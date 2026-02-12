import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageId, imageName, imageUrl } = await req.json();
    
    if (!imageId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageId and imageUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Starting background analysis for:", imageId, imageName);

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const imageBase64 = `data:image/png;base64,${base64}`;

    console.log("Image fetched, calling AI gateway...");

    // Call AI for analysis with extended parameters
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Jsi expert na analýzu obličejů a výrazů pro marketing. Analyzuj obrázek a poskytni strukturovanou analýzu včetně emočních parametrů a směrových údajů.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyzuj tento obličej pro použití v marketingových materiálech Kuba English. Urči primární emoci, sekundární tag, a detailní emoční/směrovou analýzu."
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_face",
              description: "Vrátí strukturovanou analýzu obličeje s emočními parametry a směrovými údaji",
              parameters: {
                type: "object",
                properties: {
                  primaryEmotion: { type: "string", description: "Primární emoce jedním slovem v češtině" },
                  secondaryTag: { type: "string", description: "Sekundární tag jedním slovem v češtině" },
                  energyLevel: { type: "string", enum: ["low", "medium", "high"], description: "Úroveň energie" },
                  mouthState: { type: "string", enum: ["closed", "open", "screaming", "smiling", "speaking"], description: "Stav úst" },
                  eyeExpression: { type: "string", enum: ["neutral", "skeptical", "excited", "angry", "surprised", "tired", "focused", "playful"], description: "Výraz očí" },
                  expressionIntensity: { type: "number", minimum: 1, maximum: 10, description: "Intenzita výrazu 1-10" },
                  sarcasmLevel: { type: "string", enum: ["none", "mild", "heavy"], description: "Úroveň sarkasmu" },
                  gazeDirection: { type: "string", enum: ["left", "right", "center", "up", "down", "camera"], description: "Směr pohledu" },
                  chinDirection: { type: "string", enum: ["left", "right", "center", "up", "down"], description: "Směr brady/hlavy" },
                  facialDescription: { type: "string", description: "Popis výrazu obličeje (2-3 věty)" },
                  marketingUseCases: { type: "array", items: { type: "string" }, description: "3-5 use cases pro marketing" },
                  suggestedVocabulary: { type: "array", items: { type: "string" }, description: "5-8 anglických frází" },
                  brandFit: { type: "string", description: "Jak výraz zapadá do Kuba English brandu (1-2 věty)" }
                },
                required: [
                  "primaryEmotion", "secondaryTag", "energyLevel",
                  "mouthState", "eyeExpression", "expressionIntensity", "sarcasmLevel",
                  "gazeDirection", "chinDirection",
                  "facialDescription", "marketingUseCases", "suggestedVocabulary", "brandFit"
                ],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_face" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "analyze_face") {
      throw new Error("Unexpected AI response format");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log("Analysis complete, saving to database...");

    // Save to face_analyses table with extended fields
    const { error: dbError } = await supabase
      .from("face_analyses")
      .upsert({
        image_id: imageId,
        image_name: imageName,
        image_src: imageUrl,
        primary_emotion: analysisResult.primaryEmotion,
        secondary_tag: analysisResult.secondaryTag,
        energy_level: analysisResult.energyLevel,
        mouth_state: analysisResult.mouthState,
        eye_expression: analysisResult.eyeExpression,
        expression_intensity: analysisResult.expressionIntensity,
        sarcasm_level: analysisResult.sarcasmLevel,
        gaze_direction: analysisResult.gazeDirection,
        chin_direction: analysisResult.chinDirection,
        facial_description: analysisResult.facialDescription,
        marketing_use_cases: analysisResult.marketingUseCases,
        suggested_vocabulary: analysisResult.suggestedVocabulary,
        brand_fit: analysisResult.brandFit,
      }, {
        onConflict: "image_id"
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Analysis saved successfully for:", imageId);

    return new Response(
      JSON.stringify({ success: true, imageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-face-background:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
