/**
 * Simple CSV parser for DatoCMS export
 * Extracts lessons by finding record boundaries
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function extractLessons(content) {
  const lessons = [];
  
  // Split by the pattern that starts each record: ID,item,order
  // DatoCMS IDs are 22 characters, base64-like
  const recordPattern = /^([a-zA-Z0-9_-]{22}),item,(\d+),/gm;
  
  let match;
  const recordStarts = [];
  
  while ((match = recordPattern.exec(content)) !== null) {
    recordStarts.push({
      index: match.index,
      id: match[1],
      order: parseInt(match[2], 10)
    });
  }
  
  console.log(`Found ${recordStarts.length} record starts`);
  
  // Extract each record
  for (let i = 0; i < recordStarts.length; i++) {
    const start = recordStarts[i].index;
    const end = i + 1 < recordStarts.length ? recordStarts[i + 1].index : content.length;
    const recordText = content.substring(start, end);
    
    try {
      const lesson = parseRecordSimple(recordText, recordStarts[i].id, recordStarts[i].order);
      if (lesson) {
        lessons.push(lesson);
      }
    } catch (e) {
      console.warn(`Failed to parse record ${i}:`, e.message);
    }
  }
  
  return lessons;
}

function parseRecordSimple(text, datocms_id, order) {
  // Extract name.cs - it's after order, and is the 4th field
  // id,type,order,name.cs,name.en,...
  const parts = text.split(',');
  const name = parts[3] || 'Unknown';
  
  // Find level (Zacatecnik, Pokrocily, Frajeris)
  let level = 'Zacatecnik';
  if (text.includes(',Pokrocily,')) level = 'Pokrocily';
  else if (text.includes(',Frajeris,')) level = 'Frajeris';
  
  // Find CEFR
  let cefr = 'A1';
  const cefrMatch = text.match(/,(A1|A2|B1|B2|C1|C2),/);
  if (cefrMatch) cefr = cefrMatch[1];
  
  // Find kind
  let kind = 'Other';
  if (text.includes(',Words/Phrases,')) kind = 'Words/Phrases';
  else if (text.includes(',Grammatical,')) kind = 'Grammatical';
  else if (text.includes(',Informal,')) kind = 'Informal';
  else if (text.includes(',Conversation,')) kind = 'Conversation';
  else if (text.includes(',Pronunciation,')) kind = 'Pronunciation';
  
  // Find video_upload_id (reel_link) - 22 char ID after the CEFR
  let video_upload_id = datocms_id;
  const afterCefr = text.indexOf(`,${cefr},`);
  if (afterCefr > 0) {
    const remainder = text.substring(afterCefr + cefr.length + 2);
    // Skip the conversation_prompt (which is in quotes and can be multiline)
    // Then find the reel_link ID
    const reelMatch = remainder.match(/",([a-zA-Z0-9_-]{22}),"/);
    if (reelMatch) {
      video_upload_id = reelMatch[1];
    }
  }
  
  // Extract guidance.cs JSON (Czech summary)
  let summary = { description: '', key_phrases: [], keywords: [] };
  
  // Find the first JSON block that has "description" - that's guidance.cs
  const jsonMatch = text.match(/"\{[\s\n]*"description":\s*"([^"]*)"/);
  if (jsonMatch) {
    // Try to extract the full JSON
    const jsonStart = text.indexOf('"{', text.indexOf(video_upload_id));
    if (jsonStart > 0) {
      // Find matching closing brace
      let depth = 0;
      let inString = false;
      let escaped = false;
      let jsonEnd = jsonStart + 1;
      
      for (let i = jsonStart + 1; i < text.length && i < jsonStart + 5000; i++) {
        const char = text[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          continue;
        }
        
        if (char === '"' && !escaped) {
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
        let jsonStr = text.substring(jsonStart + 1, jsonEnd);
        // Unescape double quotes
        jsonStr = jsonStr.replace(/""/g, '"');
        // Remove trailing quote if present
        if (jsonStr.endsWith('"')) jsonStr = jsonStr.slice(0, -1);
        summary = JSON.parse(jsonStr);
      } catch (e) {
        // Keep default empty summary
      }
    }
  }
  
  return {
    datocms_id,
    video_upload_id,
    name: name.replace(/^"|"$/g, ''), // Remove surrounding quotes
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
  let content;
  try {
    content = readFileSync(csvPath, 'utf-8');
  } catch (e) {
    console.error('❌ CSV file not found at', csvPath);
    process.exit(1);
  }
  
  console.log(`📄 File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n🔍 Parsing CSV...');
  const lessons = extractLessons(content);
  
  console.log(`\n📊 Parsed ${lessons.length} lessons:`);
  
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
  
  // Check how many have summary data
  const withSummary = lessons.filter(l => l.summary?.description).length;
  console.log(`With summary: ${withSummary} / ${lessons.length}`);
  
  // Show sample lessons
  console.log('\n📝 Sample lessons:');
  
  ['Zacatecnik', 'Pokrocily', 'Frajeris'].forEach(level => {
    const sample = lessons.filter(l => l.level === level).slice(0, 2);
    console.log(`\n  ${level}:`);
    sample.forEach(l => {
      console.log(`    - [${l.order}] ${l.name} (${l.kind}, ${l.cefr})`);
      console.log(`      Summary: ${l.summary?.description?.substring(0, 50) || '(empty)'}...`);
    });
  });
  
  // Save to JSON
  const outputPath = join(__dirname, 'lessons-parsed.json');
  writeFileSync(outputPath, JSON.stringify(lessons, null, 2));
  console.log(`\n✅ Saved to ${outputPath}`);
  
  return lessons;
}

main().catch(console.error);
