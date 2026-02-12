import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google Display Network standard sizes
const BANNER_SIZES = [
  { name: "Medium Rectangle", width: 300, height: 250, aspectRatio: "300/250" },
  { name: "Large Rectangle", width: 336, height: 280, aspectRatio: "336/280" },
  { name: "Leaderboard", width: 728, height: 90, aspectRatio: "728/90" },
  { name: "Half Page", width: 300, height: 600, aspectRatio: "300/600" },
  { name: "Large Mobile Banner", width: 320, height: 100, aspectRatio: "320/100" },
  { name: "Wide Skyscraper", width: 160, height: 600, aspectRatio: "160/600" },
];

interface BannerRequest {
  ideaId: string;
  ideaTitle: string;
  ideaDescription: string;
  // creativeImageUrl is not needed for deterministic rendering on the client, but
  // kept for backward compatibility with older clients.
  creativeImageUrl?: string;
  sizes?: string[]; // Optional: specific sizes, or all if not provided
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, ideaTitle, ideaDescription, sizes } = await req.json() as BannerRequest;

    if (!ideaId || !ideaTitle) {
      return new Response(
        JSON.stringify({ error: "ideaId and ideaTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Use AI to suggest layout content
    console.log("Generating banner copy suggestions...");
    
    const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Jsi copywriter pro českou značku "Kuba English" - kurz angličtiny od známého youtubera Kuby.
Tvým úkolem je navrhnout texty pro reklamní bannery. Styl je mladistvý, vtipný, s nadsázkou.

Vrať JSON objekt s těmito poli:
- title: Hlavní titulek (max 5 slov, úderný)
- subtitle: Podtitulek (max 8 slov, doplňující info)  
- cta: Call-to-action text (max 3 slova, akční)

Příklady stylu:
- "Angličtina bez keců"
- "Nauč se s Kubou"
- "Přestaň se bát mluvit"`
          },
          {
            role: "user",
            content: `Nápad na banner: ${ideaTitle}
Popis: ${ideaDescription || "Obecný banner pro Kuba English kurz angličtiny"}

Navrhni title, subtitle a CTA pro tento banner.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_banner_copy",
              description: "Return banner copy suggestions",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Main headline, max 5 words" },
                  subtitle: { type: "string", description: "Subtitle, max 8 words" },
                  cta: { type: "string", description: "Call to action, max 3 words" }
                },
                required: ["title", "subtitle", "cta"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_banner_copy" } }
      }),
    });

    if (!copyResponse.ok) {
      if (copyResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, zkus to za chvíli." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (copyResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI kredity vyčerpány, doplň kredity." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await copyResponse.text();
      console.error("AI copy generation failed:", copyResponse.status, errorText);
      throw new Error(`AI copy generation failed: ${copyResponse.status}`);
    }

    const copyData = await copyResponse.json();
    let bannerCopy = { title: ideaTitle, subtitle: "", cta: "Zjistit více" };
    
    try {
      const toolCall = copyData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        bannerCopy = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Failed to parse AI copy response:", e);
    }

    console.log("Banner copy:", bannerCopy);

    const sizesToGenerate = sizes
      ? BANNER_SIZES.filter((s) => sizes.includes(s.name))
      : BANNER_SIZES;

    return new Response(
      JSON.stringify({
        success: true,
        copy: bannerCopy,
        sizes: sizesToGenerate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-banners:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
