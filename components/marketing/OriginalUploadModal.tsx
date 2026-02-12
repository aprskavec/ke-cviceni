import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ImageCategory = "face" | "mockup" | "graphic" | "photo" | "other";

const imageCategories: { id: ImageCategory; label: string }[] = [
  { id: "face", label: "Obličeje" },
  { id: "mockup", label: "Mockupy" },
  { id: "graphic", label: "Grafika" },
  { id: "photo", label: "Fotky" },
  { id: "other", label: "Ostatní" },
];

interface OriginalUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], category: ImageCategory) => Promise<void>;
  isUploading: boolean;
  uploadProgress: string[];
}

export const OriginalUploadModal = ({
  open,
  onOpenChange,
  onUpload,
  isUploading,
  uploadProgress,
}: OriginalUploadModalProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!selectedCategory) return; // Require category selection
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    await onUpload(imageFiles, selectedCategory);
  }, [onUpload, selectedCategory]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleFiles(Array.from(files));
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
    await handleFiles(files);
  }, [handleFiles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nahrát obrázky</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nejdřív vyber kategorii
              {!selectedCategory && <span className="text-destructive ml-1">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {imageCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  disabled={isUploading}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          <div
            ref={dropZoneRef}
            onClick={() => !isUploading && selectedCategory && fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={selectedCategory ? handleDrop : undefined}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all",
              !selectedCategory 
                ? "border-border/50 bg-muted/20 cursor-not-allowed opacity-60"
                : isDragging 
                  ? "border-primary bg-primary/10 cursor-pointer" 
                  : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-medium">Nahrávám...</p>
              </div>
            ) : (
              <>
                <Upload className={cn(
                  "w-10 h-10 mx-auto mb-3 transition-colors",
                  !selectedCategory 
                    ? "text-muted-foreground/30"
                    : isDragging ? "text-primary" : "text-muted-foreground/50"
                )} />
                <p className={cn(
                  "text-sm font-medium transition-colors",
                  !selectedCategory
                    ? "text-muted-foreground/50"
                    : isDragging ? "text-primary" : "text-foreground"
                )}>
                  {!selectedCategory 
                    ? "Nejdřív vyber kategorii výše" 
                    : isDragging ? "Pusť pro nahrání" : "Přetáhni sem obrázky"
                }
                </p>
                {selectedCategory && (
                  <p className="text-xs text-muted-foreground mt-1">
                    nebo klikni pro výběr souborů
                  </p>
                )}
                {selectedCategory === "face" && (
                  <p className="text-xs text-primary/70 mt-3">
                    🤖 Pro obličeje se spustí AI analýza
                  </p>
                )}
                {selectedCategory && selectedCategory !== "face" && (
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    PNG, JPG, WEBP do 20MB
                  </p>
                )}
              </>
            )}
          </div>

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1 max-h-32 overflow-y-auto">
              {uploadProgress.map((msg, i) => (
                <p key={i} className="text-xs text-muted-foreground">{msg}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
