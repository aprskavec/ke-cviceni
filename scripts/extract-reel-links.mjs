/**
 * Extract all reel_links from CSV and compare with metadata
 * Run with: node scripts/extract-reel-links.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read CSV
const csvContent = readFileSync(join(__dirname, 'datocms-export.csv'), 'utf-8');

// Read metadata file
const metadataContent = readFileSync(join(__dirname, '../src/data/lessonMetadata.ts'), 'utf-8');

// Extract all IDs from metadata (they're the keys in lessonMetadataMap)
const metadataIds = new Set();
const metaMatches = metadataContent.matchAll(/"([A-Za-z0-9_-]{22})":\s*\{/g);
for (const match of metaMatches) {
  metadataIds.add(match[1]);
}
console.log(`Metadata has ${metadataIds.size} unique IDs`);

// Parse CSV - find all lines with lesson data
// Pattern: RecordID,item,ORDER,name.cs,...,kind,level,cefr,prompt,reel_link,...
const lessons = [];
const lines = csvContent.split('\n');

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  
  // Match line starting with 22-char ID followed by ,item,ORDER,
  const match = line.match(/^([A-Za-z0-9_-]{22}),item,(\d+),/);
  if (!match) continue;
  
  const [_, recordId, orderStr] = match;
  const order = parseInt(orderStr);
  
  // Parse the CSV line to extract fields
  const fields = [];
  let current = '';
  let inQuotes = false;
  let braceDepth = 0;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
    
    if (char === '"' && braceDepth === 0) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes && braceDepth === 0) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  
  // Fields: 0=id, 1=type, 2=order, 3=name.cs, 7=kind, 8=level, 9=cefr, 11=reel_link
  if (fields.length >= 12) {
    const name = fields[3]?.replace(/^"|"$/g, '');
    const kind = fields[7];
    const level = fields[8];
    const cefr = fields[9];
    const reelLink = fields[11];
    
    if (reelLink && reelLink.length === 22 && level && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
      lessons.push({ recordId, order, name, kind, level, cefr, reelLink });
    }
  }
}

console.log(`CSV has ${lessons.length} valid lessons`);

// Find missing lessons (not in metadata)
const missing = lessons.filter(l => !metadataIds.has(l.reelLink));

console.log(`\n=== MISSING FROM METADATA (${missing.length}) ===`);

// Group by level
const byLevel = { Zacatecnik: [], Pokrocily: [], Frajeris: [] };
for (const l of missing) {
  byLevel[l.level].push(l);
}

for (const [level, list] of Object.entries(byLevel)) {
  if (list.length > 0) {
    list.sort((a, b) => a.order - b.order);
    console.log(`\n--- ${level} (${list.length} missing) ---`);
    for (const l of list) {
      console.log(`  Order ${l.order}: "${l.name}" (${l.cefr}) - ${l.reelLink}`);
    }
  }
}

// Output to JSON for later use
writeFileSync(
  join(__dirname, 'missing-lessons.json'),
  JSON.stringify(missing, null, 2)
);

console.log(`\nSaved to scripts/missing-lessons.json`);

// Also check for extra IDs in metadata that are not in CSV
const csvReelLinks = new Set(lessons.map(l => l.reelLink));
const extraInMetadata = [...metadataIds].filter(id => !csvReelLinks.has(id));
if (extraInMetadata.length > 0) {
  console.log(`\n=== EXTRA IN METADATA (not in CSV): ${extraInMetadata.length} ===`);
  for (const id of extraInMetadata.slice(0, 10)) {
    console.log(`  ${id}`);
  }
  if (extraInMetadata.length > 10) {
    console.log(`  ... and ${extraInMetadata.length - 10} more`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`CSV lessons: ${lessons.length}`);
console.log(`Metadata IDs: ${metadataIds.size}`);
console.log(`Missing from metadata: ${missing.length}`);
console.log(`  Zacatecnik: ${byLevel.Zacatecnik.length}`);
console.log(`  Pokrocily: ${byLevel.Pokrocily.length}`);
console.log(`  Frajeris: ${byLevel.Frajeris.length}`);
