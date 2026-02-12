/**
 * Parse DatoCMS CSV export and import lessons to Supabase
 * 
 * Usage: 
 *   node scripts/parse-and-import-lessons.mjs
 * 
 * Or import in browser console from debug page
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse CSV with multi-line JSON fields
function parseCSVWithMultilineJSON(content) {
  const lessons = [];
  const lines = content.split('\n');
  
  // Skip header
  let i = 1;
  
  while (i < lines.length) {
    // Find the start of a record (starts with a DatoCMS ID pattern)
    const line = lines[i];
    if (!line || !line.match(/^[a-zA-Z0-9_-]{22},item,/)) {
      i++;
      continue;
    }
    
    // Collect all lines until the next record starts
    let recordLines = [line];
    i++;
    
    while (i < lines.length && !lines[i].match(/^[a-zA-Z0-9_-]{22},item,/)) {
      recordLines.push(lines[i]);
      i++;
    }
    
    // Join and parse the record
    const fullRecord = recordLines.join('\n');
    
    try {
      const lesson = parseRecord(fullRecord);
      if (lesson) {
        lessons.push(lesson);
      }
    } catch (e) {
      console.warn('Failed to parse record:', e.message);
    }
  }
  
  return lessons;
}

function parseRecord(record) {
  // Extract fields using regex
  const idMatch = record.match(/^([a-zA-Z0-9_-]{22}),item,(\d+),/);
  if (!idMatch) return null;
  
  const datocms_id = idMatch[1];
  const order = parseInt(idMatch[2], 10);
  
  // Extract name.cs (after order, before next comma outside quotes)
  const afterOrder = record.substring(record.indexOf(`,${order},`) + `,${order},`.length);
  const nameMatch = afterOrder.match(/^([^,]+),/);
  const name = nameMatch ? nameMatch[1] : 'Unknown';
  
  // Extract kind, level, cefr
  const kindMatch = record.match(/,(Words\/Phrases|Grammatical|Informal|Conversation|Pronunciation),/);
  const kind = kindMatch ? kindMatch[1] : 'Other';
  
  const levelMatch = record.match(/,(Zacatecnik|Pokrocily|Frajeris),/);
  const level = levelMatch ? levelMatch[1] : 'Zacatecnik';
  
  const cefrMatch = record.match(/,(A1|A2|B1|B2|C1|C2),/);
  const cefr = cefrMatch ? cefrMatch[1] : 'A1';
  
  // Extract reel_link (video ID) - it's after the conversation_prompt
  const reelMatch = record.match(/,([a-zA-Z0-9_-]{22}),"\{[\s\S]*?"description"/);
  const video_upload_id = reelMatch ? reelMatch[1] : datocms_id;
  
  // Extract guidance.cs JSON (the Czech summary)
  const guidanceMatch = record.match(/,"\{[\s\n]*"description"[\s\S]*?"keywords"[\s\S]*?\}"/);
  let summary = { description: '', key_phrases: [], keywords: [] };
  
  if (guidanceMatch) {
    try {
      // Clean up the JSON string
      let jsonStr = guidanceMatch[0].substring(2, guidanceMatch[0].length - 1); // Remove leading ," and trailing "
      jsonStr = jsonStr.replace(/""/g, '"'); // Unescape double quotes
      
      // Find the first complete JSON object
      const jsonStart = jsonStr.indexOf('{');
      let braceCount = 0;
      let jsonEnd = jsonStart;
      
      for (let i = jsonStart; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') braceCount++;
        if (jsonStr[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
      
      const cleanJson = jsonStr.substring(jsonStart, jsonEnd);
      summary = JSON.parse(cleanJson);
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
  console.log('📂 Reading CSV file...');
  
  const csvPath = join(__dirname, 'datocms-full-export.csv');
  const content = readFileSync(csvPath, 'utf-8');
  
  console.log('🔍 Parsing CSV...');
  const lessons = parseCSVWithMultilineJSON(content);
  
  console.log(`\n📊 Found ${lessons.length} lessons:`);
  
  const byLevel = lessons.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {});
  console.log('By level:', byLevel);
  
  const byKind = lessons.reduce((acc, l) => {
    acc[l.kind] = (acc[l.kind] || 0) + 1;
    return acc;
  }, {});
  console.log('By kind:', byKind);
  
  // Show first few lessons
  console.log('\nFirst 3 lessons:');
  lessons.slice(0, 3).forEach(l => {
    console.log(`  - [${l.order}] ${l.name} (${l.level}, ${l.cefr})`);
    console.log(`    Summary: ${l.summary.description?.substring(0, 60)}...`);
    console.log(`    Key phrases: ${l.summary.key_phrases?.length || 0}, Keywords: ${l.summary.keywords?.length || 0}`);
  });
  
  // Output JSON for import
  const outputPath = join(__dirname, 'lessons-for-import.json');
  const { writeFileSync } = await import('fs');
  writeFileSync(outputPath, JSON.stringify(lessons, null, 2));
  console.log(`\n✅ Saved ${lessons.length} lessons to ${outputPath}`);
  
  // Now call the edge function to import
  console.log('\n📤 Calling import edge function...');
  
  const SUPABASE_URL = 'https://lgccnltkrnolbzwybnio.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY2NubHRrcm5vbGJ6d3libmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDMyNDUsImV4cCI6MjA4NTE3OTI0NX0.brwvY1Z2sHuoPOm7AAv4DC_xRfZAhjRvd2FX15eFWC0';
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-lessons-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ lessons })
    });
    
    const result = await response.json();
    console.log('Import result:', result);
  } catch (e) {
    console.error('Import failed:', e.message);
    console.log('You can manually import using the JSON file');
  }
}

main().catch(console.error);
