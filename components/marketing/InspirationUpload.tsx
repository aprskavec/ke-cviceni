import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { generateSafeFileName } from "@/lib/fileUtils";

interface Inspiration {
  id: string;
  idea_id: string;
  image_url: string;
  file_name: string | null;
  created_at: string;
}

interface InspirationUploadProps {
  ideaId: string;
  onInspirationsChange?: (urls: string[]) => void;
}

interface PendingUpload {
  id: string;
  fileName: string;
  previewUrl: string;
}

export const InspirationUpload = ({ ideaId, onInspirationsChange }: InspirationUploadProps) => {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch existing inspirations
  useEffect(() => {
    const fetchInspirations = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketing_inspirations")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setInspirations(data);
        onInspirationsChange?.(data.map(i => i.image_url));
      }
      setIsLoading(false);
    };

    fetchInspirations();
  }, [ideaId, onInspirationsChange]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Filter to only images
    const imageFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        console.warn("Skipping non-image file:", file.name);
        return false;
      }
      return true;
    });

    if (imageFiles.length === 0) return;

    // Create preview placeholders immediately
    const newPending: PendingUpload[] = imageFiles.map((file, index) => ({
      id: `pending-${Date.now()}-${index}`,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    
    setPendingUploads(prev => [...newPending, ...prev]);
    setIsUploading(true);

    // Upload all files in parallel
    const uploadPromises = imageFiles.map(async (file, index) => {
      const pendingId = newPending[index].id;
      try {
        // Generate unique, sanitized filename (no spaces or special chars for AI APIs)
        const safeFileName = generateSafeFileName(file.name);
        const fileName = `${ideaId}/${safeFileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("marketing-inspiration")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return { pendingId, result: null };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("marketing-inspiration")
          .getPublicUrl(fileName);

        // Save to database
        const { data: insertData, error: insertError } = await supabase
          .from("marketing_inspirations")
          .insert({
            idea_id: ideaId,
            image_url: urlData.publicUrl,
            file_name: file.name,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          return { pendingId, result: null };
        }

        return { pendingId, result: insertData };
      } catch (err) {
        console.error("Error uploading file:", err);
        return { pendingId, result: null };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    // Process results - remove pending and add completed
    const completedIds = new Set<string>();
    const successfulUploads: Inspiration[] = [];
    
    results.forEach(({ pendingId, result }) => {
      completedIds.add(pendingId);
      if (result) {
        successfulUploads.push(result);
      }
    });

    // Clean up preview URLs
    newPending.forEach(p => URL.revokeObjectURL(p.previewUrl));
    
    // Remove completed from pending
    setPendingUploads(prev => prev.filter(p => !completedIds.has(p.id)));
    
    if (successfulUploads.length > 0) {
      setInspirations((prev) => {
        const newList = [...successfulUploads, ...prev];
        onInspirationsChange?.(newList.map(i => i.image_url));
        return newList;
      });
    }

    setIsUploading(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [ideaId, onInspirationsChange]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the dropzone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }, [uploadFiles]);

  const handleDelete = async (inspiration: Inspiration) => {
    // Extract path from URL
    const url = new URL(inspiration.image_url);
    const pathParts = url.pathname.split("/marketing-inspiration/");
    const filePath = pathParts[1];

    // Delete from storage
    if (filePath) {
      await supabase.storage.from("marketing-inspiration").remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from("marketing_inspirations")
      .delete()
      .eq("id", inspiration.id);

    if (!error) {
      setInspirations((prev) => {
        const newList = prev.filter((i) => i.id !== inspiration.id);
        onInspirationsChange?.(newList.map(i => i.image_url));
        return newList;
      });
    }
  };

  return (
    <div 
      ref={dropZoneRef}
      className={cn(
        "space-y-4 min-h-[200px] rounded-xl transition-colors",
        isDragging && "bg-primary/5 ring-2 ring-primary ring-dashed"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          Moje inspirace ({inspirations.length})
          {pendingUploads.length > 0 && (
            <span className="text-muted-foreground ml-1">+ {pendingUploads.length} nahrávám</span>
          )}
        </h3>
        <label
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Nahrát obrázky
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : inspirations.length === 0 && pendingUploads.length === 0 ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "w-8 h-8 mx-auto mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground/50"
          )} />
          <p className={cn(
            "text-sm transition-colors",
            isDragging ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {isDragging ? "Pusť pro nahrání" : "Přetáhni sem obrázky nebo klikni pro nahrání"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            PNG, JPG, WEBP do 20MB
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Pending uploads with loading overlay */}
          {pendingUploads.map((item) => (
            <div
              key={item.id}
              className="relative rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="w-full aspect-square object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <p className="text-xs text-white font-medium">Nahrávám...</p>
                </div>
              </div>
            </div>
          ))}
          {inspirations.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={item.image_url}
                alt={item.file_name || "Inspirace"}
                className="w-full aspect-square object-cover"
              />
              <button
                onClick={() => handleDelete(item)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {item.file_name && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{item.file_name}</p>
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg aspect-square flex items-center justify-center cursor-pointer transition-colors",
              isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={cn(
              "w-6 h-6 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground/50"
            )} />
          </div>
        </div>
      )}

      {/* Drag overlay when dragging */}
      {isDragging && inspirations.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium shadow-lg">
            Pusť pro nahrání obrázků
          </div>
        </div>
      )}
    </div>
  );
};
