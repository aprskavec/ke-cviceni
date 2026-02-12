import { cn } from "@/lib/utils";
import StickerImage from "./StickerImage";

interface Exercise {
  type: "fill-blank" | "translate" | "multiple-choice" | "match-meaning";
  question: string;
  correctAnswer: string;
  options?: string[];
  hint?: string;
  explanation?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  selectedAnswer: string | null;
  showResult: boolean;
  onSelectAnswer: (answer: string) => void;
  optionsAtBottom?: boolean;
  optionsOnly?: boolean;
  lessonName?: string;
  lessonKind?: string;
}

const ExerciseCard = ({ exercise, selectedAnswer, showResult, onSelectAnswer, optionsAtBottom = true, optionsOnly = false, lessonName, lessonKind }: ExerciseCardProps) => {
  const getTypeLabel = () => {
    switch (exercise.type) {
      case "fill-blank": return "Doplň slovíčko";
      case "translate": return "Přelož do angličtiny";
      case "multiple-choice": return "Vyber správnou odpověď";
      case "match-meaning": return "Spoj s významem";
      default: return "Cvičení";
    }
  };

  const isCorrect = selectedAnswer?.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();

  // For fill-blank, highlight the blank in the question
  const renderQuestion = () => {
    if (exercise.type === "fill-blank" && showResult) {
      // Replace blank with the answer
      const parts = exercise.question.split(/_{2,}|_____|\[___\]|\(\.\.\.\)/);
      if (parts.length > 1) {
        return (
          <span>
            {parts[0]}
            <span className={cn(
              "px-2 py-1 rounded-lg mx-1 font-semibold",
              isCorrect ? "bg-primary/20 text-primary" : "bg-gradient-to-b from-[hsl(348,100%,50%)]/20 to-[hsl(0,100%,50%)]/20 text-[hsl(348,100%,55%)]"
            )}>
              {exercise.correctAnswer}
            </span>
            {parts[1]}
          </span>
        );
      }
    }
    return exercise.question;
  };

  // Render only options
  if (optionsOnly) {
    return (
      <div className="w-full space-y-3 animate-fade-in">
        {exercise.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
          
          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(option)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-full border-2 text-center transition-all duration-200 font-['Champ'] font-bold text-lg",
                "hover:scale-[1.02] active:scale-[0.98]",
                !showResult && !isSelected && "bg-card border-border hover:border-primary/50",
                !showResult && isSelected && "bg-primary/10 border-primary",
                showResult && isCorrectOption && "bg-primary/10 border-primary",
                showResult && isSelected && !isCorrectOption && "bg-gradient-to-b from-[hsl(348,100%,50%)]/10 to-[hsl(0,100%,50%)]/10 border-[hsl(348,100%,50%)]",
                showResult && !isSelected && !isCorrectOption && "opacity-50"
              )}
            >
              <span className={cn(
                showResult && isCorrectOption && "text-primary",
                showResult && isSelected && !isCorrectOption && "text-[hsl(348,100%,55%)]"
              )}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Render question only (when optionsAtBottom is false)
  return (
    <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
      {/* Sticker Image */}
      <StickerImage word={exercise.correctAnswer} lessonName={lessonName} lessonKind={lessonKind} className="mb-6" />

      {/* Type Label */}
      <p className="text-muted-foreground text-lg mb-4">{getTypeLabel()}</p>

      {/* Question */}
      <div className="text-center px-4">
        <p className="text-xl text-foreground leading-relaxed">
          {renderQuestion()}
        </p>
        {exercise.hint && !showResult && (
          <p className="text-sm text-muted-foreground mt-4 italic">
            💡 {exercise.hint}
          </p>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;
