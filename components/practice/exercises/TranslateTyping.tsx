import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CheckButton from "../CheckButton";

interface TranslateTypingProps {
  sentence: string;
  correctAnswer: string;
  hint?: string;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  disabled: boolean;
  lessonKind?: string;
}

const TranslateTyping = ({ sentence, correctAnswer, hint, onAnswer, disabled, lessonKind }: TranslateTypingProps) => {
  const [userInput, setUserInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount for mobile keyboard
  useEffect(() => {
    if (!disabled) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [disabled]);

  // Number word mappings for normalization
  const numberWords: Record<string, string> = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "hundred": "100"
  };

  // Normalize text for comparison - handles contractions, numbers, punctuation
  const normalizeAnswer = (text: string): string => {
    let normalized = text.toLowerCase().trim();
    
    // Remove punctuation
    normalized = normalized.replace(/[.,!?'"]/g, "");
    
    // Normalize contractions (both directions)
    const contractions: Record<string, string> = {
      "i'm": "i am", "im": "i am", "i m": "i am",
      "you're": "you are", "youre": "you are",
      "he's": "he is", "hes": "he is",
      "she's": "she is", "shes": "she is",
      "it's": "it is", "its": "it is",
      "we're": "we are", "were": "we are",
      "they're": "they are", "theyre": "they are",
      "isn't": "is not", "isnt": "is not",
      "aren't": "are not", "arent": "are not",
      "wasn't": "was not", "wasnt": "was not",
      "weren't": "were not", "werent": "were not",
      "don't": "do not", "dont": "do not",
      "doesn't": "does not", "doesnt": "does not",
      "didn't": "did not", "didnt": "did not",
      "won't": "will not", "wont": "will not",
      "wouldn't": "would not", "wouldnt": "would not",
      "can't": "cannot", "cant": "cannot",
      "couldn't": "could not", "couldnt": "could not",
      "shouldn't": "should not", "shouldnt": "should not",
      "haven't": "have not", "havent": "have not",
      "hasn't": "has not", "hasnt": "has not",
      "let's": "let us", "lets": "let us",
      "that's": "that is", "thats": "that is",
      "there's": "there is", "theres": "there is",
      "what's": "what is", "whats": "what is",
      "who's": "who is", "whos": "who is",
    };
    
    // Replace contractions
    for (const [contraction, expanded] of Object.entries(contractions)) {
      normalized = normalized.replace(new RegExp(`\\b${contraction}\\b`, 'g'), expanded);
    }
    
    // Handle compound numbers like "twenty four" or "twenty-four" -> "24"
    // First handle hyphenated versions
    normalized = normalized.replace(/twenty-one/g, "21");
    normalized = normalized.replace(/twenty-two/g, "22");
    normalized = normalized.replace(/twenty-three/g, "23");
    normalized = normalized.replace(/twenty-four/g, "24");
    normalized = normalized.replace(/twenty-five/g, "25");
    normalized = normalized.replace(/twenty-six/g, "26");
    normalized = normalized.replace(/twenty-seven/g, "27");
    normalized = normalized.replace(/twenty-eight/g, "28");
    normalized = normalized.replace(/twenty-nine/g, "29");
    normalized = normalized.replace(/thirty-one/g, "31");
    normalized = normalized.replace(/thirty-two/g, "32");
    // ... and space versions
    normalized = normalized.replace(/twenty one/g, "21");
    normalized = normalized.replace(/twenty two/g, "22");
    normalized = normalized.replace(/twenty three/g, "23");
    normalized = normalized.replace(/twenty four/g, "24");
    normalized = normalized.replace(/twenty five/g, "25");
    normalized = normalized.replace(/twenty six/g, "26");
    normalized = normalized.replace(/twenty seven/g, "27");
    normalized = normalized.replace(/twenty eight/g, "28");
    normalized = normalized.replace(/twenty nine/g, "29");
    normalized = normalized.replace(/thirty one/g, "31");
    normalized = normalized.replace(/thirty two/g, "32");
    
    // Replace single number words
    for (const [word, num] of Object.entries(numberWords)) {
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), num);
    }
    
    // Normalize multiple spaces to single space
    normalized = normalized.replace(/\s+/g, " ");
    
    return normalized;
  };

  // Create gender-neutral version for comparison
  // Czech doesn't distinguish gender in 3rd person singular verbs
  const makeGenderNeutral = (text: string): string => {
    return text
      .replace(/\bshe is\b/g, "PERSON is")
      .replace(/\bhe is\b/g, "PERSON is")
      .replace(/\bshe was\b/g, "PERSON was")
      .replace(/\bhe was\b/g, "PERSON was")
      .replace(/\bshe has\b/g, "PERSON has")
      .replace(/\bhe has\b/g, "PERSON has")
      .replace(/\bshe does\b/g, "PERSON does")
      .replace(/\bhe does\b/g, "PERSON does")
      .replace(/\bshe will\b/g, "PERSON will")
      .replace(/\bhe will\b/g, "PERSON will")
      .replace(/\bshe would\b/g, "PERSON would")
      .replace(/\bhe would\b/g, "PERSON would")
      .replace(/\bshe can\b/g, "PERSON can")
      .replace(/\bhe can\b/g, "PERSON can")
      .replace(/\bshe could\b/g, "PERSON could")
      .replace(/\bhe could\b/g, "PERSON could")
      .replace(/\bshe should\b/g, "PERSON should")
      .replace(/\bhe should\b/g, "PERSON should")
      .replace(/\bshe must\b/g, "PERSON must")
      .replace(/\bhe must\b/g, "PERSON must")
      .replace(/\bshe might\b/g, "PERSON might")
      .replace(/\bhe might\b/g, "PERSON might")
      .replace(/\bher\b/g, "THEIR")
      .replace(/\bhis\b/g, "THEIR")
      .replace(/\bherself\b/g, "THEMSELF")
      .replace(/\bhimself\b/g, "THEMSELF");
  };

  // Normalize time expressions - move them to end for consistent comparison
  // "This week she is working" vs "She is working this week" should match
  const normalizeTimeExpressions = (text: string): string => {
    const timeExpressions = [
      "this week", "next week", "last week",
      "this month", "next month", "last month",
      "this year", "next year", "last year",
      "today", "tomorrow", "yesterday",
      "this morning", "this afternoon", "this evening", "tonight",
      "every day", "every week", "every month",
      "right now", "at the moment", "currently",
      "always", "never", "sometimes", "often", "usually",
      "now", "soon", "later"
    ];
    
    let result = text;
    const foundExpressions: string[] = [];
    
    // Find and remove time expressions from the beginning
    for (const expr of timeExpressions) {
      const startsWithRegex = new RegExp(`^${expr}\\s*,?\\s*`, 'i');
      if (startsWithRegex.test(result)) {
        foundExpressions.push(expr);
        result = result.replace(startsWithRegex, '');
      }
    }
    
    // Find and remove time expressions from the end
    for (const expr of timeExpressions) {
      const endsWithRegex = new RegExp(`\\s*,?\\s*${expr}$`, 'i');
      if (endsWithRegex.test(result)) {
        if (!foundExpressions.includes(expr)) {
          foundExpressions.push(expr);
        }
        result = result.replace(endsWithRegex, '');
      }
    }
    
    // Normalize the core sentence and append time expressions at the end
    result = result.trim();
    if (foundExpressions.length > 0) {
      result = result + " " + foundExpressions.sort().join(" ");
    }
    
    return result;
  };

  // Normalize adverb positions - "already", "just", "never" etc. can appear in different positions
  // "he had already fallen asleep" vs "he had fallen asleep already" should match
  const normalizeAdverbPosition = (text: string): string => {
    // Adverbs that can move around in a sentence
    const movableAdverbs = [
      "already", "just", "never", "ever", "always", "still", "yet",
      "also", "even", "only", "probably", "certainly", "definitely",
      "really", "actually", "finally", "suddenly", "quickly", "slowly"
    ];
    
    let result = text;
    const foundAdverbs: string[] = [];
    
    // Extract adverbs from the sentence
    for (const adverb of movableAdverbs) {
      const regex = new RegExp(`\\b${adverb}\\b`, 'gi');
      if (regex.test(result)) {
        foundAdverbs.push(adverb.toLowerCase());
        result = result.replace(regex, ' ');
      }
    }
    
    // Clean up multiple spaces
    result = result.replace(/\s+/g, ' ').trim();
    
    // Append sorted adverbs at end for consistent comparison
    if (foundAdverbs.length > 0) {
      result = result + " [" + foundAdverbs.sort().join(",") + "]";
    }
    
    return result;
  };

  // Normalize British vs American spelling - convert everything to American
  const normalizeBritishAmerican = (text: string): string => {
    const spellings: Record<string, string> = {
      // -our vs -or
      "colour": "color", "colours": "colors", "coloured": "colored", "colouring": "coloring",
      "favour": "favor", "favours": "favors", "favoured": "favored", "favourite": "favorite", "favourites": "favorites",
      "honour": "honor", "honours": "honors", "honoured": "honored", "honouring": "honoring",
      "labour": "labor", "labours": "labors", "laboured": "labored", "labouring": "laboring",
      "neighbour": "neighbor", "neighbours": "neighbors", "neighbourhood": "neighborhood",
      "behaviour": "behavior", "behaviours": "behaviors",
      "humour": "humor", "humours": "humors",
      "flavour": "flavor", "flavours": "flavors",
      "rumour": "rumor", "rumours": "rumors",
      "vapour": "vapor",
      "odour": "odor",
      // -ise vs -ize
      "realise": "realize", "realised": "realized", "realising": "realizing",
      "organise": "organize", "organised": "organized", "organising": "organizing",
      "recognise": "recognize", "recognised": "recognized", "recognising": "recognizing",
      "apologise": "apologize", "apologised": "apologized", "apologising": "apologizing",
      "analyse": "analyze", "analysed": "analyzed", "analysing": "analyzing",
      "criticise": "criticize", "criticised": "criticized", "criticising": "criticizing",
      "memorise": "memorize", "memorised": "memorized", "memorising": "memorizing",
      "specialise": "specialize", "specialised": "specialized", "specialising": "specializing",
      // -re vs -er
      "centre": "center", "centres": "centers",
      "theatre": "theater", "theatres": "theaters",
      "metre": "meter", "metres": "meters",
      "litre": "liter", "litres": "liters",
      "fibre": "fiber", "fibres": "fibers",
      // -ogue vs -og
      "catalogue": "catalog", "catalogues": "catalogs",
      "dialogue": "dialog", "dialogues": "dialogs",
      // Double vs single consonants
      "travelling": "traveling", "travelled": "traveled", "traveller": "traveler",
      "cancelled": "canceled", "cancelling": "canceling",
      "labelled": "labeled", "labelling": "labeling",
      "modelled": "modeled", "modelling": "modeling",
      "jewellery": "jewelry",
      "fulfil": "fulfill",
      // Other differences
      "grey": "gray",
      "licence": "license",
      "practise": "practice",
      "defence": "defense",
      "offence": "offense",
      "programme": "program", "programmes": "programs",
      "cheque": "check", "cheques": "checks",
      "tyre": "tire", "tyres": "tires",
      "aeroplane": "airplane", "aeroplanes": "airplanes",
      "aluminium": "aluminum",
      "mum": "mom",
      "flat": "apartment",
    };
    
    let result = text;
    for (const [british, american] of Object.entries(spellings)) {
      result = result.replace(new RegExp(`\\b${british}\\b`, 'gi'), american);
    }
    
    return result;
  };

  // Calculate similarity between two strings (Levenshtein-based)
  const calculateSimilarity = (a: string, b: string): number => {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= shorter.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= longer.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= shorter.length; i++) {
      for (let j = 1; j <= longer.length; j++) {
        if (shorter.charAt(i - 1) === longer.charAt(j - 1)) {
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
    
    const distance = matrix[shorter.length][longer.length];
    return (longerLength - distance) / longerLength;
  };

  // AI validation for uncertain cases
  const validateWithAI = useCallback(async (userAnswer: string, correct: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-answer", {
        body: {
          userAnswer,
          correctAnswer: correct,
          exerciseType: "translate-typing",
          context: sentence,
          lessonKind,
        },
      });

      if (error) {
        console.error("AI validation error:", error);
        return false;
      }

      return data?.isCorrect === true;
    } catch (err) {
      console.error("Failed to call AI validation:", err);
      return false;
    }
  }, [sentence, lessonKind]);

  const handleCheck = async () => {
    // Apply British/American normalization first to base text
    const normalizedInput = normalizeBritishAmerican(normalizeAnswer(userInput));
    const normalizedCorrect = normalizeBritishAmerican(normalizeAnswer(correctAnswer));
    
    // Exact match after normalization
    if (normalizedInput === normalizedCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // Time expression normalization (handles "This week I..." vs "I... this week")
    const timeNormalizedInput = normalizeTimeExpressions(normalizedInput);
    const timeNormalizedCorrect = normalizeTimeExpressions(normalizedCorrect);
    if (timeNormalizedInput === timeNormalizedCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // Adverb position normalization (handles "had already fallen" vs "had fallen already")
    const adverbNormalizedInput = normalizeAdverbPosition(normalizedInput);
    const adverbNormalizedCorrect = normalizeAdverbPosition(normalizedCorrect);
    if (adverbNormalizedInput === adverbNormalizedCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // Gender-neutral match (Czech doesn't specify gender in 3rd person)
    const genderNeutralInput = makeGenderNeutral(normalizedInput);
    const genderNeutralCorrect = makeGenderNeutral(normalizedCorrect);
    if (genderNeutralInput === genderNeutralCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // Combined: all normalizations together
    const fullyNormalizedInput = normalizeAdverbPosition(makeGenderNeutral(timeNormalizedInput));
    const fullyNormalizedCorrect = normalizeAdverbPosition(makeGenderNeutral(timeNormalizedCorrect));
    if (fullyNormalizedInput === fullyNormalizedCorrect) {
      onAnswer(true, userInput);
      return;
    }
    
    // High similarity match (90%+) to allow for minor typos
    const similarity = calculateSimilarity(normalizedInput, normalizedCorrect);
    if (similarity >= 0.9) {
      onAnswer(true, userInput);
      return;
    }
    
    // Also check fully normalized similarity
    const fullyNormalizedSimilarity = calculateSimilarity(fullyNormalizedInput, fullyNormalizedCorrect);
    if (fullyNormalizedSimilarity >= 0.9) {
      onAnswer(true, userInput);
      return;
    }
    
    // If similarity is between 70-90%, use AI validation (uncertain cases)
    if (similarity >= 0.7 || fullyNormalizedSimilarity >= 0.7) {
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userInput, correctAnswer);
        onAnswer(isCorrect, userInput);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    // Very low similarity - definitely wrong, but still check with AI if it's a reasonable length
    if (userInput.split(" ").length >= 3) {
      setIsValidating(true);
      try {
        const isCorrect = await validateWithAI(userInput, correctAnswer);
        onAnswer(isCorrect, userInput);
      } finally {
        setIsValidating(false);
      }
      return;
    }
    
    onAnswer(false, userInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && userInput.trim() && !disabled) {
      handleCheck();
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center animate-fade-in pb-24">
      {/* Source sentence with instruction tag */}
      <div className="text-center mb-8 px-4">
        <span className="inline-block text-xs font-medium text-muted-foreground/70 uppercase tracking-wider bg-muted/50 px-3 py-1 rounded-full mb-3">
          Přelož do angličtiny
        </span>
        <p className="text-xl text-foreground leading-relaxed font-medium">
          {sentence}
        </p>
        {hint && (
          <p className="text-sm text-muted-foreground mt-3 italic">
            💡 {hint}
          </p>
        )}
      </div>

      {/* Input field */}
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Napiš překlad..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="done"
          className={cn(
            "w-full p-4 rounded-2xl bg-card border-2 border-border text-foreground text-lg",
            "placeholder:text-muted-foreground resize-none min-h-[80px]",
            "focus:outline-none focus:border-primary transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          rows={2}
        />
      </div>

      {/* Check button - fixed at bottom */}
      <CheckButton
        onClick={handleCheck}
        show={!disabled && !!userInput.trim()}
      />
    </div>
  );
};

export default TranslateTyping;
