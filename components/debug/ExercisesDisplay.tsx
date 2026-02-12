import { 
  Shuffle, 
  Type, 
  Link2, 
  CircleDot, 
  Headphones,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Exercise {
  type: string;
  question?: string;
  correctAnswer?: string;
  words?: string[];
  options?: string[];
  pairs?: { english: string; czech: string }[];
  audioText?: string;
  hint?: string;
  explanation?: string;
}

interface ExercisesDisplayProps {
  exercises: Exercise[] | null | undefined;
}

const exerciseTypeConfig: Record<string, { 
  icon: React.ElementType; 
  label: string; 
  abbr: string;
  accent: string;
}> = {
  'word-bubbles': {
    icon: Shuffle,
    label: 'Word Bubbles',
    abbr: 'WB',
    accent: 'border-l-blue-500',
  },
  'translate-typing': {
    icon: Type,
    label: 'Překlad psaním',
    abbr: 'TT',
    accent: 'border-l-green-500',
  },
  'matching-pairs': {
    icon: Link2,
    label: 'Párování',
    abbr: 'MP',
    accent: 'border-l-purple-500',
  },
  'multiple-choice': {
    icon: CircleDot,
    label: 'Multiple Choice',
    abbr: 'MC',
    accent: 'border-l-orange-500',
  },
  'listening': {
    icon: Headphones,
    label: 'Listening',
    abbr: 'LS',
    accent: 'border-l-pink-500',
  },
};

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = exerciseTypeConfig[exercise.type] || {
    icon: HelpCircle,
    label: exercise.type,
    abbr: '?',
    accent: 'border-l-muted-foreground',
  };
  
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "py-2.5 px-3 rounded-md border border-border border-l-2 bg-card cursor-pointer transition-all hover:bg-muted/30",
        config.accent,
        expanded && "bg-muted/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-muted text-[10px] flex items-center justify-center font-mono text-muted-foreground">
          {index + 1}
        </span>
        <Icon className="w-3.5 h-3.5 text-foreground/70" />
        <span className="text-xs text-foreground/70 font-medium min-w-[24px]">
          {config.abbr}
        </span>
        {exercise.question && (
          <p className="text-sm text-foreground flex-1 line-clamp-1">
            {exercise.question}
          </p>
        )}
        <span className="text-xs text-muted-foreground ml-auto pl-2">
          {expanded ? '−' : '+'}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 pl-7 space-y-2 text-xs border-l border-border ml-2.5">
          {/* Correct Answer */}
          {exercise.correctAnswer && (
            <div className="flex items-start gap-2 pl-3">
              <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-muted-foreground">Odpověď: </span>
                <span className="font-medium text-foreground">{exercise.correctAnswer}</span>
              </div>
            </div>
          )}

          {/* Words for word-bubbles */}
          {exercise.words && exercise.words.length > 0 && (
            <div className="pl-3">
              <span className="text-muted-foreground">Slova: </span>
              <span className="text-foreground">{exercise.words.join(' · ')}</span>
            </div>
          )}

          {/* Options for multiple-choice */}
          {exercise.options && exercise.options.length > 0 && (
            <div className="pl-3">
              <span className="text-muted-foreground">Možnosti: </span>
              <span className="text-foreground">
                {exercise.options.map((opt, i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    <span className={opt === exercise.correctAnswer ? "text-primary font-medium" : ""}>
                      {opt}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Pairs for matching */}
          {exercise.pairs && exercise.pairs.length > 0 && (
            <div className="pl-3 space-y-0.5">
              <span className="text-muted-foreground">Páry:</span>
              {exercise.pairs.map((pair, i) => (
                <div key={i} className="text-foreground pl-2">
                  {pair.english} ↔ {pair.czech}
                </div>
              ))}
            </div>
          )}

          {/* Audio text for listening */}
          {exercise.audioText && (
            <div className="pl-3">
              <span className="text-muted-foreground">Audio: </span>
              <span className="text-foreground">{exercise.audioText}</span>
            </div>
          )}

          {/* Hint */}
          {exercise.hint && (
            <div className="pl-3 text-muted-foreground italic">
              💡 {exercise.hint}
            </div>
          )}

          {/* Explanation */}
          {exercise.explanation && (
            <div className="pl-3 text-muted-foreground">
              📝 {exercise.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExercisesDisplay({ exercises }: ExercisesDisplayProps) {
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
        <p className="text-sm text-muted-foreground italic">Žádná cvičení</p>
      </div>
    );
  }

  // Count by type
  const typeCounts = exercises.reduce((acc, ex) => {
    acc[ex.type] = (acc[ex.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-3">
      {/* Stats - minimal inline */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{exercises.length} cvičení</span>
        <span>·</span>
        {Object.entries(typeCounts).map(([type, count], i) => {
          const config = exerciseTypeConfig[type];
          return (
            <span key={type}>
              {i > 0 && <span className="mr-3">·</span>}
              {config?.abbr || type} {count}×
            </span>
          );
        })}
      </div>

      {/* Exercise cards */}
      <div className="space-y-1">
        {exercises.map((exercise, i) => (
          <ExerciseCard key={i} exercise={exercise} index={i} />
        ))}
      </div>
    </div>
  );
}
