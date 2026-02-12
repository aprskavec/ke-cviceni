import { useState, useEffect, useCallback } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import usePreloadedAudio from "@/hooks/usePreloadedAudio";
import CheckButton from "../CheckButton";

interface WordBubblesProps {
  sentence: string;
  correctAnswer: string;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  disabled: boolean;
  lessonKind?: string;
}

const WordBubbles = ({ sentence, correctAnswer, onAnswer, disabled, lessonKind }: WordBubblesProps) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { preloadWords, playWord, isLoading: isPreloading, loadedCount, totalCount } = usePreloadedAudio();

  useEffect(() => {
    // Split correct answer into words and add some distractors
    const correctWords = correctAnswer.split(" ");
    const distractors = generateDistractors(correctWords);
    const allWords = [...correctWords, ...distractors];
    // Shuffle the words
    setAvailableWords(shuffleArray(allWords));
    setSelectedWords([]);
    
    // Preload audio for all words
    preloadWords(allWords);
  }, [correctAnswer, preloadWords]);

  const generateDistractors = (correctWords: string[]): string[] => {
    // Simple distractors based on common words
    const commonWords = ["the", "a", "is", "are", "was", "were", "have", "has", "do", "does", "will", "would", "can", "could", "not", "very", "much", "more", "less", "than", "then", "now", "here", "there"];
    const distractors: string[] = [];
    const numDistractors = Math.min(3, Math.ceil(correctWords.length * 0.5));
    
    for (let i = 0; i < numDistractors; i++) {
      const word = commonWords[Math.floor(Math.random() * commonWords.length)];
      if (!correctWords.includes(word.toLowerCase()) && !distractors.includes(word)) {
        distractors.push(word);
      }
    }
    
    return distractors;
  };

  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleWordClick = (word: string, index: number) => {
    if (disabled) return;
    
    // Play preloaded audio
    playWord(word);
    
    setSelectedWords([...selectedWords, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const handleSelectedWordClick = (word: string, index: number) => {
    if (disabled) return;
    
    // Play preloaded audio
    playWord(word);
    
    setAvailableWords([...availableWords, word]);
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
  };


  // AI validation for uncertain cases
  const validateWithAI = useCallback(async (userAnswer: string, correct: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-answer", {
        body: {
          userAnswer,
          correctAnswer: correct,
          exerciseType: "word-bubbles",
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
    const userAnswer = selectedWords.join(" ");
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();
    
    // Exact match
    if (normalizedUser === normalizedCorrect) {
      onAnswer(true, userAnswer);
      return;
    }
    
    // Word order may vary - check if all correct words are present
    const userWords = normalizedUser.split(" ").filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(" ").filter(w => w.length > 0);
    
    // Same words, different order
    if (userWords.length === correctWords.length && 
        userWords.sort().join(" ") === correctWords.sort().join(" ")) {
      // Use AI to validate if word order change is acceptable
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userAnswer, correctAnswer);
        onAnswer(isCorrect, userAnswer);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    // If answers are similar length, try AI validation
    if (Math.abs(userWords.length - correctWords.length) <= 1) {
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userAnswer, correctAnswer);
        onAnswer(isCorrect, userAnswer);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    onAnswer(false, userAnswer);
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center animate-fade-in pb-24">
      {/* Audio preload indicator */}
      {isPreloading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Načítám výslovnost ({loadedCount}/{totalCount})...</span>
        </div>
      )}

      {/* Instruction */}
      <p className="text-muted-foreground text-lg mb-6">Přelož tuto větu</p>

      {/* Source sentence */}
      <div className="text-center mb-8 px-4">
        <p className="text-xl text-foreground leading-relaxed font-medium">
          {sentence}
        </p>
      </div>

      {/* Selected words area */}
      <div className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-dashed border-border bg-card/50 mb-6 flex flex-wrap gap-2 items-start content-start">
        {selectedWords.length === 0 ? (
          <p className="text-muted-foreground text-sm w-full text-center py-4">
            Klikni na slova níže
          </p>
        ) : (
          selectedWords.map((word, index) => (
            <button
              key={`selected-${index}`}
              onClick={() => handleSelectedWordClick(word, index)}
              disabled={disabled}
              className={cn(
                "px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-lg",
                "transition-all duration-200 hover:scale-105 active:scale-95",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Available words */}
      <div className="w-full flex flex-wrap gap-2 justify-center">
        {availableWords.map((word, index) => (
          <button
            key={`available-${index}`}
            onClick={() => handleWordClick(word, index)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-full bg-secondary border-2 border-border text-foreground font-medium text-lg",
              "transition-all duration-200 hover:scale-105 hover:border-primary/50 active:scale-95",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Check button - fixed at bottom */}
      <CheckButton
        onClick={handleCheck}
        show={!disabled && selectedWords.length > 0}
      />
    </div>
  );
};

export default WordBubbles;
