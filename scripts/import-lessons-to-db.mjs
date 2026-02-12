/**
 * Parse DatoCMS CSV and import lessons to Supabase database
 * Run with: node scripts/import-lessons-to-db.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read CSV
const csvContent = readFileSync(join(__dirname, 'datocms-export.csv'), 'utf-8');

// Parse CSV to extract lesson data
function parseCSV(content) {
  const lessons = new Map(); // Use Map to dedupe by reel_link
  const lines = content.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Match line starting with 22-char ID followed by ,item,ORDER,
    const match = line.match(/^([A-Za-z0-9_-]{22}),item,(\d+),/);
    if (!match) continue;
    
    const [_, recordId, orderStr] = match;
    const order = parseInt(orderStr);
    
    // Parse the CSV line to extract fields
    let fields = [];
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
    
    // Fields: 0=id, 1=type, 2=order, 3=name.cs, 7=kind, 8=level, 9=cefr, 11=reel_link, 12=guidance.cs
    if (fields.length >= 12) {
      const name = fields[3]?.replace(/^"|"$/g, '').trim();
      const kind = fields[7]?.trim();
      const level = fields[8]?.trim();
      const cefr = fields[9]?.trim();
      const reelLink = fields[11]?.trim();
      const guidanceCs = fields[12]?.trim();
      
      // Only include valid lessons with proper level
      if (reelLink && reelLink.length === 22 && level && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
        // Parse guidance.cs JSON for summary
        let summary = { description: '', key_phrases: [], keywords: [] };
        
        if (guidanceCs && guidanceCs.startsWith('{')) {
          try {
            // Clean up the JSON string
            const cleanJson = guidanceCs
              .replace(/^\"|\"$/g, '')
              .replace(/\"\"/g, '"');
            summary = JSON.parse(cleanJson);
          } catch (e) {
            // Try to extract description at minimum
            const descMatch = guidanceCs.match(/"description"\s*:\s*"([^"]+)"/);
            if (descMatch) {
              summary.description = descMatch[1];
            }
          }
        }
        
        // Only add if not already present (first occurrence wins)
        if (!lessons.has(reelLink)) {
          lessons.set(reelLink, {
            datocms_id: recordId,
            video_upload_id: reelLink,
            name: name || 'Untitled',
            kind: kind || 'general',
            order,
            level,
            cefr: cefr || 'A1',
            summary
          });
        }
      }
    }
  }
  
  return Array.from(lessons.values());
}

const lessons = parseCSV(csvContent);

console.log(`Parsed ${lessons.length} lessons from CSV`);

// Group by level for stats
const byLevel = { Zacatecnik: 0, Pokrocily: 0, Frajeris: 0 };
lessons.forEach(l => byLevel[l.level]++);

console.log('\nDistribution:');
console.log(`  Zacatecnik: ${byLevel.Zacatecnik}`);
console.log(`  Pokrocily: ${byLevel.Pokrocily}`);
console.log(`  Frajeris: ${byLevel.Frajeris}`);

// Output as JSON for importing
const outputPath = join(__dirname, 'lessons-for-import.json');
import { writeFileSync } from 'fs';
writeFileSync(outputPath, JSON.stringify(lessons, null, 2));
console.log(`\nSaved to: ${outputPath}`);

// Show first few lessons as sample
console.log('\nSample lessons:');
lessons.slice(0, 3).forEach(l => {
  console.log(`  - ${l.name} (${l.level}/${l.cefr}, order: ${l.order})`);
});
