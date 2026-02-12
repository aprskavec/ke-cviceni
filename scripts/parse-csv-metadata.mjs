/**
 * Parse DatoCMS CSV export and extract lesson metadata
 * Run with: node scripts/parse-csv-metadata.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const csvContent = readFileSync(join(__dirname, 'datocms-export.csv'), 'utf-8');

// Pattern to match record start lines
// Format: ID,item,ORDER,name.cs,...,kind,level,cefr,...,reel_link,...
const recordPattern = /^([A-Za-z0-9_-]{22}),item,(\d+),"?([^"]*)"?,"?([^"]*)"?,"?([^"]*)"?,"?([^"]*)"?,([^,]*),([^,]*),([^,]*),/gm;

const lessons = new Map();

let match;
while ((match = recordPattern.exec(csvContent)) !== null) {
  const [_, id, order, nameCs, nameEn, namePl, nameSk, kind, level, cefr] = match;
  
  // Find reel_link (video_upload_id) - it's after the cefr field
  const lineStart = csvContent.lastIndexOf('\n', match.index) + 1;
  const lineEnd = csvContent.indexOf('\n', match.index + match[0].length);
  const fullLine = csvContent.substring(lineStart, lineEnd > 0 ? lineEnd : undefined);
  
  // reel_link is field 11 (0-indexed) - extract it
  // It's a 22 char ID like the record ID
  const reelLinkMatch = fullLine.match(/,([A-Za-z0-9_-]{22}),"\{/);
  const reelLink = reelLinkMatch ? reelLinkMatch[1] : null;
  
  // Find meta.created_at - it's near the end, format: 2024-06-14T13:36:43.170+01:00
  const createdAtMatch = csvContent.substring(match.index, match.index + 20000)
    .match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2})/);
  
  if (reelLink && level && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
    lessons.set(reelLink, {
      id,
      reelLink,
      order: parseInt(order),
      name: nameCs,
      kind,
      level,
      cefr,
      createdAt: createdAtMatch ? createdAtMatch[1] : null
    });
  }
}

console.log(`Found ${lessons.size} lessons with video IDs`);

// Convert to object for JSON output
const output = Object.fromEntries(lessons);

// Output JSON
writeFileSync(
  join(__dirname, 'lesson-metadata.json'),
  JSON.stringify(output, null, 2)
);

// Output TypeScript map
const tsContent = `// Auto-generated lesson metadata from DatoCMS CSV
// Generated: ${new Date().toISOString()}
// Maps reel_link (video_upload_id) to metadata

export type LessonLevel = 'Zacatecnik' | 'Pokrocily' | 'Frajeris';

export interface LessonMeta {
  level: LessonLevel;
  cefr: string;
  createdAt: string;
}

export const lessonMetadata: Record<string, LessonMeta> = {
${Array.from(lessons.values()).map(l => 
  `  "${l.reelLink}": { level: "${l.level}", cefr: "${l.cefr}", createdAt: "${l.createdAt || ''}" }`
).join(',\n')}
};

// Level display names
export const levelNames: Record<LessonLevel, string> = {
  Zacatecnik: "Začátečník",
  Pokrocily: "Pokročilý", 
  Frajeris: "Frajeris"
};

// Level to CEFR mapping
export const levelToCefr: Record<LessonLevel, string[]> = {
  Zacatecnik: ["A1", "A2"],
  Pokrocily: ["B1", "B2"],
  Frajeris: ["C1", "C2"]
};
`;

writeFileSync(
  join(__dirname, '../src/data/lessonMetadata.ts'),
  tsContent
);

console.log('Generated src/data/lessonMetadata.ts');

// Print sample
console.log('\nSample data:');
Array.from(lessons.values()).slice(0, 5).forEach(l => {
  console.log(`  ${l.name} - ${l.level} (${l.cefr}) - ${l.createdAt?.split('T')[0]}`);
});
