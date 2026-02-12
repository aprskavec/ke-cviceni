import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default Kuba base image for marketing banners (fallback)
const DEFAULT_KUBA_IMAGE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

/**
 * Sanitize a URL by ensuring it doesn't contain problematic characters.
 * Google AI Studio cannot fetch URLs with spaces or special characters.
 */
function sanitizeImageUrl(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    // Get the pathname parts
    const pathParts = urlObj.pathname.split('/');
    // Sanitize the filename (last part)
    const fileName = pathParts[pathParts.length - 1];
    
    // Check if filename has problematic characters (spaces, parentheses, etc.)
    if (/[\s()%]/.test(decodeURIComponent(fileName))) {
      console.warn(`URL contains problematic filename: ${fileName}`);
      // Return fallback - the file needs to be re-uploaded with proper name
      return DEFAULT_KUBA_IMAGE_URL;
    }
    
    return url;
  } catch {
    return url;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      ideaTitle, 
      ideaDescription, 
      inspirationUrls = [],
      ideaInspirationImageUrl,
      mockupUrls = [],
      faceImageUrl,
      aspectRatio = "1:1"
    } = await req.json();
    
    // Use provided face image or fallback to default, with URL sanitization
    const rawKubaUrl = faceImageUrl || DEFAULT_KUBA_IMAGE_URL;
    const kubaImageUrl = sanitizeImageUrl(rawKubaUrl);
    
    if (!ideaTitle && !ideaDescription) {
      return new Response(
        JSON.stringify({ error: "Idea title or description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating Kuba marketing banner for "${ideaTitle}"`);
    console.log(`Face image: ${kubaImageUrl}`);
    console.log(`Mockups provided: ${mockupUrls.length}`);
    console.log(`Idea inspiration image: ${ideaInspirationImageUrl ? "YES" : "NO"}`);

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

    // Build IDEA INSPIRATION context - this is the PRIMARY visual reference
    const sanitizedIdeaInspirationUrl = ideaInspirationImageUrl ? sanitizeImageUrl(ideaInspirationImageUrl) : null;
    const hasIdeaInspiration = sanitizedIdeaInspirationUrl && sanitizedIdeaInspirationUrl.startsWith("http") && sanitizedIdeaInspirationUrl !== DEFAULT_KUBA_IMAGE_URL;
    const ideaInspirationContext = hasIdeaInspiration
      ? `\n\n🎯 IDEA INSPIRATION IMAGE (PRIMARY VISUAL REFERENCE) 🎯
⚠️ THIS IS THE MOST IMPORTANT VISUAL REFERENCE - REPLICATE IT CLOSELY! ⚠️

The IDEA INSPIRATION image shows EXACTLY what the user wants to create.
YOU MUST CLOSELY MATCH:
- The POSE, BODY POSITION, and COMPOSITION from the inspiration
- The SCENE, SETTING, and ENVIRONMENT
- The PROPS, OBJECTS, and ITEMS shown
- The STYLE, MOOD, and OVERALL AESTHETIC
- The COLORS, LIGHTING, and ATMOSPHERE

⚠️ CRITICAL: Your output should look like a RECREATION of the inspiration image,
but with KUBA'S FACE (from the reference photo) replacing any person in the scene.

Think of it as: "Take the inspiration image, but put Kuba in it."
The composition, pose, setting, and style should match the inspiration as closely as possible.`
      : "";

    // Build inspiration context if we have images (secondary style references)
    const hasInspirations = inspirationUrls.length > 0;
    const inspirationContext = hasInspirations 
      ? `\n\nADDITIONAL STYLE REFERENCES:
You have ${inspirationUrls.length} additional reference image(s) for visual style guidance.
Use these to refine:
- Color palette and mood
- Visual composition style
- Lighting and atmosphere`
      : "";

    // Build mockup context if we have mockups
    const hasMockups = mockupUrls.length > 0;
    const mockupContext = hasMockups
      ? `\n\nMOCKUP IMAGES PROVIDED (CRITICAL):
You have ${mockupUrls.length} mockup image(s) - these are PRODUCT SCREENSHOTS (mobile apps, websites, etc).

CRITICAL RULES FOR MOCKUPS:
1. DO NOT DISTORT, WARP, OR MODIFY the mockup content in ANY way
2. The mockup screen content must remain PIXEL-PERFECT and UNDISTORTED
3. Show the mockup on a realistic device (phone/tablet) that Kuba is holding
4. The device screen should display the mockup image EXACTLY as provided - no changes, no artistic interpretation
5. Keep proper perspective on the device frame, but the SCREEN CONTENT must stay clean and readable
6. The mockup is the HERO element - it must be clearly visible and prominent
7. Treat the mockup as a REAL screenshot that cannot be altered`
      : "";

    // Build the Kuba-style marketing banner prompt
    // Description is the PRIMARY creative direction - it tells exactly how to style Kuba
    const hasDescription = ideaDescription && ideaDescription.trim().length > 0;
    
    const basePrompt = `CRITICAL: You MUST use the EXACT person from the provided reference photo.

=== FACE IDENTITY PRESERVATION (ABSOLUTELY MANDATORY) ===
⚠️ THE FIRST IMAGE IS A REFERENCE PHOTO OF "KUBA" - YOU MUST USE THIS EXACT PERSON ⚠️
- Study the reference photo CAREFULLY - memorize his face shape, nose, eyes, skin tone
- The generated image MUST show this SAME PERSON - he must be recognizable
- PRESERVE: exact facial structure, nose shape, eye shape, face proportions, skin tone
- DO NOT generate a different person or a generic face
- If the face doesn't match the reference, the image will be REJECTED
${ideaInspirationContext}

=== PRIMARY CREATIVE BRIEF ===
${hasIdeaInspiration ? `⚠️ AN IDEA INSPIRATION IMAGE HAS BEEN PROVIDED - USE IT AS YOUR PRIMARY VISUAL GUIDE! ⚠️
Replicate the scene, pose, composition, and style from the inspiration image, but with Kuba's face.` : ""}
${hasDescription ? `CREATIVE DIRECTION: ${ideaDescription}

Transform Kuba (the person from the reference photo) according to this description. Add costume, props, pose - but KEEP HIS EXACT FACE from the reference.` : ""}
MARKETING TITLE: "${ideaTitle}"

=== BRAND CONTEXT ===
Brand: Kuba English - A fun English learning app for Czech speakers.
Mascot: Kuba - the SPECIFIC person shown in the reference photo. His face is sacred.
${inspirationContext}
${mockupContext}

=== VISUAL STYLE (CRITICAL) ===
1. FACE MUST BE IDENTICAL to reference photo - same person, photorealistic, recognizable
2. ${hasIdeaInspiration ? "REPLICATE the pose, scene, and composition from the IDEA INSPIRATION image" : "TRANSFORM the rest: add costume, props, pose, expression based on the creative brief"}
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
${hasIdeaInspiration ? `⚠️ FOLLOW THE IDEA INSPIRATION IMAGE AS CLOSELY AS POSSIBLE ⚠️
- Match the POSE, POSITION, and BODY LANGUAGE
- Match the PROPS, OBJECTS, and SETTING
- Match the STYLE, COLORS, and MOOD
- The ONLY difference should be KUBA'S FACE from the reference photo` : ""}
${hasDescription ? `Transform Kuba (same face from reference!) according to: "${ideaDescription}"
Examples:
- "80s synth pop" → Kuba (same face) in 80s costume with synth
- "jako Elvis" → Kuba (same face) in Elvis costume
- "pirat" → Kuba (same face) with pirate hat
CRITICAL: Same face, different costume/situation.` : `Use the title "${ideaTitle}" to guide the visual.`}
${hasInspirations ? "- Incorporate the visual style, colors, and mood from the style reference images" : ""}
${hasMockups ? `- INCLUDE the mockup on a device Kuba is holding (keep mockup content undistorted)` : ""}

=== FINAL CHECKLIST ===
✅ Face is IDENTICAL to reference photo (same person - Kuba)
${hasIdeaInspiration ? "✅ Scene/pose/composition matches the IDEA INSPIRATION image" : "✅ Costume/pose matches creative brief"}
✅ Solid black background (#000000)
✅ White sticker outline around figure
✅ No text anywhere
✅ Head fully visible
- Aspect ratio: ${aspectRatio}

NOW GENERATE: ${hasIdeaInspiration ? "Recreate the IDEA INSPIRATION image with Kuba's face" : `Transform the person from the reference photo into "${hasDescription ? ideaDescription : ideaTitle}"`}`;

    // Build messages array with Kuba base image + inspiration if provided
    const messageContent: any[] = [
      {
        type: "image_url",
        image_url: { url: kubaImageUrl }
      }
    ];
    
    // Add IDEA INSPIRATION image as second image (PRIMARY visual reference)
    // This should come right after Kuba's face so AI treats it as the main visual guide
    if (hasIdeaInspiration && sanitizedIdeaInspirationUrl) {
      console.log("Adding idea inspiration image as primary visual reference");
      messageContent.push({
        type: "image_url",
        image_url: { url: sanitizedIdeaInspirationUrl }
      });
    }
    
    // Add mockup images if provided (these are product screenshots to include)
    for (const url of mockupUrls.slice(0, 2)) {
      const sanitizedUrl = sanitizeImageUrl(url);
      if (sanitizedUrl && sanitizedUrl.startsWith("http") && sanitizedUrl !== DEFAULT_KUBA_IMAGE_URL) {
        messageContent.push({
          type: "image_url",
          image_url: { url: sanitizedUrl }
        });
      }
    }
    
    // Add inspiration images if provided (max 2 to leave room for base image)
    for (const url of inspirationUrls.slice(0, 2)) {
      const sanitizedUrl = sanitizeImageUrl(url);
      if (sanitizedUrl && sanitizedUrl.startsWith("http") && sanitizedUrl !== DEFAULT_KUBA_IMAGE_URL) {
        messageContent.push({
          type: "image_url",
          image_url: { url: sanitizedUrl }
        });
      }
    }
    
    // Add text prompt
    messageContent.push({
      type: "text",
      text: basePrompt
    });

    console.log("Calling Lovable AI for Kuba marketing banner...");
    
    // Retry logic for image generation (AI may occasionally refuse or fail)
    let generatedImageUrl: string | undefined;
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt + 1}/${maxRetries + 1}...`);
        
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
                content: messageContent
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Lovable AI error:", response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI credits exhausted, please add credits" }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`Lovable AI error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Lovable AI response received");

        generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (generatedImageUrl) {
          break; // Success, exit retry loop
        }
        
        const textContent = data.choices?.[0]?.message?.content || "";
        console.warn(`Attempt ${attempt + 1}: No image in response. Text: ${textContent.substring(0, 200)}`);
        lastError = new Error("AI did not generate an image");
        
        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    
    if (!generatedImageUrl) {
      console.error("All attempts failed to generate image");
      throw lastError || new Error("No image was generated after retries");
    }

    // Extract base64 and upload to storage
    const base64Match = generatedImageUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image format received");
    }

    const base64Data = base64Match[1];
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `kuba_banner_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("marketing-inspiration")
      .upload(`generated/${fileName}`, imageBytes, {
        contentType: "image/png",
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("marketing-inspiration")
      .getPublicUrl(`generated/${fileName}`);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Kuba marketing banner generated: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        metadata: {
          model: "google/gemini-2.5-flash-image",
          prompt: basePrompt,
          ideaTitle,
          ideaDescription,
          aspectRatio,
          inspirationCount: inspirationUrls.length,
          mockupCount: mockupUrls.length,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating Kuba marketing banner:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
