import { Lock, Play } from "lucide-react";
import { Lesson, getCategoryName } from "@/data/lessons";

interface LessonItemProps {
  lesson: Lesson;
  status: "locked" | "available" | "completed";
  isLast?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

const LessonItem = ({ lesson, status, isLast = false, isSelected = false, onClick }: LessonItemProps) => {
  // Guard against undefined lesson
  if (!lesson) {
    return null;
  }
  
  const category = getCategoryName(lesson.kind);

  const getNodeContent = () => {
    switch (status) {
      case "completed":
        return <Play className="w-4 h-4 text-primary fill-primary" />;
      case "available":
        return <Play className="w-4 h-4 text-primary fill-primary" />;
      case "locked":
      default:
        return <Lock className="w-4 h-4 text-muted-foreground/60" />;
    }
  };

  const getNodeStyles = () => {
    const baseStyles = "border-muted/40 bg-card/50";
    const activeStyles = "border-primary bg-primary/20 shadow-[0_0_20px_rgba(191,255,0,0.3)]";
    const selectedStyles = "border-primary bg-primary/30 ring-2 ring-primary/50";
    
    if (isSelected) return selectedStyles;
    if (status === "available" || status === "completed") return activeStyles;
    return baseStyles;
  };

  return (
    <button 
      onClick={onClick}
      disabled={status === "locked"}
      className={`relative flex items-start gap-5 w-full text-left group transition-all duration-300 ${
        status !== "locked" ? "hover:translate-x-1 cursor-pointer" : "cursor-not-allowed"
      }`}
    >
      {/* Connecting line - starts below the node circle and goes to the next node */}
      {!isLast && (
        <div 
          className={`absolute left-[23px] top-[52px] w-[2px] h-[calc(100%-52px)] ${
            status === "completed" ? "bg-primary/30" : "bg-border/50"
          }`} 
        />
      )}
      
      {/* Node */}
      <div 
        className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${getNodeStyles()}`}
      >
        {getNodeContent()}
      </div>
      
      {/* Content */}
      <div className="flex-1 py-1 pb-8">
        <h3 
          className={`font-semibold text-[17px] leading-tight mb-1 transition-colors ${
            status === "locked" ? "text-muted-foreground/70" : "text-foreground"
          }`}
        >
          {lesson.name}
        </h3>
        <p className={`text-sm ${status === "locked" ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
          {category}
        </p>
      </div>
    </button>
  );
};

export default LessonItem;
