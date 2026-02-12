import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StickerVariantSelector from "./StickerVariantSelector";

interface StickerImageProps {
  word: string;
  className?: string;
  lessonName?: string;
  lessonKind?: string;
}

const StickerImage = ({ word, className = "", lessonName, lessonKind }: StickerImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showVariantSelector, setShowVariantSelector] = useState(false);

  const fetchSticker = async (forceRegenerate = false, userFeedback = "") => {
    if (!word) return;
    
    setIsLoading(true);
    setError(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-kuba-sticker", {
        body: { word, regenerate: forceRegenerate, feedback: userFeedback, lessonName, lessonKind }
      });

      if (error) {
        console.error("Error fetching sticker:", error);
        setError(true);
        return;
      }

      if (data?.imageUrl) {
        setImageUrl(forceRegenerate ? `${data.imageUrl}?t=${Date.now()}` : data.imageUrl);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Error fetching sticker:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSticker();
  }, [word]);

  const handleSelectVariant = (selectedImageUrl: string) => {
    setImageUrl(selectedImageUrl);
  };

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-2xl bg-card/50 animate-pulse" />
        <span className="text-sm text-muted-foreground">Generuji obrázek...</span>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative group">
        <img 
          src={imageUrl} 
          alt={`Sticker for ${word}`}
          className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-fade-in"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVariantSelector(true)}
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Vybrat jinou variantu"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Variant Selector */}
      <StickerVariantSelector
        open={showVariantSelector}
        onOpenChange={setShowVariantSelector}
        word={word}
        lessonName={lessonName}
        lessonKind={lessonKind}
        currentImageUrl={imageUrl}
        onSelectVariant={handleSelectVariant}
      />
    </div>
  );
};

export default StickerImage;
