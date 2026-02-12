import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProgress {
  id: string;
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_practice_date: string | null;
  level: number;
  total_exercises_completed: number;
  total_correct_answers: number;
}

interface WordMastery {
  id: string;
  word: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  correct_count: number;
  incorrect_count: number;
  next_review_at: string;
  mastery_level: "new" | "learning" | "reviewing" | "mastered";
}

// Generate a persistent device ID
const getDeviceId = (): string => {
  const storageKey = "kuba_english_device_id";
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  return deviceId;
};

export const useUserProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [wordMasteries, setWordMasteries] = useState<WordMastery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = getDeviceId();

  // Load user progress
  const loadProgress = useCallback(async () => {
    try {
      // Try to get existing progress
      let { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // No record found, create one
        const { data: newData, error: insertError } = await supabase
          .from("user_progress")
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      setProgress(data);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  }, [userId]);

  // Load word masteries
  const loadWordMasteries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("word_mastery")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      // Cast mastery_level to our enum type
      const typedData = (data || []).map((item) => ({
        ...item,
        mastery_level: item.mastery_level as "new" | "learning" | "reviewing" | "mastered",
      }));
      setWordMasteries(typedData);
    } catch (error) {
      console.error("Error loading word masteries:", error);
    }
  }, [userId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadProgress(), loadWordMasteries()]);
      setIsLoading(false);
    };
    load();
  }, [loadProgress, loadWordMasteries]);

  // Update streak based on last practice date
  const updateStreak = useCallback(async () => {
    if (!progress) return;

    const today = new Date().toISOString().split("T")[0];
    const lastPractice = progress.last_practice_date;

    let newStreak = progress.current_streak;

    if (!lastPractice) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastPractice);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day, no change
        return;
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    const { data, error } = await supabase
      .from("user_progress")
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, progress.longest_streak),
        last_practice_date: today,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
    }
  }, [progress, userId]);

  // Add XP and update level
  const addXP = useCallback(
    async (xp: number, correctAnswers: number, totalExercises: number) => {
      if (!progress) return;

      const newTotalXP = progress.total_xp + xp;
      const newLevel = Math.floor(newTotalXP / 100) + 1; // Level up every 100 XP

      const { data, error } = await supabase
        .from("user_progress")
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          total_exercises_completed:
            progress.total_exercises_completed + totalExercises,
          total_correct_answers: progress.total_correct_answers + correctAnswers,
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (!error && data) {
        setProgress(data);
      }

      return { newTotalXP, newLevel, leveledUp: newLevel > progress.level };
    },
    [progress, userId]
  );

  // Update word mastery using SM-2 algorithm
  const updateWordMastery = useCallback(
    async (word: string, isCorrect: boolean, lessonId?: string) => {
      const existing = wordMasteries.find(
        (wm) => wm.word.toLowerCase() === word.toLowerCase()
      );

      let easeFactor = existing?.ease_factor || 2.5;
      let intervalDays = existing?.interval_days || 1;
      let repetitionCount = existing?.repetition_count || 0;

      if (isCorrect) {
        // SM-2 algorithm for correct answer
        repetitionCount += 1;
        if (repetitionCount === 1) {
          intervalDays = 1;
        } else if (repetitionCount === 2) {
          intervalDays = 6;
        } else {
          intervalDays = Math.round(intervalDays * easeFactor);
        }
        easeFactor = Math.max(1.3, easeFactor + 0.1);
      } else {
        // Reset on incorrect
        repetitionCount = 0;
        intervalDays = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
      }

      // Calculate mastery level
      let masteryLevel: "new" | "learning" | "reviewing" | "mastered" = "new";
      if (repetitionCount >= 5 && intervalDays >= 21) {
        masteryLevel = "mastered";
      } else if (repetitionCount >= 2) {
        masteryLevel = "reviewing";
      } else if (repetitionCount >= 1) {
        masteryLevel = "learning";
      }

      const nextReviewAt = new Date();
      nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

      const updateData = {
        user_id: userId,
        word: word.toLowerCase(),
        lesson_id: lessonId,
        ease_factor: easeFactor,
        interval_days: intervalDays,
        repetition_count: repetitionCount,
        correct_count: (existing?.correct_count || 0) + (isCorrect ? 1 : 0),
        incorrect_count: (existing?.incorrect_count || 0) + (isCorrect ? 0 : 1),
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReviewAt.toISOString(),
        mastery_level: masteryLevel,
      };

      if (existing) {
        await supabase
          .from("word_mastery")
          .update(updateData)
          .eq("id", existing.id);
      } else {
        await supabase.from("word_mastery").insert(updateData);
      }

      // Reload masteries
      await loadWordMasteries();
    },
    [wordMasteries, userId, loadWordMasteries]
  );

  // Get words that need review (due for spaced repetition)
  const getWordsForReview = useCallback((): WordMastery[] => {
    const now = new Date();
    return wordMasteries.filter((wm) => new Date(wm.next_review_at) <= now);
  }, [wordMasteries]);

  // Get problem words (high incorrect count, low mastery)
  const getProblemWords = useCallback((): WordMastery[] => {
    return wordMasteries
      .filter(
        (wm) =>
          wm.incorrect_count > wm.correct_count ||
          wm.mastery_level === "learning" ||
          wm.mastery_level === "new"
      )
      .sort((a, b) => b.incorrect_count - a.incorrect_count);
  }, [wordMasteries]);

  // Save practice session
  const savePracticeSession = useCallback(
    async (
      lessonId: string,
      lessonName: string,
      score: number,
      totalExercises: number,
      exerciseTypes: string[],
      durationSeconds?: number
    ) => {
      // Calculate XP: 10 per correct + 5 bonus for perfect score
      const xpEarned = score * 10 + (score === totalExercises ? 5 : 0);

      const { data, error } = await supabase
        .from("practice_sessions")
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          lesson_name: lessonName,
          score,
          total_exercises: totalExercises,
          xp_earned: xpEarned,
          duration_seconds: durationSeconds,
          exercise_types: exerciseTypes,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving session:", error);
        return null;
      }

      // Update streak and XP
      await updateStreak();
      const xpResult = await addXP(xpEarned, score, totalExercises);

      return { session: data, xpEarned, ...xpResult };
    },
    [userId, updateStreak, addXP]
  );

  // Save individual exercise result
  const saveExerciseResult = useCallback(
    async (
      sessionId: string,
      word: string,
      exerciseType: string,
      isCorrect: boolean,
      userAnswer: string,
      correctAnswer: string,
      timeSpentMs?: number
    ) => {
      await supabase.from("exercise_results").insert({
        session_id: sessionId,
        user_id: userId,
        word,
        exercise_type: exerciseType,
        is_correct: isCorrect,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        time_spent_ms: timeSpentMs,
      });

      // Update word mastery
      await updateWordMastery(word, isCorrect);
    },
    [userId, updateWordMastery]
  );

  return {
    progress,
    wordMasteries,
    isLoading,
    userId,
    updateStreak,
    addXP,
    updateWordMastery,
    getWordsForReview,
    getProblemWords,
    savePracticeSession,
    saveExerciseResult,
    reload: () => Promise.all([loadProgress(), loadWordMasteries()]),
  };
};

export default useUserProgress;
