import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phonetic map: English words → Czech phonetic approximation
// This helps the TTS pronounce English words correctly when embedded in Czech text
const ENGLISH_TO_PHONETIC: Record<string, string> = {
  // Grammar terms
  "to be": "tú bí",
  "to do": "tú dú",
  "to have": "tú hev",
  "to go": "tú gou",
  // Common verbs and forms
  "are": "ár",
  "is": "iz",
  "am": "em",
  "was": "voz",
  "were": "vér",
  "been": "bín",
  "being": "bíing",
  "do": "dú",
  "does": "daz",
  "did": "did",
  "have": "hev",
  "has": "hez",
  "had": "hed",
  // Pronouns
  "I": "áj",
  "you": "jú",
  "he": "hí",
  "she": "ší",
  "it": "it",
  "we": "ví",
  "they": "dej",
  // Common words in explanations
  "hobbies": "hobíz",
  "hobby": "hobí",
  "present": "preznt",
  "past": "pást",
  "future": "fjúčr",
  "continuous": "kontinuos",
  "perfect": "prfekt",
  "simple": "simpl",
  "tense": "tens",
  "verb": "vérb",
  "noun": "náun",
  "adjective": "edžektiv",
  "adverb": "edvérb",
  // Greetings
  "hello": "helou",
  "hi": "háj",
  "bye": "báj",
  "goodbye": "gudbáj",
};

// Clean up text for TTS and apply phonetic substitutions for English words
function cleanTextForTTS(text: string): string {
  let cleaned = text;
  
  // Remove quotes - they confuse the TTS and cause weird pauses
  cleaned = cleaned.replace(/'([^']+)'/g, '$1');
  cleaned = cleaned.replace(/"([^"]+)"/g, '$1');
  cleaned = cleaned.replace(/„([^"]+)"/g, '$1');
  cleaned = cleaned.replace(/«([^»]+)»/g, '$1');
  
  // Apply phonetic substitutions for English words embedded in Czech text
  // Sort by length (longest first) to avoid partial replacements
  const sortedPhrases = Object.keys(ENGLISH_TO_PHONETIC).sort((a, b) => b.length - a.length);
  
  for (const phrase of sortedPhrases) {
    const phonetic = ENGLISH_TO_PHONETIC[phrase];
    // Match whole words only, case insensitive
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    cleaned = cleaned.replace(regex, phonetic);
  }
  
  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId = "SLJNJvVRLEY4GJ33tRgI", speed = 1.0, pureEnglish = false } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Clean text (remove quotes) but don't add any language markers
    // The multilingual model handles code-switching automatically
    const cleanedText = pureEnglish ? text : cleanTextForTTS(text);

    console.log(`Generating TTS for: "${cleanedText.substring(0, 80)}..." with voice ${voiceId}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: "eleven_multilingual_v2",
          // No language_code - let the model auto-detect and code-switch between Czech and English
          voice_settings: {
            stability: 0.3,        // Lower = more expressive/variable
            similarity_boost: 0.8,
            style: 0.7,            // Higher = more stylized/emotional
            use_speaker_boost: true,
            speed,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
