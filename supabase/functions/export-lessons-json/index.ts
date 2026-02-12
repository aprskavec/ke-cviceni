import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map CSV kind to internal kind
function mapKind(csvKind: string): string {
  const mapping: Record<string, string> = {
    'Words/Phrases': 'conversation',
    'Grammatical': 'grammar',
    'Informal': 'slang',
    'Pronunciation': 'pronunciation',
    'Idiom': 'idioms',
    'Idioms': 'idioms',
    'Phrasal verb': 'phrasal',
    'Conversational': 'conversation',
  };
  return mapping[csvKind] || 'conversation';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent } = await req.json();
    
    if (!csvContent) {
      return new Response(JSON.stringify({ error: 'Missing csvContent' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse markdown table format from document parser
    const lines = csvContent.split('\n').filter((l: string) => l.trim().startsWith('|'));
    
    // Skip header and separator lines
    const dataLines = lines.slice(2);
    
    const lessons: any[] = [];
    
    for (const line of dataLines) {
      // Split by pipe and remove empty first/last elements
      const cells = line.split('|').slice(1, -1).map((c: string) => c.trim());
      
      if (cells.length < 12) continue;
      
      const [
        id, // 0
        type, // 1
        order, // 2
        nameCs, // 3
        _nameEn, // 4
        _namePl, // 5
        _nameSk, // 6
        kind, // 7
        level, // 8
        cefr, // 9
        _conversationPrompt, // 10
        reelLink, // 11
        guidanceCs, // 12
      ] = cells;
      
      if (type !== 'item') continue;
      
      // Parse guidance.cs JSON for summary
      let summary = null;
      if (guidanceCs && guidanceCs.startsWith('{')) {
        try {
          // Clean up markdown formatting
          const cleanJson = guidanceCs
            .replace(/<br\/>/g, '')
            .replace(/\\_/g, '_')
            .replace(/\\\[/g, '[')
            .replace(/\\\]/g, ']')
            .replace(/\\"/g, '"');
          
          const parsed = JSON.parse(cleanJson);
          summary = {
            description: parsed.description || '',
            key_phrases: (parsed.key_phrases || []).map((p: any) => ({
              text_content: p.text_content || '',
              text_content_translation: p.text_content_translation || ''
            })),
            keywords: (parsed.keywords || []).map((k: any) => ({
              text_content: k.text_content || ''
            }))
          };
        } catch (e) {
          // Try to extract just description
          const descMatch = guidanceCs.match(/"description":\s*"([^"]+)"/);
          if (descMatch) {
            summary = {
              description: descMatch[1],
              key_phrases: [],
              keywords: []
            };
          }
        }
      }
      
      // Find meta.created_at (should be around index 40)
      let createdAt = '';
      for (let i = 40; i < Math.min(cells.length, 50); i++) {
        if (cells[i] && /^\d{4}-\d{2}-\d{2}T/.test(cells[i])) {
          createdAt = cells[i];
          break;
        }
      }
      
      lessons.push({
        id: reelLink || id, // Use reel_link as the primary ID (video ID)
        name: nameCs,
        kind: mapKind(kind),
        order: parseInt(order, 10),
        level: level || 'Zacatecnik',
        cefr: cefr || 'A1',
        createdAt,
        video_upload_id: reelLink || undefined,
        summary
      });
    }
    
    // Sort by order
    lessons.sort((a, b) => a.order - b.order);
    
    // Remove duplicates by id
    const seen = new Set();
    const uniqueLessons = lessons.filter(l => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    });
    
    return new Response(JSON.stringify({ 
      lessons: uniqueLessons,
      count: uniqueLessons.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
