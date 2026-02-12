import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOICE_ID = "SLJNJvVRLEY4GJ33tRgI";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { words, language = "en" } = await req.json();

    if (!words || !Array.isArray(words) || words.length === 0) {
      return new Response(
        JSON.stringify({ error: "Words array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Normalize words - lowercase, trim
    const normalizedWords = [...new Set(words.map((w: string) => w.toLowerCase().trim()))];
    
    console.log(`Processing ${normalizedWords.length} unique words`);

    // Check which words already have cached audio
    const { data: existingAudio } = await supabase
      .from("word_audio_cache")
      .select("word, audio_url")
      .eq("voice_id", VOICE_ID)
      .eq("language", language)
      .in("word", normalizedWords);

    const existingMap = new Map(
      (existingAudio || []).map((item) => [item.word, item.audio_url])
    );

    console.log(`Found ${existingMap.size} cached audio files`);

    // Find words that need generation
    const wordsToGenerate = normalizedWords.filter((w) => !existingMap.has(w));
    
    console.log(`Need to generate ${wordsToGenerate.length} new audio files`);

    // Generate audio for missing words
    const results: Record<string, string> = {};
    
    // Add existing URLs to results
    for (const [word, url] of existingMap) {
      results[word] = url;
    }

    // Generate new audio in parallel (max 5 at a time to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < wordsToGenerate.length; i += batchSize) {
      const batch = wordsToGenerate.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (word) => {
          try {
            // Generate audio from ElevenLabs with consistent high-quality settings
            // Using language_code to force correct English pronunciation
            const response = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": ELEVENLABS_API_KEY,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text: word,
                  model_id: "eleven_multilingual_v2",
                  language_code: language, // Force English pronunciation
                  voice_settings: {
                    stability: 0.85,          // High stability for clear pronunciation
                    similarity_boost: 0.75,   // Good voice match
                    style: 0.2,               // Low style for clean output
                    use_speaker_boost: true,
                  },
                }),
              }
            );

            if (!response.ok) {
              console.error(`Failed to generate audio for "${word}": ${response.status}`);
              return;
            }

            const audioBuffer = await response.arrayBuffer();
            const fileName = `${language}/${VOICE_ID}/${encodeURIComponent(word)}.mp3`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from("word-audio")
              .upload(fileName, audioBuffer, {
                contentType: "audio/mpeg",
                upsert: true,
              });

            if (uploadError) {
              console.error(`Failed to upload audio for "${word}":`, uploadError);
              return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from("word-audio")
              .getPublicUrl(fileName);

            const audioUrl = urlData.publicUrl;

            // Cache in database
            await supabase.from("word_audio_cache").upsert(
              {
                word,
                language,
                voice_id: VOICE_ID,
                audio_url: audioUrl,
              },
              { onConflict: "word,language,voice_id" }
            );

            results[word] = audioUrl;
            console.log(`Generated and cached audio for "${word}"`);
          } catch (err) {
            console.error(`Error processing "${word}":`, err);
          }
        })
      );
    }

    return new Response(
      JSON.stringify({ 
        audioUrls: results,
        generated: wordsToGenerate.length,
        cached: existingMap.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in batch-generate-audio:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
