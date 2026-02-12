import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_FACE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

// Rate limiting: MAXIMUM SPEED - pushing limits
const DELAY_BETWEEN_GENERATIONS_MS = 1000;
const MAX_JOBS_PER_RUN = 25;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing configuration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get pending jobs (oldest first, limit to prevent timeout)
    const { data: jobs, error: jobsError } = await supabase
      .from("generation_queue")
      .select("id, idiom_id, attempts, max_attempts")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(MAX_JOBS_PER_RUN);

    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${jobs.length} jobs from queue`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      // Fetch idiom data separately
      const { data: idiom, error: idiomError } = await supabase
        .from("instagram_idioms")
        .select("id, idiom, scene")
        .eq("id", job.idiom_id)
        .maybeSingle();

      if (idiomError || !idiom) {
        console.warn(`Job ${job.id}: idiom not found, marking as failed`);
        await supabase
          .from("generation_queue")
          .update({ 
            status: "failed", 
            error_message: "Idiom not found",
            completed_at: new Date().toISOString()
          })
          .eq("id", job.id);
        failed++;
        continue;
      }

      // Mark as processing
      await supabase
        .from("generation_queue")
        .update({ 
          status: "processing", 
          started_at: new Date().toISOString(),
          attempts: job.attempts + 1
        })
        .eq("id", job.id);

      console.log(`Processing: ${idiom.idiom} (attempt ${job.attempts + 1})`);

      try {
        // Always use default face URL to avoid issues with special characters
        const faceUrl = DEFAULT_FACE_URL;
        console.log(`Using face: ${faceUrl}`);

        // Generate image
        const imageUrl = await generateImage(idiom, faceUrl, LOVABLE_API_KEY, supabase);

        if (imageUrl) {
          await supabase
            .from("generation_queue")
            .update({ 
              status: "completed",
              completed_at: new Date().toISOString()
            })
            .eq("id", job.id);
          succeeded++;
          console.log(`✅ Success: ${idiom.idiom}`);
        } else {
          throw new Error("No image generated");
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`❌ Failed: ${idiom.idiom} - ${errorMessage}`);
        
        const newStatus = job.attempts + 1 >= job.max_attempts ? "failed" : "pending";
        await supabase
          .from("generation_queue")
          .update({ 
            status: newStatus,
            error_message: errorMessage,
            completed_at: newStatus === "failed" ? new Date().toISOString() : null
          })
          .eq("id", job.id);
        
        if (newStatus === "failed") failed++;
      }

      processed++;

      // Rate limit delay between jobs
      if (processed < jobs.length) {
        console.log(`Waiting ${DELAY_BETWEEN_GENERATIONS_MS/1000}s before next job...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_GENERATIONS_MS));
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Queue processing complete",
        processed,
        succeeded,
        failed,
        remaining: jobs.length - processed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Queue processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateImage(
  idiom: { id: string; idiom: string; scene: string },
  faceUrl: string,
  apiKey: string,
  supabase: any
): Promise<string | null> {
  // Use the FULL prompt matching generate-banner-creative for consistency
  const prompt = `CRITICAL: You MUST use the EXACT person from the provided reference photo.

=== FACE IDENTITY PRESERVATION (ABSOLUTELY MANDATORY) ===
⚠️ THE FIRST IMAGE IS A REFERENCE PHOTO OF "KUBA" - YOU MUST USE THIS EXACT PERSON ⚠️
- Study the reference photo CAREFULLY - memorize his face shape, nose, eyes, skin tone
- The generated image MUST show this SAME PERSON - he must be recognizable
- PRESERVE: exact facial structure, nose shape, eye shape, face proportions, skin tone
- DO NOT generate a different person or a generic face
- If the face doesn't match the reference, the image will be REJECTED

=== PRIMARY CREATIVE BRIEF ===
CREATIVE DIRECTION: ${idiom.scene}

Transform Kuba (the person from the reference photo) according to this description. Add costume, props, pose - but KEEP HIS EXACT FACE from the reference.
MARKETING TITLE: "${idiom.idiom}"

=== BRAND CONTEXT ===
Brand: Kuba English - A fun English learning app for Czech speakers.
Mascot: Kuba - the SPECIFIC person shown in the reference photo. His face is sacred.

=== VISUAL STYLE (CRITICAL) ===
1. FACE MUST BE IDENTICAL to reference photo - same person, photorealistic, recognizable
2. TRANSFORM the rest: add costume, props, pose, expression based on the creative brief
3. BACKGROUND RULES (EXTREMELY IMPORTANT):
   - SOLID BLACK BACKGROUND ONLY - pure #000000
   - NO light effects, NO glows, NO rays, NO gradients behind the figure
   - The area outside the white sticker outline must be COMPLETELY EMPTY black
4. THICK WHITE STICKER OUTLINE around the entire figure (continuous, no gaps)
5. FRAMING: chest/waist up, fill the frame, NO legs
6. HEAD MUST BE FULLY VISIBLE - NEVER crop or cut off the top of the head

=== ABSOLUTELY NO TEXT ===
⛔ ZERO TEXT IN THE IMAGE ⛔
- NO letters, words, labels, captions, watermarks anywhere
- The image must be 100% VISUAL ONLY

=== CREATIVE INTERPRETATION ===
Transform Kuba (same face from reference!) according to: "${idiom.scene}"
Examples:
- "80s synth pop" → Kuba (same face) in 80s costume with synth
- "jako Elvis" → Kuba (same face) in Elvis costume
- "pirat" → Kuba (same face) with pirate hat
CRITICAL: Same face, different costume/situation.

=== FINAL CHECKLIST ===
✅ Face is IDENTICAL to reference photo (same person - Kuba)
✅ Costume/pose matches creative brief
✅ Solid black background (#000000)
✅ White sticker outline around figure
✅ No text anywhere
✅ Head fully visible

NOW GENERATE: Transform the person from the reference photo into "${idiom.scene}"`;

  const messageContent = [
    { type: "image_url", image_url: { url: faceUrl } },
    { type: "text", text: prompt }
  ];

  // Retry with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: messageContent }],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const waitTime = Math.pow(2, attempt + 3) * 1000; // 8s, 16s, 32s
          console.warn(`Rate limited, waiting ${waitTime/1000}s...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue;
        }
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        console.warn(`Attempt ${attempt + 1}: No image in response`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      // Upload to storage
      const base64Match = imageUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) throw new Error("Invalid image format");

      const base64Data = base64Match[1];
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `kuba_ig_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("marketing-inspiration")
        .upload(`generated/${fileName}`, imageBytes, {
          contentType: "image/png",
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("marketing-inspiration")
        .getPublicUrl(`generated/${fileName}`);

      // Save to database
      await supabase.from("marketing_creatives").insert({
        idea_id: idiom.id,
        image_url: publicUrlData.publicUrl,
      });

      return publicUrlData.publicUrl;

    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed:`, err);
      if (attempt === 2) throw err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  return null;
}
