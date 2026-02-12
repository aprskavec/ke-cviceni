import { cn } from "@/lib/utils";

interface MultipleChoiceProps {
  question: string;
  options: string[];
  correctAnswer: string;
  hint?: string;
  selectedAnswer: string | null;
  showResult: boolean;
  onSelectAnswer: (answer: string) => void;
}

const MultipleChoice = ({ 
  question, 
  options, 
  correctAnswer, 
  hint,
  selectedAnswer, 
  showResult, 
  onSelectAnswer 
}: MultipleChoiceProps) => {
  // Clean question text - remove instruction duplicates in parentheses
  const cleanQuestion = (text: string) => {
    return text
      .replace(/\s*\([Vv]yber[^)]*\)\s*/g, '')
      .replace(/\s*\([Zz]vol[^)]*\)\s*/g, '')
      .trim();
  };

  const displayQuestion = cleanQuestion(question);
  
  // Check if question has a blank to fill
  const hasBlank = /_{2,}|_____|\[___\]|\(\.\.\.\)/.test(displayQuestion);
  const isCorrect = selectedAnswer?.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  // Render question with filled blank when answer is selected
  const renderQuestion = () => {
    if (hasBlank && selectedAnswer) {
      const parts = displayQuestion.split(/_{2,}|_____|\[___\]|\(\.\.\.\)/);
      if (parts.length > 1) {
        return (
          <span>
            {parts[0]}
            <span className={cn(
              "px-2 py-1 rounded-lg mx-1 font-semibold transition-all",
              !showResult && "bg-primary/20 text-primary",
              showResult && isCorrect && "bg-primary/20 text-primary",
              showResult && !isCorrect && "bg-gradient-to-b from-[hsl(348,100%,50%)]/20 to-[hsl(0,100%,50%)]/20 text-[hsl(348,100%,55%)]"
            )}>
              {selectedAnswer}
            </span>
            {parts[1]}
          </span>
        );
      }
    }
    return displayQuestion;
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center animate-fade-in">
      {/* Instruction */}
      <p className="text-muted-foreground text-lg mb-6">Vyber správnou odpověď</p>

      {/* Question */}
      <div className="text-center mb-8 px-4">
        <p className="text-xl text-foreground leading-relaxed font-medium">
          {renderQuestion()}
        </p>
        {hint && !showResult && (
          <p className="text-sm text-muted-foreground mt-3 italic">
            💡 {hint}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="w-full space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          
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
    </div>
  );
};

export default MultipleChoice;
