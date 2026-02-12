#!/usr/bin/env node
/**
 * Script to parse DatoCMS CSV and generate lessons.ts with all lessons
 * Preserves existing interactions from current lessons.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read CSV file
const csvPath = join(__dirname, 'datocms-export.csv');
const csvContent = readFileSync(csvPath, 'utf-8');

// Existing interactions to preserve (lesson ID -> interactions object)
const existingInteractions = {
  "QFuk1RxtRE6xRt39wKYixw": {
    interactions: [
      { timestamp: 31550, type: "single-choice", form: { question: "What is your name? _______.", answers: [{ text: "My name is", correct: true, explanation: null }, { text: "Name is", correct: false, explanation: "Name is je píčovinka, dear friend. My to chceme hezky." }] } },
      { timestamp: 62580, type: "single-choice", form: { question: "How old are you?", answers: [{ text: "I am 24 years old.", correct: true, explanation: null }, { text: "I have 24 years.", correct: false, explanation: "\"Já mám 24 let\" v angličtině říct nemůžeme. Musíme říct, že jsem 24 let starý." }] } },
      { timestamp: 113580, type: "single-choice", form: { question: "What are your hobbies? My hobbies____", answers: [{ text: "are reading and playing chess.", correct: true, explanation: null }, { text: "is reading and swimming.", correct: false, explanation: "\"My hobbies is\" by znamenalo moje koníčky je, musíme říct moje koníčky jsou." }] } },
      { timestamp: 145580, type: "single-choice", form: { question: "Who is your favorite teacher?", answers: [{ text: "My favorite teacher is Kuba.", correct: true, explanation: null }, { text: "Mai favorit teacher is Mrs. Bullshitová.", correct: false, explanation: "Tvůj nejoblíbenější učitel jsem přece já, ne?" }] } }
    ]
  },
  "ecKXI2lTRxibAxLq-bQeDw": {
    interactions: [
      { timestamp: 68500, type: "single-choice", form: { question: "Jak vyjádří Gen Z anglicky, že je někdo tupá ovce?", answers: [{ text: "NPC", correct: true, explanation: null }, { text: "SIMP", correct: false, explanation: "Slovo SIMP už jsme v jedné předchozí lekci probírali a byl to ten vlezlej ubožák, co dolejzá za holkama." }] } },
      { timestamp: 139500, type: "single-choice", form: { question: "Nebudu lhát. Nemám rád rozmazlený spratky. -Pravda.", answers: [{ text: "NGL, I don't like spoiled brats. -FR.", correct: true, explanation: null }, { text: "FYI, I don't like spoiled brats. -RIP.", correct: false, explanation: "FYI znamená pro tvou informaci a RIP znamená odpočívej v pokoji." }] } },
      { timestamp: 161500, type: "single-choice", form: { question: "Kuba je ten největší borec všech dob.", answers: [{ text: "Kuba is the GOAT.", correct: true, explanation: null }, { text: "Kuba is the FART.", correct: false, explanation: "Ses uklikl, že? S prdama nemám nic společnýho." }] } },
      { timestamp: 201500, type: "single-choice", form: { question: "Jsem ožralej jako svině.", answers: [{ text: "I'm drunk AF.", correct: true, explanation: null }, { text: "I'm drunk FR.", correct: false, explanation: "FR jsme už měli a znamená to vážně." }] } }
    ]
  },
  "b4KeB50PSIqWK9wzP_RmAQ": {
    interactions: [
      { timestamp: 105500, type: "single-choice", form: { question: "Do you know him? -I think____.", answers: [{ text: "I do.", correct: true, explanation: null }, { text: "I'm.", correct: false, explanation: "I think I'm by znamenalo myslím, že jsem." }] } },
      { timestamp: 127500, type: "single-choice", form: { question: "Do you need to sleep? No_______", answers: [{ text: "I don't.", correct: true, explanation: null }, { text: "I'm not.", correct: false, explanation: "No, I'm not by znamenalo Ne, nejsem." }] } },
      { timestamp: 152500, type: "single-choice", form: { question: "Are you a teacher? Yes______.", answers: [{ text: "I'm.", correct: true, explanation: null }, { text: "I be.", correct: false, explanation: "Yes I be je blbost, protože to znamená ano, já být." }] } },
      { timestamp: 173500, type: "single-choice", form: { question: "Will you do it? No_____", answers: [{ text: "I won't", correct: true, explanation: null }, { text: "I don't", correct: false, explanation: "V otázce je operátor Will, takže potřebujeme will v záporu tedy won't" }] } }
    ]
  }
};

// Parse multiline CSV - this is complex because guidance.cs field contains JSON with newlines
function parseCSV(content) {
  const lessons = [];
  const lines = content.split('\n');
  
  // Get header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Find key column indices
  const idxId = headers.indexOf('id');
  const idxType = headers.indexOf('type');
  const idxOrder = headers.indexOf('order');
  const idxNameCs = headers.indexOf('name.cs');
  const idxKind = headers.indexOf('kind');
  const idxLevel = headers.indexOf('level');
  const idxCefr = headers.indexOf('cefr');
  const idxReelLink = headers.indexOf('reel_link');
  const idxGuidanceCs = headers.indexOf('guidance.cs');
  const idxCreatedAt = headers.indexOf('meta.created_at');
  
  // Join all lines to handle multiline JSON fields
  let currentRecord = '';
  let inRecord = false;
  let braceCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a new record start (22 char ID followed by ,item,)
    const isNewRecord = /^[A-Za-z0-9_-]{22},item,/.test(line);
    
    if (isNewRecord && currentRecord && braceCount === 0) {
      // Process previous record
      const lesson = parseRecord(currentRecord, headers, {
        idxId, idxType, idxOrder, idxNameCs, idxKind, idxLevel, idxCefr, idxReelLink, idxGuidanceCs, idxCreatedAt
      });
      if (lesson) lessons.push(lesson);
      currentRecord = line;
    } else {
      currentRecord += '\n' + line;
    }
    
    // Track brace balance for JSON detection
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
  }
  
  // Process last record
  if (currentRecord) {
    const lesson = parseRecord(currentRecord, headers, {
      idxId, idxType, idxOrder, idxNameCs, idxKind, idxLevel, idxCefr, idxReelLink, idxGuidanceCs, idxCreatedAt
    });
    if (lesson) lessons.push(lesson);
  }
  
  return lessons;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
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

function parseRecord(record, headers, indices) {
  // Extract the main fields from the record
  // This is a simplified parser - we'll extract key fields using regex
  
  const lines = record.split('\n');
  const firstLine = lines[0];
  
  // Extract ID (first field before first comma)
  const idMatch = firstLine.match(/^([A-Za-z0-9_-]{22}),item,(\d+),/);
  if (!idMatch) return null;
  
  const id = idMatch[1];
  const order = parseInt(idMatch[2], 10);
  
  // Extract name.cs (fourth field)
  const afterOrder = firstLine.substring(idMatch[0].length);
  const nameMatch = afterOrder.match(/^"?([^",]+)"?,/);
  const name = nameMatch ? nameMatch[1] : 'Unknown';
  
  // Extract kind and level from the first line
  // Format: ...,name.cs,name.en,name.pl,name.sk,kind,level,cefr,...
  const parts = firstLine.split(',');
  
  // Find kind (should be around index 7 or 8)
  let kind = 'conversation';
  let level = 'Zacatecnik';
  let cefr = 'A1';
  let reelLink = '';
  let createdAt = '';
  
  // Parse more carefully
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].replace(/"/g, '');
    
    // Kind detection
    if (['Words/Phrases', 'Grammatical', 'Informal', 'Pronunciation', 'Idiom', 'Phrasal verb'].includes(part)) {
      kind = mapKind(part);
    }
    
    // Level detection
    if (['Zacatecnik', 'Pokrocily', 'Frajeris'].includes(part)) {
      level = part;
    }
    
    // CEFR detection
    if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(part)) {
      cefr = part;
    }
    
    // Reel link detection (22 char ID)
    if (/^[A-Za-z0-9_-]{22}$/.test(part) && part !== id) {
      reelLink = part;
    }
    
    // Date detection
    if (/^\d{4}-\d{2}-\d{2}T/.test(part)) {
      createdAt = part;
    }
  }
  
  // Extract guidance.cs JSON for summary
  let summary = null;
  const guidanceMatch = record.match(/"\{\s*""description"":\s*""([^"]+)""/);
  if (guidanceMatch) {
    // Try to parse the full guidance JSON
    const jsonStart = record.indexOf('","{');
    if (jsonStart > 0) {
      // Find the JSON block
      let jsonStr = '';
      let braceCount = 0;
      let inJson = false;
      
      for (let i = jsonStart + 2; i < record.length; i++) {
        const char = record[i];
        
        if (char === '{' && !inJson) {
          inJson = true;
          jsonStr = '{';
          braceCount = 1;
        } else if (inJson) {
          jsonStr += char;
          if (char === '{') braceCount++;
          if (char === '}') {
            braceCount--;
            if (braceCount === 0) break;
          }
        }
      }
      
      if (jsonStr) {
        try {
          // Fix escaped quotes
          const cleanJson = jsonStr.replace(/""/g, '"');
          const parsed = JSON.parse(cleanJson);
          summary = {
            description: parsed.description || '',
            key_phrases: (parsed.key_phrases || []).map(p => ({
              text_content: p.text_content || '',
              text_content_translation: p.text_content_translation || ''
            })),
            keywords: (parsed.keywords || []).map(k => ({
              text_content: k.text_content || ''
            }))
          };
        } catch (e) {
          // Fallback - just extract description
          const descMatch = record.match(/""description"":\s*""([^"]+)""/);
          if (descMatch) {
            summary = {
              description: descMatch[1],
              key_phrases: [],
              keywords: []
            };
          }
        }
      }
    }
  }
  
  return {
    id: reelLink || id,  // Use reel_link as the ID (this is the video ID we use)
    name,
    kind,
    order,
    level,
    cefr,
    createdAt,
    video_upload_id: reelLink || undefined,
    summary
  };
}

function mapKind(csvKind) {
  const mapping = {
    'Words/Phrases': 'conversation',
    'Grammatical': 'grammar',
    'Informal': 'slang',
    'Pronunciation': 'pronunciation',
    'Idiom': 'idioms',
    'Phrasal verb': 'phrasal'
  };
  return mapping[csvKind] || 'conversation';
}

// Parse the CSV
console.log('Parsing CSV...');
const lessons = parseCSV(csvContent);
console.log(`Found ${lessons.length} lessons in CSV`);

// Sort by order
lessons.sort((a, b) => a.order - b.order);

// Remove duplicates by ID (keep first occurrence)
const seen = new Set();
const uniqueLessons = lessons.filter(l => {
  if (seen.has(l.id)) return false;
  seen.add(l.id);
  return true;
});

console.log(`Unique lessons: ${uniqueLessons.length}`);

// Add interactions from existing lessons
uniqueLessons.forEach(lesson => {
  if (existingInteractions[lesson.id]) {
    lesson.interactions = existingInteractions[lesson.id];
  }
});

// Generate TypeScript file
function generateTS(lessons) {
  let ts = `export interface QuizAnswer {
  text: string;
  correct: boolean;
  explanation: string | null;
}

export interface QuizQuestion {
  timestamp: number;
  type: string;
  form: {
    question: string;
    answers: QuizAnswer[];
  };
}

export interface Interactions {
  interactions: QuizQuestion[];
}

export interface LessonSummary {
  description: string;
  key_phrases: {
    text_content: string;
    text_content_translation: string;
  }[];
  keywords: {
    text_content: string;
  }[];
}

export interface Lesson {
  id: string;
  name: string;
  kind: string;
  order: number;
  level?: 'Zacatecnik' | 'Pokrocily' | 'Frajeris';
  cefr?: string;
  createdAt?: string;
  video_upload_id?: string;
  interactions?: Interactions;
  summary?: LessonSummary;
}

// Complete lessons from DatoCMS export - ordered by lesson number
export const lessons: Lesson[] = [
`;

  lessons.forEach((lesson, idx) => {
    ts += `  {\n`;
    ts += `    id: "${lesson.id}",\n`;
    ts += `    name: "${escapeString(lesson.name)}",\n`;
    ts += `    kind: "${lesson.kind}",\n`;
    ts += `    order: ${lesson.order},\n`;
    ts += `    level: "${lesson.level}",\n`;
    ts += `    cefr: "${lesson.cefr}",\n`;
    if (lesson.createdAt) {
      ts += `    createdAt: "${lesson.createdAt}",\n`;
    }
    if (lesson.video_upload_id) {
      ts += `    video_upload_id: "${lesson.video_upload_id}",\n`;
    }
    if (lesson.interactions) {
      ts += `    interactions: ${JSON.stringify(lesson.interactions, null, 6).split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n')},\n`;
    }
    if (lesson.summary) {
      ts += `    summary: {\n`;
      ts += `      description: "${escapeString(lesson.summary.description)}",\n`;
      ts += `      key_phrases: [\n`;
      lesson.summary.key_phrases.forEach((p, i) => {
        ts += `        { text_content: "${escapeString(p.text_content)}", text_content_translation: "${escapeString(p.text_content_translation)}" }${i < lesson.summary.key_phrases.length - 1 ? ',' : ''}\n`;
      });
      ts += `      ],\n`;
      ts += `      keywords: [${lesson.summary.keywords.map(k => `{ text_content: "${escapeString(k.text_content)}" }`).join(', ')}]\n`;
      ts += `    }\n`;
    }
    ts += `  }${idx < lessons.length - 1 ? ',' : ''}\n`;
  });

  ts += `];

// Category mapping for display
export const categoryNames: Record<string, string> = {
  "conversation": "Konverzace",
  "slang": "Slang & Nadávky", 
  "grammar": "Gramatika",
  "idioms": "Idiomy",
  "phrasal": "Frázová slovesa",
  "business": "Obchodní angličtina",
  "travel": "Cestování",
  "pronunciation": "Výslovnost"
};

export const getCategoryName = (kind: string): string => {
  return categoryNames[kind] || "Ostatní";
};

// Get category color for visual distinction
export const getCategoryColor = (kind: string): string => {
  const colors: Record<string, string> = {
    "conversation": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "slang": "bg-red-500/20 text-red-400 border-red-500/30",
    "grammar": "bg-green-500/20 text-green-400 border-green-500/30",
    "idioms": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "phrasal": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "business": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "travel": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "pronunciation": "bg-pink-500/20 text-pink-400 border-pink-500/30"
  };
  return colors[kind] || "bg-primary/20 text-primary border-primary/30";
};
`;

  return ts;
}

function escapeString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Write output
const output = generateTS(uniqueLessons);
const outputPath = join(__dirname, '..', 'src', 'data', 'lessons-generated.ts');
writeFileSync(outputPath, output);
console.log(`Generated ${outputPath} with ${uniqueLessons.length} lessons`);

// Also output lesson count info
console.log('\nLesson breakdown by level:');
const byLevel = {};
uniqueLessons.forEach(l => {
  byLevel[l.level] = (byLevel[l.level] || 0) + 1;
});
Object.entries(byLevel).forEach(([level, count]) => {
  console.log(`  ${level}: ${count}`);
});
