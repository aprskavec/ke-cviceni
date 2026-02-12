import { useState, useCallback, useRef } from "react";

interface UseTextToSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const { language = "en-US", rate = 0.9, pitch = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== "undefined" && "speechSynthesis" in window
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string, customOptions?: { rate?: number; language?: string }) => {
      if (!isSupported) {
        console.warn("Web Speech API is not supported");
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = customOptions?.language || language;
      utterance.rate = customOptions?.rate || rate;
      utterance.pitch = pitch;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith(utterance.lang.split("-")[0]) &&
          (v.name.includes("Google") || v.name.includes("Natural"))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, language, rate, pitch]
  );

  const speakSlow = useCallback(
    (text: string) => {
      speak(text, { rate: 0.6 });
    },
    [speak]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const speakCzech = useCallback(
    (text: string) => {
      speak(text, { language: "cs-CZ", rate: 0.85 });
    },
    [speak]
  );

  return {
    speak,
    speakSlow,
    speakCzech,
    stop,
    isSpeaking,
    isSupported,
  };
};

export default useTextToSpeech;
