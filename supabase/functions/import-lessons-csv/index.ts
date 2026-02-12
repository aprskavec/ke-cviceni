import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonData {
  datocms_id: string;
  video_upload_id: string;
  name: string;
  kind: string;
  order: number;
  level: string;
  cefr: string;
  summary: {
    description: string;
    key_phrases: Array<{ text_content: string; text_content_translation: string }>;
    keywords: Array<{ text_content: string; text_content_translation: string }>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lessons, mode = "upsert" } = await req.json() as { 
      lessons: LessonData[]; 
      mode?: "upsert" | "replace" 
    };

    if (!lessons || !Array.isArray(lessons)) {
      return new Response(
        JSON.stringify({ error: "lessons array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Importing ${lessons.length} lessons in ${mode} mode...`);

    // If replace mode, delete all existing lessons first
    if (mode === "replace") {
      console.log("Deleting all existing lessons...");
      const { error: deleteError } = await supabase
        .from("lessons")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: `Failed to delete existing lessons: ${deleteError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Deleted all existing lessons");
    }

    // Insert/upsert in batches
    const batchSize = 50;
    let totalImported = 0;
    
    for (let i = 0; i < lessons.length; i += batchSize) {
      const batch = lessons.slice(i, i + batchSize);
      
      const lessonsToInsert = batch.map((lesson) => ({
        datocms_id: lesson.datocms_id,
        video_upload_id: lesson.video_upload_id || lesson.datocms_id,
        name: lesson.name,
        kind: lesson.kind,
        order: lesson.order,
        level: lesson.level,
        cefr: lesson.cefr,
        summary: lesson.summary || { description: '', key_phrases: [], keywords: [] },
      }));

      let result;
      if (mode === "replace") {
        // In replace mode, just insert (we already deleted all)
        result = await supabase.from("lessons").insert(lessonsToInsert).select();
      } else {
        // In upsert mode, use upsert with conflict resolution
        result = await supabase
          .from("lessons")
          .upsert(lessonsToInsert, { onConflict: "datocms_id" })
          .select();
      }

      if (result.error) {
        console.error(`Batch ${i / batchSize + 1} error:`, result.error);
        return new Response(
          JSON.stringify({ 
            error: result.error.message,
            imported: totalImported,
            failedAt: i
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      totalImported += result.data?.length || 0;
      console.log(`Imported batch ${i / batchSize + 1}: ${result.data?.length} lessons (total: ${totalImported})`);
    }

    // Get final counts by level
    const { data: countData } = await supabase.from("lessons").select("level");
    const byLevel = countData?.reduce((acc: Record<string, number>, l: { level: string }) => {
      acc[l.level] = (acc[l.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    console.log(`Successfully imported ${totalImported} lessons`);
    console.log("By level:", byLevel);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: totalImported,
        byLevel,
        message: `Imported ${totalImported} lessons`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
