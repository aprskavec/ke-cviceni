import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Default fallback
const DEFAULT_FACE_URL = "https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/happy.png";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sceneDescription } = await req.json();
    
    if (!sceneDescription) {
      return new Response(
        JSON.stringify({ 
          faceUrl: DEFAULT_FACE_URL,
          emotion: "default",
          reason: "No scene description provided"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing scene for best face: "${sceneDescription.substring(0, 100)}..."`);

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

    // Fetch all available faces with their analyses
    const { data: faces, error: facesError } = await supabase
      .from("face_analyses")
      .select("id, image_name, image_src, primary_emotion, secondary_tag, energy_level, sarcasm_level, mouth_state, eye_expression, facial_description")
      .order("created_at", { ascending: false });

    if (facesError || !faces || faces.length === 0) {
      console.log("No faces found, using default");
      return new Response(
        JSON.stringify({ 
          faceUrl: DEFAULT_FACE_URL,
          emotion: "default",
          reason: "No faces in database"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${faces.length} faces to choose from`);

    // Build face catalog for AI
    const faceCatalog = faces.map((face, index) => ({
      index,
      name: face.image_name,
      emotion: face.primary_emotion,
      secondary: face.secondary_tag,
      energy: face.energy_level,
      sarcasm: face.sarcasm_level,
      mouth: face.mouth_state,
      eyes: face.eye_expression,
      description: face.facial_description?.substring(0, 150) || ""
    }));

    // Ask AI to select the best face
    const prompt = `You are selecting the best face photo for a marketing creative.

SCENE TO VISUALIZE:
"${sceneDescription}"

AVAILABLE FACES (choose one by index):
${faceCatalog.map(f => `[${f.index}] "${f.name}" - ${f.emotion} (${f.secondary}), energy: ${f.energy}, sarcasm: ${f.sarcasm || "none"}, ${f.mouth} mouth, ${f.eyes} eyes${f.description ? ` - ${f.description}` : ""}`).join("\n")}

SELECTION CRITERIA:
1. Match the EMOTION needed for the scene (e.g., angry scene → angry/frustrated face)
2. Match the ENERGY LEVEL (high energy scene → high energy face)
3. Consider SARCASM/IRONY if the scene is humorous
4. Match MOUTH STATE for the action (speaking → open, subtle → closed)
5. Consider EYE EXPRESSION for the mood

Respond with ONLY a JSON object (no markdown, no explanation):
{"index": <number>, "reason": "<brief reason in Czech>"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      
      // Return default on error
      return new Response(
        JSON.stringify({ 
          faceUrl: DEFAULT_FACE_URL,
          emotion: "default",
          reason: "AI selection failed, using default"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let selectedIndex = 0;
    let reason = "Default selection";
    
    try {
      // Clean up response - remove markdown if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      
      if (typeof parsed.index === "number" && parsed.index >= 0 && parsed.index < faces.length) {
        selectedIndex = parsed.index;
        reason = parsed.reason || "AI selected";
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Try to extract index from text
      const indexMatch = content.match(/"index"\s*:\s*(\d+)/);
      if (indexMatch) {
        const idx = parseInt(indexMatch[1], 10);
        if (idx >= 0 && idx < faces.length) {
          selectedIndex = idx;
          reason = "Extracted from partial response";
        }
      }
    }

    const selectedFace = faces[selectedIndex];
    
    // Build proper URL - handle relative paths
    let faceUrl = selectedFace.image_src;
    if (faceUrl.startsWith("/images/")) {
      // Convert relative path to Supabase storage URL
      const fileName = faceUrl.split("/").pop();
      faceUrl = `https://lgccnltkrnolbzwybnio.supabase.co/storage/v1/object/public/vocabulary-stickers/kuba-base/${fileName}`;
    }

    console.log(`Selected face: "${selectedFace.image_name}" (${selectedFace.primary_emotion}) - ${reason}`);

    return new Response(
      JSON.stringify({ 
        faceUrl,
        faceId: selectedFace.id,
        faceName: selectedFace.image_name,
        emotion: selectedFace.primary_emotion,
        reason
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error selecting best face:", error);
    return new Response(
      JSON.stringify({ 
        faceUrl: DEFAULT_FACE_URL,
        emotion: "default",
        reason: error instanceof Error ? error.message : "Unknown error"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
