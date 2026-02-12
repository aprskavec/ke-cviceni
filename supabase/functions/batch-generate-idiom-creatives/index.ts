import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_FACE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { idiomIds, imagesPerIdiom = 40, concurrency = 2 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch idioms to process
    let query = supabase.from("instagram_idioms").select("id, idiom, scene");
    
    if (idiomIds && idiomIds.length > 0) {
      query = query.in("id", idiomIds);
    }
    
    const { data: idioms, error: idiomsError } = await query;
    
    if (idiomsError || !idioms || idioms.length === 0) {
      throw new Error("No idioms found");
    }

    console.log(`Starting batch generation for ${idioms.length} idioms, ${imagesPerIdiom} images each`);

    // Start background processing
    EdgeRuntime.waitUntil(processIdioms(idioms, imagesPerIdiom, concurrency, supabase, LOVABLE_API_KEY, SUPABASE_URL));

    return new Response(
      JSON.stringify({ 
        message: `Started generating ${imagesPerIdiom} images for ${idioms.length} idioms`,
        idioms: idioms.map(i => i.idiom),
        totalImages: idioms.length * imagesPerIdiom
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processIdioms(
  idioms: any[], 
  imagesPerIdiom: number, 
  concurrency: number,
  supabase: any,
  apiKey: string,
  supabaseUrl: string
) {
  for (const idiom of idioms) {
    console.log(`\n========== Processing: ${idiom.idiom} ==========`);
    
    try {
      // First, select the best face for this scene
      let faceUrl = DEFAULT_FACE_URL;
      try {
        const faceResponse = await fetch(`${supabaseUrl}/functions/v1/select-best-face`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({ sceneDescription: idiom.scene }),
        });
        
        if (faceResponse.ok) {
          const faceData = await faceResponse.json();
          if (faceData.faceUrl) {
            faceUrl = faceData.faceUrl;
            console.log(`Selected face: ${faceData.faceName} (${faceData.emotion})`);
          }
        }
      } catch (faceErr) {
        console.warn("Face selection failed, using default:", faceErr);
      }

      // Generate images sequentially with longer delays to avoid rate limiting
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < imagesPerIdiom; i++) {
        const result = await generateSingleCreative(idiom, i, faceUrl, apiKey, supabase);
        
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
        
        // Log progress every 5 images
        if ((i + 1) % 5 === 0 || i === imagesPerIdiom - 1) {
          console.log(`${idiom.idiom}: ${successCount}/${i + 1} generated (${failCount} failed)`);
        }
        
        // Delay between each image to avoid rate limiting - 3 seconds
        await new Promise(r => setTimeout(r, 3000));
      }
      
      console.log(`✅ Completed ${idiom.idiom}: ${successCount} images generated`);
      
    } catch (err) {
      console.error(`Failed to process ${idiom.idiom}:`, err);
    }
    
    // Delay between idioms - 5 seconds
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log("\n========== BATCH GENERATION COMPLETE ==========");
}

async function generateSingleCreative(
  idiom: any,
  variationIndex: number,
  faceUrl: string,
  apiKey: string,
  supabase: any
): Promise<string | null> {
  const variationHint = ` (variation ${variationIndex + 1}: explore different pose, angle, expression, or perspective)`;
  const sceneDescription = idiom.scene + variationHint;

  const basePrompt = `CRITICAL: You MUST use the EXACT person from the provided reference photo.

=== FACE IDENTITY PRESERVATION (ABSOLUTELY MANDATORY) ===
⚠️ THE FIRST IMAGE IS A REFERENCE PHOTO OF "KUBA" - YOU MUST USE THIS EXACT PERSON ⚠️
- Study the reference photo CAREFULLY - memorize his face shape, nose, eyes, skin tone
- The generated image MUST show this SAME PERSON - he must be recognizable
- PRESERVE: exact facial structure, nose shape, eye shape, face proportions, skin tone
- DO NOT generate a different person or a generic face

=== PRIMARY CREATIVE BRIEF ===
CREATIVE DIRECTION: ${sceneDescription}

Transform Kuba (the person from the reference photo) according to this description. Add costume, props, pose - but KEEP HIS EXACT FACE from the reference.
MARKETING TITLE: "${idiom.idiom}"

=== BRAND CONTEXT ===
Brand: Kuba English - A fun English learning app for Czech speakers.
Mascot: Kuba - the SPECIFIC person shown in the reference photo.

=== VISUAL STYLE (CRITICAL) ===
1. FACE MUST BE IDENTICAL to reference photo - same person, photorealistic, recognizable
2. TRANSFORM the rest: add costume, props, pose, expression based on the creative brief
3. BACKGROUND RULES (EXTREMELY IMPORTANT):
   - SOLID BLACK BACKGROUND ONLY - pure #000000
   - NO light effects, NO glows, NO rays, NO gradients behind the figure
4. THICK WHITE STICKER OUTLINE around the entire figure (continuous, no gaps)
5. FRAMING: chest/waist up, fill the frame, NO legs
6. HEAD MUST BE FULLY VISIBLE - NEVER crop or cut off the top of the head

=== ABSOLUTELY NO TEXT ===
⛔ ZERO TEXT IN THE IMAGE ⛔
- NO letters, words, labels, captions, watermarks anywhere
- The image must be 100% VISUAL ONLY

NOW GENERATE: Transform the person from the reference photo into "${sceneDescription}"`;

  const messageContent = [
    {
      type: "image_url",
      image_url: { url: faceUrl }
    },
    {
      type: "text",
      text: basePrompt
    }
  ];

  // Retry logic with exponential backoff for rate limits
  const maxRetries = 3;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
          const waitTime = Math.pow(2, attempt + 2) * 1000; // 4s, 8s, 16s, 32s
          console.warn(`Rate limited, waiting ${waitTime/1000}s (attempt ${attempt + 1})...`);
          await new Promise(r => setTimeout(r, waitTime));
          continue; // Retry this attempt
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageUrl) {
        console.warn(`Attempt ${attempt + 1}: No image in response`);
        continue;
      }

      // Extract base64 and upload
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
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  return null;
}
