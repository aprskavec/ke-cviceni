import { useState, useCallback, useRef, useEffect } from "react";
import { stopAllTTSAudio } from "./useElevenLabsTTS";

interface UsePreloadedTTSOptions {
  voiceId?: string;
  volume?: number;
}

const DEFAULT_VOLUME = 0.6;

export const usePreloadedTTS = (words: string[], options: UsePreloadedTTSOptions = {}) => {
  const { voiceId = "SLJNJvVRLEY4GJ33tRgI", volume = DEFAULT_VOLUME } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const audioCache = useRef<Map<string, string>>(new Map());
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  // Preload all words on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (words.length === 0) {
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    let loaded = 0;

    const preloadWord = async (word: string) => {
      // Skip if already cached
      if (audioCache.current.has(word)) {
        loaded++;
        if (isMountedRef.current) {
          setLoadedCount(loaded);
        }
        return;
      }

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
            body: JSON.stringify({ text: word, voiceId }),
            signal: abortController.signal,
          }
        );

        if (response.ok && isMountedRef.current) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          audioCache.current.set(word, url);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error(`Failed to preload TTS for "${word}":`, err);
        }
      }

      loaded++;
      if (isMountedRef.current) {
        setLoadedCount(loaded);
      }
    };

    // Preload all words in parallel (max 3 at a time to avoid rate limiting)
    const preloadAll = async () => {
      const uniqueWords = [...new Set(words)];
      const batchSize = 3;
      
      for (let i = 0; i < uniqueWords.length; i += batchSize) {
        if (!isMountedRef.current) break;
        const batch = uniqueWords.slice(i, i + batchSize);
        await Promise.all(batch.map(preloadWord));
      }
      
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };

    preloadAll();

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [words, voiceId]);

  // Play a preloaded word instantly
  const speak = useCallback((word: string) => {
    // Stop any global TTS audio first
    stopAllTTSAudio();
    
    // Stop current audio if playing
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
      currentAudio.current = null;
    }

    const cachedUrl = audioCache.current.get(word);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audio.volume = volume;
      currentAudio.current = audio;
      
      audio.onended = () => {
        if (currentAudio.current === audio) {
          currentAudio.current = null;
        }
      };
      
      audio.play().catch(console.error);
    } else {
      // Fallback: fetch on demand if not cached
      console.warn(`Audio for "${word}" not preloaded, fetching on demand`);
      fetchAndPlay(word);
    }
  }, [volume]);

  const fetchAndPlay = async (word: string) => {
    if (!isMountedRef.current) return;
    
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
          body: JSON.stringify({ text: word, voiceId }),
        }
      );

      if (response.ok && isMountedRef.current) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioCache.current.set(word, url);
        
        const audio = new Audio(url);
        audio.volume = volume;
        currentAudio.current = audio;
        
        audio.onended = () => {
          if (currentAudio.current === audio) {
            currentAudio.current = null;
          }
        };
        
        audio.play().catch(console.error);
      }
    } catch (err) {
      console.error(`Failed to fetch TTS for "${word}":`, err);
    }
  };

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
      currentAudio.current = null;
    }
  }, []);

  // Cleanup URLs and stop audio on unmount
  useEffect(() => {
    return () => {
      // Stop any playing audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current.currentTime = 0;
        currentAudio.current = null;
      }
      
      // Cleanup URLs
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
      audioCache.current.clear();
    };
  }, []);

  return {
    speak,
    stop,
    isLoading,
    loadedCount,
    totalCount: words.length,
  };
};

export default usePreloadedTTS;
