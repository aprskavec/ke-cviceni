import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock, Sparkles } from "lucide-react";

interface WordMasteryCardProps {
  word: string;
  masteryLevel: "new" | "learning" | "reviewing" | "mastered";
  correctCount: number;
  incorrectCount: number;
  nextReviewAt?: string;
  className?: string;
}

const WordMasteryCard = ({
  word,
  masteryLevel,
  correctCount,
  incorrectCount,
  nextReviewAt,
  className,
}: WordMasteryCardProps) => {
  const getMasteryConfig = () => {
    switch (masteryLevel) {
      case "new":
        return {
          icon: Sparkles,
          color: "text-blue-500",
          bgColor: "bg-blue-500/20",
          label: "Nové",
        };
      case "learning":
        return {
          icon: AlertCircle,
          color: "text-orange-500",
          bgColor: "bg-orange-500/20",
          label: "Učím se",
        };
      case "reviewing":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/20",
          label: "Opakování",
        };
      case "mastered":
        return {
          icon: CheckCircle2,
          color: "text-green-500",
          bgColor: "bg-green-500/20",
          label: "Zvládnuté",
        };
    }
  };

  const config = getMasteryConfig();
  const Icon = config.icon;
  const total = correctCount + incorrectCount;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const formatNextReview = () => {
    if (!nextReviewAt) return null;
    const date = new Date(nextReviewAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Dnes";
    if (diffDays === 1) return "Zítra";
    return `Za ${diffDays} dní`;
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-4 flex items-center gap-4",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          config.bgColor
        )}
      >
        <Icon className={cn("w-5 h-5", config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{word}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={config.color}>{config.label}</span>
          <span>•</span>
          <span>
            {correctCount}✓ / {incorrectCount}✗
          </span>
          {total > 0 && (
            <>
              <span>•</span>
              <span>{accuracy}%</span>
            </>
          )}
        </div>
      </div>

      {nextReviewAt && masteryLevel !== "mastered" && (
        <div className="text-xs text-muted-foreground text-right flex-shrink-0">
          {formatNextReview()}
        </div>
      )}
    </div>
  );
};

export default WordMasteryCard;
