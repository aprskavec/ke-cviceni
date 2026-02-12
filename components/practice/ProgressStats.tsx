import { Flame, Star, Trophy, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStatsProps {
  totalXP: number;
  currentStreak: number;
  level: number;
  totalCorrect: number;
  totalExercises: number;
  className?: string;
}

const ProgressStats = ({
  totalXP,
  currentStreak,
  level,
  totalCorrect,
  totalExercises,
  className,
}: ProgressStatsProps) => {
  const accuracy =
    totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;
  const xpToNextLevel = 100 - (totalXP % 100);
  const levelProgress = (totalXP % 100) / 100;

  return (
    <div className={cn("w-full", className)}>
      {/* Level progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Level {level}
          </span>
          <span className="text-sm text-muted-foreground">
            {xpToNextLevel} XP do dalšího levelu
          </span>
        </div>
        <div className="h-3 bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* XP */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalXP}</p>
            <p className="text-xs text-muted-foreground">Celkem XP</p>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              currentStreak > 0 ? "bg-orange-500/20" : "bg-muted"
            )}
          >
            <Flame
              className={cn(
                "w-6 h-6",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 1 ? "Den v řadě" : "Dnů v řadě"}
            </p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Úspěšnost</p>
          </div>
        </div>

        {/* Total exercises */}
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalExercises}</p>
            <p className="text-xs text-muted-foreground">Cvičení</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressStats;
