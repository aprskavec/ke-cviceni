import { useState, useMemo } from "react";
import { Search, X, Loader2, Dumbbell } from "lucide-react";
import LessonItem from "./LessonItem";
import LessonDetail from "./LessonDetail";
import PracticeSession from "./practice/PracticeSession";
import { Lesson } from "@/data/lessons";
import { LessonLevel } from "@/data/lessonMetadata";
import { useLessons } from "@/hooks/useLessons";
import { useCachedLessonIds } from "@/hooks/useCachedLessonIds";
import { cn } from "@/lib/utils";

interface LessonPlanProps {
  levelFilter: LessonLevel;
}

const LessonPlan = ({ levelFilter }: LessonPlanProps) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [practiceLesson, setPracticeLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyWithExercises, setShowOnlyWithExercises] = useState(false);

  // Fetch lessons from database
  const { data: lessons = [], isLoading, error } = useLessons(levelFilter);
  
  // Fetch cached lesson IDs (lessons with exercises)
  const { data: cachedLessonIds = new Set<string>() } = useCachedLessonIds();

  // Count lessons with exercises in current level
  const lessonsWithExercisesCount = useMemo(() => {
    return lessons.filter(lesson => cachedLessonIds.has(lesson.id)).length;
  }, [lessons, cachedLessonIds]);

  // Filter lessons based on search query and exercises filter
  const filteredLessons = useMemo(() => {
    let result = lessons;
    
    // Filter by exercises first
    if (showOnlyWithExercises) {
      result = result.filter(lesson => cachedLessonIds.has(lesson.id));
    }
    
    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((lesson) => {
        if (!lesson) return false;
        
        // Search in lesson name
        if (lesson.name?.toLowerCase().includes(query)) return true;
        
        // Search in lesson kind (category)
        if (lesson.kind?.toLowerCase().includes(query)) return true;
        
        // Search in summary description
        if (lesson.summary?.description?.toLowerCase().includes(query)) return true;
        
        // Search in keywords
        if (lesson.summary?.keywords?.some(kw => 
          kw.text_content?.toLowerCase().includes(query)
        )) return true;
        
        // Search in key phrases (both Czech and English)
        if (lesson.summary?.key_phrases?.some(phrase => 
          phrase.text_content?.toLowerCase().includes(query) || 
          phrase.text_content_translation?.toLowerCase().includes(query)
        )) return true;
        
        return false;
      });
    }
    
    return result;
  }, [lessons, searchQuery, showOnlyWithExercises, cachedLessonIds]);

  // All lessons are unlocked
  const getLessonStatus = (_index: number): "locked" | "available" | "completed" => {
    return "available";
  };

  const handleLessonClick = (lesson: Lesson, status: string) => {
    if (status !== "locked") {
      setSelectedLesson(lesson);
    }
  };

  const handleStartPractice = (lesson: Lesson) => {
    setPracticeLesson(lesson);
  };

  const handleClosePractice = () => {
    setPracticeLesson(null);
  };

  // If practice session is active, render it fullscreen
  if (practiceLesson) {
    return (
      <PracticeSession 
        lesson={practiceLesson} 
        onClose={handleClosePractice} 
      />
    );
  }

  return (
    <>
      {/* Main lesson list - always visible, shrinks when detail opens on desktop */}
      <div className="pb-32 pl-1">
        {/* Search input */}
        <div className="sticky top-0 z-20 bg-background pb-4 pt-2 pr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hledat lekce..."
              className={cn(
                "w-full pl-10 pr-10 py-3 rounded-xl",
                "bg-muted/50 border border-border",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Filter toggle and result count */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowOnlyWithExercises(!showOnlyWithExercises)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                showOnlyWithExercises 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <Dumbbell className="w-4 h-4" />
              <span>S cvičeními ({lessonsWithExercisesCount})</span>
            </button>
            
            {(searchQuery || showOnlyWithExercises) && (
              <p className="text-sm text-muted-foreground">
                {filteredLessons.length} {filteredLessons.length === 1 ? 'lekce' : filteredLessons.length >= 2 && filteredLessons.length <= 4 ? 'lekce' : 'lekcí'}
              </p>
            )}
          </div>
        </div>

        {/* Lesson list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Načítám lekce...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p className="text-lg">Chyba při načítání lekcí</p>
            <p className="text-sm mt-1">Zkus obnovit stránku</p>
          </div>
        ) : filteredLessons && filteredLessons.length > 0 ? (
          filteredLessons.map((lesson, index) => {
            if (!lesson) return null;
            const status = getLessonStatus(index);
            return (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                status={status}
                isLast={index === filteredLessons.length - 1}
                isSelected={selectedLesson?.id === lesson.id}
                onClick={() => handleLessonClick(lesson, status)}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Žádné lekce nenalezeny</p>
            <p className="text-sm mt-1">Zkus jiný hledaný výraz</p>
          </div>
        )}
      </div>

      {/* Right side panel - slides in from right on desktop */}
      <div 
        className={`
          fixed top-0 right-0 h-full z-40
          w-full lg:w-[480px] xl:w-[540px]
          bg-background border-l border-border
          transform transition-transform duration-300 ease-out
          ${selectedLesson ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {selectedLesson && (
          <div className="h-full pt-12 px-5 pb-24 overflow-y-auto">
            <LessonDetail 
              lesson={selectedLesson} 
              onClose={() => setSelectedLesson(null)}
              onStartPractice={() => handleStartPractice(selectedLesson)}
            />
          </div>
        )}
      </div>

      {/* Mobile overlay backdrop */}
      {selectedLesson && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedLesson(null)}
        />
      )}
    </>
  );
};

export default LessonPlan;
