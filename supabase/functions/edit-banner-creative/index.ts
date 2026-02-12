import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { 
      sourceImageUrl, 
      editInstruction,
      ideaTitle,
      ideaDescription
    } = await req.json();
    
    if (!sourceImageUrl || !editInstruction) {
      return new Response(
        JSON.stringify({ error: "sourceImageUrl and editInstruction are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Editing creative with instruction: "${editInstruction}"`);

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

    // Build the edit prompt
    const editPrompt = `EDIT THIS IMAGE based on the following instruction:

=== EDIT INSTRUCTION ===
${editInstruction}

=== CONTEXT ===
${ideaTitle ? `Campaign title: "${ideaTitle}"` : ""}
${ideaDescription ? `Campaign description: "${ideaDescription}"` : ""}

=== RULES ===
1. Keep the same overall composition and style
2. Keep the face realistic and recognizable - only modify as instructed
3. Apply the edit instruction precisely
4. Maintain the black background and white sticker outline style
5. Keep the aspect ratio 1:1

=== ABSOLUTELY NO TEXT (CRITICAL - HARDCODED RULE) ===
⛔ ZERO TEXT IN THE IMAGE - THIS IS NON-NEGOTIABLE ⛔
- NO letters, words, labels, captions, titles, watermarks, logos with text
- NO text on clothing, props, backgrounds, or anywhere in the image
- NO stylized text, handwritten text, or any form of written characters
- NO numbers, symbols that represent words, or any typographic elements
- The image must be 100% VISUAL ONLY - pure imagery without any textual content
- If you generate ANY text, the image will be REJECTED
- This rule has NO exceptions - even if the edit instruction mentions text, DO NOT add it

APPLY THE EDIT: "${editInstruction}"`;

    const messageContent = [
      {
        type: "image_url",
        image_url: { url: sourceImageUrl }
      },
      {
        type: "text",
        text: editPrompt
      }
    ];

    console.log("Calling Lovable AI for image edit...");
    
    // Retry logic
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
          break;
        }
        
        const textContent = data.choices?.[0]?.message?.content || "";
        console.warn(`Attempt ${attempt + 1}: No image in response. Text: ${textContent.substring(0, 200)}`);
        lastError = new Error("AI did not generate an image");
        
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
    
    const fileName = `kuba_edited_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    
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
    console.log(`Edited creative generated: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        imageUrl: publicUrl,
        metadata: {
          model: "google/gemini-2.5-flash-image",
          prompt: editPrompt,
          editInstruction,
          ideaTitle,
          ideaDescription,
          aspectRatio: "1:1",
          generatedAt: new Date().toISOString(),
          isEdit: true,
          sourceImageUrl
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error editing creative:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
