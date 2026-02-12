import { Flag, Lightbulb, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import useSoundEffects from "@/hooks/useSoundEffects";
import useElevenLabsTTS from "@/hooks/useElevenLabsTTS";

interface FeedbackSheetProps {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  onContinue: () => void;
}

// Fun intro phrases for correct answers - natural spelling for TTS
const CORRECT_INTROS = [
  "Nájc bráško!",
  "Bomba!",
  "To sedlo!",
  "Přesně tak!",
  "Výborně kámo!",
  "Jedeš!",
  "Takhle to má být!",
  "Super práce!",
  "Hustý!",
  "No takhle jo!",
  "Máš to v malíku!",
  "Paráda!",
  "Krása!",
  "Mašina!",
  "Tomu říkám výkon!",
  "Legenda!",
  "Parádní!",
  "Bomba kámo!",
];

// Fun intro phrases for incorrect answers - supportive but honest
const INCORRECT_INTROS = [
  "Škoda kámo.",
  "Ouha!",
  "Těsně vedle, příště to dáš!",
  "No nic, jedeme dál!",
  "Nevadí, stává se.",
  "Hlavně klídek.",
  "Tenhle byl záludnej.",
  "To dá příště!",
  "Skoro!",
  "Nevadí.",
];

const getRandomIntro = (isCorrect: boolean): string => {
  const intros = isCorrect ? CORRECT_INTROS : INCORRECT_INTROS;
  return intros[Math.floor(Math.random() * intros.length)];
};

const FeedbackSheet = ({ isCorrect, correctAnswer, explanation, onContinue }: FeedbackSheetProps) => {
  const { playSuccess, playError } = useSoundEffects();
  const { speak, stop, fadeOut, isSpeaking, isLoading } = useElevenLabsTTS();
  
  // Mute state with localStorage persistence
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem("feedback-voice-muted");
    return stored === "true";
  });

  // Get a random intro phrase (memoized so it doesn't change on re-renders)
  const introPhrase = useMemo(() => getRandomIntro(isCorrect), [isCorrect]);

  // Toggle mute and persist - also stop audio if muting
  const toggleMute = () => {
    setIsMuted(prev => {
      const newValue = !prev;
      localStorage.setItem("feedback-voice-muted", String(newValue));
      
      // If muting, stop any current audio
      if (newValue) {
        stop();
      }
      
      return newValue;
    });
  };

  // Handle continue with fade out
  const handleContinue = async () => {
    await fadeOut(250);
    onContinue();
  };

  // Play sound on mount and speak the feedback
  useEffect(() => {
    if (isCorrect) {
      playSuccess();
    } else {
      playError();
    }

    // Speak the intro + explanation immediately (only if not muted)
    if (!isMuted) {
      // Start speaking right away - no delay
      if (explanation) {
        const textToSpeak = `${introPhrase} ${explanation}`;
        speak(textToSpeak);
      } else {
        speak(introPhrase);
      }
    }

    // Cleanup: stop audio when component unmounts
    return () => {
      stop();
    };
  }, [isCorrect, playSuccess, playError, introPhrase, explanation, speak, isMuted, stop]);

  // Manual replay of the explanation
  const handleReplay = () => {
    if (explanation) {
      const textToSpeak = `${introPhrase} ${explanation}`;
      speak(textToSpeak);
    } else {
      speak(introPhrase);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div
          className={cn(
            "rounded-[28px] p-6 backdrop-blur-sm",
            isCorrect
              ? "bg-primary shadow-[0_-8px_40px_-12px_hsl(68,100%,50%,0.4)]"
              : "bg-gradient-to-b from-[hsl(348,100%,50%)] to-[hsl(0,100%,45%)] shadow-[0_-8px_40px_-12px_hsl(348,100%,50%,0.4)]"
          )}
        >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h2
            className={cn(
              "text-3xl font-black font-['Champ'] tracking-tight",
              isCorrect ? "text-primary-foreground" : "text-white"
            )}
          >
            {isCorrect ? "Najs!" : "Ouha!"}
          </h2>
          <div className="flex gap-2">
            {/* Voice toggle - mute/unmute and replay */}
            <button
              onClick={() => {
                if (isMuted) {
                  // If muted, unmute and play
                  toggleMute();
                  setTimeout(() => handleReplay(), 100);
                } else if (isSpeaking || isLoading) {
                  // If playing, mute (stop)
                  toggleMute();
                } else {
                  // If not playing, replay
                  handleReplay();
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                isCorrect
                  ? "border-primary-foreground/20 hover:border-primary-foreground/40"
                  : "border-white/20 hover:border-white/40",
                isMuted 
                  ? (isCorrect ? "text-primary-foreground/30" : "text-white/30")
                  : (isCorrect ? "text-primary-foreground/70" : "text-white/70"),
                (isSpeaking || isLoading) && "animate-pulse"
              )}
              title={isMuted ? "Zapnout hlas" : (isSpeaking ? "Zastavit" : "Přehrát znovu")}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                isCorrect
                  ? "border-primary-foreground/20 text-primary-foreground/50 hover:border-primary-foreground/40 hover:text-primary-foreground/70"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70"
              )}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Correct answer for wrong answers */}
        {!isCorrect && (
          <div className="mb-4">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Správná odpověď</p>
            <p className="text-white text-xl font-semibold">{correctAnswer}</p>
          </div>
        )}

        {/* Explanation - Premium Design */}
        {explanation && (
          <div className={cn(
            "mb-5 flex gap-3 items-start",
          )}>
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
              isCorrect 
                ? "bg-primary-foreground/15" 
                : "bg-white/15"
            )}>
              <Lightbulb className={cn(
                "w-4 h-4",
                isCorrect ? "text-primary-foreground" : "text-white"
              )} />
            </div>
            <p className={cn(
              "text-[15px] leading-relaxed flex-1",
              isCorrect ? "text-primary-foreground/85" : "text-white/85"
            )}>
              {explanation}
            </p>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className={cn(
            "w-full py-4 rounded-full font-['Champ'] font-bold text-lg transition-all",
            "hover:scale-[1.02] active:scale-[0.98]",
            isCorrect
              ? "bg-primary-foreground text-primary shadow-lg"
              : "bg-[#0a0a0a] text-white shadow-lg"
          )}
        >
          {isCorrect ? "Pokračovat" : "Mám to"}
        </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSheet;
