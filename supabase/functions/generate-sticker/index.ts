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
    const { word, regenerate = false, feedback = "" } = await req.json();
    
    if (!word) {
      return new Response(
        JSON.stringify({ error: "Word is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Request for "${word}", regenerate: ${regenerate}, feedback: "${feedback}"`);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if sticker already exists in cache (skip if regenerating)
    if (!regenerate) {
      const { data: existingSticker } = await supabase
        .from("vocabulary_stickers")
        .select("image_url")
        .eq("word", word.toLowerCase())
        .single();

      if (existingSticker) {
        console.log(`Found cached sticker for "${word}"`);
        return new Response(
          JSON.stringify({ imageUrl: existingSticker.image_url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Delete old cached sticker if regenerating
      console.log(`Deleting old cached sticker for "${word}"`);
      await supabase
        .from("vocabulary_stickers")
        .delete()
        .eq("word", word.toLowerCase());
    }

    // Fetch learned prompt improvements from database
    const { data: learnings } = await supabase
      .from("prompt_learnings")
      .select("feedback")
      .order("success_count", { ascending: false })
      .limit(5);

    const learnedRules = learnings?.map(l => l.feedback).join(". ") || "";

    console.log(`Generating new sticker for "${word}" using DALL-E 3`);
    if (learnedRules) {
      console.log(`Applying learned rules: ${learnedRules}`);
    }

    // Build prompt with learned rules
    const basePrompt = `A cute kawaii sticker illustration of "${word}" (English vocabulary concept). 
Style: Cartoon sticker with thick white outline border around the entire design.
Colors: Bright vibrant neon colors, glossy highlights, cute and simple design.
Background: Solid pure black background (#000000).
Important: NO text, NO words, NO letters, NO labels - only visual imagery representing the concept.`;

    // Combine base prompt with learned rules and user feedback
    let fullPrompt = basePrompt;
    
    if (learnedRules) {
      fullPrompt += `\n\nLearned style preferences: ${learnedRules}`;
    }
    
    if (feedback) {
      fullPrompt += `\n\nAdditional style request: ${feedback}`;
    }

    // Call OpenAI DALL-E 3 API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DALL-E API error:", response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid OpenAI API key" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`DALL-E API error: ${response.status}`);
    }

    const data = await response.json();
    const base64Image = data.data?.[0]?.b64_json;
    
    if (!base64Image) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image was generated");
    }

    console.log(`DALL-E generated image for "${word}"`);

    // If feedback was provided and generation succeeded, save it as a learning
    if (feedback && feedback.trim()) {
      console.log(`Saving feedback as learning: "${feedback}"`);
      
      // Try to upsert - if feedback already exists, increment success_count
      const { error: upsertError } = await supabase
        .from("prompt_learnings")
        .upsert(
          { 
            feedback: feedback.trim(), 
            word: word.toLowerCase(),
            success_count: 1 
          },
          { 
            onConflict: "feedback",
            ignoreDuplicates: false 
          }
        );
      
      if (upsertError) {
        // If upsert failed due to unique constraint, try to increment
        console.log("Upsert failed, trying to increment existing:", upsertError.message);
        
        const { data: existing } = await supabase
          .from("prompt_learnings")
          .select("id, success_count")
          .ilike("feedback", feedback.trim())
          .single();
        
        if (existing) {
          await supabase
            .from("prompt_learnings")
            .update({ success_count: existing.success_count + 1 })
            .eq("id", existing.id);
        }
      }
    }

    // Upload to storage
    const imageBytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
    const fileName = `${word.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("vocabulary-stickers")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("vocabulary-stickers")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Cache the URL in database
    const { error: insertError } = await supabase
      .from("vocabulary_stickers")
      .insert({
        word: word.toLowerCase(),
        image_url: publicUrl,
      });

    if (insertError) {
      console.error("Cache insert error:", insertError);
      // Non-critical, continue with response
    }

    console.log(`Sticker generated and cached for "${word}": ${publicUrl}`);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating sticker:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});