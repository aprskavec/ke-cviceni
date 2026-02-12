import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonData {
  name: string;
  kind: string;
  summary?: {
    description: string;
    key_phrases: { text_content: string; text_content_translation: string }[];
    keywords: { text_content: string }[];
  };
  interactions?: {
    interactions: {
      timestamp: number;
      type: string;
      form: {
        question: string;
        answers: { text: string; correct: boolean; explanation: string | null }[];
      };
    }[];
  };
}

interface WordPriority {
  word: string;
  priority: "review" | "problem" | "new" | "normal";
}

interface DifficultyProfile {
  level: "beginner" | "intermediate" | "advanced";
  exerciseComplexity: number;
  focusOnProblemWords: boolean;
}

// Lesson type detection
type LessonCategory = "grammar" | "vocabulary" | "conversation" | "mixed";

const GRAMMAR_KINDS = ["grammar", "tenses", "verb-forms", "sentence-structure"];
const VOCABULARY_KINDS = ["vocabulary", "slang", "phrases", "idioms", "words"];
const CONVERSATION_KINDS = ["conversation", "speaking", "dialogue"];

function detectLessonCategory(lesson: LessonData): LessonCategory {
  const kind = lesson.kind.toLowerCase();
  const name = lesson.name.toLowerCase();
  
  // Check by kind first
  if (GRAMMAR_KINDS.some(g => kind.includes(g))) return "grammar";
  if (VOCABULARY_KINDS.some(v => kind.includes(v))) return "vocabulary";
  if (CONVERSATION_KINDS.some(c => kind.includes(c))) return "conversation";
  
  // Check by lesson name for grammar patterns
  const grammarPatterns = [
    "present", "past", "future", "continuous", "perfect", "tense",
    "conditional", "passive", "modal", "verb", "gerund", "infinitive",
    "question", "negative", "clause", "pronoun", "article", "preposition"
  ];
  
  if (grammarPatterns.some(pattern => name.includes(pattern))) {
    return "grammar";
  }
  
  // Default to mixed
  return "mixed";
}

// Get appropriate exercise types based on lesson category
function getExerciseTypesForCategory(category: LessonCategory, includeListening: boolean): string[] {
  const baseTypes: Record<LessonCategory, string[]> = {
    grammar: ["multiple-choice", "translate-typing", "word-bubbles"],
    vocabulary: ["matching-pairs", "translate-typing", "word-bubbles", "multiple-choice"],
    conversation: ["translate-typing", "word-bubbles", "multiple-choice"],
    mixed: ["word-bubbles", "translate-typing", "multiple-choice", "matching-pairs"],
  };
  
  const types = [...baseTypes[category]];
  if (includeListening) {
    types.push("listening");
  }
  
  return types;
}

