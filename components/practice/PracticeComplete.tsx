import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Star, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeCompleteProps {
  score: number;
  total: number;
  lessonName: string;
  xpEarned?: number;
  leveledUp?: boolean;
  currentStreak?: number;
  onClose: () => void;
  onRetry: () => void;
}

const PracticeComplete = ({ 
  score, 
  total, 
  lessonName, 
  xpEarned,
  leveledUp = false,
  currentStreak = 0,
  onClose, 
  onRetry 
}: PracticeCompleteProps) => {
  const percentage = Math.round((score / total) * 100);
  const displayXP = xpEarned ?? score * 10;
  
  const getMessage = () => {
    if (percentage === 100) return { text: "Perfektní! 🎉", color: "text-primary" };
    if (percentage >= 80) return { text: "Skvělá práce! 🔥", color: "text-primary" };
    if (percentage >= 60) return { text: "Dobrá práce! 💪", color: "text-yellow-400" };
    if (percentage >= 40) return { text: "Jde to! 📚", color: "text-orange-400" };
    return { text: "Nevzdávej se! 💡", color: "text-red-400" };
  };

  const message = getMessage();

  // Calculate stars (0-3)
  const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      {/* Centered container with mobile-like max-width and phone mockup border on desktop */}
      <div className="w-full h-full max-w-md mx-auto flex flex-col items-center justify-center p-6 overflow-y-auto md:h-[90vh] md:my-auto md:rounded-[40px] md:border-4 md:border-border/50 md:shadow-2xl">
        {/* Level Up Animation */}
        {leveledUp && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              LEVEL UP!
            </div>
          </div>
        )}

        {/* Trophy */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-scale-in">
            <Trophy className="w-16 h-16 text-primary" />
          </div>
          {percentage === 100 && (
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-bounce">
              <span className="text-xl">🏆</span>
            </div>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className={cn(
                "w-10 h-10 transition-all duration-500",
                i < stars 
                  ? "text-primary fill-primary animate-scale-in" 
                  : "text-muted-foreground/30"
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

        {/* Message */}
        <h1 className={cn("text-3xl font-black mb-2", message.color)}>
          {message.text}
        </h1>

        {/* Score */}
        <div className="text-center mb-2">
          <p className="text-6xl font-black text-foreground mb-1">
            {score}<span className="text-muted-foreground text-3xl">/{total}</span>
          </p>
          <p className="text-muted-foreground">správných odpovědí</p>
        </div>

        {/* Lesson name */}
        <p className="text-sm text-muted-foreground mb-6">
          Lekce: {lessonName}
        </p>

        {/* Stats row */}
        <div className="flex gap-4 mb-8">
          {/* XP earned */}
          <div className="bg-primary/10 border border-primary/30 rounded-2xl px-5 py-3">
            <p className="text-primary font-bold text-lg flex items-center gap-2">
              <Star className="w-5 h-5" />
              +{displayXP} XP
            </p>
          </div>

          {/* Streak */}
          {currentStreak > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-5 py-3">
              <p className="text-orange-500 font-bold text-lg flex items-center gap-2">
                <Flame className="w-5 h-5" />
                {currentStreak} {currentStreak === 1 ? "den" : "dnů"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="w-full space-y-3">
          <Button
            onClick={onRetry}
            className="w-full h-14 text-lg font-bold rounded-2xl"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Zkusit znovu
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-2xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Zpět na lekce
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PracticeComplete;
