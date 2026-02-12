import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorPopupProps {
  show: boolean;
  message?: string;
  onHide: () => void;
}

const ErrorPopup = ({ show, message, onHide }: ErrorPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timers when show changes
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (show) {
      setIsVisible(true);
      
      // Start fade-out after 400ms (faster)
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        
        // Call onHide after fade-out animation completes (200ms)
        hideTimerRef.current = setTimeout(() => {
          onHide();
        }, 200);
      }, 400);
    } else {
      // Immediately hide if show becomes false
      setIsVisible(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [show, onHide]);

  // Don't render if not showing and not visible
  if (!show && !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]",
        "pointer-events-none transition-all duration-200",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
      )}
    >
      <div className="relative">
        {/* Glowing background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(348,100%,50%)] to-[hsl(0,100%,50%)] rounded-full blur-2xl opacity-40" />
        
        {/* Main popup */}
        <div className="relative bg-gradient-to-b from-[hsl(348,100%,45%)] to-[hsl(0,100%,40%)] rounded-full p-6 shadow-2xl animate-shake">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            {message && (
              <span className="text-white font-bold text-lg pr-2">{message}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
