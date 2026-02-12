import { MessageSquare, Tag, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyPhrase {
  text_content: string;
  text_content_translation: string;
}

interface Keyword {
  text_content: string;
}

interface LessonSummary {
  description?: string;
  key_phrases?: KeyPhrase[];
  keywords?: Keyword[];
}

interface SummaryDisplayProps {
  summary: LessonSummary | null | undefined;
}

export function SummaryDisplay({ summary }: SummaryDisplayProps) {
  if (!summary) {
    return (
      <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
        <p className="text-sm text-muted-foreground italic">Žádné summary data</p>
      </div>
    );
  }

  const { description, key_phrases = [], keywords = [] } = summary;

  return (
    <div className="space-y-4">
      {/* Description */}
      {description && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Popis lekce</h4>
          </div>
          <p className="text-sm text-foreground leading-relaxed pl-5">{description}</p>
        </div>
      )}

      {/* Key Phrases */}
      {key_phrases.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Klíčové fráze ({key_phrases.length})
            </h4>
          </div>
          <div className="space-y-1 pl-5">
            {key_phrases.map((phrase, i) => (
              <div key={i} className="flex items-baseline gap-2 py-1">
                <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground">{phrase.text_content}</span>
                  <span className="text-sm text-muted-foreground"> — {phrase.text_content_translation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Klíčová slova ({keywords.length})
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-5">
            {keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded border border-border bg-card text-foreground"
              >
                {keyword.text_content}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!description && key_phrases.length === 0 && keywords.length === 0 && (
        <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border">
          <p className="text-sm text-muted-foreground italic">
            Summary existuje, ale neobsahuje žádná data
          </p>
        </div>
      )}
    </div>
  );
}
