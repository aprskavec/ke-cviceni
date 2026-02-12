/**
 * Extract all lessons from CSV and generate complete metadata
 * Run with: node scripts/generate-complete-metadata.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read CSV
const csvContent = readFileSync(join(__dirname, 'datocms-export.csv'), 'utf-8');

// Parse CSV - extract lesson data
// CSV header: id,type,order,name.cs,name.en,name.pl,name.sk,kind,level,cefr,conversation_prompt,reel_link,...
const lessons = new Map(); // Use Map to dedupe by reel_link

const lines = csvContent.split('\n');

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
  
  // Fields: 0=id, 1=type, 2=order, 3=name.cs, 7=kind, 8=level, 9=cefr, 11=reel_link
  if (fields.length >= 12) {
    const name = fields[3]?.replace(/^"|"$/g, '');
    const kind = fields[7];
    const level = fields[8];
    const cefr = fields[9];
    const reelLink = fields[11];
    
    if (reelLink && reelLink.length === 22 && level && ['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(level)) {
      // Only add if not already present (first occurrence wins)
      if (!lessons.has(reelLink)) {
        lessons.set(reelLink, { recordId, order, name, kind, level, cefr, reelLink });
      }
    }
  }
}

console.log(`Found ${lessons.size} unique lessons in CSV`);

// Group by level
const byLevel = { Zacatecnik: [], Pokrocily: [], Frajeris: [] };
for (const l of lessons.values()) {
  byLevel[l.level].push(l);
}

// Sort each level by order
for (const level of Object.keys(byLevel)) {
  byLevel[level].sort((a, b) => a.order - b.order);
}

console.log(`\nDistribution:`);
console.log(`  Zacatecnik: ${byLevel.Zacatecnik.length}`);
console.log(`  Pokrocily: ${byLevel.Pokrocily.length}`);
console.log(`  Frajeris: ${byLevel.Frajeris.length}`);

// Generate TypeScript metadata file
const generateMetadata = () => {
  let output = `// Lesson metadata from DatoCMS CSV export
// Maps lesson ID (reel_link) to level, cefr, and createdAt
// Generated: ${new Date().toISOString()}

export type LessonLevel = 'Zacatecnik' | 'Pokrocily' | 'Frajeris';

export interface LessonMeta {
  level: LessonLevel;
  cefr: string;
  createdAt: string;
  order: number;
}

// Extracted from DatoCMS CSV - reel_link → metadata mapping
// All ${lessons.size} lessons from CSV export
export const lessonMetadataMap: Record<string, LessonMeta> = {
`;

  // Add Zacatecnik
  output += `  // === ZACATECNIK (A1-A2) - ${byLevel.Zacatecnik.length} lessons ===\n`;
  for (const l of byLevel.Zacatecnik) {
    output += `  "${l.reelLink}": { level: "Zacatecnik", cefr: "${l.cefr}", createdAt: "", order: ${l.order} }, // ${l.name}\n`;
  }
  
  // Add Pokrocily
  output += `\n  // === POKROCILY (B1-B2) - ${byLevel.Pokrocily.length} lessons ===\n`;
  for (const l of byLevel.Pokrocily) {
    output += `  "${l.reelLink}": { level: "Pokrocily", cefr: "${l.cefr}", createdAt: "", order: ${l.order} }, // ${l.name}\n`;
  }
  
  // Add Frajeris
  output += `\n  // === FRAJERIS (C1-C2) - ${byLevel.Frajeris.length} lessons ===\n`;
  for (const l of byLevel.Frajeris) {
    output += `  "${l.reelLink}": { level: "Frajeris", cefr: "${l.cefr}", createdAt: "", order: ${l.order} }, // ${l.name}\n`;
  }
  
  output += `};

// Level display names for UI
export const levelNames: Record<LessonLevel, string> = {
  Zacatecnik: "Začátečník",
  Pokrocily: "Pokročilý",
  Frajeris: "Frajeris"
};

// Level with CEFR labels for picker
export const levelLabels: Record<LessonLevel, string> = {
  Zacatecnik: "A1-A2",
  Pokrocily: "B1-B2",
  Frajeris: "C1-C2"
};

// CEFR to Level mapping
export const cefrToLevel: Record<string, LessonLevel> = {
  "A1": "Zacatecnik",
  "A2": "Zacatecnik", 
  "B1": "Pokrocily",
  "B2": "Pokrocily",
  "C1": "Frajeris",
  "C2": "Frajeris"
};

// Level filter options for UI picker
export const levelOptions = [
  { value: 'Zacatecnik', label: 'Začátečník', cefr: 'A1-A2' },
  { value: 'Pokrocily', label: 'Pokročilý', cefr: 'B1-B2' },
  { value: 'Frajeris', label: 'Frajeris', cefr: 'C1-C2' }
] as const;

// Helper to find metadata by lesson ID or video_upload_id
function findMeta(lessonId: string, videoUploadId?: string): LessonMeta | undefined {
  if (lessonMetadataMap[lessonId]) {
    return lessonMetadataMap[lessonId];
  }
  if (videoUploadId && lessonMetadataMap[videoUploadId]) {
    return lessonMetadataMap[videoUploadId];
  }
  return undefined;
}

// Get level for a lesson
export function getLessonLevel(lessonId: string, order: number, videoUploadId?: string): LessonLevel {
  const meta = findMeta(lessonId, videoUploadId);
  if (meta) return meta.level;
  
  // Fallback based on order
  if (order <= 15) return 'Zacatecnik';
  if (order <= 52) return 'Pokrocily';
  return 'Frajeris';
}

// Get CEFR for a lesson
export function getLessonCefr(lessonId: string, order: number, videoUploadId?: string): string {
  const meta = findMeta(lessonId, videoUploadId);
  if (meta) return meta.cefr;
  
  if (order <= 8) return 'A1';
  if (order <= 15) return 'A2';
  if (order <= 35) return 'B1';
  if (order <= 52) return 'B2';
  return 'C1';
}

// Get order from metadata
export function getLessonOrder(lessonId: string, fallbackOrder: number, videoUploadId?: string): number {
  const meta = findMeta(lessonId, videoUploadId);
  return meta?.order ?? fallbackOrder;
}

// Get created date for a lesson
export function getLessonCreatedAt(lessonId: string): string | undefined {
  return lessonMetadataMap[lessonId]?.createdAt;
}

// Get CEFR label for a level
export function getCefrForLevel(level: LessonLevel): string {
  return levelLabels[level];
}

// Get total lesson count
export function getTotalLessonCount(): number {
  return Object.keys(lessonMetadataMap).length;
}
`;

  return output;
};

// Generate lessons.ts entries for missing lessons
const generateLessonsEntries = () => {
  let output = '// Missing lesson entries to add to lessons.ts\n\n';
  
  for (const l of lessons.values()) {
    output += `  {
    id: "${l.reelLink}",
    name: "${l.name.replace(/"/g, '\\"')}",
    kind: "${l.kind.toLowerCase()}",
    order: ${l.order},
    level: "${l.level}",
    cefr: "${l.cefr}",
    summary: {
      description: "",
      key_phrases: [],
      keywords: []
    }
  },\n`;
  }
  
  return output;
};

// Write output files
writeFileSync(join(__dirname, 'generated-metadata.ts'), generateMetadata());
console.log(`\nGenerated: scripts/generated-metadata.ts`);

writeFileSync(join(__dirname, 'generated-lessons-entries.ts'), generateLessonsEntries());
console.log(`Generated: scripts/generated-lessons-entries.ts`);

// Also output a simple list of all reel_links for comparison
const allReelLinks = [...lessons.values()].map(l => l.reelLink);
writeFileSync(join(__dirname, 'all-reel-links.json'), JSON.stringify(allReelLinks, null, 2));
console.log(`Generated: scripts/all-reel-links.json`);
