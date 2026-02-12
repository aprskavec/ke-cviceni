import { useMemo, useState, useEffect } from "react";
import { Loader2, Download, RefreshCw, Wand2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { renderBannerPng } from "@/lib/marketing/bannerRender";

// Google Display Network standard sizes
const BANNER_SIZES = [
  { name: "Medium Rectangle", width: 300, height: 250, aspectRatio: "300/250" },
  { name: "Large Rectangle", width: 336, height: 280, aspectRatio: "336/280" },
  { name: "Leaderboard", width: 728, height: 90, aspectRatio: "728/90" },
  { name: "Half Page", width: 300, height: 600, aspectRatio: "300/600" },
  { name: "Large Mobile Banner", width: 320, height: 100, aspectRatio: "320/100" },
  { name: "Wide Skyscraper", width: 160, height: 600, aspectRatio: "160/600" },
];

interface BannerCopy {
  title: string;
  subtitle: string;
  cta: string;
}

interface GeneratedBanner {
  sizeName: string;
  width: number;
  height: number;
  imageUrl: string;
}

interface BannersPanelProps {
  ideaId: string;
  ideaTitle: string;
  ideaDescription: string;
}

export const BannersPanel = ({ ideaId, ideaTitle, ideaDescription }: BannersPanelProps) => {
  const { toast } = useToast();
  const [selectedCreative, setSelectedCreative] = useState<{ id: string; imageUrl: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ done: 0, total: 0 });
  const [bannerCopy, setBannerCopy] = useState<BannerCopy | null>(null);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);
  const [error, setError] = useState<string | null>(null);

  const primaryVarValue = useMemo(() => {
    // shadcn token format e.g. "24.6 95% 53.1%"
    return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  }, []);

  const sizeByName = useMemo(() => {
    const m = new Map<string, (typeof BANNER_SIZES)[number]>();
    for (const s of BANNER_SIZES) m.set(s.name, s);
    return m;
  }, []);

  const runWithConcurrency = async <T,>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>
  ) => {
    const queue = [...items];
    const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        await worker(item);
      }
    });
    await Promise.all(runners);
  };

  // Load selected creative on mount
  useEffect(() => {
    const loadSelectedCreative = async () => {
      const { data, error } = await supabase
        .from("marketing_creatives")
        .select("id, image_url, transparent_url")
        .eq("idea_id", ideaId)
        .eq("is_selected", true)
        .single();

      if (!error && data) {
        setSelectedCreative({
          id: data.id,
          imageUrl: data.transparent_url || data.image_url,
        });
      }
    };

    loadSelectedCreative();
  }, [ideaId]);

  const handleGenerateBanners = async () => {
    if (!selectedCreative) {
      toast({
        title: "Není vybraná kreativa",
        description: "Nejdříve vyber kreativu v kroku Refinement.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratingProgress({ done: 0, total: BANNER_SIZES.length });
    setGeneratedBanners([]);

    try {
      toast({
        title: "Generuji bannery...",
        description: "AI navrhne texty a bannery se vygenerují do přesných rozměrů.",
      });

      const { data, error: fnError } = await supabase.functions.invoke("generate-banners", {
        body: {
          ideaId,
          ideaTitle,
          ideaDescription,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      if (data?.copy) {
        setBannerCopy(data.copy);
      }

      const sizesToGenerate = Array.isArray(data?.sizes)
        ? (data.sizes as Array<{ name: string }>).map((s) => sizeByName.get(s.name)).filter(Boolean)
        : BANNER_SIZES;

      setGeneratingProgress({ done: 0, total: sizesToGenerate.length });

      const uploadBanner = async (size: (typeof BANNER_SIZES)[number]) => {
        const copy = (data?.copy || bannerCopy || { title: ideaTitle, subtitle: "", cta: "Zjistit více" }) as BannerCopy;

        const blob = await renderBannerPng({
          size,
          creativeImageUrl: selectedCreative.imageUrl,
          copy,
          primaryVarValue,
        });

        const fileName = `banners/${ideaId}/${size.width}x${size.height}.png`;
        const { error: uploadError } = await supabase.storage
          .from("marketing-inspiration")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("marketing-inspiration")
          .getPublicUrl(fileName);

        setGeneratedBanners((prev) => {
          const next: GeneratedBanner = {
            sizeName: size.name,
            width: size.width,
            height: size.height,
            imageUrl: urlData.publicUrl,
          };
          const filtered = prev.filter((b) => b.sizeName !== next.sizeName);
          return [...filtered, next].sort((a, b) => {
            const ai = BANNER_SIZES.findIndex((s) => s.name === a.sizeName);
            const bi = BANNER_SIZES.findIndex((s) => s.name === b.sizeName);
            return ai - bi;
          });
        });

        setGeneratingProgress((p) => ({ ...p, done: p.done + 1 }));
      };

      await runWithConcurrency(sizesToGenerate as any, 3, uploadBanner);

      toast({
        title: "Bannery vygenerovány!",
        description: `Vytvořeno ${sizesToGenerate.length} bannerů.`,
      });
    } catch (err) {
      console.error("Banner generation error:", err);
      const message = err instanceof Error ? err.message : "Nepodařilo se vygenerovat bannery";
      setError(message);
      toast({
        title: "Chyba při generování",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Chyba při stahování",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    for (const banner of generatedBanners) {
      await handleDownload(
        banner.imageUrl,
        `kuba-banner-${banner.sizeName.toLowerCase().replace(/\s+/g, "-")}.png`
      );
    }
    toast({
      title: "Všechny bannery staženy!",
    });
  };

  return (
    <div className="space-y-6">
      {/* Selected Creative Preview */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-medium mb-3">Vybraná kreativa</h4>
        {selectedCreative ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-card border border-border">
              <img
                src={selectedCreative.imageUrl}
                alt="Selected creative"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Tato kreativa bude použita pro generování bannerů.</p>
              <p className="text-xs mt-1">Změnit můžeš v kroku Refinement.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-primary">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Nejdříve vyber kreativu v kroku Refinement.</p>
          </div>
        )}
      </div>

      {/* AI Copy Preview */}
      {bannerCopy && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            AI navržené texty
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Titulek:</span>
              <p className="font-semibold text-foreground">{bannerCopy.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Podtitulek:</span>
              <p className="text-foreground">{bannerCopy.subtitle}</p>
            </div>
            <div>
              <span className="text-muted-foreground">CTA:</span>
              <span className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                {bannerCopy.cta}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerateBanners}
        disabled={isGenerating || !selectedCreative}
        className={cn(
          "w-full py-4 rounded-full font-medium transition-colors flex items-center justify-center gap-2",
          isGenerating || !selectedCreative
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generuji ({generatingProgress.done}/{generatingProgress.total})...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Vygenerovat všechny bannery
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Generated Banners Grid */}
      {generatedBanners.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Vygenerované bannery ({generatedBanners.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Stáhnout vše
              </button>
              <button
                onClick={handleGenerateBanners}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                Regenerovat
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {generatedBanners.map((banner) => (
              <div key={banner.sizeName} className="group">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{banner.sizeName}</p>
                  <span className="text-xs text-muted-foreground font-mono">
                    {banner.width}×{banner.height}
                  </span>
                </div>
                <div 
                  className="relative bg-card border border-border rounded-lg overflow-hidden"
                  style={{ 
                    maxWidth: Math.min(banner.width, 600),
                    aspectRatio: `${banner.width}/${banner.height}` 
                  }}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.sizeName}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(
                        banner.imageUrl,
                        `kuba-banner-${banner.sizeName.toLowerCase().replace(/\s+/g, "-")}.png`
                      )}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Stáhnout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - show available sizes */}
      {generatedBanners.length === 0 && !isGenerating && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Dostupné rozměry bannerů:</h4>
          <div className="grid grid-cols-2 gap-2">
            {BANNER_SIZES.map((size) => (
              <div
                key={size.name}
                className="p-3 bg-muted/30 border border-border/50 rounded-lg"
              >
                <p className="text-sm font-medium">{size.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {size.width}×{size.height}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BannersPanel;
