import { useState, useRef, useEffect, useCallback } from "react";
import { Image, Instagram, Plus, Lightbulb, X, Download, Sparkles, FileText, Images, Trash2, Wand2, ChevronLeft, Check, Loader2, User, Upload, Undo2, Star, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { generateSafeFileName } from "@/lib/fileUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InspirationUpload } from "@/components/marketing/InspirationUpload";
import { RefinementPanel } from "@/components/marketing/RefinementPanel";
import { OriginalUploadModal } from "@/components/marketing/OriginalUploadModal";
import { BannersPanel } from "@/components/marketing/BannersPanel";
import { OptimizedImage } from "@/components/ui/optimized-image";

type TabId = "bannery" | "instagram" | "originals";

const navItems: { id: TabId; label: string; icon: typeof Image }[] = [
  { id: "bannery", label: "Bannery", icon: Image },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "originals", label: "Original obrazky", icon: User },
];

type ImageCategory = "face" | "mockup" | "graphic" | "photo" | "other";

const imageCategories: { id: ImageCategory; label: string }[] = [
  { id: "face", label: "Obličeje" },
  { id: "mockup", label: "Mockupy" },
  { id: "graphic", label: "Grafika" },
  { id: "photo", label: "Fotky" },
  { id: "other", label: "Ostatní" },
];

interface KubaImage {
  id: string;
  name: string;
  src: string;
  category: ImageCategory;
}

interface BannerIdea {
  id: string;
  title: string;
  description: string;
  notes: string;
  inspirationImageUrl: string | null;
  targetFormat: string;
  status: "idea" | "in-progress" | "done";
  createdAt: string;
  creatives?: Creative[];
}

interface Creative {
  id: string;
  name: string;
  dimensions: string;
  aspectRatio: string;
  imageUrl?: string;
}

interface InstagramIdea {
  id: string;
  title: string;
  description: string;
  notes: string;
  type: "post" | "story" | "carousel";
  status: "draft" | "ready" | "scheduled";
  createdAt: string;
}

