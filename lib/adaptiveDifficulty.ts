// Adaptive Difficulty System
// Adjusts exercise generation based on user's word mastery

interface WordMastery {
  word: string;
  ease_factor: number;
  interval_days: number;
  correct_count: number;
  incorrect_count: number;
  mastery_level: "new" | "learning" | "reviewing" | "mastered";
  next_review_at: string;
}

interface DifficultyProfile {
  level: "beginner" | "intermediate" | "advanced";
  focusOnProblemWords: boolean;
  includeReviewWords: boolean;
  exerciseComplexity: number; // 1-3
}

export const calculateDifficultyProfile = (
  wordMasteries: WordMastery[],
  userLevel: number
): DifficultyProfile => {
  if (wordMasteries.length === 0) {
    return {
      level: "beginner",
      focusOnProblemWords: false,
      includeReviewWords: false,
      exerciseComplexity: 1,
    };
  }

  // Calculate average mastery
  const avgCorrectRate =
    wordMasteries.reduce((acc, wm) => {
      const total = wm.correct_count + wm.incorrect_count;
      return acc + (total > 0 ? wm.correct_count / total : 0);
    }, 0) / wordMasteries.length;

  // Count mastery levels
  const masteryDistribution = wordMasteries.reduce(
    (acc, wm) => {
      acc[wm.mastery_level]++;
      return acc;
    },
    { new: 0, learning: 0, reviewing: 0, mastered: 0 }
  );

  const totalWords = wordMasteries.length;
  const masteredRatio = masteryDistribution.mastered / totalWords;
  const problemRatio =
    (masteryDistribution.new + masteryDistribution.learning) / totalWords;

  // Determine level
  let level: "beginner" | "intermediate" | "advanced" = "beginner";
  if (userLevel >= 10 && masteredRatio > 0.5 && avgCorrectRate > 0.8) {
    level = "advanced";
  } else if (userLevel >= 5 && masteredRatio > 0.2 && avgCorrectRate > 0.6) {
    level = "intermediate";
  }

  // Determine complexity (1-3)
  let exerciseComplexity = 1;
  if (level === "advanced") {
    exerciseComplexity = 3;
  } else if (level === "intermediate") {
    exerciseComplexity = 2;
  }

  return {
    level,
    focusOnProblemWords: problemRatio > 0.3,
    includeReviewWords: masteryDistribution.reviewing > 0,
    exerciseComplexity,
  };
};

export const selectWordsForPractice = (
  lessonWords: string[],
  wordMasteries: WordMastery[],
  count: number = 6
): { word: string; priority: "review" | "problem" | "new" | "normal" }[] => {
  const now = new Date();
  const wordPriorities: {
    word: string;
    priority: "review" | "problem" | "new" | "normal";
    score: number;
  }[] = [];

  for (const word of lessonWords) {
    const mastery = wordMasteries.find(
      (wm) => wm.word.toLowerCase() === word.toLowerCase()
    );

    if (!mastery) {
      // New word - high priority
      wordPriorities.push({ word, priority: "new", score: 80 });
    } else if (new Date(mastery.next_review_at) <= now) {
      // Due for review - highest priority
      wordPriorities.push({ word, priority: "review", score: 100 });
    } else if (
      mastery.mastery_level === "learning" ||
      mastery.incorrect_count > mastery.correct_count
    ) {
      // Problem word - high priority
      wordPriorities.push({ word, priority: "problem", score: 90 });
    } else {
      // Normal word
      const daysSinceReview = Math.floor(
        (now.getTime() - new Date(mastery.next_review_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      wordPriorities.push({
        word,
        priority: "normal",
        score: Math.max(0, 50 - daysSinceReview * 5),
      });
    }
  }

  // Sort by score and take top N
  return wordPriorities
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ word, priority }) => ({ word, priority }));
};

export const getDifficultyHint = (
  profile: DifficultyProfile
): string => {
  const hints: string[] = [];

  if (profile.level === "beginner") {
    hints.push("DIFFICULTY: Easy - simpler vocabulary and shorter sentences");
  } else if (profile.level === "intermediate") {
    hints.push("DIFFICULTY: Medium - include some phrasal verbs and idioms");
  } else {
    hints.push("DIFFICULTY: Hard - complex sentences, idioms, slang");
  }

  if (profile.focusOnProblemWords) {
    hints.push("FOCUS: Repeat problem words more frequently");
  }

  if (profile.exerciseComplexity >= 2) {
    hints.push("COMPLEXITY: Include fill-in-the-blank and context clues");
  }

  return hints.join("\n");
};

export const adjustExerciseCount = (
  baseCount: number,
  profile: DifficultyProfile,
  reviewWordsCount: number
): number => {
  let count = baseCount;

  // Add more exercises if there are many words to review
  if (reviewWordsCount > 3) {
    count += 2;
  }

  // Advanced users can handle more
  if (profile.level === "advanced") {
    count += 1;
  }

  return Math.min(count, 10); // Cap at 10
};
