import { useState, useEffect } from "react";
import { Check, Loader2, RefreshCw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface StickerVariantSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
  lessonName?: string;
  lessonKind?: string;
  currentImageUrl?: string;
  onSelectVariant: (imageUrl: string) => void;
}

interface Variant {
  id: string;
  imageUrl: string | null;
  isLoading: boolean;
  error: boolean;
  isFromDatabase: boolean;
}

const StickerVariantSelector = ({
  open,
  onOpenChange,
  word,
  lessonName,
  lessonKind,
  currentImageUrl,
  onSelectVariant,
}: StickerVariantSelectorProps) => {
  const isMobile = useIsMobile();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);

  // Load variants when opened
  useEffect(() => {
    if (open) {
      loadExistingVariants();
    } else {
      // Reset when closed
      setVariants([]);
      setSelectedId(null);
      setIsLoadingFromDb(true);
    }
  }, [open, word]);

  const loadExistingVariants = async () => {
    setIsLoadingFromDb(true);
    
    try {
      // Load existing variants from database
      const { data: existingVariants, error } = await supabase
        .from("sticker_variants")
        .select("id, image_url, is_selected")
        .eq("word", word.toLowerCase())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading variants:", error);
      }

      const dbVariants: Variant[] = (existingVariants || []).map(v => ({
        id: v.id,
        imageUrl: v.image_url,
        isLoading: false,
        error: false,
        isFromDatabase: true,
      }));

      // Find selected variant or use current image
      const selectedVariant = existingVariants?.find(v => v.is_selected);
      
      if (dbVariants.length > 0) {
        setVariants(dbVariants);
        setSelectedId(selectedVariant?.id || dbVariants[0].id);
      } else if (currentImageUrl) {
        // No variants in DB, but we have a current image - save it as first variant
        const { data: inserted } = await supabase
          .from("sticker_variants")
          .insert({
            word: word.toLowerCase(),
            image_url: currentImageUrl,
            lesson_name: lessonName,
            lesson_kind: lessonKind,
            is_selected: true,
          })
          .select("id")
          .single();

        const currentVariant: Variant = {
          id: inserted?.id || "current",
          imageUrl: currentImageUrl,
          isLoading: false,
          error: false,
          isFromDatabase: true,
        };
        setVariants([currentVariant]);
        setSelectedId(currentVariant.id);
      }
    } catch (err) {
      console.error("Error loading variants:", err);
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  const generateNewVariants = async (count: number = 4) => {
    setIsGeneratingNew(true);
    
    // Add placeholder variants for loading state
    const newVariantPlaceholders: Variant[] = Array.from({ length: count }, (_, i) => ({
      id: `generating-${i}-${Date.now()}`,
      imageUrl: null,
      isLoading: true,
      error: false,
      isFromDatabase: false,
    }));
    
    setVariants(prev => [...prev, ...newVariantPlaceholders]);

    // Generate each variant
    for (let i = 0; i < count; i++) {
      const placeholderId = newVariantPlaceholders[i].id;
      
      try {
        const { data, error } = await supabase.functions.invoke("generate-kuba-sticker", {
          body: { 
            word, 
            regenerate: true, 
            feedback: `variant ${variants.length + i + 1}`,
            lessonName, 
            lessonKind,
            saveVariant: true, // Tell edge function to save to sticker_variants table
          }
        });

        if (error || !data?.imageUrl) {
          console.error(`Error generating variant ${i}:`, error);
          setVariants(prev => prev.map(v => 
            v.id === placeholderId ? { ...v, isLoading: false, error: true } : v
          ));
          continue;
        }

        // Save to database
        const { data: inserted } = await supabase
          .from("sticker_variants")
          .insert({
            word: word.toLowerCase(),
            image_url: data.imageUrl,
            lesson_name: lessonName,
            lesson_kind: lessonKind,
            is_selected: false,
          })
          .select("id")
          .single();

        setVariants(prev => prev.map(v => 
          v.id === placeholderId ? { 
            ...v, 
            id: inserted?.id || placeholderId,
            imageUrl: data.imageUrl, 
            isLoading: false,
            isFromDatabase: true,
          } : v
        ));
      } catch (err) {
        console.error(`Error generating variant ${i}:`, err);
        setVariants(prev => prev.map(v => 
          v.id === placeholderId ? { ...v, isLoading: false, error: true } : v
        ));
      }
    }

    setIsGeneratingNew(false);
  };

  const handleSelect = async (variant: Variant) => {
    if (variant.imageUrl && !variant.isLoading) {
      // Update is_selected in database
      await supabase
        .from("sticker_variants")
        .update({ is_selected: false })
        .eq("word", word.toLowerCase());
      
      await supabase
        .from("sticker_variants")
        .update({ is_selected: true })
        .eq("id", variant.id);

      // Also update the main vocabulary_stickers table
      await supabase
        .from("vocabulary_stickers")
        .upsert({
          word: word.toLowerCase(),
          image_url: variant.imageUrl,
        }, { onConflict: "word" });

      onSelectVariant(variant.imageUrl);
      onOpenChange(false);
    }
  };

  const handleRetryOne = async (variantId: string) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, isLoading: true, error: false } : v
    ));

    try {
      const { data, error } = await supabase.functions.invoke("generate-kuba-sticker", {
        body: { 
          word, 
          regenerate: true, 
          feedback: "retry variant",
          lessonName, 
          lessonKind 
        }
      });

      if (error || !data?.imageUrl) {
        setVariants(prev => prev.map(v => 
          v.id === variantId ? { ...v, isLoading: false, error: true } : v
        ));
        return;
      }

      // Save to database
      const { data: inserted } = await supabase
        .from("sticker_variants")
        .insert({
          word: word.toLowerCase(),
          image_url: data.imageUrl,
          lesson_name: lessonName,
          lesson_kind: lessonKind,
          is_selected: false,
        })
        .select("id")
        .single();

      setVariants(prev => prev.map(v => 
        v.id === variantId ? { 
          ...v, 
          id: inserted?.id || variantId,
          imageUrl: data.imageUrl, 
          isLoading: false,
          isFromDatabase: true,
        } : v
      ));
    } catch {
      setVariants(prev => prev.map(v => 
        v.id === variantId ? { ...v, isLoading: false, error: true } : v
      ));
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Vyber variantu obrázku pro "<strong>{word}</strong>"
          {variants.filter(v => v.isFromDatabase && v.imageUrl).length > 0 && (
            <span className="ml-2 text-primary">
              ({variants.filter(v => v.isFromDatabase && v.imageUrl).length} uložených)
            </span>
          )}
        </p>

        {isLoadingFromDb ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Načítám varianty...</span>
          </div>
        ) : (
          <>
            {/* Variants list - single column for larger images */}
            <div className="flex flex-col gap-4">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => handleSelect(variant)}
                  disabled={variant.isLoading || variant.error}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden bg-card border-4 transition-all",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary",
                    selectedId === variant.id 
                      ? "border-primary ring-2 ring-primary scale-[1.02] shadow-lg" 
                      : "border-border",
                    (variant.isLoading || variant.error) && "cursor-not-allowed opacity-70"
                  )}
                >
                  {variant.isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Generuji...</span>
                    </div>
                  ) : variant.error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">Chyba</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetryOne(variant.id);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Znovu
                      </Button>
                    </div>
                  ) : variant.imageUrl ? (
                    <>
                      <img 
                        src={variant.imageUrl} 
                        alt={`Varianta ${index + 1}`}
                        className="w-full h-full object-contain p-2"
                      />
                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute inset-0 transition-all pointer-events-none",
                        selectedId === variant.id 
                          ? "bg-primary/10" 
                          : "bg-transparent"
                      )} />
                      {selectedId === variant.id && (
                        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg z-10">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 text-xs bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
                        #{index + 1}
                      </span>
                    </>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Generate more variants button */}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => generateNewVariants(4)}
              disabled={isGeneratingNew}
            >
              {isGeneratingNew ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Vygenerovat 4 nové varianty
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>Vybrat variantu obrázku</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Right side panel - wider
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[550px] sm:w-[600px] p-0">
        <SheetHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <SheetTitle>Vybrat variantu obrázku</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default StickerVariantSelector;
