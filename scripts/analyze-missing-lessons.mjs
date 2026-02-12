/**
 * Analyze missing lessons by comparing CSV with lessons.ts
 * Run with: node scripts/analyze-missing-lessons.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read CSV
const csvContent = readFileSync(join(__dirname, 'datocms-export.csv'), 'utf-8');

// Read lessons.ts to get existing IDs
const lessonsContent = readFileSync(join(__dirname, '../src/data/lessons.ts'), 'utf-8');

// Extract all lesson IDs from lessons.ts (both id and video_upload_id)
const existingIds = new Set();
const idMatches = lessonsContent.matchAll(/id:\s*["']([A-Za-z0-9_-]{22})["']/g);
for (const match of idMatches) {
  existingIds.add(match[1]);
}
const videoIdMatches = lessonsContent.matchAll(/video_upload_id:\s*["']([A-Za-z0-9_-]{22})["']/g);
for (const match of videoIdMatches) {
  existingIds.add(match[1]);
}

console.log(`Found ${existingIds.size} unique IDs in lessons.ts`);

// Parse CSV to extract lessons
// Pattern: ID,item,ORDER,name.cs,...,kind,level,cefr,...,reel_link,...
const lines = csvContent.split('\n');
const csvLessons = [];

// Match lines that start with a record (22 char ID, then ",item,")
const recordPattern = /^([A-Za-z0-9_-]{22}),item,(\d+),"?([^"]*)"?,/;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(recordPattern);
  
  if (match) {
    const [_, recordId, order, nameCs] = match;
    
    // Parse the line more carefully to extract fields
    // Fields: id, type, order, name.cs, name.en, name.pl, name.sk, kind, level, cefr, conversation_prompt, reel_link
    const parts = parseCSVLine(line);
    
    if (parts.length >= 12) {
      const kind = parts[7];
      const level = parts[8];
      const cefr = parts[9];
      const reelLink = parts[11]; // reel_link is the video_upload_id
      
      if (reelLink && reelLink.length === 22 && level && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
        csvLessons.push({
          recordId,
          reelLink,
          order: parseInt(order),
          name: nameCs,
          kind,
          level,
          cefr
        });
      }
    }
  }
}

// Simple CSV line parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let braceDepth = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    
    if (char === '"' && braceDepth === 0) {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes && braceDepth === 0) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

console.log(`Found ${csvLessons.length} lessons in CSV with valid level/cefr`);

// Find missing lessons
const missingLessons = csvLessons.filter(lesson => {
  // Check if either recordId or reelLink exists in our data
  return !existingIds.has(lesson.recordId) && !existingIds.has(lesson.reelLink);
});

console.log(`\n=== MISSING LESSONS (${missingLessons.length}) ===`);

// Group by level
const byLevel = { Zacatecnik: [], Pokrocily: [], Frajeris: [] };
for (const lesson of missingLessons) {
  byLevel[lesson.level].push(lesson);
}

for (const [level, lessons] of Object.entries(byLevel)) {
  if (lessons.length > 0) {
    console.log(`\n--- ${level} (${lessons.length} missing) ---`);
    lessons.sort((a, b) => a.order - b.order);
    for (const l of lessons) {
      console.log(`  Order ${l.order}: "${l.name}" (${l.cefr}) - reel_link: ${l.reelLink}`);
    }
  }
}

// Also check for duplicates in our data
const idCounts = {};
const allIdMatches = lessonsContent.matchAll(/id:\s*["']([A-Za-z0-9_-]{22})["']/g);
for (const match of allIdMatches) {
  idCounts[match[1]] = (idCounts[match[1]] || 0) + 1;
}

const duplicates = Object.entries(idCounts).filter(([_, count]) => count > 1);
if (duplicates.length > 0) {
  console.log(`\n=== DUPLICATE IDs IN lessons.ts ===`);
  for (const [id, count] of duplicates) {
    console.log(`  ${id}: appears ${count} times`);
  }
}

// Summary
console.log(`\n=== SUMMARY ===`);
console.log(`CSV lessons: ${csvLessons.length}`);
console.log(`Existing IDs in lessons.ts: ${existingIds.size}`);
console.log(`Missing lessons: ${missingLessons.length}`);
console.log(`  - Zacatecnik: ${byLevel.Zacatecnik.length}`);
console.log(`  - Pokrocily: ${byLevel.Pokrocily.length}`);
console.log(`  - Frajeris: ${byLevel.Frajeris.length}`);
