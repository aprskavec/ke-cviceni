import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Sparkles, Loader2 } from "lucide-react";
import useSoundEffects from "@/hooks/useSoundEffects";
import usePreloadedTTS from "@/hooks/usePreloadedTTS";
import ErrorPopup from "../ErrorPopup";

interface Pair {
  english: string;
  czech: string;
}

interface MatchingPairsProps {
  pairs: Pair[];
  onComplete: (correctCount: number, totalCount: number) => void;
  disabled: boolean;
}

interface Position {
  x: number;
  y: number;
}

interface MatchedPairData {
  english: string;
  czech: string;
  leftPos: Position;
  rightPos: Position;
}

// Particle component for success effect
const SuccessParticles = ({ position, onComplete }: { position: Position; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const delay = Math.random() * 0.1;
    const size = 8 + Math.random() * 8;
    
    return (
      <div
        key={i}
        className="absolute pointer-events-none"
        style={{
          left: position.x,
          top: position.y,
          animation: `particle-burst 0.8s ease-out ${delay}s forwards`,
          ['--tx' as string]: `${tx}px`,
          ['--ty' as string]: `${ty}px`,
        }}
      >
        <Sparkles 
          className="text-primary drop-shadow-[0_0_6px_hsl(68,100%,50%)]" 
          style={{ width: size, height: size }} 
        />
      </div>
    );
  });

  return <>{particles}</>;
};

// Connection line component
const ConnectionLine = ({ 
  from, 
  to, 
  isCorrect, 
  isWrong,
  isAnimatingOut 
}: { 
  from: Position; 
  to: Position; 
  isCorrect: boolean;
  isWrong: boolean;
  isAnimatingOut: boolean;
}) => {
  const midX = (from.x + to.x) / 2;
  const controlOffset = 30;
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="line-gradient-correct" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(68, 100%, 50%)" />
          <stop offset="100%" stopColor="hsl(80, 100%, 60%)" />
        </linearGradient>
        <linearGradient id="line-gradient-wrong" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(348, 100%, 50%)" />
          <stop offset="100%" stopColor="hsl(0, 100%, 50%)" />
        </linearGradient>
        <linearGradient id="line-gradient-pending" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0, 0%, 60%)" />
          <stop offset="100%" stopColor="hsl(0, 0%, 40%)" />
        </linearGradient>
        <filter id="glow-correct">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-wrong">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M ${from.x} ${from.y} Q ${midX} ${from.y - controlOffset} ${to.x} ${to.y}`}
        fill="none"
        stroke={isCorrect ? "url(#line-gradient-correct)" : isWrong ? "url(#line-gradient-wrong)" : "url(#line-gradient-pending)"}
        strokeWidth={isCorrect ? 4 : 3}
        strokeLinecap="round"
        filter={isCorrect ? "url(#glow-correct)" : isWrong ? "url(#glow-wrong)" : undefined}
        className={cn(
          "transition-all duration-300",
          isAnimatingOut && "opacity-0"
        )}
        style={{
          strokeDasharray: isCorrect ? 'none' : '8,4',
          animation: isCorrect ? 'none' : 'dash 0.5s linear infinite',
        }}
      />
    </svg>
  );
};

