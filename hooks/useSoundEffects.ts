import { useCallback } from "react";

// Haptic feedback using Vibration API
const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const useSoundEffects = () => {
  const playSuccess = useCallback(() => {
    // Haptic: short gentle tap
    vibrate(50);
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Pleasant ascending chime - C5, E5, G5
      playTone(523.25, now, 0.15);
      playTone(659.25, now + 0.08, 0.15);
      playTone(783.99, now + 0.16, 0.2);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  const playError = useCallback(() => {
    // Haptic: two quick strong buzzes for error
    vibrate([100, 50, 100]);
    
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playTone = (frequency: number, startTime: number, duration: number, type: OscillatorType = 'square') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Descending error buzz - two quick low tones
      playTone(220, now, 0.12, 'square');
      playTone(165, now + 0.12, 0.18, 'square');
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  const playClick = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  const playLevelUp = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Triumphant fanfare - C5, E5, G5, C6
      playTone(523.25, now, 0.2);
      playTone(659.25, now + 0.1, 0.2);
      playTone(783.99, now + 0.2, 0.2);
      playTone(1046.50, now + 0.3, 0.4);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }, []);

  return {
    playSuccess,
    playError,
    playClick,
    playLevelUp,
  };
};

export default useSoundEffects;
