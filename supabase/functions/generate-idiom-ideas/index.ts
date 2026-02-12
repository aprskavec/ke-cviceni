import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title } = await req.json();

    if (!title || title.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating idiom ideas for:", title);

    const systemPrompt = `You are "KUBA" - a sarcastic, brutally honest Czech comedy writer with a dark sense of humor.

Your task is to generate English idioms and describe HILARIOUS, ABSURD scenes where the idiom is taken LITERALLY.

YOUR HUMOR STYLE (KUBA STYLE):
- Drsný, sarkastický, typicky český humor
- Reference na české reálie: hospoda, pivo, řízek, fronty na úřadech, stěžování si, panelák, víkend na chalupě
- Absurdní situace dotažené do extrému
- Černý humor, který by prošel jen v hospodě
- Přehnaná mimika a emoce (zoufalství, panika, trapnost)
- Situace, které zná každý Čech

TARGET AUDIENCE: Češi (30-45 let), kteří ocení sarkasmus a absurditu

IMPORTANT RULES:
- Generate 8-12 relevant idioms
- Focus ONLY on the LITERAL (funny/absurd) visual interpretation  
- Make it EXTREMELY ABSURD and OVER-THE-TOP
- Add Czech cultural context where it fits naturally
- The funnier and more ridiculous, the better
- Descriptions should be in Czech language
- Keep descriptions vivid but concise (2-3 sentences max)
- Think: "Co by rozesmálo partu u piva?"`;

    const userPrompt = `Creative brief: "${title}"

Generate English idioms that would be HILARIOUS when visualized literally - with KUBA's sarcastic Czech humor. Return a JSON array:
[
  {
    "idiom": "Spill the beans",
    "scene": "Typický český úředník v šedém saku zakopne o práh a z obří konzervy se na šéfa vysypou tisíce fazolí. Šéf stojí v šoku pokrytý fazolemi, jedna mu visí z nosu, sekretářka fotí na mobil."
  },
  {
    "idiom": "Let the cat out of the bag", 
    "scene": "Nervózní tchyně otevře igelitku z Lidlu a kočka z ní vyletí přímo do vánočního stromku. Stromek padá, koule se kutálí, děda spí dál na gauči."
  }
]`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "return_idiom_ideas",
              description: "Return the list of idiom ideas with hilarious literal scene descriptions",
              parameters: {
                type: "object",
                properties: {
                  idioms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        idiom: { type: "string", description: "The English idiom" },
                        scene: { type: "string", description: "Czech description of the hilarious literal visual scene" },
                      },
                      required: ["idiom", "scene"],
                    },
                  },
                },
                required: ["idioms"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_idiom_ideas" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "return_idiom_ideas") {
      console.error("Unexpected response format:", JSON.stringify(data));
      throw new Error("Invalid response format from AI");
    }

    const idiomData = JSON.parse(toolCall.function.arguments);
    console.log(`Generated ${idiomData.idioms?.length || 0} idiom ideas`);

    return new Response(
      JSON.stringify({ idioms: idiomData.idioms }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating idiom ideas:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