const MatchingPairs = ({ pairs, onComplete, disabled }: MatchingPairsProps) => {
  const [leftItems, setLeftItems] = useState<string[]>([]);
  const [rightItems, setRightItems] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Map<string, MatchedPairData>>(new Map());
  const [wrongPair, setWrongPair] = useState<{ left: number; right: number } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [pendingConnection, setPendingConnection] = useState<{ from: Position; to: Position } | null>(null);
  const [successConnection, setSuccessConnection] = useState<{ from: Position; to: Position; key: string } | null>(null);
  const [particles, setParticles] = useState<{ id: number; position: Position }[]>([]);
  const [hiddenPairs, setHiddenPairs] = useState<Set<string>>(new Set());
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const particleIdRef = useRef(0);
  
  const { playSuccess, playError } = useSoundEffects();
  
  // Preload all words for instant playback
  const allWords = useMemo(() => {
    return [...pairs.map(p => p.english), ...pairs.map(p => p.czech)];
  }, [pairs]);
  const { speak, isLoading: isPreloading } = usePreloadedTTS(allWords);


  useEffect(() => {
    // Shuffle both columns independently
    const shuffledLeft = shuffleArray(pairs.map(p => p.english));
    const shuffledRight = shuffleArray(pairs.map(p => p.czech));
    setLeftItems(shuffledLeft);
    setRightItems(shuffledRight);
    setMatchedPairs(new Map());
    setHiddenPairs(new Set());
    setCorrectCount(0);
    leftRefs.current = new Array(pairs.length).fill(null);
    rightRefs.current = new Array(pairs.length).fill(null);
  }, [pairs]);

  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getElementCenter = (element: HTMLElement | null): Position | null => {
    if (!element || !containerRef.current) return null;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  const updatePendingConnection = useCallback(() => {
    if (selectedLeft !== null && selectedRight !== null) {
      const leftPos = getElementCenter(leftRefs.current[selectedLeft]);
      const rightPos = getElementCenter(rightRefs.current[selectedRight]);
      
      if (leftPos && rightPos) {
        setPendingConnection({ from: leftPos, to: rightPos });
      }
    } else {
      setPendingConnection(null);
    }
  }, [selectedLeft, selectedRight]);

  useEffect(() => {
    updatePendingConnection();
  }, [updatePendingConnection]);

  const handleLeftClick = (index: number) => {
    if (disabled || hiddenPairs.has(leftItems[index])) return;
    
    const word = leftItems[index];
    setSelectedLeft(index);
    setWrongPair(null);
    
    // Speak the English word
    speak(word);
    
    if (selectedRight !== null) {
      checkMatch(index, selectedRight);
    }
  };

  const handleRightClick = (index: number) => {
    if (disabled || hiddenPairs.has(rightItems[index])) return;
    
    const word = rightItems[index];
    setSelectedRight(index);
    setWrongPair(null);
    
    // Speak the Czech word
    speak(word);
    
    if (selectedLeft !== null) {
      checkMatch(selectedLeft, index);
    }
  };

  const checkMatch = (leftIndex: number, rightIndex: number) => {
    const englishWord = leftItems[leftIndex];
    const czechWord = rightItems[rightIndex];
    
    const leftPos = getElementCenter(leftRefs.current[leftIndex]);
    const rightPos = getElementCenter(rightRefs.current[rightIndex]);
    
    // Find if this is a correct pair
    const isCorrect = pairs.some(p => p.english === englishWord && p.czech === czechWord);
    
    if (isCorrect && leftPos && rightPos) {
      // Play success sound
      playSuccess();
      
      // Show success connection
      const connectionKey = `${englishWord}-${czechWord}`;
      setSuccessConnection({ from: leftPos, to: rightPos, key: connectionKey });
      
      // Add particles at the center between the two items
      const centerPos = {
        x: (leftPos.x + rightPos.x) / 2,
        y: (leftPos.y + rightPos.y) / 2,
      };
      const newParticleId = particleIdRef.current++;
      setParticles(prev => [...prev, { id: newParticleId, position: centerPos }]);
      
      // Store matched pair data
      const pairData: MatchedPairData = {
        english: englishWord,
        czech: czechWord,
        leftPos,
        rightPos,
      };
      
      const newMatched = new Map(matchedPairs);
      newMatched.set(englishWord, pairData);
      setMatchedPairs(newMatched);
      setCorrectCount(prev => prev + 1);
      
      // Animate out and hide after delay
      setTimeout(() => {
        setSuccessConnection(null);
        setHiddenPairs(prev => {
          const newHidden = new Set(prev);
          newHidden.add(englishWord);
          newHidden.add(czechWord);
          return newHidden;
        });
        
        // Check if all pairs are matched
        if (newMatched.size === pairs.length) {
          setTimeout(() => {
            onComplete(correctCount + 1, pairs.length);
          }, 300);
        }
      }, 600);
    } else {
      // Play error sound and show popup
      playError();
      setShowErrorPopup(true);
      
      setWrongPair({ left: leftIndex, right: rightIndex });
      setTimeout(() => {
        setWrongPair(null);
      }, 800);
    }
    
    setSelectedLeft(null);
    setSelectedRight(null);
    setPendingConnection(null);
  };

  const isHidden = (word: string) => hiddenPairs.has(word);
  const isMatched = (word: string) => matchedPairs.has(word) || Array.from(matchedPairs.values()).some(p => p.czech === word);

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-md flex flex-col items-center animate-fade-in relative"
    >
      {/* CSS for animations */}
      <style>{`
        @keyframes particle-burst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1);
            opacity: 0;
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -12;
          }
        }
        @keyframes match-success {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(0.95);
            opacity: 0;
          }
        }
      `}</style>

      {/* Error Popup */}
      <ErrorPopup 
        show={showErrorPopup} 
        onHide={() => setShowErrorPopup(false)} 
      />

      {/* Particles */}
      {particles.map(p => (
        <SuccessParticles 
          key={p.id} 
          position={p.position} 
          onComplete={() => removeParticle(p.id)} 
        />
      ))}
      {/* Connection lines */}
      {pendingConnection && !successConnection && (
        <ConnectionLine 
          from={pendingConnection.from} 
          to={pendingConnection.to} 
          isCorrect={false}
          isWrong={wrongPair !== null}
          isAnimatingOut={false}
        />
      )}
      
      {successConnection && (
        <ConnectionLine 
          from={successConnection.from} 
          to={successConnection.to} 
          isCorrect={true}
          isWrong={false}
          isAnimatingOut={false}
        />
      )}

      {/* Instruction */}
      <div className="flex items-center gap-2 mb-6">
        <p className="text-muted-foreground text-lg">Spoj páry</p>
        {isPreloading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-primary font-bold">{hiddenPairs.size / 2}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{pairs.length}</span>
      </div>

      {/* Matching columns */}
      <div className="w-full flex gap-4">
        {/* Left column - English */}
        <div className="flex-1 space-y-3">
          {leftItems.map((word, index) => {
            const hidden = isHidden(word);
            const matched = isMatched(word);
            const isSelected = selectedLeft === index;
            const isWrong = wrongPair?.left === index;
            const isSuccessAnimating = successConnection && matchedPairs.has(word);
            
            return (
              <button
                key={`left-${index}`}
                ref={el => { leftRefs.current[index] = el; }}
                onClick={() => handleLeftClick(index)}
                disabled={disabled || hidden}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  "font-medium text-base",
                  hidden && "opacity-0 pointer-events-none scale-95",
                  !hidden && matched && !isSuccessAnimating && "bg-primary/20 border-primary/50 text-primary",
                  !hidden && !matched && !isSelected && !isWrong && "bg-card border-border hover:border-primary/50",
                  !hidden && isSelected && !isWrong && "bg-primary/10 border-primary ring-2 ring-primary/30",
                  !hidden && isWrong && "bg-destructive/10 border-destructive animate-shake",
                  isSuccessAnimating && "bg-primary/30 border-primary scale-105"
                )}
                style={{
                  transition: hidden ? 'all 0.4s ease-out' : 'all 0.2s ease-out',
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{word}</span>
                  {matched && !hidden && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column - Czech */}
        <div className="flex-1 space-y-3">
          {rightItems.map((word, index) => {
            const hidden = isHidden(word);
            const matched = isMatched(word);
            const isSelected = selectedRight === index;
            const isWrong = wrongPair?.right === index;
            const isSuccessAnimating = successConnection && Array.from(matchedPairs.values()).some(p => p.czech === word);
            
            return (
              <button
                key={`right-${index}`}
                ref={el => { rightRefs.current[index] = el; }}
                onClick={() => handleRightClick(index)}
                disabled={disabled || hidden}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all duration-200",
                  "font-medium text-base",
                  hidden && "opacity-0 pointer-events-none scale-95",
                  !hidden && matched && !isSuccessAnimating && "bg-primary/20 border-primary/50 text-primary",
                  !hidden && !matched && !isSelected && !isWrong && "bg-card border-border hover:border-primary/50",
                  !hidden && isSelected && !isWrong && "bg-primary/10 border-primary ring-2 ring-primary/30",
                  !hidden && isWrong && "bg-destructive/10 border-destructive animate-shake",
                  isSuccessAnimating && "bg-primary/30 border-primary scale-105"
                )}
                style={{
                  transition: hidden ? 'all 0.4s ease-out' : 'all 0.2s ease-out',
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{word}</span>
                  {matched && !hidden && <Check className="w-5 h-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchingPairs;
