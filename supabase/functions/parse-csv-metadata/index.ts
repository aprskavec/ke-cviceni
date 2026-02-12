// Edge function to parse DatoCMS CSV and extract lesson metadata
// POST body should contain the CSV content

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LessonMeta {
  id: string;
  reelLink: string;
  order: number;
  name: string;
  kind: string;
  level: string;
  cefr: string;
  createdAt: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const csvContent = await req.text();
    
    if (!csvContent || csvContent.length < 100) {
      return new Response(
        JSON.stringify({ error: 'CSV content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lessons: LessonMeta[] = [];
    
    // Pattern to match record start lines
    // Format: ID,item,ORDER,name.cs,...,kind,level,cefr,...,reel_link,...
    // Columns: 0=id, 2=order, 3=name.cs, 7=kind, 8=level, 9=cefr, 11=reel_link
    const recordStartPattern = /^([A-Za-z0-9_-]{22}),item,(\d+),/gm;
    
    let match;
    while ((match = recordStartPattern.exec(csvContent)) !== null) {
      const lineStart = match.index;
      const lineEnd = csvContent.indexOf('\n', lineStart);
      const line = csvContent.substring(lineStart, lineEnd > 0 ? lineEnd : undefined);
      
      // Parse CSV line respecting quotes
      const fields = parseCSVLine(line);
      
      if (fields.length >= 12) {
        const id = fields[0];
        const order = parseInt(fields[2]) || 0;
        const name = fields[3]?.replace(/^"|"$/g, '');
        const kind = fields[7];
        const level = fields[8];
        const cefr = fields[9];
        const reelLink = fields[11];
        
        // Find meta.created_at - search forward from this line
        const metaSection = csvContent.substring(lineStart, lineStart + 30000);
        const createdAtMatch = metaSection.match(/,(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}),/);
        const createdAt = createdAtMatch ? createdAtMatch[1] : '';
        
        // Only include records with valid level values
        if (reelLink && reelLink.length >= 20 && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
          lessons.push({
            id,
            reelLink,
            order,
            name,
            kind,
            level,
            cefr,
            createdAt
          });
        }
      }
    }
    
    // Sort by order
    lessons.sort((a, b) => a.order - b.order);
    
    // Generate TypeScript code for lessonMetadata
    const tsCode = generateTypeScriptMap(lessons);
    
    // Generate lesson updates (to add to lessons.ts)
    const lessonUpdates = lessons.reduce((acc, l) => {
      acc[l.reelLink] = {
        level: l.level,
        cefr: l.cefr,
        createdAt: l.createdAt
      };
      return acc;
    }, {} as Record<string, { level: string; cefr: string; createdAt: string }>);

    return new Response(
      JSON.stringify({
        count: lessons.length,
        lessons: lessons,
        metadata: lessonUpdates,
        tsCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error parsing CSV:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  result.push(current);
  
  return result;
}

function generateTypeScriptMap(lessons: LessonMeta[]): string {
  const entries = lessons.map(l => 
    `  "${l.reelLink}": { level: "${l.level}" as const, cefr: "${l.cefr}", createdAt: "${l.createdAt}" }`
  ).join(',\n');
  
  return `// Auto-generated lesson metadata from DatoCMS
// Generated: ${new Date().toISOString()}
// Total lessons: ${lessons.length}

export const lessonMetadataMap: Record<string, { level: 'Zacatecnik' | 'Pokrocily' | 'Frajeris'; cefr: string; createdAt: string }> = {
${entries}
};
`;
}
