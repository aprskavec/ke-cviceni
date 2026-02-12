/**
 * Script to extract lesson metadata from DatoCMS CSV export
 * Run with: npx tsx scripts/extract-lesson-metadata.ts
 * 
 * This script parses the CSV, extracts level, cefr, and createdAt,
 * and outputs JSON that can be merged with lessons.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// CSV structure (key columns):
// 0: id (DatoCMS ID)
// 2: order
// 3: name.cs
// 7: kind
// 8: level (Zacatecnik, Pokrocily, Frajeris)
// 9: cefr (A1, A2, B1, B2, C1)
// 11: reel_link (video_upload_id - THIS IS OUR KEY TO MATCH)
// 40: meta.created_at

interface LessonMetadata {
  videoUploadId: string;
  level: 'Zacatecnik' | 'Pokrocily' | 'Frajeris';
  cefr: string;
  createdAt: string;
  order: number;
  name: string;
}

// Read the CSV file - this needs to be copied to the scripts folder first
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx tsx scripts/extract-lesson-metadata.ts <path-to-csv>');
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf-8');

// The CSV has multi-line JSON in cells, so we need a different approach
// We'll look for lines that START with an ID pattern (not starting with quote or whitespace)
// These are the "header" lines of each record

const lessons: LessonMetadata[] = [];
const lines = csvContent.split('\n');

// Pattern to match the start of a record (ID followed by ,item,)
const recordStartPattern = /^([A-Za-z0-9_-]{22}),item,(\d+),/;

for (let i = 1; i < lines.length; i++) { // Skip header row
  const line = lines[i];
  const match = line.match(recordStartPattern);
  
  if (match) {
    // This is a record start line
    // Need to find the end of this record (the metadata at the end)
    // Look for the pattern with meta.created_at
    
    // Find the full record by looking ahead until we find the metadata line
    let fullRecord = line;
    let j = i + 1;
    
    // The metadata is at the end of the record, on a line ending with the meta fields
    // Pattern: ...Y7aybpV_QVyIIWcki4WD1A,item_type,...,DATETIME,...
    while (j < lines.length && !recordStartPattern.test(lines[j])) {
      fullRecord += '\n' + lines[j];
      j++;
    }
    
    // Now parse the first line to get key fields
    // Split by comma but respect quotes
    const firstLineParts = parseCSVLine(line);
    
    if (firstLineParts.length >= 12) {
      const id = firstLineParts[0];
      const order = parseInt(firstLineParts[2]) || 0;
      const name = firstLineParts[3];
      const kind = firstLineParts[7];
      const level = firstLineParts[8] as 'Zacatecnik' | 'Pokrocily' | 'Frajeris';
      const cefr = firstLineParts[9];
      const videoUploadId = firstLineParts[11];
      
      // Find meta.created_at from the end of the full record
      // It's in the format: 2024-06-14T13:36:43.170+01:00
      const createdAtMatch = fullRecord.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+\d{2}:\d{2})/);
      const createdAt = createdAtMatch ? createdAtMatch[1] : '';
      
      if (videoUploadId && videoUploadId.length > 10 && level) {
        lessons.push({
          videoUploadId,
          level,
          cefr,
          createdAt,
          order,
          name
        });
      }
    }
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// Sort by createdAt (newest first for display)
lessons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

console.log(`Found ${lessons.length} lessons with video IDs`);
console.log('\nSample data:');
lessons.slice(0, 5).forEach(l => {
  console.log(`  ${l.name} - ${l.level} (${l.cefr}) - ${l.createdAt}`);
});

// Output as JSON
const outputPath = path.join(path.dirname(csvPath), 'lesson-metadata.json');
fs.writeFileSync(outputPath, JSON.stringify(lessons, null, 2));
console.log(`\nSaved to: ${outputPath}`);

// Also output as a TypeScript map for easy merging
const tsMapOutput = `// Auto-generated lesson metadata from DatoCMS
// Maps video_upload_id to metadata

export const lessonMetadata: Record<string, { level: string; cefr: string; createdAt: string }> = {
${lessons.map(l => `  "${l.videoUploadId}": { level: "${l.level}", cefr: "${l.cefr}", createdAt: "${l.createdAt}" }`).join(',\n')}
};
`;

const tsPath = path.join(path.dirname(csvPath), 'lesson-metadata.ts');
fs.writeFileSync(tsPath, tsMapOutput);
console.log(`Saved TypeScript map to: ${tsPath}`);
