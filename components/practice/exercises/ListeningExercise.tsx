import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, VolumeX, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import useElevenLabsTTS from "@/hooks/useElevenLabsTTS";
import CheckButton from "../CheckButton";

interface ListeningExerciseProps {
  sentence: string; // The English sentence to listen to
  correctAnswer: string; // The correct transcription
  hint?: string;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  disabled: boolean;
  lessonKind?: string;
}

const ListeningExercise = ({
  sentence,
  correctAnswer,
  hint,
  onAnswer,
  disabled,
  lessonKind,
}: ListeningExerciseProps) => {
  const [userInput, setUserInput] = useState("");
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { speakEnglish, speakEnglishSlow, isSpeaking, isLoading, isSupported } = useElevenLabsTTS();

  // Auto-focus textarea after first audio play
  useEffect(() => {
    if (hasPlayed && !disabled && !isSpeaking) {
      // Focus after audio finishes playing
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasPlayed, disabled, isSpeaking]);

  // Auto-play on mount
  useEffect(() => {
    if (isSupported && !hasPlayed) {
      const timer = setTimeout(() => {
        speakEnglish(sentence);
        setHasPlayed(true);
        setPlayCount(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sentence, speakEnglish, isSupported, hasPlayed]);

  const handlePlay = () => {
    speakEnglish(sentence);
    setPlayCount((prev) => prev + 1);
  };

  const handlePlaySlow = () => {
    speakEnglishSlow(sentence);
    setPlayCount((prev) => prev + 1);
  };

  // AI validation for uncertain cases
  const validateWithAI = useCallback(async (userAnswer: string, correct: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-answer", {
        body: {
          userAnswer,
          correctAnswer: correct,
          exerciseType: "listening",
          context: sentence,
          lessonKind,
        },
      });

      if (error) {
        console.error("AI validation error:", error);
        return false;
      }

      return data?.isCorrect === true;
    } catch (err) {
      console.error("Failed to call AI validation:", err);
      return false;
    }
  }, [sentence, lessonKind]);

  const handleCheck = async () => {
    // Normalize both strings for comparison
    const normalizedInput = userInput.toLowerCase().trim().replace(/[.,!?']/g, "");
    const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/[.,!?']/g, "");
    
    // Exact match
    if (normalizedInput === normalizedCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // Calculate similarity
    const similarity = calculateSimilarity(normalizedInput, normalizedCorrect);
    
    // High similarity (90%+) - definitely correct
    if (similarity >= 0.9) {
      onAnswer(true, userInput);
      return;
    }
    
    // Medium similarity (70-90%) - use AI to decide
    if (similarity >= 0.7) {
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userInput, correctAnswer);
        onAnswer(isCorrect, userInput);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    // Low similarity but reasonable length - still check with AI
    if (userInput.split(" ").length >= 3) {
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userInput, correctAnswer);
        onAnswer(isCorrect, userInput);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    onAnswer(false, userInput);
  };

  const calculateSimilarity = (a: string, b: string): number => {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    const longerLength = longer.length;
    if (longerLength === 0) return 1;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longerLength - editDistance) / longerLength;
  };

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput.trim() && !disabled) {
      handleCheck();
    }
  };

  if (!isSupported) {
    return (
      <div className="w-full max-w-md flex flex-col items-center p-6">
        <VolumeX className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          Tvůj prohlížeč nepodporuje hlasový výstup. Zkus jiný prohlížeč.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex flex-col items-center animate-fade-in pb-24">
      {/* Instruction */}
      <p className="text-muted-foreground text-lg mb-6">Poslechni a napiš co slyšíš</p>

      {/* Audio controls */}
      <div className="flex gap-3 mb-8">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePlay}
          disabled={isSpeaking || isLoading || disabled}
          className={cn(
            "rounded-full w-20 h-20 p-0",
            (isSpeaking || isLoading) && "animate-pulse bg-primary/10"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          ) : (
            <Volume2 className={cn("w-10 h-10", isSpeaking && "text-primary")} />
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handlePlaySlow}
          disabled={isSpeaking || isLoading || disabled}
          className="rounded-full px-6 h-20"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Pomalu
        </Button>
      </div>

      {/* Play count indicator */}
      <p className="text-sm text-muted-foreground mb-4">
        Přehráno: {playCount}×
      </p>

      {/* Hint after multiple plays */}
      {playCount >= 3 && hint && (
        <p className="text-sm text-primary mb-4 italic">💡 {hint}</p>
      )}

      {/* Input field */}
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Napiš co slyšíš..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="done"
          className={cn(
            "w-full p-4 rounded-2xl bg-card border-2 border-border text-foreground text-lg",
            "placeholder:text-muted-foreground resize-none min-h-[80px]",
            "focus:outline-none focus:border-primary transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          rows={2}
        />
      </div>

      {/* Check button - fixed at bottom */}
      <CheckButton
        onClick={handleCheck}
        show={!disabled && !!userInput.trim()}
      />
    </div>
  );
};

export default ListeningExercise;
