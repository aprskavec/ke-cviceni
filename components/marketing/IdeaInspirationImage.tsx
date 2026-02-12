import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface IdeaInspirationImageProps {
  ideaId: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
}

export const IdeaInspirationImage = ({ ideaId, imageUrl, onChange }: IdeaInspirationImageProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      console.warn("Not an image file:", file.name);
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `idea-inspiration/${ideaId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("marketing-inspiration")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("marketing-inspiration")
        .getPublicUrl(fileName);

      onChange(urlData.publicUrl);
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setIsUploading(false);
    }
  }, [ideaId, onChange]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  const handleRemove = useCallback(async () => {
    if (!imageUrl) return;

    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split("/marketing-inspiration/");
      const filePath = pathParts[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from("marketing-inspiration").remove([filePath]);
      }

      onChange(null);
    } catch (err) {
      console.error("Error removing image:", err);
      onChange(null);
    }
  }, [imageUrl, onChange]);

  if (imageUrl) {
    return (
      <div className="relative group">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border">
          <img
            src={imageUrl}
            alt="Inspirace"
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={handleRemove}
          className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
        >
          <X className="w-3 h-3 text-destructive-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors",
        isDragging 
          ? "border-primary bg-primary/10" 
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      {isUploading ? (
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      ) : (
        <>
          <ImageIcon className={cn(
            "w-5 h-5 mb-1 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground/50"
          )} />
          <span className="text-[10px] text-muted-foreground/70">Inspirace</span>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};
