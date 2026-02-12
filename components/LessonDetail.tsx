import { useState } from "react";
import { X, Sparkles, BookOpen, Video, MessageCircleQuestion, Clock, Hash, ChevronDown, ChevronUp, Check, X as XIcon } from "lucide-react";
import { Lesson, getCategoryName, getCategoryColor } from "@/data/lessons";
import { cn } from "@/lib/utils";

interface LessonDetailProps {
  lesson: Lesson;
  onClose: () => void;
  onStartPractice: () => void;
}

const LessonDetail = ({ lesson, onClose, onStartPractice }: LessonDetailProps) => {
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);
  const category = getCategoryName(lesson.kind);
  const categoryColor = getCategoryColor(lesson.kind);

  const formatTimestamp = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-semibold border", categoryColor)}>
              {category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Lekce {lesson.order + 1}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-tight">{lesson.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-secondary/30">
        {lesson.video_upload_id && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Video className="w-4 h-4 text-primary" />
            <span>Video</span>
          </div>
        )}
        {lesson.interactions && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircleQuestion className="w-4 h-4 text-orange-400" />
            <span>{lesson.interactions.interactions.length} kvízů</span>
          </div>
        )}
        {lesson.summary?.key_phrases && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>{lesson.summary.key_phrases.length} frází</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        {lesson.summary && (
          <>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-foreground leading-relaxed">
                {lesson.summary.description}
              </p>
            </div>

            {/* Key Phrases */}
            {lesson.summary.key_phrases.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Klíčové fráze ({lesson.summary.key_phrases.length})
                </h3>
                <div className="space-y-3">
                  {lesson.summary.key_phrases.map((phrase, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <p className="font-medium text-foreground mb-1 text-lg">
                        {phrase.text_content}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        → {phrase.text_content_translation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {lesson.summary.keywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Slovíčka ({lesson.summary.keywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.summary.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors cursor-default"
                    >
                      {keyword.text_content}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Interactive Quizzes */}
        {lesson.interactions && lesson.interactions.interactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              Interaktivní kvízy ({lesson.interactions.interactions.length})
            </h3>
            <div className="space-y-3">
              {lesson.interactions.interactions.map((quiz, index) => (
                <div 
                  key={index}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedQuiz(expandedQuiz === index ? null : index)}
                    className="w-full p-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">
                          {quiz.form.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(quiz.timestamp)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {quiz.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedQuiz === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedQuiz === index && (
                    <div className="p-4 space-y-3 bg-card animate-fade-in">
                      <p className="text-foreground font-medium mb-3">{quiz.form.question}</p>
                      {quiz.form.answers.map((answer, answerIndex) => (
                        <div 
                          key={answerIndex}
                          className={cn(
                            "p-3 rounded-xl border flex items-start gap-3",
                            answer.correct 
                              ? "bg-green-500/10 border-green-500/30" 
                              : "bg-red-500/5 border-border"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                            answer.correct ? "bg-green-500" : "bg-red-500/50"
                          )}>
                            {answer.correct ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <XIcon className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium",
                              answer.correct ? "text-green-400" : "text-muted-foreground"
                            )}>
                              {answer.text}
                            </p>
                            {answer.explanation && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                {answer.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video ID (for reference) */}
        {lesson.video_upload_id && (
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
              <Video className="w-4 h-4" />
              Video ID
            </h3>
            <code className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
              {lesson.video_upload_id}
            </code>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-border space-y-3">
        <button 
          onClick={onStartPractice}
          className="w-full py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-primary"
        >
          <Sparkles className="w-5 h-5" />
          Procvičit slovíčka s AI
        </button>
        <button className="w-full py-4 rounded-full bg-secondary text-foreground font-bold text-lg hover:bg-muted transition-colors flex items-center justify-center gap-2">
          <BookOpen className="w-5 h-5" />
          Spustit video lekci
        </button>
      </div>
    </div>
  );
};

export default LessonDetail;
