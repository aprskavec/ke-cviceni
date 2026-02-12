import { supabase } from "@/integrations/supabase/client";

interface ValidationResult {
  isCorrect: boolean;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

/**
 * Hook for AI-powered answer validation
 * Validates user answers with semantic understanding, supporting:
 * - Synonyms (phone/call, kid/child)
 * - Word order variations
 * - British/American spelling
 * - Minor typos
 * - Contractions
 */
export const useAnswerValidation = () => {
  /**
   * Validate an answer using AI semantic comparison
   * Falls back to basic string matching if AI is unavailable
   */
  const validateAnswer = async (
    userAnswer: string,
    correctAnswer: string,
    exerciseType: string,
    context?: string,
    lessonKind?: string
  ): Promise<ValidationResult> => {
    // For idioms, skip local word-order validation - we need exact idiom phrases
    const isIdiomLesson = lessonKind?.toLowerCase() === "idioms";
    
    // Quick local check first for exact matches
    const localResult = quickLocalValidation(userAnswer, correctAnswer, isIdiomLesson);
    if (localResult.isCorrect && localResult.confidence === "high") {
      return localResult;
    }

    try {
      const { data, error } = await supabase.functions.invoke("validate-answer", {
        body: {
          userAnswer,
          correctAnswer,
          exerciseType,
          context,
          lessonKind,
        },
      });

      if (error) {
        console.error("Validation API error:", error);
        return localResult; // Use local result as fallback
      }

      return data as ValidationResult;
    } catch (err) {
      console.error("Failed to call validation API:", err);
      return localResult; // Use local result as fallback
    }
  };

  return { validateAnswer };
};

/**
 * Quick local validation for common cases
 * This avoids API calls for obvious matches/mismatches
 */
function quickLocalValidation(userAnswer: string, correctAnswer: string, isIdiomLesson: boolean = false): ValidationResult {
  const normalized = (text: string) => 
    text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:'"]/g, "")
      .replace(/\s+/g, " ")
      // Common contractions
      .replace(/i'm/g, "i am")
      .replace(/you're/g, "you are")
      .replace(/he's/g, "he is")
      .replace(/she's/g, "she is")
      .replace(/it's/g, "it is")
      .replace(/we're/g, "we are")
      .replace(/they're/g, "they are")
      .replace(/don't/g, "do not")
      .replace(/doesn't/g, "does not")
      .replace(/didn't/g, "did not")
      .replace(/won't/g, "will not")
      .replace(/can't/g, "cannot")
      .replace(/couldn't/g, "could not")
      .replace(/wouldn't/g, "would not")
      .replace(/shouldn't/g, "should not")
      .replace(/haven't/g, "have not")
      .replace(/hasn't/g, "has not")
      .replace(/hadn't/g, "had not")
      .replace(/isn't/g, "is not")
      .replace(/aren't/g, "are not")
      .replace(/wasn't/g, "was not")
      .replace(/weren't/g, "were not");

  const normalizedUser = normalized(userAnswer);
  const normalizedCorrect = normalized(correctAnswer);

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, confidence: "high" };
  }

  // British/American normalization
  const americanized = (text: string) => 
    text
      .replace(/colour/g, "color")
      .replace(/favourite/g, "favorite")
      .replace(/travelling/g, "traveling")
      .replace(/centre/g, "center")
      .replace(/theatre/g, "theater")
      .replace(/realise/g, "realize")
      .replace(/organise/g, "organize")
      .replace(/grey/g, "gray")
      .replace(/programme/g, "program")
      .replace(/behaviour/g, "behavior")
      .replace(/neighbour/g, "neighbor");

  if (americanized(normalizedUser) === americanized(normalizedCorrect)) {
    return { isCorrect: true, confidence: "high" };
  }

  // Word order normalization (sort words and compare)
  // SKIP for idioms - they need exact phrase!
  if (!isIdiomLesson) {
    const sortedUser = normalizedUser.split(" ").sort().join(" ");
    const sortedCorrect = normalizedCorrect.split(" ").sort().join(" ");
    
    if (sortedUser === sortedCorrect) {
      return { isCorrect: true, confidence: "high", reason: "Správně, jen jiný slovosled" };
    }
  }

  // Calculate similarity for typo tolerance
  const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
  
  if (similarity >= 0.92) {
    return { isCorrect: true, confidence: "high", reason: "Téměř správně" };
  }
  
  if (similarity >= 0.85) {
    return { isCorrect: true, confidence: "medium", reason: "Správně s drobnými chybami" };
  }

  // Not obviously correct - needs AI validation
  return { isCorrect: false, confidence: "low" };
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;

  if (longerLength === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export default useAnswerValidation;
