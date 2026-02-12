import { Flame, Snowflake, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonLevel, levelOptions } from "@/data/lessonMetadata";

interface StatsBarProps {
  streak: number;
  freezes: number;
  selectedLevel: LessonLevel;
  onLevelChange: (level: LessonLevel) => void;
  lessonCount?: number;
}

const StatsBar = ({ streak, freezes, selectedLevel, onLevelChange, lessonCount }: StatsBarProps) => {
  const currentOption = levelOptions.find(opt => opt.value === selectedLevel) || levelOptions[0];

  return (
    <div className="flex items-center justify-between mb-10">
      <h1 className="text-4xl font-champ font-black tracking-tight">Plán</h1>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/80 backdrop-blur-sm text-foreground font-semibold text-sm hover:bg-secondary transition-colors">
              <span>
                {currentOption.cefr ? currentOption.cefr : currentOption.label}
              </span>
              {lessonCount !== undefined && (
                <span className="text-xs text-muted-foreground">({lessonCount})</span>
              )}
              <ChevronDown className="w-4 h-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {levelOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onLevelChange(option.value as LessonLevel)}
                className="flex items-center justify-between"
              >
                <span>
                  {option.label}
                  {option.cefr && <span className="text-muted-foreground ml-1 text-xs">({option.cefr})</span>}
                </span>
                {selectedLevel === option.value && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Freeze badge */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center border border-cyan-500/20">
            <Snowflake className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-cyan-500 text-primary-foreground text-xs font-bold rounded-full px-1.5">
            {freezes}
          </span>
        </div>
        
        {/* Streak badge */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/10 flex items-center justify-center border border-orange-500/20">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full px-1.5">
            {streak}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
