import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stopAllTTSAudio } from "./useElevenLabsTTS";

interface UsePreloadedAudioReturn {
  preloadWords: (words: string[]) => Promise<void>;
  playWord: (word: string) => void;
  stop: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  playingWord: string | null;
  loadedCount: number;
  totalCount: number;
}

export const usePreloadedAudio = (): UsePreloadedAudioReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Stop current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
      
      // Clear all audio elements
      audioMapRef.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioMapRef.current.clear();
    };
  }, []);

  const preloadWords = useCallback(async (words: string[]) => {
    if (words.length === 0) return;

    // Normalize and dedupe words
    const uniqueWords = [...new Set(words.map((w) => w.toLowerCase().trim()))];
    setTotalCount(uniqueWords.length);
    setLoadedCount(0);
    setIsLoading(true);

    try {
      // Call edge function to get/generate audio URLs
      const { data, error } = await supabase.functions.invoke("batch-generate-audio", {
        body: { words: uniqueWords, language: "en" },
      });

      if (error) {
        console.error("Failed to generate audio:", error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        return;
      }

      const audioUrls = data?.audioUrls || {};

      // Preload audio elements
      let loaded = 0;
      const loadPromises = Object.entries(audioUrls).map(([word, url]) => {
        return new Promise<void>((resolve) => {
          const audio = new Audio(url as string);
          audio.preload = "auto";
          
          audio.oncanplaythrough = () => {
            audioMapRef.current.set(word, audio);
            loaded++;
            if (isMountedRef.current) {
              setLoadedCount(loaded);
            }
            resolve();
          };
          
          audio.onerror = () => {
            console.error(`Failed to preload audio for "${word}"`);
            resolve();
          };

          // Start loading
          audio.load();
        });
      });

      await Promise.all(loadPromises);
      console.log(`Preloaded ${loaded} audio files`);
    } catch (err) {
      console.error("Error preloading audio:", err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (isMountedRef.current) {
      setIsPlaying(false);
      setPlayingWord(null);
    }
  }, []);

  const playWord = useCallback((word: string) => {
    const normalizedWord = word.toLowerCase().trim();
    const audio = audioMapRef.current.get(normalizedWord);

    if (!audio) {
      console.warn(`No preloaded audio for "${word}"`);
      return;
    }

    // Stop any global TTS audio first
    stopAllTTSAudio();

    // Stop any current playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    currentAudioRef.current = audio;
    audio.currentTime = 0;
    
    audio.onplay = () => {
      if (isMountedRef.current) {
        setIsPlaying(true);
        setPlayingWord(normalizedWord);
      }
    };
    
    audio.onended = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
        setPlayingWord(null);
      }
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null;
      }
    };
    
    audio.onpause = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
        setPlayingWord(null);
      }
    };

    audio.play().catch((err) => {
      console.error("Failed to play audio:", err);
      if (isMountedRef.current) {
        setIsPlaying(false);
        setPlayingWord(null);
      }
    });
  }, []);

  return {
    preloadWords,
    playWord,
    stop,
    isLoading,
    isPlaying,
    playingWord,
    loadedCount,
    totalCount,
  };
};

export default usePreloadedAudio;