const Marketing = () => {
  const [activeTab, setActiveTab] = useState<TabId>("bannery");
  const [selectedIdea, setSelectedIdea] = useState<BannerIdea | null>(null);
  const [selectedImage, setSelectedImage] = useState<KubaImage | null>(null);
  const [isNewIdea, setIsNewIdea] = useState(false);
  const [bannerIdeas, setBannerIdeas] = useState<BannerIdea[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<BannerIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creativeThumbnails, setCreativeThumbnails] = useState<Record<string, string | undefined>>({});
  
  // Instagram state
  const [selectedInstagramIdea, setSelectedInstagramIdea] = useState<InstagramIdea | null>(null);
  const [isNewInstagramIdea, setIsNewInstagramIdea] = useState(false);
  const [instagramIdeas, setInstagramIdeas] = useState<InstagramIdea[]>([]);
  const [instagramDeleteDialogOpen, setInstagramDeleteDialogOpen] = useState(false);
  const [instagramIdeaToDelete, setInstagramIdeaToDelete] = useState<InstagramIdea | null>(null);
  const [instagramThumbnails, setInstagramThumbnails] = useState<Record<string, string | undefined>>({});
  const handleSelectImage = (image: KubaImage) => {
    setSelectedIdea(null);
    setSelectedImage(image);
  };

  const handleCloseImagePanel = () => {
    setSelectedImage(null);
  };

  // Load ideas from database
  const loadIdeas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Split ideas by target_format
      const banners: BannerIdea[] = [];
      const instagram: InstagramIdea[] = [];
      
      data?.forEach(idea => {
        if (idea.target_format === "instagram") {
          instagram.push({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            notes: (idea as any).notes || "",
            type: "carousel",
            status: idea.status as "draft" | "ready" | "scheduled",
            createdAt: new Date(idea.created_at).toLocaleDateString("cs-CZ"),
          });
        } else {
          banners.push({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            notes: (idea as any).notes || "",
            inspirationImageUrl: (idea as any).inspiration_image_url || null,
            targetFormat: idea.target_format,
            status: idea.status as "idea" | "in-progress" | "done",
            createdAt: new Date(idea.created_at).toLocaleDateString("cs-CZ"),
            creatives: []
          });
        }
      });
      
      setBannerIdeas(banners);
      setInstagramIdeas(instagram);
    } catch (err) {
      console.error("Error loading ideas:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  // Load selected creative thumbnails for Instagram idioms
  useEffect(() => {
    const loadInstagramThumbnails = async () => {
      if (instagramIdeas.length === 0) return;
      
      try {
        // Get all idiom IDs for these instagram ideas
        const { data: idioms, error: idiomsError } = await supabase
          .from("instagram_idioms")
          .select("id, idea_id")
          .in("idea_id", instagramIdeas.map(i => i.id));
        
        if (idiomsError || !idioms?.length) return;
        
        // Get selected creatives for these idioms
        const { data: creatives, error: creativesError } = await supabase
          .from("marketing_creatives")
          .select("idea_id, image_url")
          .eq("is_selected", true)
          .in("idea_id", idioms.map(i => i.id));
        
        if (creativesError) return;
        
        // Map idiom_id -> instagram idea_id -> thumbnail
        const idiomToIdea = idioms.reduce((acc, i) => ({ ...acc, [i.id]: i.idea_id }), {} as Record<string, string>);
        const thumbnails: Record<string, string | undefined> = {};
        
        creatives?.forEach(c => {
          const instagramIdeaId = idiomToIdea[c.idea_id];
          if (instagramIdeaId && !thumbnails[instagramIdeaId]) {
            thumbnails[instagramIdeaId] = c.image_url;
          }
        });
        
        setInstagramThumbnails(thumbnails);
      } catch (err) {
        console.error("Error loading instagram thumbnails:", err);
      }
    };
    
    loadInstagramThumbnails();
  }, [instagramIdeas]);

  const handleCreateNewIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_ideas")
        .insert({
          title: "",
          description: "",
          target_format: "",
          status: "idea"
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newIdea: BannerIdea = {
        id: data.id,
        title: data.title,
        description: data.description,
        notes: (data as any).notes || "",
        inspirationImageUrl: (data as any).inspiration_image_url || null,
        targetFormat: data.target_format,
        status: data.status as "idea" | "in-progress" | "done",
        createdAt: "právě teď",
        creatives: []
      };
      
      setBannerIdeas(prev => [newIdea, ...prev]);
      setSelectedIdea(newIdea);
      setIsNewIdea(true);
    } catch (err) {
      console.error("Error creating idea:", err);
    }
  };

  const handleSelectIdea = (idea: BannerIdea) => {
    setSelectedIdea(idea);
    setIsNewIdea(false);
  };

  // Update idea in list and database when editing
  const handleUpdateIdea = async (updatedIdea: BannerIdea) => {
    setBannerIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    setSelectedIdea(updatedIdea);
    
    try {
      const { error } = await supabase
        .from("marketing_ideas")
        .update({
          title: updatedIdea.title,
          description: updatedIdea.description,
          notes: updatedIdea.notes,
          inspiration_image_url: updatedIdea.inspirationImageUrl,
          target_format: updatedIdea.targetFormat,
          status: updatedIdea.status
        })
        .eq("id", updatedIdea.id);
      
      if (error) throw error;
    } catch (err) {
      console.error("Error updating idea:", err);
    }
  };

  const handleDeleteRequest = (idea: BannerIdea) => {
    setIdeaToDelete(idea);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!ideaToDelete) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from("marketing_ideas")
        .delete()
        .eq("id", ideaToDelete.id);
      
      if (error) throw error;
      
      // Also delete associated inspirations
      await supabase
        .from("marketing_inspirations")
        .delete()
        .eq("idea_id", ideaToDelete.id);
      
      setBannerIdeas(prev => prev.filter(i => i.id !== ideaToDelete.id));
      
      if (selectedIdea?.id === ideaToDelete.id) {
        setSelectedIdea(null);
        setIsNewIdea(false);
      }
    } catch (err) {
      console.error("Error deleting idea:", err);
    } finally {
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    }
  };

  const isDetailOpen = selectedIdea || selectedImage || selectedInstagramIdea;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Sidebar - Navigation (hidden on mobile) */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card/50 flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl font-black text-primary-foreground font-champ">K</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-champ">Marketing</h1>
              <p className="text-muted-foreground text-xs">Kuba English</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedIdea(null);
                    setSelectedInstagramIdea(null);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedIdea(null);
                setSelectedInstagramIdea(null);
                setSelectedImage(null);
              }}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all min-w-[72px]",
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Middle Column - List */}
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300 pb-20 lg:pb-0",
        // On mobile, hide when detail is open
        isDetailOpen ? "hidden lg:block" : "",
        // On desktop, add margin for detail panel
        isDetailOpen ? "lg:mr-[720px]" : ""
      )}>
        <div className="p-4 sm:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {activeTab === "bannery" && (
                <BannerIdeasList 
                  ideas={bannerIdeas}
                  selectedId={selectedIdea?.id} 
                  onSelect={handleSelectIdea}
                  onCreateNew={handleCreateNewIdea}
                  onDelete={handleDeleteRequest}
                  thumbnails={creativeThumbnails}
                  onThumbnailsLoaded={setCreativeThumbnails}
                />
              )}
              {activeTab === "instagram" && (
                <InstagramIdeasList 
                  ideas={instagramIdeas}
                  selectedId={selectedInstagramIdea?.id}
                  onSelect={(idea) => {
                    setSelectedInstagramIdea(idea);
                    setIsNewInstagramIdea(false);
                  }}
                  onCreateNew={async () => {
                    try {
                      // Create in database first with target_format="instagram"
                      const { data, error } = await supabase
                        .from("marketing_ideas")
                        .insert({
                          title: "",
                          description: "",
                          target_format: "instagram",
                          status: "draft"
                        })
                        .select()
                        .single();
                      
                      if (error) throw error;
                      
                      const newIdea: InstagramIdea = {
                        id: data.id,
                        title: data.title,
                        description: data.description,
                        notes: (data as any).notes || "",
                        type: "carousel",
                        status: "draft",
                        createdAt: "právě teď"
                      };
                      setInstagramIdeas(prev => [newIdea, ...prev]);
                      setSelectedInstagramIdea(newIdea);
                      setIsNewInstagramIdea(true);
                    } catch (err) {
                      console.error("Error creating Instagram idea:", err);
                    }
                  }}
                  onDelete={(idea) => {
                    setInstagramIdeaToDelete(idea);
                    setInstagramDeleteDialogOpen(true);
                  }}
                  thumbnails={instagramThumbnails}
                />
              )}
              {activeTab === "originals" && (
                <OriginalsGallery 
                  selectedId={selectedImage?.id}
                  onSelect={handleSelectImage}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Column - Detail Panel for Ideas (fullscreen on mobile) */}
      <div 
        className={cn(
          "fixed inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:h-full lg:w-[720px] bg-background lg:border-l border-border z-50 lg:z-auto",
          "transform transition-transform duration-300 ease-out overflow-auto",
          selectedIdea ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedIdea && (
          <IdeaDetailPanel 
            idea={selectedIdea} 
            onClose={() => {
              setSelectedIdea(null);
              setIsNewIdea(false);
            }}
            isNew={isNewIdea}
            onUpdate={handleUpdateIdea}
            onThumbnailChange={(ideaId, imageUrl) => {
              setCreativeThumbnails(prev => ({
                ...prev,
                [ideaId]: imageUrl || undefined
              }));
            }}
          />
        )}
      </div>

      {/* Right Column - Detail Panel for Images (fullscreen on mobile) */}
      <div 
        className={cn(
          "fixed inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:h-full lg:w-[720px] bg-background lg:border-l border-border z-50 lg:z-auto",
          "transform transition-transform duration-300 ease-out overflow-auto",
          selectedImage && !selectedIdea ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedImage && (
          <ImageAnalysisPanel 
            image={selectedImage} 
            onClose={handleCloseImagePanel}
          />
        )}
      </div>

      {/* Right Column - Detail Panel for Instagram Ideas (fullscreen on mobile) */}
      <div 
        className={cn(
          "fixed inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:h-full lg:w-[720px] bg-background lg:border-l border-border z-50 lg:z-auto",
          "transform transition-transform duration-300 ease-out overflow-auto",
          selectedInstagramIdea && !selectedIdea && !selectedImage ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedInstagramIdea && (
          <InstagramIdeaDetailPanel 
            idea={selectedInstagramIdea} 
            onClose={() => {
              setSelectedInstagramIdea(null);
              setIsNewInstagramIdea(false);
            }}
            isNew={isNewInstagramIdea}
            onUpdate={(updatedIdea) => {
              setInstagramIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
              setSelectedInstagramIdea(updatedIdea);
            }}
          />
        )}
      </div>

      {/* Page ID Badge - hide on mobile when detail open */}
      <div className={cn(
        "fixed bottom-20 lg:bottom-4 right-4 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm border border-border z-30",
        isDetailOpen && "hidden lg:block"
      )}>
        <span className="text-xs font-mono text-muted-foreground">/marketing</span>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat nápad?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chceš smazat nápad "{ideaToDelete?.title || 'bez názvu'}"? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Instagram Delete Confirmation Dialog */}
      <AlertDialog open={instagramDeleteDialogOpen} onOpenChange={setInstagramDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat nápad?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chceš smazat nápad "{instagramIdeaToDelete?.title || 'bez názvu'}"? Tato akce je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (instagramIdeaToDelete) {
                  try {
                    // Delete from database
                    await supabase
                      .from("marketing_ideas")
                      .delete()
                      .eq("id", instagramIdeaToDelete.id);
                    
                    // Also delete associated idioms
                    await supabase
                      .from("instagram_idioms")
                      .delete()
                      .eq("idea_id", instagramIdeaToDelete.id);
                  } catch (err) {
                    console.error("Error deleting Instagram idea:", err);
                  }
                  
                  setInstagramIdeas(prev => prev.filter(i => i.id !== instagramIdeaToDelete.id));
                  if (selectedInstagramIdea?.id === instagramIdeaToDelete.id) {
                    setSelectedInstagramIdea(null);
                    setIsNewInstagramIdea(false);
                  }
                }
                setInstagramDeleteDialogOpen(false);
                setInstagramIdeaToDelete(null);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ideaStatusColors = {
  idea: "bg-yellow-500/20 text-yellow-400",
  "in-progress": "bg-blue-500/20 text-blue-400",
  done: "bg-green-500/20 text-green-400",
};

const ideaStatusLabels = {
  idea: "Nápad",
  "in-progress": "Rozpracováno",
  done: "Hotovo",
};

interface BannerIdeasListProps {
  ideas: BannerIdea[];
  selectedId?: string;
  onSelect: (idea: BannerIdea) => void;
  onCreateNew: () => void;
  onDelete: (idea: BannerIdea) => void;
  thumbnails: Record<string, string | undefined>;
  onThumbnailsLoaded: (thumbnails: Record<string, string | undefined>) => void;
}

const BannerIdeasList = ({ ideas, selectedId, onSelect, onCreateNew, onDelete, thumbnails, onThumbnailsLoaded }: BannerIdeasListProps) => {
  // Load selected creative thumbnails for all ideas on mount
  useEffect(() => {
    const loadThumbnails = async () => {
      if (ideas.length === 0) return;

      const { data, error } = await supabase
        .from("marketing_creatives")
        .select("idea_id, image_url, transparent_url")
        .in("idea_id", ideas.map(i => i.id))
        .eq("is_selected", true);

      if (!error && data) {
        const loaded: Record<string, string | undefined> = {};
        for (const creative of data) {
          loaded[creative.idea_id] = creative.transparent_url || creative.image_url;
        }
        onThumbnailsLoaded(loaded);
      }
    };

    loadThumbnails();
  }, [ideas, onThumbnailsLoaded]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold">Nápady na bannery</h2>
          <p className="text-muted-foreground text-sm">{ideas.length} nápadů</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nový nápad</span>
          <span className="sm:hidden">Nový</span>
        </button>
      </div>

      {/* Simple List */}
      <div className="space-y-2">
        {ideas.map((item) => {
          const thumbnail = thumbnails[item.id];
          
          return (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className={cn(
                "group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl cursor-pointer transition-colors",
                selectedId === item.id 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              {thumbnail ? (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={thumbnail} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm sm:text-base">{item.title || "Nový nápad"}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.description || "Bez popisu"}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="p-2 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface IdeaDetailPanelProps {
  idea: BannerIdea;
  onClose: () => void;
  isNew?: boolean;
  onUpdate?: (updatedIdea: BannerIdea) => void;
  onThumbnailChange?: (ideaId: string, imageUrl: string | null) => void;
}

type WizardStep = "napad" | "kreativa";

const steps: { id: WizardStep; label: string; icon: typeof FileText }[] = [
  { id: "napad", label: "Nápad", icon: FileText },
  { id: "kreativa", label: "Kreativa", icon: Wand2 },
];

import { IdeaInspirationImage } from "@/components/marketing/IdeaInspirationImage";

const IdeaDetailPanel = ({ idea, onClose, isNew = false, onUpdate, onThumbnailChange }: IdeaDetailPanelProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("napad");
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [inspirationUrls, setInspirationUrls] = useState<string[]>([]);
  const [editedTitle, setEditedTitle] = useState(idea.title);
  const [editedDescription, setEditedDescription] = useState(idea.description);
  const [descriptionHistory, setDescriptionHistory] = useState<string[]>([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [editedNotes, setEditedNotes] = useState(idea.notes || "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [idea.id]);

  useEffect(() => {
    // Always start at step 1, reset state when opening any idea
    setCurrentStep("napad");
    setCompletedSteps(new Set());
    setEditedTitle(idea.title);
    setEditedDescription(idea.description);
    setEditedNotes(idea.notes || "");
    setInspirationUrls([]);
    // Initialize history with original description if it exists (so user can always go back to it)
    setDescriptionHistory(idea.description.trim() ? [idea.description] : []);
  }, [idea.id, idea.title, idea.description, idea.notes]);

  // Mark nápad as complete when title is filled
  useEffect(() => {
    if (editedTitle.trim()) {
      setCompletedSteps(prev => new Set([...prev, "napad"]));
    } else {
      setCompletedSteps(prev => {
        const next = new Set(prev);
        next.delete("napad");
        return next;
      });
    }
  }, [editedTitle]);

  // Mark kreativa as complete when there are creatives
  // useCallback = stable identity so child effects don't re-run unnecessarily
  const handleCreativesGenerated = useCallback((hasCreatives: boolean) => {
    if (hasCreatives) {
      setCompletedSteps((prev) => new Set([...prev, "kreativa"]));
    }
  }, []);


  // Update parent list when title or description changes
  const handleTitleChange = (newTitle: string) => {
    setEditedTitle(newTitle);
    onUpdate?.({ ...idea, title: newTitle, description: editedDescription, notes: editedNotes });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setEditedDescription(newDescription);
    onUpdate?.({ ...idea, title: editedTitle, description: newDescription, notes: editedNotes });
  };

  const handleNotesChange = (newNotes: string) => {
    setEditedNotes(newNotes);
    onUpdate?.({ ...idea, title: editedTitle, description: editedDescription, notes: newNotes });
  };

  const handleInspirationImageChange = (newUrl: string | null) => {
    onUpdate?.({ ...idea, title: editedTitle, description: editedDescription, notes: editedNotes, inspirationImageUrl: newUrl });
  };

  const handleGenerateDescription = async () => {
    if (!editedTitle.trim()) return;

    setIsGeneratingDescription(true);

    try {
      // Save current description to history before generating new one
      if (editedDescription.trim()) {
        setDescriptionHistory(prev => [...prev, editedDescription]);
      }

      const { data, error } = await supabase.functions.invoke("generate-idea-description", {
        body: { title: editedTitle.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.description) {
        setEditedDescription(data.description);
        onUpdate?.({ ...idea, title: editedTitle, description: data.description });
      }
    } catch (err) {
      console.error("Error generating description:", err);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleUndoDescription = () => {
    if (descriptionHistory.length === 0) return;

    const previousDescription = descriptionHistory[descriptionHistory.length - 1];
    setDescriptionHistory(prev => prev.slice(0, -1));
    setEditedDescription(previousDescription);
    onUpdate?.({ ...idea, title: editedTitle, description: previousDescription });
  };

  const handleNext = () => {
    if (!isLastStep) {
      // Mark current step as completed when moving forward
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const nextStep = steps[currentStepIndex + 1].id;
      setCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleStepClick = (stepId: WizardStep) => {
    setCurrentStep(stepId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with title and close */}
      <div className="p-4 sm:p-6 border-b border-border flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ideaStatusColors[idea.status])}>
              {ideaStatusLabels[idea.status]}
            </span>
          </div>
          {isNew && idea.title === "" ? (
            <p className="text-lg sm:text-xl font-semibold text-muted-foreground truncate">Nový nápad</p>
          ) : (
            <h2 className="text-lg sm:text-xl font-semibold truncate">{idea.title || "Nový nápad"}</h2>
          )}
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step indicators - horizontal scroll on mobile */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.has(step.id) && !isActive;
            const StepIcon = step.icon;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Nápad Step */}
        {currentStep === "napad" && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Název nápadu</label>
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Např. Kuba s pivem a angličtinou..."
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Popis nápadu</label>
                  <div className="flex items-center gap-1">
                    {descriptionHistory.length > 0 && (
                      <button
                        onClick={handleUndoDescription}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Vrátit předchozí popis"
                      >
                        <Undo2 className="w-3 h-3" />
                        Zpět
                      </button>
                    )}
                    <button
                      onClick={handleGenerateDescription}
                      disabled={!editedTitle.trim() || isGeneratingDescription}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                        !editedTitle.trim() || isGeneratingDescription
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-primary hover:bg-primary/10"
                      )}
                      title="Vygenerovat popis pomocí AI"
                    >
                      {isGeneratingDescription ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generuji...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Vygenerovat AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea 
                  value={editedDescription}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Popiš svůj nápad na banner nebo kreativu..."
                  className="w-full h-32 px-4 py-3 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="flex-shrink-0 pt-7">
                <IdeaInspirationImage
                  ideaId={idea.id}
                  imageUrl={idea.inspirationImageUrl}
                  onChange={handleInspirationImageChange}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Poznámky</label>
              <textarea 
                value={editedNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Místo pro jakékoliv poznámky k tomuto nápadu..."
                className="w-full h-40 px-4 py-3 bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40 text-sm"
              />
            </div>

            {!isNew && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Vytvořeno: {idea.createdAt}</p>
              </div>
            )}
          </div>
        )}

        {/* Kreativa Step */}
        {currentStep === "kreativa" && (
          <RefinementPanel 
            ideaId={idea.id}
            ideaTitle={editedTitle}
            ideaDescription={editedDescription}
            inspirationUrls={inspirationUrls}
            ideaInspirationImageUrl={idea.inspirationImageUrl}
            onCreativesGenerated={handleCreativesGenerated}
            onSelectionChange={(imageUrl) => onThumbnailChange?.(idea.id, imageUrl)}
          />
        )}
      </div>

      {/* Sticky footer with navigation */}
      <div className="p-6 border-t border-border bg-background">
        <div className="flex items-center gap-3">
          {!isFirstStep && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Zpět
            </button>
          )}
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={currentStep === "napad" && !editedTitle.trim()}
              className={cn(
                "flex-1 px-4 py-3 rounded-full font-medium transition-colors",
                currentStep === "napad" && !editedTitle.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              Pokračovat
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
            >
              Hotovo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-primary/20 text-primary",
  scheduled: "bg-blue-500/20 text-blue-400",
};

const typeLabels = {
  post: "Post",
  story: "Story",
  carousel: "Carousel",
};

interface InstagramIdeasListProps {
  ideas: InstagramIdea[];
  selectedId?: string;
  onSelect: (idea: InstagramIdea) => void;
  onCreateNew: () => void;
  onDelete: (idea: InstagramIdea) => void;
  thumbnails?: Record<string, string | undefined>;
}

const InstagramIdeasList = ({ ideas, selectedId, onSelect, onCreateNew, onDelete, thumbnails = {} }: InstagramIdeasListProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold">Instagram nápady</h2>
          <p className="text-muted-foreground text-sm">{ideas.length} nápadů</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nový nápad</span>
          <span className="sm:hidden">Nový</span>
        </button>
      </div>

      {/* Simple List */}
      <div className="space-y-2">
        {ideas.map((item) => {
          const thumbnail = thumbnails[item.id];
          return (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className={cn(
                "group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl cursor-pointer transition-colors",
                selectedId === item.id 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={item.title || "Kreativa"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-500/10 flex items-center justify-center">
                    <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm sm:text-base">{item.title || "Nový nápad"}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.description || "Bez popisu"}</p>
              </div>
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium hidden sm:inline-flex", statusColors[item.status])}>
                {typeLabels[item.type]}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                className="p-2 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface InstagramIdeaDetailPanelProps {
  idea: InstagramIdea;
  onClose: () => void;
  isNew?: boolean;
  onUpdate?: (updatedIdea: InstagramIdea) => void;
}

interface IdiomIdea {
  id?: string;
  idiom: string;
  scene: string;
}

interface IdiomCreative {
  id: string;
  imageUrl: string;
  isLoading?: boolean;
  isSelected?: boolean;
}

const InstagramIdeaDetailPanel = ({ idea, onClose, isNew = false, onUpdate }: InstagramIdeaDetailPanelProps) => {
  const [editedTitle, setEditedTitle] = useState(idea.title);
  const [idiomIdeas, setIdiomIdeas] = useState<IdiomIdea[]>([]);
  const [isLoadingIdioms, setIsLoadingIdioms] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdiom, setSelectedIdiom] = useState<IdiomIdea | null>(null);
  const [editedScene, setEditedScene] = useState("");
  const [idiomCreatives, setIdiomCreatives] = useState<IdiomCreative[]>([]);
  const [isGeneratingCreatives, setIsGeneratingCreatives] = useState(false);
  const [idiomThumbnails, setIdiomThumbnails] = useState<Record<string, string | undefined>>({});
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current && !selectedIdiom) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [idea.id, selectedIdiom]);

  // Load idioms from database when idea changes
  useEffect(() => {
    setEditedTitle(idea.title);
    setSelectedIdiom(null);
    setIdiomCreatives([]);
    setIsLoadingIdioms(true);
    loadIdiomsFromDb();
  }, [idea.id]);

  const loadIdiomsFromDb = async () => {
    try {
      const { data, error } = await supabase
        .from("instagram_idioms")
        .select("*")
        .eq("idea_id", idea.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const idioms = data?.map(d => ({
        id: d.id,
        idiom: d.idiom,
        scene: d.scene,
      })) || [];
      
      setIdiomIdeas(idioms);
      
      // Load thumbnails for these idioms
      if (idioms.length > 0) {
        const idiomIds = idioms.map(i => i.id).filter(Boolean) as string[];
        const { data: creatives } = await supabase
          .from("marketing_creatives")
          .select("idea_id, image_url")
          .in("idea_id", idiomIds)
          .eq("is_selected", true);
        
        if (creatives?.length) {
          const thumbs: Record<string, string | undefined> = {};
          creatives.forEach(c => {
            thumbs[c.idea_id] = c.image_url;
          });
          setIdiomThumbnails(thumbs);
        }
      }
    } catch (err) {
      console.error("Error loading idioms:", err);
      setIdiomIdeas([]);
    } finally {
      setIsLoadingIdioms(false);
    }
  };

  // Load creatives from DB when idiom is selected (don't auto-generate)
  useEffect(() => {
    if (selectedIdiom) {
      setEditedScene(selectedIdiom.scene);
      loadIdiomCreatives(selectedIdiom.id);
    }
  }, [selectedIdiom]);

  const loadIdiomCreatives = async (idiomId: string) => {
    try {
      setIsGeneratingCreatives(true);
      const { data, error } = await supabase
        .from("marketing_creatives")
        .select("*")
        .eq("idea_id", idiomId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setIdiomCreatives(data?.map(c => ({
        id: c.id,
        imageUrl: c.image_url,
        isLoading: false,
        isSelected: c.is_selected || false,
      })) || []);
    } catch (err) {
      console.error("Error loading idiom creatives:", err);
      setIdiomCreatives([]);
    } finally {
      setIsGeneratingCreatives(false);
    }
  };

  const handleDeleteCreative = async (creativeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from("marketing_creatives").delete().eq("id", creativeId);
      setIdiomCreatives(prev => prev.filter(c => c.id !== creativeId));
    } catch (err) {
      console.error("Error deleting creative:", err);
    }
  };

  const handleToggleFavorite = async (creativeId: string) => {
    const creative = idiomCreatives.find(c => c.id === creativeId);
    if (!creative || creative.isLoading || !selectedIdiom?.id) return;

    const newIsSelected = !creative.isSelected;
    
    // Optimistically update UI
    setIdiomCreatives(prev => prev.map(c => ({
      ...c,
      isSelected: c.id === creativeId ? newIsSelected : false // Only one can be selected
    })));
    
    // Update thumbnail in idiom list
    setIdiomThumbnails(prev => ({
      ...prev,
      [selectedIdiom.id!]: newIsSelected ? creative.imageUrl : undefined
    }));

    try {
      // First, deselect all others for this idiom
      if (newIsSelected) {
        await supabase
          .from("marketing_creatives")
          .update({ is_selected: false })
          .eq("idea_id", selectedIdiom.id);
      }
      
      // Then set the new selection
      await supabase
        .from("marketing_creatives")
        .update({ is_selected: newIsSelected })
        .eq("id", creativeId);
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Revert on error
      setIdiomCreatives(prev => prev.map(c => ({
        ...c,
        isSelected: c.id === creativeId ? !newIsSelected : c.isSelected
      })));
      setIdiomThumbnails(prev => ({
        ...prev,
        [selectedIdiom.id!]: !newIsSelected ? creative.imageUrl : undefined
      }));
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    setEditedTitle(newTitle);
    onUpdate?.({ ...idea, title: newTitle });
    
    // Save to database
    try {
      await supabase
        .from("marketing_ideas")
        .update({ title: newTitle })
        .eq("id", idea.id);
    } catch (err) {
      console.error("Error saving title:", err);
    }
  };

  const handleGenerateIdioms = async () => {
    if (!editedTitle.trim() || isGenerating || idiomIdeas.length > 0) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-idiom-ideas", {
        body: { title: editedTitle.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.idioms && Array.isArray(data.idioms)) {
        // Save to database
        const toInsert = data.idioms.map((idiom: { idiom: string; scene: string }) => ({
          idea_id: idea.id,
          idiom: idiom.idiom,
          scene: idiom.scene,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from("instagram_idioms")
          .insert(toInsert)
          .select();

        if (insertError) throw insertError;

        // Update local state with DB IDs
        setIdiomIdeas(prev => [
          ...prev,
          ...(inserted?.map(d => ({
            id: d.id,
            idiom: d.idiom,
            scene: d.scene,
          })) || [])
        ]);
      }
    } catch (err) {
      console.error("Error generating idiom ideas:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteIdiom = async (idiomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from("instagram_idioms").delete().eq("id", idiomId);
      setIdiomIdeas(prev => prev.filter(i => i.id !== idiomId));
    } catch (err) {
      console.error("Error deleting idiom:", err);
    }
  };

  const handleDeleteAllIdioms = async () => {
    try {
      await supabase.from("instagram_idioms").delete().eq("idea_id", idea.id);
      setIdiomIdeas([]);
    } catch (err) {
      console.error("Error deleting all idioms:", err);
    }
  };

  const handleSelectIdiom = (idiom: IdiomIdea) => {
    setSelectedIdiom(idiom);
    // Don't clear creatives - let useEffect load from DB
  };

  const handleBackToList = () => {
    setSelectedIdiom(null);
    setIdiomCreatives([]);
    setEditedScene("");
  };

  const creativesGridRef = useRef<HTMLDivElement>(null);

  const generateCreatives = async (sceneDescription: string) => {
    if (!sceneDescription.trim() || isGeneratingCreatives) return;

    setIsGeneratingCreatives(true);
    
    // Create 8 placeholder skeletons with unique IDs
    const placeholderIds = Array.from({ length: 8 }, (_, i) => `loading-${Date.now()}-${i}`);
    const placeholders: IdiomCreative[] = placeholderIds.map(id => ({
      id,
      imageUrl: "",
      isLoading: true,
    }));
    setIdiomCreatives(prev => [...prev, ...placeholders]);

    // Auto-scroll to show new creatives being generated
    setTimeout(() => {
      creativesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);

    try {
      // First, select the best face for this scene using AI
      console.log("Selecting best face for scene...");
      let selectedFaceUrl: string | undefined;
      
      try {
        const { data: faceData, error: faceError } = await supabase.functions.invoke("select-best-face", {
          body: { sceneDescription }
        });
        
        if (!faceError && faceData?.faceUrl) {
          selectedFaceUrl = faceData.faceUrl;
          console.log(`AI selected face: ${faceData.faceName} (${faceData.emotion}) - ${faceData.reason}`);
        }
      } catch (faceErr) {
        console.warn("Face selection failed, using default:", faceErr);
      }

      // Generate 8 creatives in parallel (2 at a time), replacing placeholders as they complete
      for (let i = 0; i < 8; i += 2) {
        const batchPlaceholderIds = [placeholderIds[i], placeholderIds[i + 1]];
        
        const batchPromises = batchPlaceholderIds.map(async (placeholderId, batchIndex) => {
          const creative = await generateSingleCreative(sceneDescription, i + batchIndex, selectedFaceUrl);
          
          // Replace the specific placeholder with the result
          setIdiomCreatives(prev => prev.map(c => {
            if (c.id === placeholderId) {
              if (creative) {
                return { ...creative, isLoading: false };
              } else {
                // Mark as failed - will be cleaned up
                return { ...c, id: `failed-${placeholderId}`, isLoading: false, imageUrl: "" };
              }
            }
            return c;
          }));
          
          return creative;
        });
        
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error("Error generating creatives:", err);
    } finally {
      setIsGeneratingCreatives(false);
      // Remove any failed placeholders (no imageUrl)
      setIdiomCreatives(prev => prev.filter(c => !c.isLoading && c.imageUrl));
    }
  };

  const generateSingleCreative = async (sceneDescription: string, variationIndex?: number, faceUrl?: string): Promise<IdiomCreative | null> => {
    if (!selectedIdiom) return null;
    
    try {
      // Add variation hint to make each generation unique
      const variationHint = variationIndex !== undefined 
        ? ` (variation ${variationIndex + 1}: explore different pose, angle, or expression)` 
        : "";
      
      const { data, error } = await supabase.functions.invoke("generate-banner-creative", {
        body: {
          ideaId: selectedIdiom.id, // Use idiom ID for linking
          ideaTitle: selectedIdiom.idiom || "",
          ideaDescription: sceneDescription + variationHint,
          faceImageUrl: faceUrl, // Use AI-selected face
          mockupUrls: [],
          inspirationUrls: [],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        // Save to database with idiom ID as idea_id
        const { data: inserted, error: insertError } = await supabase
          .from("marketing_creatives")
          .insert({
            idea_id: selectedIdiom.id,
            image_url: data.imageUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error saving creative:", insertError);
          // Return creative anyway for UI
          return {
            id: `creative-${Date.now()}-${Math.random()}`,
            imageUrl: data.imageUrl,
          };
        }

        return {
          id: inserted.id,
          imageUrl: inserted.image_url,
        };
      }
    } catch (err) {
      console.error("Error generating single creative:", err);
    }
    return null;
  };

  const handleGenerateMore = () => {
    if (editedScene.trim()) {
      generateCreatives(editedScene);
    }
  };

  // State for editing mode
  const [isEditingScene, setIsEditingScene] = useState(false);

  // If idiom is selected, show creative generation view
  if (selectedIdiom) {
    return (
      <div className="h-full flex flex-col">
        {/* Sticky Header - fixed at top */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border bg-background">
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={handleBackToList}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Zpět</span>
            </button>
            
            <h2 className="text-base sm:text-lg font-semibold text-foreground truncate flex-1 text-center px-2">
              {selectedIdiom.idiom}
            </h2>
            
            <div className="flex items-center gap-2">
              {idiomCreatives.some(c => c.isSelected) && (
                <button
                  onClick={() => {
                    const favoriteEl = document.querySelector('[data-favorite="true"]');
                    favoriteEl?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Favorit</span>
                </button>
              )}
              <button 
                onClick={() => setIsEditingScene(!isEditingScene)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isEditingScene ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content area - everything scrolls together */}
        <div className="flex-1 overflow-auto">
          {/* Scene preview - clickable to open edit drawer */}
          {editedScene && (
            <div 
              onClick={() => setIsEditingScene(true)}
              className="p-4 sm:p-6 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <p className="text-sm text-muted-foreground line-clamp-2">{editedScene}</p>
            </div>
          )}
          
          {!editedScene && (
            <div 
              onClick={() => setIsEditingScene(true)}
              className="p-4 sm:p-6 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <p className="text-sm text-muted-foreground/50 italic">Klikni pro přidání popisu scény...</p>
            </div>
          )}

          {/* Bottom sheet drawer for editing scene - mobile optimized */}
          <Drawer open={isEditingScene} onOpenChange={setIsEditingScene}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="text-left pb-2">
                <DrawerTitle>Popis scény</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6">
                <textarea
                  value={editedScene}
                  onChange={(e) => setEditedScene(e.target.value)}
                  placeholder="Popis vtipné scény..."
                  className="w-full h-40 px-4 py-3 bg-muted/50 border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40 text-base"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingScene(false)}
                  className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Hotovo
                </button>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Creatives grid */}
          <div className="p-4 sm:p-6">
            {isGeneratingCreatives && idiomCreatives.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-muted/30 animate-pulse flex items-center justify-center border border-border">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : idiomCreatives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                <Wand2 className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
                <p className="text-sm">Zatím žádné kreativy</p>
                <p className="text-xs text-center px-4">Klikni na tužku pro úpravu popisu scény</p>
              </div>
            ) : (
              <div ref={creativesGridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {idiomCreatives.map((creative, index) => (
                  <div 
                    key={creative.id}
                    data-favorite={creative.isSelected ? "true" : undefined}
                    onClick={() => !creative.isLoading && handleToggleFavorite(creative.id)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group",
                      creative.isLoading 
                        ? "bg-muted/30 animate-pulse border-border cursor-default" 
                        : creative.isSelected
                          ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                          : "border-border hover:border-primary/50 hover:shadow-lg animate-scale-in"
                    )}
                    style={{ animationDelay: creative.isLoading ? undefined : `${index * 100}ms` }}
                  >
                    {creative.isLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 sm:gap-3">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Generuji...</p>
                      </div>
                    ) : (
                      <>
                        <OptimizedImage 
                          src={creative.imageUrl} 
                          alt=""
                          aspectRatio="square"
                          className="w-full h-full"
                          targetSize={400}
                          priority={index < 4}
                        />
                        
                        {/* Favorite indicator */}
                        {creative.isSelected && (
                          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3 fill-current" />
                            Favorit
                          </div>
                        )}
                        
                        {/* Delete button - always visible */}
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCreative(creative.id, e);
                          }}
                          className="absolute top-2 right-2 p-3 rounded-full bg-background/95 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-lg z-20 touch-manipulation cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Bottom padding for sticky button */}
            <div className="h-24" />
          </div>
        </div>

        {/* Sticky Generate button */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm">
          <button
            onClick={handleGenerateMore}
            disabled={!editedScene.trim() || isGeneratingCreatives}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-colors",
              !editedScene.trim() || isGeneratingCreatives
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isGeneratingCreatives ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generuji...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generovat 8 variant
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Default view - idiom list
  return (
    <div className="h-full flex flex-col">
      {/* Header with close button */}
      <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-400 flex-shrink-0" />
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusColors[idea.status])}>
            {typeLabels[idea.type]}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Title input + Generate button */}
      <div className="p-4 sm:p-6 border-b border-border space-y-3 sm:space-y-4">
        <input
          ref={titleInputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Např. Vtipné idiomy doslova vs. přeneseně..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/40 text-base sm:text-lg font-medium"
        />
        <button
          onClick={handleGenerateIdioms}
          disabled={!editedTitle.trim() || isGenerating || idiomIdeas.length > 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base",
            !editedTitle.trim() || isGenerating || idiomIdeas.length > 0
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generuji nápady...
            </>
          ) : idiomIdeas.length > 0 ? (
            <>
              <Sparkles className="w-4 h-4 opacity-50" />
              Nejdřív smaž všechny idiomy
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generovat nápady
            </>
          )}
        </button>
      </div>

      {/* Idiom ideas list */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoadingIdioms ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : idiomIdeas.length === 0 && !isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-center">Zadej název nápadu a klikni na "Generovat nápady"</p>
          </div>
        ) : isGenerating ? (
          <div className="space-y-4">
            {/* Show existing idioms first */}
            {idiomIdeas.map((item, index) => (
              <div 
                key={item.id || index} 
                className="relative p-4 rounded-xl bg-card border border-border animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{item.idiom}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.scene}</p>
              </div>
            ))}
            {/* Loading skeletons for new items */}
            {[1, 2, 3, 4].map((i) => (
              <div key={`skeleton-${i}`} className="p-4 rounded-xl bg-muted/30 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Delete all button */}
            {idiomIdeas.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleDeleteAllIdioms}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Smazat vše
                </button>
              </div>
            )}
            
            {idiomIdeas.map((item, index) => {
              const thumbnail = item.id ? idiomThumbnails[item.id] : undefined;
              
              return (
                <div 
                  key={item.id || index} 
                  className="relative p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Delete button */}
                  {item.id && (
                    <button
                      onClick={(e) => handleDeleteIdiom(item.id!, e)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Clickable area */}
                  <button 
                    onClick={() => handleSelectIdiom(item)}
                    className="w-full text-left"
                  >
                    {/* Idiom header with thumbnail */}
                    <div className="flex items-center gap-3 mb-3 pr-8">
                      {thumbnail ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 border-primary/30">
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-foreground flex-1">{item.idiom}</h3>
                      <ChevronLeft className="w-5 h-5 text-primary rotate-180 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 flex-shrink-0" />
                    </div>
                    
                    {/* Scene description */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.scene}</p>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Built-in Kuba base images
const builtinKubaImages: KubaImage[] = [
  { id: "happy", name: "Happy", src: "/images/kuba/happy.png", category: "face" },
  { id: "cute-smile", name: "Cute Smile", src: "/images/kuba/cute-smile.png", category: "face" },
  { id: "angry", name: "Angry", src: "/images/kuba/angry.png", category: "face" },
  { id: "disgusted", name: "Disgusted", src: "/images/kuba/disgusted.png", category: "face" },
];

interface OriginalsGalleryProps {
  selectedId?: string;
  onSelect: (image: KubaImage) => void;
}

const OriginalsGallery = ({ selectedId, onSelect }: OriginalsGalleryProps) => {
  const [uploadedImages, setUploadedImages] = useState<KubaImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [analysisQueue, setAnalysisQueue] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | "all">("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Load uploaded images from database
  const loadUploadedImages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("kuba_base_images")
        .select("*")
        .eq("is_builtin", false)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setUploadedImages(data?.map(img => ({
        id: img.id,
        name: img.name,
        src: img.image_url,
        category: (img.category as ImageCategory) || "face"
      })) || []);
    } catch (err) {
      console.error("Error loading uploaded images:", err);
    }
  }, []);

  useEffect(() => {
    loadUploadedImages();
  }, [loadUploadedImages]);

  // Check for analysis completion
  useEffect(() => {
    if (analysisQueue.length === 0) return;

    const checkAnalysis = async () => {
      for (const imageId of analysisQueue) {
        const { data } = await supabase
          .from("face_analyses")
          .select("id")
          .eq("image_id", imageId)
          .maybeSingle();
        
        if (data) {
          setAnalysisQueue(prev => prev.filter(id => id !== imageId));
        }
      }
    };

    const interval = setInterval(checkAnalysis, 3000);
    return () => clearInterval(interval);
  }, [analysisQueue]);

  const handleUploadFiles = useCallback(async (files: File[], category: ImageCategory) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress([]);
    const newImages: KubaImage[] = [];
    const newAnalysisQueue: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use sanitized filename to avoid issues with AI APIs (spaces, special chars)
        const fileName = generateSafeFileName(file.name);
        
        setUploadProgress(prev => [...prev, `Nahrávám ${file.name}...`]);

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("kuba-originals")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          setUploadProgress(prev => [...prev, `Chyba: ${file.name}`]);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("kuba-originals")
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;
        const imageName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

        // Save to database with selected category
        const { data: dbData, error: dbError } = await supabase
          .from("kuba_base_images")
          .insert({
            name: imageName,
            image_url: imageUrl,
            storage_path: fileName,
            is_builtin: false,
            category: category
          })
          .select()
          .single();

        if (dbError) {
          console.error("DB error:", dbError);
          continue;
        }

        const newImage: KubaImage = {
          id: dbData.id,
          name: imageName,
          src: imageUrl,
          category: category
        };
        newImages.push(newImage);

        // Only trigger AI analysis for face images
        if (category === "face") {
          setUploadProgress(prev => [...prev, `Spouštím AI analýzu: ${imageName}...`]);

          supabase.functions.invoke("analyze-face-background", {
            body: {
              imageId: dbData.id,
              imageName: imageName,
              imageUrl: imageUrl
            }
          }).then(({ error }) => {
            if (error) {
              console.error("Background analysis error:", error);
            }
          });

          newAnalysisQueue.push(dbData.id);
        }
      }

      setUploadedImages(prev => [...newImages, ...prev]);
      setAnalysisQueue(prev => [...prev, ...newAnalysisQueue]);
      setUploadProgress(prev => [...prev, `✓ Nahráno ${newImages.length} obrázků${newAnalysisQueue.length > 0 ? ", AI analýza běží na pozadí" : ""}`]);
      
      // Close modal after successful upload with slight delay
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadProgress([]);
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadProgress(prev => [...prev, "Chyba při nahrávání"]);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDeleteImage = async (image: KubaImage, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Get storage path
      const { data: imgData } = await supabase
        .from("kuba_base_images")
        .select("storage_path")
        .eq("id", image.id)
        .single();

      if (imgData?.storage_path) {
        // Delete from storage
        await supabase.storage
          .from("kuba-originals")
          .remove([imgData.storage_path]);
      }

      // Delete from database
      await supabase
        .from("kuba_base_images")
        .delete()
        .eq("id", image.id);

      // Delete analysis
      await supabase
        .from("face_analyses")
        .delete()
        .eq("image_id", image.id);

      setUploadedImages(prev => prev.filter(img => img.id !== image.id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const allImages = [...builtinKubaImages, ...uploadedImages];
  
  // Filter images by category
  const filteredImages = selectedCategory === "all" 
    ? allImages 
    : allImages.filter(img => img.category === selectedCategory);

  // Count images per category
  const categoryCounts = imageCategories.reduce((acc, cat) => {
    acc[cat.id] = allImages.filter(img => img.category === cat.id).length;
    return acc;
  }, {} as Record<ImageCategory, number>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with upload button */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold">Original obrazky</h2>
          <p className="text-muted-foreground text-sm">
            {filteredImages.length} z {allImages.length} obrázků
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Nahrát obrázky</span>
            <span className="sm:hidden">Nahrát</span>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <OriginalUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUploadFiles}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Category filter tabs - horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Vše ({allImages.length})
        </button>
        {imageCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              categoryCounts[cat.id] === 0 && "opacity-50"
            )}
          >
            {cat.label} ({categoryCounts[cat.id]})
          </button>
        ))}
      </div>

      {/* Analysis queue indicator */}
      {analysisQueue.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-primary">
            AI analýza běží pro {analysisQueue.length} obrázků...
          </span>
        </div>
      )}

      {/* Grid of images - responsive columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
        {filteredImages.map((image) => {
          const isBuiltin = builtinKubaImages.some(b => b.id === image.id);
          const isAnalyzing = analysisQueue.includes(image.id);
          const categoryLabel = imageCategories.find(c => c.id === image.category)?.label;
          
          return (
            <div 
              key={image.id} 
              onClick={() => onSelect(image)}
              className={cn(
                "group cursor-pointer transition-all relative",
                selectedId === image.id && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl"
              )}
            >
              <div className="aspect-square bg-black rounded-xl overflow-hidden border border-border relative">
                <img 
                  src={image.src} 
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
                
                {/* Analyzing indicator */}
                {isAnalyzing && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/80 text-primary-foreground text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      AI
                    </div>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Analyzovat
                  </button>
                  {!isBuiltin && (
                    <button 
                      onClick={(e) => handleDeleteImage(image, e)}
                      className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{image.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel}
                  {!isBuiltin && " • nahrané"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ImageAnalysisPanelProps {
  image: KubaImage;
  onClose: () => void;
}

interface FaceAnalysis {
  primaryEmotion: string;
  secondaryTag: string;
  energyLevel: "low" | "medium" | "high";
  // Extended emotional parameters
  mouthState: "closed" | "open" | "screaming" | "smiling" | "speaking";
  eyeExpression: "neutral" | "skeptical" | "excited" | "angry" | "surprised" | "tired" | "focused" | "playful";
  expressionIntensity: number;
  sarcasmLevel: "none" | "mild" | "heavy";
  // Directional parameters
  gazeDirection: "left" | "right" | "center" | "up" | "down" | "camera";
  chinDirection: "left" | "right" | "center" | "up" | "down";
  // Original fields
  facialDescription: string;
  marketingUseCases: string[];
  suggestedVocabulary: string[];
  brandFit: string;
}

const energyLabels: Record<string, { label: string; color: string }> = {
  low: { label: "Nízká", color: "bg-blue-500/20 text-blue-400" },
  medium: { label: "Střední", color: "bg-yellow-500/20 text-yellow-400" },
  high: { label: "Vysoká", color: "bg-red-500/20 text-red-400" },
};

const mouthStateLabels: Record<string, string> = {
  closed: "Zavřená",
  open: "Otevřená",
  screaming: "Křičící",
  smiling: "Usmívající se",
  speaking: "Mluvící",
};

const eyeExpressionLabels: Record<string, string> = {
  neutral: "Neutrální",
  skeptical: "Skeptický",
  excited: "Nadšený",
  angry: "Naštvaný",
  surprised: "Překvapený",
  tired: "Unavený",
  focused: "Soustředěný",
  playful: "Hravý",
};

const sarcasmLabels: Record<string, { label: string; color: string }> = {
  none: { label: "Žádný", color: "bg-muted text-muted-foreground" },
  mild: { label: "Mírný", color: "bg-yellow-500/20 text-yellow-400" },
  heavy: { label: "Silný", color: "bg-red-500/20 text-red-400" },
};

const directionLabels: Record<string, string> = {
  left: "← Doleva",
  right: "Doprava →",
  center: "Střed",
  up: "↑ Nahoru",
  down: "↓ Dolů",
  camera: "📷 Do kamery",
};

const getEnergyLabel = (level: string) => {
  return energyLabels[level] || { label: level, color: "bg-muted text-muted-foreground" };
};

const ImageAnalysisPanel = ({ image, onClose }: ImageAnalysisPanelProps) => {
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const fetchImageAsBase64 = async (src: string): Promise<string> => {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Load existing analysis from database
  const loadExistingAnalysis = async () => {
    try {
      const { data, error: dbError } = await supabase
        .from("face_analyses")
        .select("*")
        .eq("image_id", image.id)
        .maybeSingle();
      
      if (dbError) {
        console.error("Error loading analysis:", dbError);
        return false;
      }
      
      if (data) {
        console.log("Loaded existing analysis from DB for", image.id);
        setAnalysis({
          primaryEmotion: data.primary_emotion,
          secondaryTag: data.secondary_tag,
          energyLevel: data.energy_level as "low" | "medium" | "high",
          mouthState: (data.mouth_state || "closed") as FaceAnalysis["mouthState"],
          eyeExpression: (data.eye_expression || "neutral") as FaceAnalysis["eyeExpression"],
          expressionIntensity: data.expression_intensity || 5,
          sarcasmLevel: (data.sarcasm_level || "none") as FaceAnalysis["sarcasmLevel"],
          gazeDirection: (data.gaze_direction || "center") as FaceAnalysis["gazeDirection"],
          chinDirection: (data.chin_direction || "center") as FaceAnalysis["chinDirection"],
          facialDescription: data.facial_description,
          marketingUseCases: data.marketing_use_cases as string[],
          suggestedVocabulary: data.suggested_vocabulary as string[],
          brandFit: data.brand_fit,
        });
        setIsSaved(true);
        return true;
      }
      console.log("No existing analysis found for", image.id);
      return false;
    } catch (err) {
      console.error("Error loading analysis:", err);
      return false;
    }
  };

  // Save analysis to database
  const saveAnalysis = async (analysisData: FaceAnalysis) => {
    try {
      const { error: dbError } = await supabase
        .from("face_analyses")
        .upsert({
          image_id: image.id,
          image_name: image.name,
          image_src: image.src,
          primary_emotion: analysisData.primaryEmotion,
          secondary_tag: analysisData.secondaryTag,
          energy_level: analysisData.energyLevel,
          mouth_state: analysisData.mouthState,
          eye_expression: analysisData.eyeExpression,
          expression_intensity: analysisData.expressionIntensity,
          sarcasm_level: analysisData.sarcasmLevel,
          gaze_direction: analysisData.gazeDirection,
          chin_direction: analysisData.chinDirection,
          facial_description: analysisData.facialDescription,
          marketing_use_cases: analysisData.marketingUseCases,
          suggested_vocabulary: analysisData.suggestedVocabulary,
          brand_fit: analysisData.brandFit,
        }, {
          onConflict: "image_id"
        });
      
      if (dbError) throw dbError;
      setIsSaved(true);
    } catch (err) {
      console.error("Error saving analysis:", err);
    }
  };

  const runAnalysis = async (forceNew = false) => {
    setIsAnalyzing(true);
    setError(null);
    if (forceNew) setAnalysis(null);

    try {
      // Convert image to base64 and send to edge function
      const imageBase64 = await fetchImageAsBase64(image.src);
      
      const { data, error: funcError } = await supabase.functions.invoke('analyze-face', {
        body: { imageBase64 }
      });

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      const analysisResult = data.analysis as FaceAnalysis;
      setAnalysis(analysisResult);
      
      // Save to database
      await saveAnalysis(analysisResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setIsSaved(false);
      const hasExisting = await loadExistingAnalysis();
      if (!hasExisting) {
        await runAnalysis();
      }
      setIsLoading(false);
    };
    init();
  }, [image.id]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
              AI Analýza
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold truncate">{image.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image preview with emotion tags */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center relative">
          <img 
            src={image.src} 
            alt={image.name}
            className="h-full object-contain"
          />
          {/* Emotion tags overlay */}
          {analysis && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 sm:gap-2">
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-primary text-primary-foreground shadow-lg">
                {analysis.primaryEmotion}
              </span>
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-secondary text-secondary-foreground shadow-lg">
                {analysis.secondaryTag}
              </span>
            </div>
          )}
          {/* Energy level */}
          {analysis && analysis.energyLevel && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
              <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getEnergyLabel(analysis.energyLevel).color)}>
                ⚡ {getEnergyLabel(analysis.energyLevel).label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {(isAnalyzing || isLoading) && !analysis && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {isLoading ? "Načítám uloženou analýzu..." : "Analyzuji obličej pomocí AI..."}
            </p>
          </div>
        )}

        {error && !analysis && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
            <p className="font-medium">Chyba při analýze</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Saved indicator */}
            {isSaved && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Analýza uložena v databázi</span>
              </div>
            )}

            {/* Extended emotional parameters */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Emoční parametry</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Ústa</p>
                  <p className="font-medium">{mouthStateLabels[analysis.mouthState] || analysis.mouthState}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Oči</p>
                  <p className="font-medium">{eyeExpressionLabels[analysis.eyeExpression] || analysis.eyeExpression}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Intenzita</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(analysis.expressionIntensity / 10) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-sm">{analysis.expressionIntensity}/10</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Sarkasmus</p>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", sarcasmLabels[analysis.sarcasmLevel]?.color)}>
                    {sarcasmLabels[analysis.sarcasmLevel]?.label || analysis.sarcasmLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Directional parameters */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Směrové parametry</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Pohled</p>
                  <p className="font-medium">{directionLabels[analysis.gazeDirection] || analysis.gazeDirection}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Brada / Hlava</p>
                  <p className="font-medium">{directionLabels[analysis.chinDirection] || analysis.chinDirection}</p>
                </div>
              </div>
            </div>

            {/* Facial description */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Popis výrazu</h3>
              <p className="text-foreground">{analysis.facialDescription}</p>
            </div>

            {/* Brand fit */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Kuba English Brand Fit</h3>
              <p className="text-foreground">{analysis.brandFit}</p>
            </div>

            {/* Marketing use cases */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Použití v marketingu</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.marketingUseCases.map((useCase, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 rounded-lg text-sm bg-muted text-foreground"
                  >
                    {useCase}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested vocabulary */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Doporučená slovíčka</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedVocabulary.map((word, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 rounded-lg text-sm bg-primary/10 text-primary font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border bg-background">
        <button
          onClick={() => runAnalysis(true)}
          disabled={isAnalyzing || isLoading}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium transition-colors",
            isAnalyzing 
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {isAnalyzing ? "Analyzuji..." : "Znovu analyzovat"}
        </button>
      </div>
    </div>
  );
};

export default Marketing;
