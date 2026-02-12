import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Kuba base image in Supabase storage
const KUBA_BASE_IMAGE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { word, regenerate = false, feedback = "", lessonName = "", lessonKind = "" } = await req.json();
    
    if (!word) {
      return new Response(
        JSON.stringify({ error: "Word is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating Kuba sticker for "${word}", lesson: "${lessonName}" (${lessonKind}), regenerate: ${regenerate}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check cache first (unless regenerating)
    const cacheKey = `kuba_${word.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    
    if (!regenerate) {
      const { data: existingSticker } = await supabase
        .from("vocabulary_stickers")
        .select("image_url")
        .eq("word", cacheKey)
        .single();

      if (existingSticker) {
        console.log(`Found cached Kuba sticker for "${word}"`);
        return new Response(
          JSON.stringify({ imageUrl: existingSticker.image_url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Delete old cache if regenerating
      await supabase
        .from("vocabulary_stickers")
        .delete()
        .eq("word", cacheKey);
    }

    // Fetch learned prompt improvements
    const { data: learnings } = await supabase
      .from("prompt_learnings")
      .select("feedback")
      .order("success_count", { ascending: false })
      .limit(3);

    const learnedRules = learnings?.map(l => l.feedback).join(". ") || "";

    // Build lesson context hint
    const lessonContextHint = lessonName 
      ? `\n\nLESSON CONTEXT (use this to disambiguate meanings): This is from a lesson called "${lessonName}"${lessonKind ? ` (category: ${lessonKind})` : ""}.
For example: if the lesson is about "Sexual English" or romance, interpret words in that context (e.g., "vzrušený" = aroused/turned on, not just excited).
If the lesson is about business, interpret formally. Match the lesson theme!`
      : "";

    // Special prompt section for idioms - combine literal + figurative meaning
    const isIdiomLesson = lessonKind?.toLowerCase() === "idioms";
    const idiomInstructions = isIdiomLesson ? `
IDIOM VISUALIZATION RULES (CRITICAL - THIS IS AN IDIOM):
This phrase is an IDIOM - you MUST visualize BOTH the literal imagery AND the figurative meaning together!

Examples of how to combine literal + figurative:
- "Go bananas" (go crazy) → Kuba going crazy WHILE surrounded by bananas or holding bananas
- "Spill the beans" (reveal secret) → Kuba whispering/telling secret with beans spilling from hands
- "Break a leg" (good luck) → Kuba giving thumbs up with a broken leg cast (comedic)
- "Piece of cake" (easy) → Kuba looking confident/relaxed while holding or eating cake
- "Raining cats and dogs" (heavy rain) → Kuba in rain with cartoon cats/dogs falling
- "Bite the bullet" (face difficulty) → Kuba with determined face, biting a bullet
- "Cool as a cucumber" (calm) → Kuba looking chill, possibly with cucumber
- "In hot water" (in trouble) → Kuba in a pot of steaming water looking worried
- "Let the cat out of the bag" (reveal secret) → Kuba with surprised face, cat escaping from bag

IDIOM VISUALIZATION FORMULA:
1. Identify the LITERAL elements (bananas, beans, cake, cats, dogs, etc.)
2. Identify the FIGURATIVE meaning (crazy, easy, heavy rain, reveal secret, etc.)
3. Show Kuba EXPRESSING the figurative meaning (crazy face, relaxed, worried, etc.)
4. INCLUDE the literal elements as props, costume, or background elements
5. Make it FUNNY and MEMORABLE - exaggerate both elements!

The goal is to help learners REMEMBER the idiom by seeing the visual connection!
` : "";

    // Build the editing prompt - KEEP REALISTIC FACE, TRANSPARENT BG, COMPLETE WHITE OUTLINE
    // CRITICAL: Start with explicit image generation instruction to prevent text-only responses
    const basePrompt = `GENERATE AN IMAGE NOW. Transform the person in this photo into a funny sticker for: "${word}"
${lessonContextHint}
${idiomInstructions}

INSTRUCTIONS FOR IMAGE GENERATION:
1. KEEP the exact same face - realistic, recognizable, photorealistic features
2. TRANSFORM the rest: add costume, props, expression based on the word/sentence meaning
3. SOLID BLACK BACKGROUND - NO transparency, NO checkerboard pattern, pure #000000 black
4. WHITE STICKER OUTLINE around the entire figure (continuous, no gaps)
5. FRAMING: chest/waist up, fill the frame, NO legs
6. HEAD MUST BE FULLY VISIBLE - NEVER crop or cut off the top of the head

CRITICAL BACKGROUND RULE:
- Background MUST be solid black (#000000)
- NEVER use transparency or checkerboard pattern
- NEVER use gray or any other color - only pure black

WHAT TO SHOW:
- Extract the KEY VISUAL CONCEPT from "${word}"
${isIdiomLesson ? "- For idioms: COMBINE literal imagery (objects) with figurative expression (emotion/action)" : "- Examples: \"phone ringing\" → answering phone, \"get married\" → bride costume, \"I love you\" → heart-eyes"}

HUMOR STYLE - GO EXTREME:
- Wedding/marry → BRIDE with veil, bouquet
- Baby → pacifier, bib
- King/Queen → crown, royal cape
- Rich → gold chains, money falling
- Angry → red face, steam from ears
- Love → heart-eyes, holding hearts
${isIdiomLesson ? "- Idioms → SHOW the literal objects + the figurative expression together!" : ""}

FOR ABSTRACT CONCEPTS - USE PANTOMIME:
- Think → hand on chin, looking up
- Listen → hand cupped to ear
- Sleep → eyes closed, hands under tilted head

CRITICAL: 
- NO text/words/labels in the image
- The face MUST remain realistic (the costume/situation can be absurd)
- SOLID BLACK BACKGROUND - absolutely no transparency or checkerboard
- HEAD NEVER CUT OFF - the entire head including hair/hat must be fully visible

NOW GENERATE THE IMAGE based on: "${word}"`;

    let fullPrompt = basePrompt;
    if (learnedRules) {
      fullPrompt += `\n\nStyle notes: ${learnedRules}`;
    }
    if (feedback) {
      fullPrompt += `\n\nUser request: ${feedback}`;
    }

    // Helper function to call the AI with retry
    const callAI = async (attempt: number = 1): Promise<string> => {
      console.log(`Calling Lovable AI (attempt ${attempt})...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: KUBA_BASE_IMAGE_URL
                  }
                },
                {
                  type: "text",
                  text: attempt === 1 
                    ? fullPrompt 
                    : `IMPORTANT: You MUST generate an image, not just text. ${fullPrompt}`
                }
              ]
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        
        if (response.status === 429) {
          throw { status: 429, message: "Rate limit exceeded, please try again later" };
        }
        if (response.status === 402) {
          throw { status: 402, message: "AI credits exhausted, please add credits" };
        }
        throw new Error(`Lovable AI error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Lovable AI response received");

      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        const textContent = data.choices?.[0]?.message?.content || "";
        console.error(`No image in response (attempt ${attempt}). Text response: ${textContent.substring(0, 200)}...`);
        
        // Retry up to 2 times
        if (attempt < 2) {
          console.log("Retrying with stronger image generation instruction...");
          return callAI(attempt + 1);
        }
        throw new Error("No image was generated after retries");
      }

      return imageUrl;
    };

    let generatedImageUrl: string;
    try {
      generatedImageUrl = await callAI();
    } catch (err: any) {
      if (err.status) {
        return new Response(
          JSON.stringify({ error: err.message }),
          { status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }

    // The image is base64 encoded, extract and upload to storage
    const base64Match = generatedImageUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image format received");
    }

    const base64Data = base64Match[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `kuba_${word.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("vocabulary-stickers")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("vocabulary-stickers")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Cache the result
    const { error: insertError } = await supabase
      .from("vocabulary_stickers")
      .insert({
        word: cacheKey,
        image_url: publicUrl,
      });

    if (insertError) {
      console.error("Cache insert error:", insertError);
    }

    // Save feedback as learning if provided
    if (feedback && feedback.trim()) {
      await supabase
        .from("prompt_learnings")
        .upsert(
          { feedback: feedback.trim(), word: word.toLowerCase(), success_count: 1 },
          { onConflict: "feedback", ignoreDuplicates: false }
        );
    }

    console.log(`Kuba sticker generated for "${word}": ${publicUrl}`);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating Kuba sticker:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
