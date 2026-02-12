import { useState, useCallback, useRef, useEffect } from "react";

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  speed?: number;
  volume?: number;
}

// Normalized volume level for consistent audio output
const DEFAULT_VOLUME = 0.6;

// Global audio instance tracker - ensures only one audio plays at a time
let globalCurrentAudio: HTMLAudioElement | null = null;
let globalCurrentUrl: string | null = null;

const stopGlobalAudio = () => {
  if (globalCurrentAudio) {
    globalCurrentAudio.pause();
    globalCurrentAudio.currentTime = 0;
    globalCurrentAudio = null;
  }
  if (globalCurrentUrl) {
    URL.revokeObjectURL(globalCurrentUrl);
    globalCurrentUrl = null;
  }
};

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}) => {
  const { voiceId = "SLJNJvVRLEY4GJ33tRgI", speed = 1.0, volume = DEFAULT_VOLUME } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const baseVolumeRef = useRef(volume);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Stop audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, []);

  const fadeOut = useCallback((duration: number = 300) => {
    return new Promise<void>((resolve) => {
      if (!audioRef.current) {
        resolve();
        return;
      }

      const audio = audioRef.current;
      const startVolume = audio.volume;
      const steps = 15;
      const stepDuration = duration / steps;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - volumeStep * currentStep);
        audio.volume = newVolume;

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = baseVolumeRef.current;
          audioRef.current = null;
          
          if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
          }
          
          // Clear global tracking
          if (globalCurrentAudio === audio) {
            globalCurrentAudio = null;
            globalCurrentUrl = null;
          }
          
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsLoading(false);
          }
          resolve();
        }
      }, stepDuration);
    });
  }, []);

  const stop = useCallback(() => {
    // Abort any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Clear global tracking
      if (globalCurrentAudio === audioRef.current) {
        globalCurrentAudio = null;
      }
      audioRef.current = null;
    }
    if (currentUrlRef.current) {
      if (globalCurrentUrl === currentUrlRef.current) {
        globalCurrentUrl = null;
      }
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    
    if (isMountedRef.current) {
      setIsSpeaking(false);
      setIsLoading(false);
    }
  }, []);

  const speak = useCallback(
    async (text: string, customOptions?: { speed?: number; pureEnglish?: boolean }) => {
      // Stop any global audio first (prevents overlapping from different components)
      stopGlobalAudio();
      
      // Stop own current playback
      stop();
      
      if (!isMountedRef.current) return;
      
      setError(null);
      setIsLoading(true);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              text,
              voiceId,
              speed: customOptions?.speed || speed,
              pureEnglish: customOptions?.pureEnglish || false,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        // Check if still mounted
        if (!isMountedRef.current) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `TTS request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        
        // Check if still mounted
        if (!isMountedRef.current) return;
        
        const audioUrl = URL.createObjectURL(audioBlob);
        currentUrlRef.current = audioUrl;
        globalCurrentUrl = audioUrl;

        const audio = new Audio(audioUrl);
        audio.volume = baseVolumeRef.current;
        audioRef.current = audio;
        globalCurrentAudio = audio;

        audio.onplay = () => {
          if (isMountedRef.current) {
            setIsSpeaking(true);
            setIsLoading(false);
          }
        };

        audio.onended = () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
          if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
          }
          if (globalCurrentAudio === audio) {
            globalCurrentAudio = null;
            globalCurrentUrl = null;
          }
        };

        audio.onerror = () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsLoading(false);
            setError("Failed to play audio");
          }
        };

        await audio.play();
      } catch (err) {
        // Ignore abort errors
        if ((err as Error).name === "AbortError") {
          return;
        }
        
        console.error("ElevenLabs TTS error:", err);
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setIsLoading(false);
          setIsSpeaking(false);
        }
      }
    },
    [voiceId, speed, stop]
  );

  const speakSlow = useCallback(
    (text: string, pureEnglish?: boolean) => {
      speak(text, { speed: 0.7, pureEnglish });
    },
    [speak]
  );

  const speakEnglish = useCallback(
    (text: string, customOptions?: { speed?: number }) => {
      speak(text, { ...customOptions, pureEnglish: true });
    },
    [speak]
  );

  const speakEnglishSlow = useCallback(
    (text: string) => {
      speak(text, { speed: 0.7, pureEnglish: true });
    },
    [speak]
  );

  return {
    speak,
    speakSlow,
    speakEnglish,
    speakEnglishSlow,
    stop,
    fadeOut,
    isSpeaking,
    isLoading,
    error,
    isSupported: true,
  };
};

// Export for external use (e.g., stopping all audio when navigating)
export const stopAllTTSAudio = stopGlobalAudio;

export default useElevenLabsTTS;
