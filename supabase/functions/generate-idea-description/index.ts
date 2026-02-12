import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, description = "", count = 1 }: { title: string; description?: string; count?: number } = await req.json();

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Název nápadu je povinný" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clamp count to reasonable limits
    const descriptionsCount = Math.min(Math.max(1, count), 6);
    
    // Use description as base context if provided
    const hasBaseDescription = description.trim().length > 0;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating description for idea:", title, "base description:", description);

    const systemPrompt = `Jsi vizuální kreativní ředitel pro českou aplikaci "Kuba English".
Kuba = sarkastický chlápek s výraznou mimikou.

=== FORMÁT ===
Piš STRUČNĚ (max 15 slov) ale VTIPNĚ - přehnaná emoce, absurdní situace.
Formát: [stylizace postavy], [akce/póza], [vtipný detail]

=== PŘÍKLADY DOBRÝCH POPISŮ ===
- "Kuba jako zoufalé batole, dramatický pláč, natahuje ručičky"
- "Kuba jako přehnaný byznysmen, hází peníze, nafoukaný ksicht"  
- "Kuba jako líný student, spí na učebnici, slintá"
- "Kuba jako frustrovaný táta, tahá si vlasy, obklopen dětmi"
- "Kuba jako sarkastický číšník, převrací oči, nese prázdný talíř"
- "Kuba jako supernadšený fitko trenér, přehnané svaly, motivační póza"

=== ŠPATNÉ POPISY (nepoužívat!) ===
❌ "pohodová postava, radostný výraz" (= nudné, žádný humor)
❌ "veselá póza, pozitivní energie" (= generické, bez charakteru)
❌ "Kuba s pivem a řízkem" (= příliš stereotypní, ne vždy relevantní)

=== PRAVIDLA ===
${hasBaseDescription 
  ? `Vycházej z popisu nápadu, přidej sarkasmus a přehnanou emoci.`
  : `Vymysli vtipnou scénu která vystihuje téma názvu - přehnaná emoce, absurdní situace.`}
- VŽDY přidej nějaký vtipný/absurdní detail
- Humor = přehnaná mimika, absurdní situace, sarkasmus (NE vždy pivo/řízek!)
- Žádné texty, nápisy nebo slogany v obraze

=== VÍCE VARIANT ===
Odděluj znaky |||`;

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
          { role: "user", content: hasBaseDescription
            ? (descriptionsCount > 1 
              ? `Název: "${title}"\nPopis nápadu: "${description}"\n\nVygeneruj ${descriptionsCount} RŮZNÝCH vizuálních variant tohoto popisu. Odděluj je znaky |||`
              : `Název: "${title}"\nPopis nápadu: "${description}"\n\nVygeneruj vizuální variantu tohoto popisu.`)
            : (descriptionsCount > 1 
              ? `Název nápadu: "${title}"\n\nVygeneruj ${descriptionsCount} RŮZNÝCH vizuálních popisů pro tento nápad. Odděluj je znaky |||`
              : `Název nápadu: "${title}"\n\nVygeneruj kreativní popis pro tento marketingový nápad.`)
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Zkus to za chvíli." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Nedostatek kreditů pro AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI API error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      console.error("No content in AI response:", data);
      return new Response(
        JSON.stringify({ error: "AI nevrátilo žádný popis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Post-processing helper
    const cleanDescription = (text: string): string => {
      const textPatterns = [
        /s\s*nápisem\s*[„"'].*?[„"']/gi,
        /nápis[:\s]*[„"'].*?[„"']/gi,
        /text[:\s]*[„"'].*?[„"']/gi,
        /slogan[:\s]*[„"'].*?[„"']/gi,
        /heslo[:\s]*[„"'].*?[„"']/gi,
        /[„"'].*?[„"']\s*(?:na\s+)?(?:pozadí|banneru|obrázku)/gi,
        /Celé to doplňuje nápis.*$/gi,
        /doplněn[ýáo]\s+(?:textem|nápisem).*$/gi,
        /^\d+[\.\)]\s*/gm, // Remove numbering like "1. " or "1) "
        /^[-•]\s*/gm, // Remove bullet points
      ];

      let cleaned = text;
      for (const pattern of textPatterns) {
        cleaned = cleaned.replace(pattern, '').trim();
      }
      return cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
    };

    // Split by ||| if multiple descriptions requested
    const descriptions: string[] = rawContent
      .split(/\|\|\|/)
      .map((d: string) => cleanDescription(d))
      .filter((d: string) => d.length > 5); // Filter out empty/too short results

    console.log(`Generated ${descriptions.length} descriptions:`, descriptions);

    // Return array if multiple were requested, single string for backwards compatibility
    if (descriptionsCount > 1) {
      return new Response(
        JSON.stringify({ descriptions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ description: descriptions[0] || rawContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