function getExerciseInstructions(category: LessonCategory, exerciseTypes: string[]): string {
  const typeDescriptions: Record<string, string> = {
    "word-bubbles": `- "word-bubbles": Student skládá anglickou větu z přeházených slov. Poskytni českou větu jako otázku, anglický překlad rozděl na jednotlivá slova v poli "words". Přidej 2-3 extra slova jako distraktory.`,
    
    "translate-typing": `- "translate-typing": Student píše překlad. Poskytni českou větu, student musí napsat anglicky.`,
    
    "matching-pairs": `- "matching-pairs": Student páruje 4 slovíčka s jejich překlady. Poskytni pole "pairs" s objekty {english, czech}.
  ⚠️ DŮLEŽITÉ PRO MATCHING-PAIRS: 
  - NIKDY nepoužívej synonyma! Každé slovíčko musí mít JEDNOZNAČNÝ překlad.
  - ŠPATNĚ: "at the moment" = "právě teď", "right now" = "v tuto chvíli" (jsou to synonyma!)
  - SPRÁVNĚ: Vyber 4 RŮZNÁ slovíčka s jasně odlišnými významy (např. "happy" = "šťastný", "sad" = "smutný")`,
    
    "multiple-choice": `- "multiple-choice": Vyber správnou odpověď z 4 možností. Pro GRAMATIKU: doplň správný tvar (např. "I ___ eating" → am/is/are). Pro SLOVÍČKA: vyber správný překlad.`,
    
    "listening": `- "listening": Student poslouchá anglickou větu a musí ji napsat. Poskytni "audioText" (co uslyší) a "correctAnswer" (co má napsat).`,
  };
  
  let instructions = "TYPY CVIČENÍ (používej POUZE tyto typy):\n";
  for (const type of exerciseTypes) {
    if (typeDescriptions[type]) {
      instructions += typeDescriptions[type] + "\n";
    }
  }
  
  // Add category-specific guidance
  if (category === "grammar") {
    instructions += `\n⚠️ GRAMATICKÁ LEKCE - SPECIÁLNÍ PRAVIDLA:
- NEPOUŽÍVEJ matching-pairs! Pro gramatiku není vhodný.
- Zaměř se na správné tvary sloves, časů, pořadí slov.
- U multiple-choice: doplňování správného tvaru do věty (am/is/are, do/does, was/were, atd.)
- U translate-typing: překlad vět s důrazem na správnou gramatickou strukturu.
- U word-bubbles: sestavení věty s důrazem na správný slovosled.`;
  } else if (category === "vocabulary") {
    instructions += `\n⚠️ SLOVÍČKOVÁ LEKCE - SPECIÁLNÍ PRAVIDLA:
- Matching-pairs je IDEÁLNÍ - používej ho!
- Zaměř se na překlady jednotlivých slov a frází.
- U multiple-choice: vyber správný překlad slova.`;
  }
  
  return instructions;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      lesson, 
      exerciseCount = 6,
      wordPriorities = [],
      difficultyProfile = { level: "beginner", exerciseComplexity: 1, focusOnProblemWords: false },
      includeListening = true
    } = await req.json() as { 
      lesson: LessonData; 
      exerciseCount?: number;
      wordPriorities?: WordPriority[];
      difficultyProfile?: DifficultyProfile;
      includeListening?: boolean;
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Detect lesson category and get appropriate exercise types
    const lessonCategory = detectLessonCategory(lesson);
    const exerciseTypes = getExerciseTypesForCategory(lessonCategory, includeListening);
    const exerciseInstructions = getExerciseInstructions(lessonCategory, exerciseTypes);
    
    console.log(`Lesson "${lesson.name}" detected as: ${lessonCategory}, using types: ${exerciseTypes.join(", ")}`);

    // Build context from lesson data
    const keyPhrases = lesson.summary?.key_phrases?.map(p => 
      `"${p.text_content}" = "${p.text_content_translation}"`
    ).join("\n") || "";
    
    const keywords = lesson.summary?.keywords?.map(k => k.text_content).join(", ") || "";
    
    const existingQuizzes = lesson.interactions?.interactions?.map(q => 
      `Q: ${q.form.question}\nA: ${q.form.answers.map(a => `${a.text} (${a.correct ? 'correct' : 'wrong'})`).join(', ')}`
    ).join("\n\n") || "";

    // Build priority words context
    const priorityContext = wordPriorities.length > 0 
      ? `\nPRIORITY WORDS (focus more on these):\n${wordPriorities.map(w => `- "${w.word}" (${w.priority})`).join("\n")}`
      : "";

    // Difficulty adjustments
    const difficultyInstructions = getDifficultyInstructions(difficultyProfile);

    const systemPrompt = `Jsi expert na výuku angličtiny a vytváříš interaktivní cvičení ve stylu Duolingo pro česky mluvící studenty.
Tvým úkolem je generovat zábavná a efektivní cvičení.

DETEKOVANÁ KATEGORIE LEKCE: ${lessonCategory.toUpperCase()}

PRAVIDLA:
1. Všechna cvičení musí být založena na obsahu lekce
2. Používej RŮZNÉ typy cvičení - střídej je rovnoměrně!
3. Otázky pište v češtině, odpovědi v angličtině (kromě listening)
4. ${difficultyInstructions}
5. U word-bubbles musí být správná odpověď sestavitelná z poskytnutých slov

${exerciseInstructions}

⚠️⚠️⚠️ KRITICKÁ PRAVIDLA PRO SÉMANTICKOU PŘESNOST ⚠️⚠️⚠️

1. "JAK SE MÁŠ/MÁTE?" (well-being) vs "JAKÝ JSI?" (self-description):
   - "Jak se máš?" / "Mám se skvěle" → "I'm DOING great" / "I'm FEELING awesome" (používej DOING/FEELING!)
   - "Jsem skvělý" → "I'm awesome" / "I'm great" (bez DOING - popis sebe sama)
   - ŠPATNĚ: "Jak se máš?" → "I'm awesome" (to znamená "jsem skvělý", ne "mám se skvěle"!)
   - SPRÁVNĚ: "Jak se máš?" → "I'm doing great" / "I'm feeling awesome"

2. PŘECHODNOST SLOVES (transitive vs intransitive):
   - "Večeřím" → "I'm having dinner" / "I'm eating dinner" (NE jen "I'm dinner")
   - "Snídám" → "I'm having breakfast" (NE "I'm breakfast")

3. PŘEKLADY MUSÍ BÝT PŘESNÉ:
   - Kontroluj, že anglická odpověď skutečně znamená to samé co česká otázka
   - "best" (nejlepší) ≠ "better" (lepší)
   - "make" (vytvořit/udělat) ≠ "do" (dělat/konat)
   - "say" (říct) ≠ "tell" (vyprávět/sdělit někomu)

4. POZOR NA FRÁZE S JINÝMI VÝZNAMY:
   - "Best regards" = "S pozdravem" (zakončení emailu), NE "nejlepší pozdravy"
   - "How do you do?" = formální pozdrav, NE "Jak to děláš?"
   - "What's up?" = "Co je?" / "Jak je?", NE "Co je nahoře?"

5. ČLENY A ZÁJMENA:
   - "Jsem student" → "I'm A student" (nezapomeň na člen!)
   - "Mám rád hudbu" → "I like music" (bez členu - obecně)

DŮLEŽITÉ - EXPLANATION:
Každé cvičení MUSÍ obsahovat pole "explanation" s krátkým vysvětlením PROČ je odpověď správná.
Vysvětlení by mělo být:
- Krátké (1-2 věty)
- Poučné - vysvětlit gramatické pravidlo, nebo proč se to říká takhle
- V češtině
Příklady:
- "Používáme 'are' protože 'you' vyžaduje množné číslo slovesa být."
- "Present continuous se tvoří pomocí 'am/is/are' + sloveso s -ing."
- "'Make' a 'do' se často pletou - 'make breakfast' je správně, protože jídlo vytváříme."
- "'I'm doing great' používáme pro pocit/náladu, zatímco 'I'm great' popisuje jaký jsem."

FORMÁT ODPOVĚDI (JSON array):
[
  {
    "type": "word-bubbles",
    "question": "Jak se máš?",
    "correctAnswer": "How are you doing",
    "words": ["How", "are", "you", "doing", "is", "am"],
    "explanation": "Na otázku 'jak se máš' odpovídáme 'I'm doing...' nebo 'I'm feeling...', ne jen 'I'm [přídavné jméno]'."
  },
  {
    "type": "translate-typing", 
    "question": "Jsem studentka.",
    "correctAnswer": "I am a student",
    "hint": "Nezapomeň na člen",
    "explanation": "V angličtině používáme neurčitý člen 'a' před povoláním."
  },
  {
    "type": "multiple-choice",
    "question": "I ___ eating dinner right now.",
    "correctAnswer": "am",
    "options": ["am", "is", "are", "be"],
    "hint": "Sloveso být v 1. osobě",
    "explanation": "S 'I' vždy používáme 'am' v přítomném průběhovém čase."
  },
  {
    "type": "multiple-choice",
    "question": "Jak byste řekli, že se máte naprosto skvěle?",
    "correctAnswer": "I am doing awesome",
    "options": ["I am doing awesome", "I am awesome", "I am do awesome", "I doing awesome"],
    "hint": "Slovo začíná na 'a'",
    "explanation": "'I'm doing awesome' = mám se skvěle (pocit). 'I'm awesome' = jsem skvělý (popis sebe)."
  }${lessonCategory === "vocabulary" ? `,
  {
    "type": "matching-pairs",
    "pairs": [
      {"english": "hello", "czech": "ahoj"},
      {"english": "goodbye", "czech": "sbohem"},
      {"english": "please", "czech": "prosím"},
      {"english": "thanks", "czech": "díky"}
    ],
    "explanation": "Základní zdvořilostní fráze jsou klíčem k dobré konverzaci."
  }` : ''}${includeListening ? `,
  {
    "type": "listening",
    "audioText": "How are you doing today?",
    "correctAnswer": "How are you doing today",
    "hint": "Pozor na 'doing'",
    "explanation": "'How are you doing?' je neformální verze 'How are you?' s důrazem na aktuální pocit."
  }` : ''}
]

DŮLEŽITÉ: 
- Vždy vytvoř MIX typů cvičení! Nikdy neopakuj stejný typ 2x za sebou.
- Používej POUZE typy cvičení uvedené výše pro tuto kategorii lekce.
- PŘED ODESLÁNÍM: Zkontroluj, že anglická odpověď skutečně znamená to samé co česká otázka!
- Vrať POUZE validní JSON array bez žádného dalšího textu.`;

function getDifficultyInstructions(profile: DifficultyProfile): string {
  switch (profile.level) {
    case "advanced":
      return "Difficulty by měla být B1-B2 - složitější věty, idiomy, frázová slovesa";
    case "intermediate":
      return "Difficulty by měla být A2-B1 - středně složité věty";
    default:
      return "Difficulty by měla být přiměřená úrovni A1-A2 - jednoduché věty";
  }
}

    const userPrompt = `Vytvoř ${exerciseCount} cvičení pro lekci "${lesson.name}" (kategorie: ${lessonCategory}, druh: ${lesson.kind}).

POPIS LEKCE:
${lesson.summary?.description || "Bez popisu"}

KLÍČOVÉ FRÁZE (použij pro word-bubbles a translate-typing):
${keyPhrases || "Žádné"}

KLÍČOVÁ SLOVÍČKA${lessonCategory === "vocabulary" ? " (použij pro matching-pairs)" : ""}:
${keywords || "Žádná"}
${priorityContext}

${existingQuizzes ? `EXISTUJÍCÍ KVÍZY (inspiruj se obsahem):
${existingQuizzes}` : ""}

Vytvoř ${exerciseCount} různorodých cvičení. POVINNĚ použij minimálně 3 různé typy z povolených typů pro tuto kategorii (${exerciseTypes.join(", ")})!${includeListening ? ' Zahrň alespoň 1 listening cvičení.' : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let exercises;
    try {
      // Try to extract JSON from the response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      exercises = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse exercises from AI response");
    }

    // Filter out matching-pairs for grammar lessons (safety check)
    if (lessonCategory === "grammar") {
      exercises = exercises.filter((ex: any) => ex.type !== "matching-pairs");
    }

    // Shuffle options for each exercise
    exercises = exercises.map((ex: any) => ({
      ...ex,
      options: ex.options ? shuffleArray([...ex.options]) : undefined,
    }));

    return new Response(JSON.stringify({ exercises, lessonCategory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating exercises:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
