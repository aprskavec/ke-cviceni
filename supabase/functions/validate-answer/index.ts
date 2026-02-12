import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  userAnswer: string;
  correctAnswer: string;
  exerciseType: string;
  context?: string; // Optional context like the question
  lessonKind?: string; // Type of lesson (e.g., "idioms", "grammar", "vocabulary")
}

interface ValidationResponse {
  isCorrect: boolean;
  confidence: "high" | "medium" | "low";
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswer, correctAnswer, exerciseType, context, lessonKind } = await req.json() as ValidationRequest;
    
    // Quick exact match check first (fast path)
    const normalizedUser = normalizeBasic(userAnswer);
    const normalizedCorrect = normalizeBasic(correctAnswer);
    
    if (normalizedUser === normalizedCorrect) {
      return new Response(JSON.stringify({ 
        isCorrect: true, 
        confidence: "high",
        reason: "Exact match"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // If very short answers (1-2 words), be more strict
    const userWords = normalizedUser.split(" ").filter(w => w.length > 0);
    const correctWords = normalizedCorrect.split(" ").filter(w => w.length > 0);
    
    if (userWords.length <= 2 && correctWords.length <= 2) {
      // For short answers, check with basic normalization + typo tolerance
      const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
      if (similarity >= 0.85) {
        return new Response(JSON.stringify({ 
          isCorrect: true, 
          confidence: "high",
          reason: "Close match with minor differences"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to basic matching if no API key
      console.warn("LOVABLE_API_KEY not configured, using basic validation");
      return new Response(JSON.stringify(basicValidation(normalizedUser, normalizedCorrect)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this is an idiom lesson - require stricter validation
    const isIdiomLesson = lessonKind?.toLowerCase() === "idioms";
    
    // Build idiom-specific rules
    const idiomRules = isIdiomLesson ? `
SPECIÁLNÍ PRAVIDLA PRO IDIOMY (KRITICKÉ - TOTO JE IDIOM!):
Toto cvičení testuje znalost KONKRÉTNÍHO IDIOMU. Student se musí naučit přesnou frázi!

PŘÍSNĚJŠÍ HODNOCENÍ:
- "go bananas" ≠ "get crazy" nebo "become crazy" - musí být přesný idiom!
- "piece of cake" ≠ "very easy" - musí být idiom!
- "spill the beans" ≠ "tell the secret" - musí být idiom!
- "break a leg" ≠ "good luck" - musí být idiom!
- "raining cats and dogs" ≠ "raining heavily" - musí být idiom!

U idiomů NEPŘIJÍMEJ:
- Parafráze nebo vysvětlení významu místo idiomu
- Synonyma která nejsou součástí idiomu
- Překlad významu místo přesné fráze

U idiomů PŘIJMI:
- Drobné gramatické úpravy (they will/they'll, is going to/will)
- Malá písmena/velká písmena
- Chybějící interpunkce
- Drobné překlepy (1-2 písmena) v běžných slovech

KLÍČOVÉ: Cílem je naučit se PŘESNÝ IDIOM, ne jeho význam!
` : "";

    // Use AI for semantic comparison
    const systemPrompt = `Jsi přísný ale spravedlivý učitel angličtiny. Tvým úkolem je posoudit, zda je odpověď studenta správná.
${idiomRules}
PRAVIDLA PRO HODNOCENÍ:
1. SPRÁVNĚ uznej pokud:
   - Odpověď má STEJNÝ VÝZNAM jako očekávaná odpověď${isIdiomLesson ? " (u idiomů musí být přesná fráze!)" : ""}
   - Použil synonyma (např. "phone" vs "call", "kid" vs "child")${isIdiomLesson ? " - NEPLATÍ pro klíčová slova idiomu!" : ""}
   - Změnil slovosled ale význam zůstal
   - Použil britskou nebo americkou angličtinu (colour/color)
   - Malé překlepy u BĚŽNÝCH slov (1-2 písmena, např. "becuase" → "because")
   - Chybí/přidaná interpunkce nebo velká písmena
   - Použil zkratky (I'm = I am, don't = do not)

2. ŠPATNĚ uznej pokud:
   - Odpověď má JINÝ VÝZNAM
   - Chybí důležitá slova která mění smysl
   - Je to úplně jiná věta
   - Gramatická chyba která mění čas nebo osobu
   - KLÍČOVÉ slovo je úplně špatně (např. "iw" místo "IQ", "cat" místo "car")
   - Překlep vytváří jiné existující slovo (např. "form" místo "from")${isIdiomLesson ? "\n   - Použil parafrázi nebo vysvětlení místo přesného idiomu" : ""}

DŮLEŽITÉ:
- Překlepy u KLÍČOVÝCH slov (zkratky, jména, technické termíny) = ŠPATNĚ
- "IQ" je zkratka a musí být napsána správně - "iw", "iq", "Iq" nebo jakákoliv jiná varianta = ŠPATNĚ
${isIdiomLesson ? "- U IDIOMŮ: přesná fráze je povinná, parafráze = ŠPATNĚ" : ""}

ODPOVĚZ POUZE JSON objektem:
{
  "isCorrect": true/false,
  "confidence": "high"/"medium"/"low",
  "reason": "Krátké vysvětlení v češtině"
}`;

    const userPrompt = `Typ cvičení: ${exerciseType}${isIdiomLesson ? " (IDIOM - vyžaduje přesnou frázi!)" : ""}
${context ? `Kontext/Otázka: ${context}\n` : ""}
Očekávaná odpověď: "${correctAnswer}"
Odpověď studenta: "${userAnswer}"

Je odpověď studenta správná?`;

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
        temperature: 0.1, // Low temperature for consistent evaluation
      }),
    });

    if (!response.ok) {
      console.error("AI validation failed, using basic validation");
      return new Response(JSON.stringify(basicValidation(normalizedUser, normalizedCorrect)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as ValidationResponse;
        
        // Trust AI decision - don't override with similarity check
        // The AI is better at catching semantic errors like "iw" vs "IQ"
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
    }
    
    // Fallback to basic validation
    return new Response(JSON.stringify(basicValidation(normalizedUser, normalizedCorrect)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error validating answer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Basic text normalization
function normalizeBasic(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/\s+/g, " ")
    // Contractions
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
    .replace(/weren't/g, "were not")
    .replace(/let's/g, "let us")
    .replace(/that's/g, "that is")
    .replace(/what's/g, "what is")
    .replace(/there's/g, "there is")
    .replace(/here's/g, "here is")
    .replace(/who's/g, "who is")
    .replace(/i've/g, "i have")
    .replace(/you've/g, "you have")
    .replace(/we've/g, "we have")
    .replace(/they've/g, "they have")
    .replace(/i'd/g, "i would")
    .replace(/you'd/g, "you would")
    .replace(/he'd/g, "he would")
    .replace(/she'd/g, "she would")
    .replace(/we'd/g, "we would")
    .replace(/they'd/g, "they would")
    .replace(/i'll/g, "i will")
    .replace(/you'll/g, "you will")
    .replace(/he'll/g, "he will")
    .replace(/she'll/g, "she will")
    .replace(/we'll/g, "we will")
    .replace(/they'll/g, "they will");
}

// Basic validation without AI
function basicValidation(userAnswer: string, correctAnswer: string): ValidationResponse {
  // Calculate similarity
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  
  if (similarity >= 0.9) {
    return { isCorrect: true, confidence: "high", reason: "Velmi podobná odpověď" };
  }
  if (similarity >= 0.8) {
    return { isCorrect: true, confidence: "medium", reason: "Podobná odpověď s drobnými rozdíly" };
  }
  if (similarity >= 0.7) {
    return { isCorrect: true, confidence: "low", reason: "Uznáno, ale zkontroluj si správnou verzi" };
  }
  
  return { isCorrect: false, confidence: "high", reason: "Odpověď se liší od očekávané" };
}

// Levenshtein distance-based similarity
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
