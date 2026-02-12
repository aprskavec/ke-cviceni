/**
 * Parse DatoCMS CSV export with multiline JSON fields
 * Works in browser and Node.js
 */

export interface ParsedLesson {
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

export function parseDatoCmsCSV(content: string): ParsedLesson[] {
  const lessons: ParsedLesson[] = [];
  
  // Find all record starts using pattern: DatoCMS_ID,item,ORDER,
  // DatoCMS IDs are 22 characters, base64-url-safe
  const recordPattern = /^([a-zA-Z0-9_-]{22}),item,(\d+),/gm;
  
  const recordStarts: Array<{ index: number; id: string; order: number }> = [];
  let match;
  
  while ((match = recordPattern.exec(content)) !== null) {
    recordStarts.push({
      index: match.index,
      id: match[1],
      order: parseInt(match[2], 10)
    });
  }
  
  console.log(`Found ${recordStarts.length} records in CSV`);
  
  // Extract each record
  for (let i = 0; i < recordStarts.length; i++) {
    const start = recordStarts[i].index;
    const end = i + 1 < recordStarts.length ? recordStarts[i + 1].index : content.length;
    const record = content.substring(start, end);
    
    try {
      const lesson = parseRecord(record, recordStarts[i].id, recordStarts[i].order);
      if (lesson) {
        lessons.push(lesson);
      }
    } catch (e) {
      console.warn(`Failed to parse record ${i} (order ${recordStarts[i].order}):`, e);
    }
  }
  
  return lessons;
}

function parseRecord(record: string, datocms_id: string, order: number): ParsedLesson | null {
  // Extract name.cs (4th comma-separated field after ID,item,order)
  const headerMatch = record.match(/^[^,]+,item,\d+,([^,]+),/);
  let name = headerMatch ? headerMatch[1] : 'Unknown';
  // Remove quotes if present
  name = name.replace(/^"|"$/g, '');
  
  // Extract level
  let level = 'Zacatecnik';
  if (record.includes(',Pokrocily,')) level = 'Pokrocily';
  else if (record.includes(',Frajeris,')) level = 'Frajeris';
  
  // Extract CEFR
  let cefr = 'A1';
  const cefrMatch = record.match(/,(A1|A2|B1|B2|C1|C2),/);
  if (cefrMatch) cefr = cefrMatch[1];
  
  // Extract kind
  let kind = 'Other';
  const kindOptions = ['Words/Phrases', 'Grammatical', 'Informal', 'Conversation', 'Conversational', 'Pronunciation'];
  for (const k of kindOptions) {
    if (record.includes(`,${k},`)) {
      kind = k;
      break;
    }
  }
  
  // Extract video_upload_id (reel_link) - 22 char ID before the first JSON
  let video_upload_id = datocms_id;
  // Look for pattern: ,ID,"{  where ID is 22 chars
  const reelPattern = /,([a-zA-Z0-9_-]{22}),"\{/;
  const reelMatch = record.match(reelPattern);
  if (reelMatch) {
    video_upload_id = reelMatch[1];
  }
  
  // Extract summary (guidance.cs - first JSON with "description")
  let summary = {
    description: '',
    key_phrases: [] as Array<{ text_content: string; text_content_translation: string }>,
    keywords: [] as Array<{ text_content: string; text_content_translation: string }>
  };
  
  // Find first JSON block starting with {"description"
  const jsonStartIdx = record.indexOf(',"{');
  if (jsonStartIdx > 0) {
    // Find the complete JSON by counting braces
    let depth = 0;
    let inString = false;
    let prevChar = '';
    let jsonEnd = jsonStartIdx + 3;
    
    for (let i = jsonStartIdx + 2; i < record.length && i < jsonStartIdx + 8000; i++) {
      const char = record[i];
      
      // Handle escape sequences
      if (prevChar === '\\') {
        prevChar = '';
        continue;
      }
      
      if (char === '\\') {
        prevChar = char;
        continue;
      }
      
      // Handle quotes (including escaped "")
      if (char === '"') {
        // Check for CSV-escaped quote ""
        if (record[i + 1] === '"') {
          i++; // Skip the escaped quote
          prevChar = '';
          continue;
        }
        inString = !inString;
        prevChar = char;
        continue;
      }
      
      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
          depth--;
          if (depth === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      prevChar = char;
    }
    
    try {
      let jsonStr = record.substring(jsonStartIdx + 2, jsonEnd);
      // Unescape CSV double quotes
      jsonStr = jsonStr.replace(/""/g, '"');
      // Remove trailing quote if present
      if (jsonStr.endsWith('"')) {
        jsonStr = jsonStr.slice(0, -1);
      }
      
      const parsed = JSON.parse(jsonStr);
      if (parsed.description !== undefined) {
        summary = {
          description: parsed.description || '',
          key_phrases: parsed.key_phrases || [],
          keywords: parsed.keywords || []
        };
      }
    } catch (e) {
      // Keep default empty summary
      console.warn(`Failed to parse JSON for ${name}:`, e);
    }
  }
  
  return {
    datocms_id,
    video_upload_id,
    name,
    kind,
    order,
    level,
    cefr,
    summary
  };
}

export function getLessonStats(lessons: ParsedLesson[]) {
  const byLevel = lessons.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byKind = lessons.reduce((acc, l) => {
    acc[l.kind] = (acc[l.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const withSummary = lessons.filter(l => l.summary?.description).length;
  
  return { byLevel, byKind, withSummary, total: lessons.length };
}
