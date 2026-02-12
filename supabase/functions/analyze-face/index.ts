import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing face with base64 image data");

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
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
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
                  primaryEmotion: {
                    type: "string",
                    description: "Primární emoce jedním slovem v češtině (např. Radost, Vztek, Znechucení, Překvapení, Smutek, Strach, Pohoda, Sarkasmus)"
                  },
                  secondaryTag: {
                    type: "string",
                    description: "Sekundární tag jedním slovem v češtině popisující náladu/vibe (např. Sarkasmus, Sebevědomí, Provokace, Vtip, Ironie)"
                  },
                  energyLevel: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Úroveň energie výrazu"
                  },
                  mouthState: {
                    type: "string",
                    enum: ["closed", "open", "screaming", "smiling", "speaking"],
                    description: "Stav úst - zavřená, otevřená, křičící, usmívající se, mluvící"
                  },
                  eyeExpression: {
                    type: "string",
                    enum: ["neutral", "skeptical", "excited", "angry", "surprised", "tired", "focused", "playful"],
                    description: "Výraz očí - neutrální, skeptický, nadšený, naštvaný, překvapený, unavený, soustředěný, hravý"
                  },
                  expressionIntensity: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "Intenzita výrazu od 1 (jemný) do 10 (extrémní)"
                  },
                  sarcasmLevel: {
                    type: "string",
                    enum: ["none", "mild", "heavy"],
                    description: "Úroveň sarkasmu ve výrazu"
                  },
                  gazeDirection: {
                    type: "string",
                    enum: ["left", "right", "center", "up", "down", "camera"],
                    description: "Kam směřuje pohled očí - doleva, doprava, střed, nahoru, dolů, do kamery"
                  },
                  chinDirection: {
                    type: "string",
                    enum: ["left", "right", "center", "up", "down"],
                    description: "Kam směřuje brada/hlava - doleva, doprava, střed, nahoru, dolů"
                  },
                  facialDescription: {
                    type: "string",
                    description: "Popis výrazu obličeje - pozice obočí, očí, úst (2-3 věty)"
                  },
                  marketingUseCases: {
                    type: "array",
                    items: { type: "string" },
                    description: "Seznam 3-5 konkrétních use cases pro marketing (např. 'Reakce na gramatickou chybu', 'Oslavný moment po správné odpovědi')"
                  },
                  suggestedVocabulary: {
                    type: "array",
                    items: { type: "string" },
                    description: "Seznam 5-8 anglických slovíček nebo frází které by se k tomuto výrazu hodily pro Kuba English brand"
                  },
                  brandFit: {
                    type: "string",
                    description: "Jak tento výraz zapadá do Kuba English brandu - drsný sarkasmus, hospodský humor (1-2 věty)"
                  }
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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_face") {
      throw new Error("Unexpected AI response format");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);
    console.log("Face analysis complete:", analysisResult);

    return new Response(
      JSON.stringify({ analysis: analysisResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-face:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
