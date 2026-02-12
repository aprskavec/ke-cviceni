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
    const { text, language = "en" } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Google TTS via Lovable AI gateway (Gemini models support audio)
    // For now, we'll generate speech markers that can be used with Web Speech API
    // In future, this could be expanded to use ElevenLabs or similar
    
    // Generate pronunciation guide using AI
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
            content: `You are a pronunciation expert. Generate IPA phonetic transcription and syllable breakdown for the given text.
Return JSON format:
{
  "text": "original text",
  "ipa": "IPA transcription",
  "syllables": ["syl", "la", "bles"],
  "stressPattern": "primary stress syllable index (0-based)",
  "slowPronunciation": "text with dots between syllables for slow reading"
}`
          },
          {
            role: "user",
            content: `Generate pronunciation guide for: "${text}" (language: ${language})`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let pronunciationGuide;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      pronunciationGuide = jsonMatch ? JSON.parse(jsonMatch[0]) : { text, ipa: text };
    } catch {
      pronunciationGuide = { text, ipa: text };
    }

    return new Response(
      JSON.stringify({
        ...pronunciationGuide,
        useWebSpeechAPI: true,
        language: language === "cs" ? "cs-CZ" : "en-US",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
