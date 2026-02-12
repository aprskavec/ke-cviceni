import { useState, useEffect, useCallback, useRef } from "react";
import { Wand2, Loader2, X, RefreshCw, Eraser, Download, Info, Smartphone, User, Star, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Fallback Kuba face when none are uploaded to the database
const DEFAULT_KUBA_FACE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

interface RefinementPanelProps {
  ideaId: string;
  ideaTitle: string;
  ideaDescription: string;
  inspirationUrls?: string[];
  ideaInspirationImageUrl?: string | null;
  onCreativesGenerated?: (hasCreatives: boolean) => void;
  onSelectionChange?: (selectedImageUrl: string | null) => void;
}

interface BaseImage {
  id: string;
  name: string;
  image_url: string;
}

interface CreativeMetadata {
  model: string;
  prompt: string;
  ideaTitle?: string;
  ideaDescription?: string;
  aspectRatio?: string;
  inspirationCount?: number;
  mockupCount?: number;
  generatedAt?: string;
}

interface GeneratedCreative {
  id: string;
  imageUrl: string;
  transparentUrl?: string;
  timestamp: number;
  isRemovingBg?: boolean;
  isSelected?: boolean;
  metadata?: CreativeMetadata;
  isLoading?: boolean; // For skeleton state
}

export const RefinementPanel = ({ 
  ideaId, 
  ideaTitle, 
  ideaDescription,
  inspirationUrls = [],
  ideaInspirationImageUrl,
  onCreativesGenerated,
  onSelectionChange
}: RefinementPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);
  const [mockups, setMockups] = useState<BaseImage[]>([]);
  const [faces, setFaces] = useState<BaseImage[]>([]);
  const [selectedMockups, setSelectedMockups] = useState<Set<string>>(new Set());
  const [selectedFace, setSelectedFace] = useState<string | null>(null);
  const [variantCount, setVariantCount] = useState(1);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Report “has creatives” upwards in a render-safe way (no parent setState inside our setState updaters)
  const hasRealCreatives = generatedCreatives.some((c) => !c.isLoading && !!c.imageUrl);

  useEffect(() => {
    onCreativesGenerated?.(hasRealCreatives);
  }, [hasRealCreatives, onCreativesGenerated]);

  // UX: when generating variants, auto-scroll to the creatives grid so the user
  // immediately sees all inserted skeletons (especially on smaller viewports).
  const creativesAnchorRef = useRef<HTMLDivElement | null>(null);
  const [shouldScrollToCreatives, setShouldScrollToCreatives] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState<GeneratedCreative | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load existing creatives from database
  // IMPORTANT: Skip if we're currently generating to avoid overwriting skeleton placeholders
  const loadCreatives = useCallback(async () => {
    if (!ideaId) return;
    
    try {
      const { data, error } = await supabase
        .from("marketing_creatives")
        .select("*")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        // Only update if we're NOT generating - otherwise we'd overwrite our skeleton placeholders
        setGeneratedCreatives(prev => {
          const hasPlaceholders = prev.some(c => c.isLoading);
          if (hasPlaceholders) {
            // Keep existing state with placeholders, don't overwrite
            return prev;
          }
          // No placeholders, safe to update from DB
          return data.map(c => ({
            id: c.id,
            imageUrl: c.image_url,
            transparentUrl: c.transparent_url || undefined,
            timestamp: new Date(c.created_at).getTime(),
            isSelected: c.is_selected || false,
            metadata: c.metadata as unknown as CreativeMetadata | undefined,
          }));
        });
      }
    } catch (err) {
      console.error("Error loading creatives:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ideaId]);

  // Load mockups and faces from originals
  const loadBaseImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("kuba_base_images")
        .select("id, name, image_url, category")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setMockups(data.filter(img => img.category === "mockup"));
        const faceImages = data.filter(img => img.category === "face");
        
        // Sort faces so "happy/šťastný" comes first
        const sortedFaces = [...faceImages].sort((a, b) => {
          const aIsHappy = a.name.toLowerCase().includes("happy") || 
                           a.name.toLowerCase().includes("šťastný") ||
                           a.image_url.toLowerCase().includes("happy");
          const bIsHappy = b.name.toLowerCase().includes("happy") || 
                           b.name.toLowerCase().includes("šťastný") ||
                           b.image_url.toLowerCase().includes("happy");
          if (aIsHappy && !bIsHappy) return -1;
          if (!aIsHappy && bIsHappy) return 1;
          return 0;
        });
        
        setFaces(sortedFaces);
        // ALWAYS auto-select first face (happy) as default
        if (sortedFaces.length > 0) {
          setSelectedFace(prev => prev ?? sortedFaces[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading base images:", err);
    }
  }, []);

  useEffect(() => {
    loadBaseImages();
    loadCreatives();
  }, [loadBaseImages, loadCreatives]);

  useEffect(() => {
    if (!shouldScrollToCreatives) return;
    if (generatedCreatives.length === 0) return;

    // Wait for the grid to mount with the new items, then scroll.
    requestAnimationFrame(() => {
      creativesAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScrollToCreatives(false);
    });
  }, [shouldScrollToCreatives, generatedCreatives.length]);

  const toggleMockup = (id: string) => {
    setSelectedMockups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!ideaTitle && !ideaDescription) {
      toast({
        title: "Chybí popis nápadu",
        description: "Nejdřív vyplň název nebo popis nápadu v prvním kroku.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratingProgress(0);

    // Get selected mockup URLs
    const selectedMockupUrls = mockups
      .filter(m => selectedMockups.has(m.id))
      .map(m => m.image_url);

    // Get selected face URL - fallback to first available face or default Kuba
    const selectedFaceUrl = 
      faces.find(f => f.id === selectedFace)?.image_url 
      ?? faces[0]?.image_url 
      ?? DEFAULT_KUBA_FACE_URL;

    // Determine base description - user's own description is PRIORITY
    const baseDescription = ideaDescription?.trim() || ideaTitle || "";
    let descriptionVariants: string[] = [baseDescription];
    
    // CRITICAL: If user provided a detailed description (>50 chars), USE IT EXACTLY
    // Don't let AI overwrite the user's specific creative direction
    const hasDetailedUserDescription = ideaDescription && ideaDescription.trim().length > 50;
    
    if (hasDetailedUserDescription) {
      // User gave specific instructions - use their description for ALL variants
      console.log(`Using user's detailed description for all ${variantCount} variants: "${baseDescription.substring(0, 80)}..."`);
      descriptionVariants = Array(variantCount).fill(baseDescription);
    } else if (variantCount > 1 && ideaTitle) {
      // No detailed description - generate AI variants for variety
      try {
        console.log(`Generating ${variantCount} AI description variants for: ${ideaTitle}`);
        const { data: descData, error: descError } = await supabase.functions.invoke("generate-idea-description", {
          body: { title: ideaTitle, description: ideaDescription, count: variantCount },
        });
        
        if (!descError && descData?.descriptions && Array.isArray(descData.descriptions) && descData.descriptions.length > 0) {
          const validDescriptions = descData.descriptions.filter((d: string) => d && d.trim().length > 0);
          if (validDescriptions.length > 0) {
            descriptionVariants = validDescriptions;
            console.log("Generated AI description variants:", descriptionVariants);
          }
        }
      } catch (err) {
        console.warn("Failed to generate description variants, using original:", err);
      }
    }

    // Create placeholder skeletons IMMEDIATELY for instant feedback
    const placeholderIds = Array.from({ length: variantCount }, () =>
      `placeholder-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );

    const placeholders: GeneratedCreative[] = placeholderIds.map((id) => ({
      id,
      imageUrl: "",
      timestamp: Date.now(),
      isLoading: true,
    }));

    // Add skeletons to the start of the list immediately
    setGeneratedCreatives((prev) => [...placeholders, ...prev]);
    setShouldScrollToCreatives(true);

    const generateSingle = async (index: number, placeholderId: string): Promise<void> => {
      // Pick a description - cycle through variants with robust fallback
      const variantIndex = index % descriptionVariants.length;
      const descriptionForThisCreative = descriptionVariants[variantIndex]?.trim() 
        || baseDescription 
        || ideaTitle 
        || "Kuba";
      
      console.log(`Variant ${index + 1}: using description "${descriptionForThisCreative.substring(0, 50)}..."`);
      
      try {
        const { data, error } = await supabase.functions.invoke("generate-banner-creative", {
          body: {
            ideaTitle,
            ideaDescription: descriptionForThisCreative,
            inspirationUrls,
            ideaInspirationImageUrl: ideaInspirationImageUrl || undefined,
            mockupUrls: selectedMockupUrls,
            faceImageUrl: selectedFaceUrl,
            aspectRatio: "1:1",
          },
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          if (data.error.includes("Rate limit")) {
            toast({
              title: "Příliš mnoho požadavků",
              description: "Zkus to znovu za chvíli.",
              variant: "destructive",
            });
          } else if (data.error.includes("credits")) {
            toast({
              title: "Nedostatek kreditů",
              description: "Doplň kredity pro generování.",
              variant: "destructive",
            });
          } else {
            throw new Error(data.error);
          }
          // Remove the failed placeholder
          setGeneratedCreatives(prev => prev.filter(c => c.id !== placeholderId));
          return;
        }

        if (data?.imageUrl) {
          // Save to database
          const { data: insertedCreative, error: insertError } = await supabase
            .from("marketing_creatives")
            .insert({
              idea_id: ideaId,
              image_url: data.imageUrl,
              metadata: data.metadata,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error saving creative:", insertError);
            throw new Error("Nepodařilo se uložit kreativu");
          }

          // Replace the placeholder with the real creative
          setGeneratedCreatives(prev => 
            prev.map(c => c.id === placeholderId ? {
              id: insertedCreative.id,
              imageUrl: data.imageUrl,
              timestamp: new Date(insertedCreative.created_at).getTime(),
              metadata: data.metadata,
              isLoading: false,
            } : c)
          );
          
          setGeneratingProgress(p => p + 1);
        } else {
          // No image returned, remove placeholder
          setGeneratedCreatives(prev => prev.filter(c => c.id !== placeholderId));
        }
      } catch (err) {
        console.error(`Generation error for variant ${index + 1}:`, err);
        // Remove the failed placeholder
        setGeneratedCreatives(prev => prev.filter(c => c.id !== placeholderId));
        toast({
          title: `Chyba při generování varianty ${index + 1}`,
          description: err instanceof Error ? err.message : "Zkus to znovu.",
          variant: "destructive",
        });
      }
    };

    // IMPORTANT: Start generation in a new tick so React can render the skeletons first.
    // Also limit concurrency to reduce rate-limit / "no image" failures.
    const concurrency = Math.min(2, placeholderIds.length);

    const runGeneration = async () => {
      try {
        let nextIndex = 0;

        const worker = async () => {
          while (true) {
            const i = nextIndex++;
            if (i >= placeholderIds.length) return;

            await generateSingle(i, placeholderIds[i]);

            // Small pacing between requests (even with concurrency)
            if (i < placeholderIds.length - 1) {
              await new Promise((r) => setTimeout(r, 350));
            }
          }
        };

        await Promise.all(Array.from({ length: concurrency }, () => worker()));

        toast({
          title: variantCount > 1 ? `Generování dokončeno!` : "Kreativa vygenerována!",
          description: "Nové návrhy jsou připraveny a uloženy.",
        });
      } finally {
        setIsGenerating(false);
        setGeneratingProgress(0);
      }
    };

    // Let the UI paint skeletons first
    setTimeout(() => {
      void runGeneration();
    }, 0);
  };

  const handleRemoveBackground = async (creativeId: string, imageUrl: string) => {
    setGeneratedCreatives(prev => 
      prev.map(c => c.id === creativeId ? { ...c, isRemovingBg: true } : c)
    );

    try {
      toast({
        title: "Odstraňuji pozadí...",
        description: "Může to trvat pár sekund.",
      });

      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageUrl },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        // Update in database
        const { error: updateError } = await supabase
          .from("marketing_creatives")
          .update({ transparent_url: data.imageUrl })
          .eq("id", creativeId);

        if (updateError) {
          console.error("Error updating transparent URL:", updateError);
        }

        setGeneratedCreatives(prev => 
          prev.map(c => c.id === creativeId 
            ? { ...c, transparentUrl: data.imageUrl, isRemovingBg: false } 
            : c
          )
        );
        toast({
          title: "Pozadí odstraněno!",
          description: "Průhledná verze je připravena.",
        });
      }
    } catch (err) {
      console.error("Background removal error:", err);
      setGeneratedCreatives(prev => 
        prev.map(c => c.id === creativeId ? { ...c, isRemovingBg: false } : c)
      );
      toast({
        title: "Chyba při odstraňování pozadí",
        description: err instanceof Error ? err.message : "Zkus to znovu.",
        variant: "destructive",
      });
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

  const handleRemoveCreative = async (id: string) => {
    try {
      const { error } = await supabase
        .from("marketing_creatives")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting creative:", error);
        toast({
          title: "Chyba při mazání",
          variant: "destructive",
        });
        return;
      }

      setGeneratedCreatives(prev => {
        const newList = prev.filter(c => c.id !== id);
        return newList;
      });
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSelectCreative = async (id: string) => {
    try {
      // Check if this creative is already selected (toggle off)
      const currentCreative = generatedCreatives.find(c => c.id === id);
      const isCurrentlySelected = currentCreative?.isSelected;

      if (isCurrentlySelected) {
        // Deselect it
        const { error } = await supabase
          .from("marketing_creatives")
          .update({ is_selected: false })
          .eq("id", id);

        if (error) {
          console.error("Error deselecting creative:", error);
          toast({
            title: "Chyba při odznačení",
            variant: "destructive",
          });
          return;
        }

        // Update local state
        setGeneratedCreatives(prev => 
          prev.map(c => c.id === id ? { ...c, isSelected: false } : c)
        );

        // Notify parent about deselection
        onSelectionChange?.(null);

        toast({
          title: "Kreativa odznačena",
        });
      } else {
        // Deselect all, then select this one
        await supabase
          .from("marketing_creatives")
          .update({ is_selected: false })
          .eq("idea_id", ideaId);

        const { error } = await supabase
          .from("marketing_creatives")
          .update({ is_selected: true })
          .eq("id", id);

        if (error) {
          console.error("Error selecting creative:", error);
          toast({
            title: "Chyba při výběru",
            variant: "destructive",
          });
          return;
        }

        // Update local state
        setGeneratedCreatives(prev => 
          prev.map(c => ({ ...c, isSelected: c.id === id }))
        );

        // Notify parent about selection change
        const selectedCreative = generatedCreatives.find(c => c.id === id);
        onSelectionChange?.(selectedCreative?.transparentUrl || selectedCreative?.imageUrl || null);

        toast({
          title: "Kreativa vybrána!",
          description: "Tato kreativa bude použita pro banner.",
        });
      }
    } catch (err) {
      console.error("Select error:", err);
    }
  };

  const handleOpenEditDialog = (creative: GeneratedCreative) => {
    setEditingCreative(creative);
    setEditInstruction("");
    setEditDialogOpen(true);
  };

  const handleEditCreative = async () => {
    if (!editingCreative || !editInstruction.trim()) return;
    
    // Store values before closing dialog (dialog close resets state)
    const sourceImageUrl = editingCreative.imageUrl;
    const instruction = editInstruction.trim();
    
    // Create a placeholder for the new edited creative
    const placeholderId = `placeholder-edit-${Date.now()}`;
    const placeholder: GeneratedCreative = {
      id: placeholderId,
      imageUrl: "",
      timestamp: Date.now(),
      isLoading: true,
    };
    
    // Close dialog and add skeleton IMMEDIATELY
    setEditDialogOpen(false);
    setIsEditing(true);
    
    // Use setTimeout to ensure React renders the skeleton before the API call
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Add skeleton at the start
    setGeneratedCreatives(prev => [placeholder, ...prev]);
    
    try {
      const { data, error } = await supabase.functions.invoke("edit-banner-creative", {
        body: {
          sourceImageUrl: sourceImageUrl,
          editInstruction: instruction,
          ideaTitle,
          ideaDescription,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        // Save to database
        const { data: insertedCreative, error: insertError } = await supabase
          .from("marketing_creatives")
          .insert({
            idea_id: ideaId,
            image_url: data.imageUrl,
            metadata: data.metadata,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error saving edited creative:", insertError);
          throw new Error("Nepodařilo se uložit upravenou kreativu");
        }

        // Replace placeholder with real creative
        setGeneratedCreatives(prev => 
          prev.map(c => c.id === placeholderId ? {
            id: insertedCreative.id,
            imageUrl: data.imageUrl,
            timestamp: new Date(insertedCreative.created_at).getTime(),
            metadata: data.metadata,
            isLoading: false,
          } : c)
        );
        
        toast({
          title: "Kreativa upravena!",
          description: "Nová varianta je připravena.",
        });
      } else {
        // Remove placeholder on failure
        setGeneratedCreatives(prev => prev.filter(c => c.id !== placeholderId));
        throw new Error("Nepodařilo se vygenerovat upravenou verzi");
      }
    } catch (err) {
      console.error("Edit error:", err);
      // Remove placeholder
      setGeneratedCreatives(prev => prev.filter(c => c.id !== placeholderId));
      toast({
        title: "Chyba při úpravě",
        description: err instanceof Error ? err.message : "Zkus to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
      setEditingCreative(null);
      setEditInstruction("");
    }
  };

  const hasContext = ideaTitle || ideaDescription || inspirationUrls.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context summary */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Kontext pro generování</h4>
        {ideaTitle && (
          <p className="text-sm"><span className="text-muted-foreground">Název:</span> {ideaTitle}</p>
        )}
        {ideaDescription && (
          <p className="text-sm line-clamp-2"><span className="text-muted-foreground">Popis:</span> {ideaDescription}</p>
        )}
        <p className="text-sm">
          <span className="text-muted-foreground">Inspirace:</span>{" "}
          {inspirationUrls.length > 0 ? `${inspirationUrls.length} obrázků` : "žádné"}
        </p>
        {selectedMockups.size > 0 && (
          <p className="text-sm">
            <span className="text-muted-foreground">Mockupy:</span>{" "}
            {selectedMockups.size} vybráno
          </p>
        )}
      </div>

      {/* Face selector - only show if more than 1 face available */}
      {faces.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Obličej Kuby</h4>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              {faces.length} {faces.length === 1 ? "fotka" : faces.length >= 2 && faces.length <= 4 ? "fotky" : "fotek"}
            </span>
            {selectedFace && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {faces.find(f => f.id === selectedFace)?.name || "vybrán"}
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {faces.map(face => (
              <button
                key={face.id}
                onClick={() => setSelectedFace(face.id)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedFace === face.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img 
                  src={face.image_url} 
                  alt={face.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {selectedFace === face.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Vyber referenční fotku Kuby pro generování
          </p>
        </div>
      )}

      {/* Mockup selector */}
      {mockups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Mockupy z originals</h4>
            {selectedMockups.size > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {selectedMockups.size} vybráno
              </span>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mockups.map(mockup => (
              <button
                key={mockup.id}
                onClick={() => toggleMockup(mockup.id)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedMockups.has(mockup.id)
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img 
                  src={mockup.image_url} 
                  alt={mockup.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {selectedMockups.has(mockup.id) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Vyber mockupy které se mají použít v kreativě (např. mobilní appku)
          </p>
        </div>
      )}

      {/* Variant count selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Počet variant</span>
          <span className="text-xs text-muted-foreground">{variantCount} {variantCount === 1 ? "kreativa" : variantCount >= 2 && variantCount <= 4 ? "kreativy" : "kreativ"}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => setVariantCount(count)}
              disabled={isGenerating}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium text-sm transition-colors",
                variantCount === count
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {count}×
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !hasContext}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-4 rounded-full font-medium transition-colors text-lg",
          isGenerating || !hasContext
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generuji {generatingProgress}/{variantCount}...
          </>
        ) : generatedCreatives.length > 0 ? (
          <>
            <RefreshCw className="w-5 h-5" />
            Vygenerovat {variantCount > 1 ? `${variantCount} varianty` : "další variantu"}
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Vygenerovat {variantCount > 1 ? `${variantCount} kreativy` : "kreativu"}
          </>
        )}
      </button>

      {/* Generated creatives grid */}
      {generatedCreatives.length > 0 && (
        <div className="space-y-3">
          <div ref={creativesAnchorRef} />
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Vygenerované návrhy ({generatedCreatives.length})</h3>
            {generatedCreatives.some(c => c.isSelected) && (
              <span className="text-xs bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                1 vybrána
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Klikni na kreativu pro výběr do banneru</p>
          <div className="grid grid-cols-2 gap-3">
            {generatedCreatives.map((creative) => (
              <div 
                key={creative.id} 
                onClick={() => !creative.isLoading && handleSelectCreative(creative.id)}
                className={cn(
                  "group relative rounded-lg overflow-hidden bg-muted transition-all",
                  creative.isLoading 
                    ? "cursor-default" 
                    : "cursor-pointer",
                  !creative.isLoading && creative.isSelected 
                    ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background" 
                    : !creative.isLoading && "hover:ring-2 hover:ring-primary/50"
                )}
              >
                {creative.isLoading ? (
                  // Loading skeleton with animated shimmer
                  <div className="relative aspect-square">
                    <Skeleton className="w-full h-full" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground font-medium">Generuji...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "relative",
                      creative.transparentUrl && "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')]"
                    )}>
                      <OptimizedImage
                        src={creative.transparentUrl || creative.imageUrl}
                        alt="Generated creative"
                        aspectRatio="square"
                        className="w-full h-full"
                      />
                    </div>
                    
                    {/* Selected indicator */}
                    {creative.isSelected && (
                      <div className="absolute top-2 right-2 p-1.5 bg-amber-500 rounded-full">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                    
                    {creative.isRemovingBg && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <span className="text-xs">Odstraňuji pozadí...</span>
                        </div>
                      </div>
                    )}

                    {/* Info button for metadata */}
                    {creative.metadata && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 left-2 p-1.5 bg-black/60 rounded-full hover:bg-primary transition-colors opacity-0 group-hover:opacity-100"
                            title="Zobrazit metadata"
                          >
                            <Info className="w-3 h-3 text-white" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 max-h-96 overflow-y-auto text-xs" side="right">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-muted-foreground">Model:</span>
                              <p className="font-mono bg-muted px-1 py-0.5 rounded mt-0.5">{creative.metadata.model}</p>
                            </div>
                            {creative.metadata.generatedAt && (
                              <div>
                                <span className="font-semibold text-muted-foreground">Vygenerováno:</span>
                                <p>{new Date(creative.metadata.generatedAt).toLocaleString('cs-CZ')}</p>
                              </div>
                            )}
                            {creative.metadata.aspectRatio && (
                              <div>
                                <span className="font-semibold text-muted-foreground">Poměr stran:</span>
                                <p>{creative.metadata.aspectRatio}</p>
                              </div>
                            )}
                            {creative.metadata.inspirationCount !== undefined && (
                              <div>
                                <span className="font-semibold text-muted-foreground">Inspirací:</span>
                                <p>{creative.metadata.inspirationCount}</p>
                              </div>
                            )}
                            {creative.metadata.mockupCount !== undefined && creative.metadata.mockupCount > 0 && (
                              <div>
                                <span className="font-semibold text-muted-foreground">Mockupů:</span>
                                <p>{creative.metadata.mockupCount}</p>
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-muted-foreground">Prompt:</span>
                              <pre className="whitespace-pre-wrap text-[10px] bg-muted p-2 rounded mt-1 max-h-48 overflow-y-auto">
                                {creative.metadata.prompt}
                              </pre>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    <div className={cn(
                      "absolute top-2 flex gap-1 transition-opacity",
                      creative.isSelected ? "right-10" : "right-2",
                      "opacity-0 group-hover:opacity-100"
                    )}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(creative); }}
                        className="p-1.5 bg-black/60 rounded-full hover:bg-primary transition-colors"
                        title="Upravit"
                      >
                        <Pencil className="w-3 h-3 text-white" />
                      </button>
                      {!creative.transparentUrl && !creative.isRemovingBg && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveBackground(creative.id, creative.imageUrl); }}
                          className="p-1.5 bg-black/60 rounded-full hover:bg-primary transition-colors"
                          title="Odstranit pozadí"
                        >
                          <Eraser className="w-3 h-3 text-white" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(
                          creative.transparentUrl || creative.imageUrl,
                          `kuba-banner-${creative.id}${creative.transparentUrl ? '-transparent' : ''}.png`
                        ); }}
                        className="p-1.5 bg-black/60 rounded-full hover:bg-primary transition-colors"
                        title="Stáhnout"
                      >
                        <Download className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCreative(creative.id); }}
                        className="p-1.5 bg-black/60 rounded-full hover:bg-destructive transition-colors"
                        title="Smazat"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    {creative.transparentUrl && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary/90 rounded text-xs text-primary-foreground font-medium">
                        Průhledné
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasContext && (
        <p className="text-sm text-muted-foreground text-center">
          Nejdřív vyplň nápad nebo nahraj inspirace
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upravit kreativu</DialogTitle>
            <DialogDescription>
              Popiš, jak chceš kreativu upravit. AI vytvoří novou variantu na základě originálu a tvých instrukcí.
            </DialogDescription>
          </DialogHeader>
          
          {editingCreative && (
            <div className="space-y-4">
              {/* Preview of original */}
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={editingCreative.imageUrl} 
                    alt="Original" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">Originál</p>
                  <p className="text-xs text-muted-foreground">
                    Nová varianta bude vytvořena na základě tohoto obrázku.
                  </p>
                </div>
              </div>
              
              {/* Edit instruction input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Jak to chceš upravit?</label>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="Např. přidej sluneční brýle, změň pozadí na modré, udělej ho víc dramatického..."
                  className="w-full h-24 px-4 py-3 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <button
              onClick={() => setEditDialogOpen(false)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleEditCreative}
              disabled={!editInstruction.trim() || isEditing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                !editInstruction.trim() || isEditing
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generuji...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Upravit
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
