/**
 * Parse DatoCMS CSV and import all 151 lessons to Supabase
 * 
 * Run with: npx tsx scripts/import-all-lessons.ts
 */

interface Lesson {
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

// Parse the CSV content
function parseCSV(content: string): Lesson[] {
  const lessons: Lesson[] = [];
  const lines = content.split('\n');
  
  // Find all record starts (DatoCMS ID pattern at start of line)
  const recordStartPattern = /^([a-zA-Z0-9_-]{22}),item,(\d+),/;
  
  let i = 1; // Skip header
  while (i < lines.length) {
    const match = lines[i].match(recordStartPattern);
    if (!match) {
      i++;
      continue;
    }
    
    const datocms_id = match[1];
    const order = parseInt(match[2], 10);
    
    // Collect all lines until next record
    const recordLines: string[] = [lines[i]];
    i++;
    
    while (i < lines.length && !lines[i].match(recordStartPattern)) {
      recordLines.push(lines[i]);
      i++;
    }
    
    const record = recordLines.join('\n');
    
    try {
      const lesson = parseRecord(record, datocms_id, order);
      if (lesson) {
        lessons.push(lesson);
      }
    } catch (e) {
      console.warn(`Failed to parse lesson at order ${order}:`, e);
    }
  }
  
  return lessons;
}

function parseRecord(record: string, datocms_id: string, order: number): Lesson | null {
  // Extract name.cs (4th field)
  const nameMatch = record.match(/,item,\d+,([^,]+),/);
  const name = nameMatch ? nameMatch[1].replace(/^"|"$/g, '') : 'Unknown';
  
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
  const kindMatch = record.match(/,(Words\/Phrases|Grammatical|Informal|Conversation|Conversational|Pronunciation),/);
  if (kindMatch) kind = kindMatch[1];
  
  // Extract video_upload_id (reel_link)
  let video_upload_id = datocms_id;
  const reelMatch = record.match(/,([a-zA-Z0-9_-]{22}),"\{[\s\n]*"description"/);
  if (reelMatch) video_upload_id = reelMatch[1];
  
  // Extract summary (guidance.cs JSON)
  let summary = { description: '', key_phrases: [] as any[], keywords: [] as any[] };
  
  // Find the first JSON block with description
  const jsonStart = record.indexOf(',"{');
  if (jsonStart > 0) {
    // Find matching end
    let depth = 0;
    let inString = false;
    let escaped = false;
    let jsonEnd = jsonStart + 2;
    
    for (let i = jsonStart + 2; i < record.length && i < jsonStart + 5000; i++) {
      const char = record[i];
      
      if (escaped) {
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (char === '"' && record[i-1] !== '\\') {
        // Check for escaped quote ""
        if (record[i+1] === '"') {
          i++; // Skip escaped quote
          continue;
        }
        inString = !inString;
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
    }
    
    try {
      let jsonStr = record.substring(jsonStart + 2, jsonEnd);
      // Unescape double quotes
      jsonStr = jsonStr.replace(/""/g, '"');
      summary = JSON.parse(jsonStr);
    } catch (e) {
      // Keep default empty summary
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

async function main() {
  const fs = await import('fs');
  const path = await import('path');
  
  const csvPath = path.join(process.cwd(), 'scripts', 'datocms-full-export.csv');
  console.log('📂 Reading CSV from:', csvPath);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  console.log(`📄 File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n🔍 Parsing...');
  const lessons = parseCSV(content);
  
  console.log(`\n📊 Parsed ${lessons.length} lessons`);
  
  // Count by level
  const byLevel = lessons.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('By level:', byLevel);
  
  // Count with summary
  const withSummary = lessons.filter(l => l.summary?.description).length;
  console.log(`With summary: ${withSummary}/${lessons.length}`);
  
  // Save JSON for inspection
  const jsonPath = path.join(process.cwd(), 'scripts', 'lessons-for-import.json');
  fs.writeFileSync(jsonPath, JSON.stringify(lessons, null, 2));
  console.log(`\n💾 Saved to ${jsonPath}`);
  
  // Import to Supabase
  console.log('\n📤 Importing to Supabase...');
  
  const SUPABASE_URL = 'https://lgccnltkrnolbzwybnio.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY2NubHRrcm5vbGJ6d3libmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDMyNDUsImV4cCI6MjA4NTE3OTI0NX0.brwvY1Z2sHuoPOm7AAv4DC_xRfZAhjRvd2FX15eFWC0';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-lessons-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ lessons, mode: 'replace' })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Import successful:', result);
    } else {
      console.error('❌ Import failed:', result);
    }
  } catch (e) {
    console.error('❌ Network error:', e);
  }
}

main().catch(console.error);
