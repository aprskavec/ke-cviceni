import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DbLesson {
  id: string;
  datocms_id: string;
  video_upload_id: string;
  name: string;
  kind: string;
  order: number;
  level: string;
  cefr: string;
  summary: any;
}

interface GenerateExercisesPanelProps {
  lesson: DbLesson;
  onGenerated: () => void;
}

export const GenerateExercisesPanel = ({ lesson, onGenerated }: GenerateExercisesPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(6);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Call the generate-exercises function
      const { data: generatedData, error: genError } = await supabase.functions.invoke('generate-exercises', {
        body: {
          lesson: {
            name: lesson.name,
            kind: lesson.kind,
            summary: lesson.summary,
          },
          exerciseCount,
          includeListening: true,
        }
      });

      if (genError) throw genError;

      if (!generatedData?.exercises || generatedData.exercises.length === 0) {
        throw new Error("No exercises generated");
      }

      // Save to cache
      const { error: cacheError } = await supabase
        .from('lesson_exercises_cache')
        .upsert({
          lesson_id: lesson.datocms_id,
          lesson_name: lesson.name,
          lesson_category: generatedData.lessonCategory || lesson.kind,
          exercises: generatedData.exercises,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'lesson_id'
        });

      if (cacheError) throw cacheError;

      toast.success(`Vygenerováno ${generatedData.exercises.length} cvičení!`);
      onGenerated();
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Chyba při generování: " + (error instanceof Error ? error.message : "Neznámá chyba"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-muted/30 border border-border">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        
        <h3 className="font-semibold text-lg mb-2">Žádná cached cvičení</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Tato lekce ještě nemá vygenerovaná cvičení.
        </p>

        {/* Exercise count selector */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-muted-foreground">Počet cvičení:</span>
          <div className="flex gap-1">
            {[4, 6, 8, 10].map((count) => (
              <button
                key={count}
                onClick={() => setExerciseCount(count)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  exerciseCount === count
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generuji cvičení...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Vygenerovat cvičení
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Cvičení budou vygenerována pomocí AI na základě obsahu lekce.
        </p>
      </div>
    </div>
  );
};
