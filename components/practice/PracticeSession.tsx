import { useState, useEffect, useRef, useCallback } from "react";
import { X, RefreshCcw, Copy, Check, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lesson } from "@/data/lessons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DevAssistantPanel from "@/components/dev/DevAssistantPanel";
import PracticeComplete from "./PracticeComplete";
import FeedbackSheet from "./FeedbackSheet";
import StickerImage from "./StickerImage";
import WordBubbles from "./exercises/WordBubbles";
import TranslateTyping from "./exercises/TranslateTyping";
import MatchingPairs from "./exercises/MatchingPairs";
import MultipleChoice from "./exercises/MultipleChoice";
import ListeningExercise from "./exercises/ListeningExercise";
import useUserProgress from "@/hooks/useUserProgress";
import { 
  calculateDifficultyProfile, 
  selectWordsForPractice,
  adjustExerciseCount 
} from "@/lib/adaptiveDifficulty";

interface Exercise {
  id?: string; // Unique exercise ID for debugging
  type: "word-bubbles" | "translate-typing" | "matching-pairs" | "multiple-choice" | "listening";
  question?: string;
  correctAnswer?: string;
  options?: string[];
  words?: string[];
  pairs?: { english: string; czech: string }[];
  hint?: string;
  audioText?: string;
  explanation?: string;
}

interface PracticeSessionProps {
  lesson: Lesson;
  onClose: () => void;
}

// Exercise type display names and colors
const EXERCISE_TYPE_INFO: Record<string, { label: string; color: string }> = {
  "word-bubbles": { label: "Word Bubbles", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  "translate-typing": { label: "Translate Typing", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "matching-pairs": { label: "Matching Pairs", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  "multiple-choice": { label: "Multiple Choice", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  "listening": { label: "Listening", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
};

const ExerciseDebugTag = ({ exercise, index }: { exercise: Exercise; index: number }) => {
  const [copied, setCopied] = useState(false);
  const info = EXERCISE_TYPE_INFO[exercise.type] || { label: exercise.type, color: "bg-muted text-muted-foreground border-border" };
  
  // Generate a short debug ID with key data
  const shortId = exercise.id || `ex${index}`;
  const debugData = {
    id: shortId,
    type: exercise.type,
    q: exercise.question?.substring(0, 50) || exercise.audioText?.substring(0, 50) || "",
    a: exercise.correctAnswer?.substring(0, 30) || "",
    opts: exercise.options?.join("|") || "",
    pairs: exercise.pairs?.map(p => `${p.english}=${p.czech}`).join("|") || "",
  };
  
  const handleCopy = async () => {
    try {
      const debugString = JSON.stringify(debugData, null, 2);
      await navigator.clipboard.writeText(debugString);
      setCopied(true);
      toast.success(`Zkopírováno ID: ${shortId}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nepodařilo se zkopírovat");
    }
  };
  
  // Hide on mobile for cleaner UX
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "hidden md:flex mx-auto items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        "transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer",
        info.color
      )}
      title="Klikni pro zkopírování debug dat"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span className="font-mono">{shortId}</span>
      <span className="opacity-70">•</span>
      {info.label}
    </button>
  );
};

const ContextCopyButton = ({ lesson, exercise, exerciseIndex, totalExercises, isReviewMode }: { 
  lesson: Lesson; exercise: Exercise; exerciseIndex: number; totalExercises: number; isReviewMode: boolean 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ctx = {
      lesson: { id: lesson.id, name: lesson.name, kind: lesson.kind },
      ex: {
        idx: `${exerciseIndex + 1}/${totalExercises}`,
        id: exercise.id || `ex${exerciseIndex}`,
        type: exercise.type,
        q: exercise.question?.substring(0, 60) || exercise.audioText?.substring(0, 60) || "",
        a: exercise.correctAnswer?.substring(0, 40) || "",
      },
      review: isReviewMode || undefined,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(ctx));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent fail
    }
  }, [lesson, exercise, exerciseIndex, totalExercises, isReviewMode]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "absolute bottom-20 right-3 z-40 w-8 h-8 rounded-full flex items-center justify-center",
        "bg-muted/60 backdrop-blur-sm border border-border/50 text-muted-foreground",
        "hover:bg-muted hover:text-foreground transition-all duration-200",
        "active:scale-90",
        copied && "bg-primary/20 text-primary border-primary/30"
      )}
      title="Zkopírovat kontext cvičení"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Bug className="w-3.5 h-3.5" />}
    </button>
  );
};


const PracticeSession = ({ lesson, onClose }: PracticeSessionProps) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ isCorrect: boolean; userAnswer: string; correctAnswer: string; explanation?: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  
  // Track wrong answers for review at the end
  const [wrongAnswers, setWrongAnswers] = useState<{ exercise: Exercise; userAnswer: string }[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  
  const startTimeRef = useRef<number>(Date.now());
  const exerciseStartTimeRef = useRef<number>(Date.now());
  
  const { 
    progress, 
    wordMasteries, 
    savePracticeSession, 
    saveExerciseResult,
    getWordsForReview 
  } = useUserProgress();

  useEffect(() => {
    loadOrGenerateExercises();
  }, [lesson]);

  const loadOrGenerateExercises = async () => {
    setIsLoading(true);
    startTimeRef.current = Date.now();
    
    try {
      // First, try to load cached exercises
      const { data: cachedData, error: cacheError } = await supabase
        .from("lesson_exercises_cache")
        .select("exercises, lesson_category")
        .eq("lesson_id", lesson.id)
        .single();

      if (!cacheError && cachedData?.exercises) {
        console.log(`Loaded cached exercises for lesson "${lesson.name}"`);
        // Add IDs to cached exercises if they don't have them
        const cachedExercises = (cachedData.exercises as unknown as Exercise[]).map((ex, i) => ({
          ...ex,
          id: ex.id || `${lesson.id.substring(0, 4)}_${i}_${ex.type.substring(0, 2)}`,
        }));
        setExercises(cachedExercises);
        setIsLoading(false);
        return;
      }

      // No cache found, generate new exercises
      console.log(`No cache found for lesson "${lesson.name}", generating...`);
      await generateExercises();
    } catch (error) {
      console.error("Failed to load exercises:", error);
      // Try generating as fallback
      await generateExercises();
    }
  };

  const generateExercises = async () => {
    try {
      // Get lesson words
      const lessonWords = [
        ...(lesson.summary?.keywords?.map(k => k.text_content) || []),
        ...(lesson.summary?.key_phrases?.map(p => p.text_content) || []),
      ];
      
      // Calculate difficulty based on user's progress
      const difficultyProfile = calculateDifficultyProfile(
        wordMasteries,
        progress?.level || 1
      );
      
      // Get words that need review
      const wordsForReview = getWordsForReview();
      const reviewWordsInLesson = wordsForReview.filter(wm => 
        lessonWords.some(lw => lw.toLowerCase().includes(wm.word.toLowerCase()))
      );
      
      // Select priority words
      const wordPriorities = selectWordsForPractice(lessonWords, wordMasteries, 6);
      
      // Adjust exercise count based on review needs
      const exerciseCount = adjustExerciseCount(6, difficultyProfile, reviewWordsInLesson.length);

      const { data, error } = await supabase.functions.invoke("generate-exercises", {
        body: { 
          lesson: {
            id: lesson.id,
            name: lesson.name,
            kind: lesson.kind,
            summary: lesson.summary,
            interactions: lesson.interactions,
          },
          exerciseCount,
          wordPriorities,
          difficultyProfile,
          includeListening: true,
        },
      });

      if (error) throw error;
      
      if (data?.exercises && data.exercises.length > 0) {
        // Add unique IDs to each exercise
        const exercisesWithIds = data.exercises.map((ex: Exercise, i: number) => ({
          ...ex,
          id: `${lesson.id.substring(0, 4)}_${i}_${ex.type.substring(0, 2)}`,
        }));
        setExercises(exercisesWithIds);
        
        // Cache the exercises for future use (fire and forget)
        supabase
          .from("lesson_exercises_cache")
          .upsert({
            lesson_id: lesson.id,
            lesson_name: lesson.name,
            exercises: data.exercises,
            lesson_category: data.lessonCategory || null,
          }, { onConflict: "lesson_id" })
          .then(({ error: upsertError }) => {
            if (upsertError) {
              console.error("Failed to cache exercises:", upsertError);
            } else {
              console.log(`Cached exercises for lesson "${lesson.name}"`);
            }
          });
      } else {
        throw new Error("No exercises generated");
      }
    } catch (error) {
      console.error("Failed to generate exercises:", error);
      toast.error("Nepodařilo se vygenerovat cvičení. Zkus to znovu.");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean, userAnswer: string, correctAnswer?: string) => {
    const currentExercise = isReviewMode 
      ? wrongAnswers[reviewIndex].exercise 
      : exercises[currentIndex];
    const finalCorrectAnswer = correctAnswer || currentExercise.correctAnswer || "";
    
    setLastAnswer({ 
      isCorrect, 
      userAnswer, 
      correctAnswer: finalCorrectAnswer,
      explanation: currentExercise.explanation
    });
    setShowResult(true);

    if (isCorrect) {
      if (!isReviewMode) {
        setScore((prev) => prev + 1);
      }
    } else if (!isReviewMode) {
      // Track wrong answer for review (only in main session, not during review)
      setWrongAnswers(prev => [...prev, { exercise: currentExercise, userAnswer }]);
    }

    // Calculate time spent on this exercise
    const timeSpentMs = Date.now() - exerciseStartTimeRef.current;

    // Save exercise result if we have a session
    if (sessionId) {
      // Extract the word being tested
      const word = currentExercise.question || currentExercise.audioText || finalCorrectAnswer;
      await saveExerciseResult(
        sessionId,
        word,
        currentExercise.type,
        isCorrect,
        userAnswer,
        finalCorrectAnswer,
        timeSpentMs
      );
    }
  };

  const handleMatchingComplete = async (correctCount: number, totalCount: number) => {
    const currentExercise = isReviewMode
      ? wrongAnswers[reviewIndex].exercise
      : exercises[currentIndex];
    const isCorrect = correctCount === totalCount;
    setLastAnswer({
      isCorrect,
      userAnswer: `${correctCount}/${totalCount} správně`,
      correctAnswer: "Všechny páry",
      explanation: currentExercise.explanation
    });
    setShowResult(true);
    if (isCorrect) {
      if (!isReviewMode) {
        setScore((prev) => prev + 1);
      }
    } else if (!isReviewMode) {
      // Track wrong matching for review
      setWrongAnswers(prev => [...prev, { exercise: currentExercise, userAnswer: `${correctCount}/${totalCount}` }]);
    }

    // Save results for each pair
    if (sessionId && currentExercise.pairs) {
      for (const pair of currentExercise.pairs) {
        await saveExerciseResult(
          sessionId,
          pair.english,
          "matching-pairs",
          isCorrect,
          isCorrect ? pair.english : "wrong",
          pair.english,
          undefined
        );
      }
    }
  };

  const handleNext = async () => {
    exerciseStartTimeRef.current = Date.now();
    
    // Handle review mode navigation
    if (isReviewMode) {
      if (reviewIndex < wrongAnswers.length - 1) {
        setReviewIndex(prev => prev + 1);
        setShowResult(false);
        setLastAnswer(null);
      } else {
        // Review complete - finish session
        setIsComplete(true);
      }
      return;
    }
    
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowResult(false);
      setLastAnswer(null);
    } else {
      // Main session complete - save results
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      const exerciseTypes = [...new Set(exercises.map(e => e.type))];
      
      const result = await savePracticeSession(
        lesson.id,
        lesson.name,
        score + (lastAnswer?.isCorrect ? 1 : 0), // Include current answer
        exercises.length,
        exerciseTypes,
        durationSeconds
      );

      if (result) {
        setXpEarned(result.xpEarned);
        setLeveledUp(result.leveledUp || false);
      }

      // Check if there are wrong answers to review
      if (wrongAnswers.length > 0 || (lastAnswer && !lastAnswer.isCorrect)) {
        // Add the last wrong answer if applicable
        if (lastAnswer && !lastAnswer.isCorrect) {
          const currentExercise = exercises[currentIndex];
          setWrongAnswers(prev => [...prev, { exercise: currentExercise, userAnswer: lastAnswer.userAnswer }]);
        }
        // Start review mode
        setIsReviewMode(true);
        setReviewIndex(0);
        setShowResult(false);
        setLastAnswer(null);
      } else {
        setIsComplete(true);
      }
    }
  };

  // Create session on first answer
  useEffect(() => {
    if (showResult && !sessionId && exercises.length > 0) {
      // Create a temporary session ID for tracking
      const tempId = `temp_${Date.now()}`;
      setSessionId(tempId);
    }
  }, [showResult, sessionId, exercises.length]);

  const progress_percent = exercises.length > 0 
    ? ((currentIndex + (showResult ? 1 : 0)) / exercises.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="w-full h-full max-w-md mx-auto flex flex-col items-center justify-center p-6 md:h-[90vh] md:my-auto md:rounded-[40px] md:border-4 md:border-border/50 md:shadow-2xl">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">Generuji cvičení...</h2>
          <p className="text-muted-foreground text-center">
            AI vytváří personalizovaná cvičení pro lekci "{lesson.name}"
          </p>
          {progress && (
            <p className="text-sm text-primary mt-4">
              Level {progress.level} • {progress.total_xp} XP
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <PracticeComplete
        score={score}
        total={exercises.length}
        lessonName={lesson.name}
        xpEarned={xpEarned}
        leveledUp={leveledUp}
        currentStreak={progress?.current_streak || 0}
        onClose={onClose}
        onRetry={() => {
          setCurrentIndex(0);
          setScore(0);
          setIsComplete(false);
          setShowResult(false);
          setLastAnswer(null);
          setSessionId(null);
          setXpEarned(0);
          setLeveledUp(false);
          setWrongAnswers([]);
          setIsReviewMode(false);
          setReviewIndex(0);
          generateExercises();
        }}
      />
    );
  }

  // Get the current exercise based on mode
  const currentExercise = isReviewMode 
    ? wrongAnswers[reviewIndex]?.exercise 
    : exercises[currentIndex];

  // Calculate progress for review mode
  const reviewProgress = isReviewMode && wrongAnswers.length > 0
    ? ((reviewIndex + (showResult ? 1 : 0)) / wrongAnswers.length) * 100
    : 0;

  // Don't render if no current exercise
  if (!currentExercise) {
    return null;
  }

  // Determine visible components for dev assistant
  const visibleComponents = (() => {
    const components = ["CloseButton", "ProgressBar"];
    if (isReviewMode) components.push("ReviewBanner");
    components.push("ExerciseDebugTag");
    switch (currentExercise.type) {
      case "word-bubbles": components.push("StickerImage", "WordBubbles", "CheckButton"); break;
      case "translate-typing": components.push("StickerImage", "TranslateTyping", "CheckButton"); break;
      case "matching-pairs": components.push("MatchingPairs"); break;
      case "multiple-choice": components.push("StickerImage", "MultipleChoice"); break;
      case "listening": components.push("ListeningExercise", "CheckButton"); break;
    }
    if (showResult) components.push("FeedbackSheet");
    return components;
  })();

  const renderExercise = () => {
    switch (currentExercise.type) {
      case "word-bubbles":
        return (
          <div className="flex flex-col items-center w-full">
            {currentExercise.question && (
              <div data-component="StickerImage">
                <StickerImage word={currentExercise.question} lessonName={lesson.name} lessonKind={lesson.kind} className="mb-4" />
              </div>
            )}
            <div data-component="WordBubbles">
              <WordBubbles
                sentence={currentExercise.question || ""}
                correctAnswer={currentExercise.correctAnswer || ""}
                onAnswer={(isCorrect, userAnswer) => handleAnswer(isCorrect, userAnswer, currentExercise.correctAnswer)}
                disabled={showResult}
                lessonKind={lesson.kind}
              />
            </div>
          </div>
        );
      
      case "translate-typing":
        return (
          <div className="flex flex-col items-center w-full">
            {currentExercise.question && (
              <div data-component="StickerImage">
                <StickerImage word={currentExercise.question} lessonName={lesson.name} lessonKind={lesson.kind} className="mb-4" />
              </div>
            )}
            <div data-component="TranslateTyping">
              <TranslateTyping
                sentence={currentExercise.question || ""}
                correctAnswer={currentExercise.correctAnswer || ""}
                hint={currentExercise.hint}
                onAnswer={(isCorrect, userAnswer) => handleAnswer(isCorrect, userAnswer, currentExercise.correctAnswer)}
                disabled={showResult}
                lessonKind={lesson.kind}
              />
            </div>
          </div>
        );
      
      case "matching-pairs":
        return (
          <div data-component="MatchingPairs">
            <MatchingPairs
              pairs={currentExercise.pairs || []}
              onComplete={handleMatchingComplete}
              disabled={showResult}
            />
          </div>
        );
      
      case "multiple-choice":
        return (
          <div className="flex flex-col items-center w-full">
            {currentExercise.question && (
              <div data-component="StickerImage">
                <StickerImage word={currentExercise.question} lessonName={lesson.name} lessonKind={lesson.kind} className="mb-4" />
              </div>
            )}
            <div data-component="MultipleChoice">
              <MultipleChoice
                question={currentExercise.question || ""}
                options={currentExercise.options || []}
                correctAnswer={currentExercise.correctAnswer || ""}
                hint={currentExercise.hint}
                selectedAnswer={lastAnswer?.userAnswer || null}
                showResult={showResult}
                onSelectAnswer={(answer) => {
                  const isCorrect = answer.toLowerCase().trim() === currentExercise.correctAnswer?.toLowerCase().trim();
                  handleAnswer(isCorrect, answer, currentExercise.correctAnswer);
                }}
              />
            </div>
          </div>
        );
      
      case "listening":
        return (
          <div data-component="ListeningExercise">
            <ListeningExercise
              sentence={currentExercise.audioText || currentExercise.correctAnswer || ""}
              correctAnswer={currentExercise.correctAnswer || currentExercise.audioText || ""}
              hint={currentExercise.hint}
              onAnswer={(isCorrect, userAnswer) => handleAnswer(isCorrect, userAnswer, currentExercise.correctAnswer)}
              disabled={showResult}
              lessonKind={lesson.kind}
            />
          </div>
        );
      
      default:
        return <p className="text-muted-foreground">Neznámý typ cvičení</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {/* Centered container with mobile-like max-width and phone mockup border on desktop */}
      <div className="w-full h-full max-w-md mx-auto flex flex-col relative md:h-[90vh] md:my-auto md:rounded-[40px] md:border-4 md:border-border/50 md:shadow-2xl md:overflow-hidden">
        {/* Review Mode Banner */}
        {isReviewMode && (
          <div data-component="ReviewBanner" className="bg-gradient-to-r from-[hsl(348,100%,50%)] to-[hsl(0,100%,50%)] px-4 py-3 flex items-center justify-center gap-2">
            <RefreshCcw className="w-5 h-5 text-white" />
            <span className="text-white font-bold">Opravování chyb ({reviewIndex + 1}/{wrongAnswers.length})</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 p-4">
          <div data-component="CloseButton">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full bg-card"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 relative" data-component="ProgressBar">
            <div className="h-4 bg-card rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out relative",
                  isReviewMode ? "bg-[hsl(348,100%,50%)]" : "bg-primary"
                )}
                style={{ width: `${isReviewMode ? reviewProgress : progress_percent}%` }}
              >
                {!isReviewMode && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-[hsl(80,100%,60%)] to-primary rounded-full" />
                    <div className="absolute inset-0 shadow-[0_0_20px_hsl(68,100%,50%,0.6),0_0_40px_hsl(68,100%,50%,0.3)] rounded-full" />
                  </>
                )}
                {isReviewMode && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(348,100%,50%)] via-[hsl(0,100%,55%)] to-[hsl(348,100%,50%)] rounded-full" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Debug Tag */}
        <ExerciseDebugTag exercise={currentExercise} index={isReviewMode ? reviewIndex : currentIndex} />

        {/* Exercise Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
          {renderExercise()}
        </div>

        {/* Feedback Sheet */}
        {showResult && lastAnswer && (
          <div data-component="FeedbackSheet">
            <FeedbackSheet
              isCorrect={lastAnswer.isCorrect}
              correctAnswer={lastAnswer.correctAnswer}
              explanation={lastAnswer.explanation}
              onContinue={handleNext}
            />
          </div>
        )}

        {/* Floating dev buttons */}
        <ContextCopyButton lesson={lesson} exercise={currentExercise} exerciseIndex={isReviewMode ? reviewIndex : currentIndex} totalExercises={exercises.length} isReviewMode={isReviewMode} />
        <DevAssistantPanel
          lessonId={lesson.id}
          lessonName={lesson.name}
          lessonKind={lesson.kind}
          exerciseType={currentExercise.type}
          exerciseIndex={isReviewMode ? reviewIndex : currentIndex}
          totalExercises={exercises.length}
          exerciseQuestion={currentExercise.question || currentExercise.audioText}
          exerciseAnswer={currentExercise.correctAnswer}
          isReviewMode={isReviewMode}
          visibleComponents={visibleComponents}
        />
      </div>
    </div>
  );
};

export default PracticeSession;
