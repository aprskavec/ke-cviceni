/**
 * Sync lessons from DatoCMS CSV export to Supabase
 * 
 * This script:
 * 1. Parses the CSV export from DatoCMS
 * 2. Deletes all existing lessons from the database
 * 3. Inserts all lessons from CSV with full summary data
 * 
 * Usage: node scripts/sync-lessons-from-csv.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection
const SUPABASE_URL = 'https://lgccnltkrnolbzwybnio.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse CSV with multi-line JSON fields
function parseCSV(content) {
  const records = [];
  const lines = content.split('\n');
  
  // Get header
  const header = lines[0].split(',');
  
  let currentRecord = null;
  let currentField = '';
  let inQuotes = false;
  let fieldIndex = 0;
  let lineIndex = 1;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    if (!currentRecord) {
      currentRecord = {};
      currentField = '';
      inQuotes = false;
      fieldIndex = 0;
    }
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        const headerName = header[fieldIndex]?.trim();
        if (headerName) {
          currentRecord[headerName] = currentField.trim();
        }
        currentField = '';
        fieldIndex++;
      } else {
        currentField += char;
      }
    }
    
    // End of line
    if (inQuotes) {
      // Multi-line field, continue
      currentField += '\n';
      lineIndex++;
    } else {
      // End of record
      const headerName = header[fieldIndex]?.trim();
      if (headerName) {
        currentRecord[headerName] = currentField.trim();
      }
      
      // Only add if it has an id and is an item
      if (currentRecord.id && currentRecord.type === 'item') {
        records.push(currentRecord);
      }
      
      currentRecord = null;
      lineIndex++;
    }
  }
  
  return records;
}

// Parse JSON field safely
function parseJSON(str) {
  if (!str || str === 'null' || str === '') return null;
  try {
    // Handle escaped quotes
    const cleaned = str.replace(/""/g, '"');
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract just the description, key_phrases, keywords
    try {
      // Remove outer quotes if present
      let s = str;
      if (s.startsWith('"') && s.endsWith('"')) {
        s = s.slice(1, -1);
      }
      s = s.replace(/""/g, '"');
      return JSON.parse(s);
    } catch (e2) {
      console.warn('Failed to parse JSON:', str.substring(0, 100));
      return null;
    }
  }
}

async function main() {
  console.log('📂 Reading CSV file...');
  
  // Read the CSV file
  const csvPath = join(__dirname, 'datocms-export.csv');
  let csvContent;
  
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch (e) {
    // Try the uploaded file path
    const altPath = join(__dirname, '..', 'datocms-full-export.csv');
    try {
      csvContent = readFileSync(altPath, 'utf-8');
    } catch (e2) {
      console.error('❌ CSV file not found. Please save the CSV as scripts/datocms-export.csv');
      process.exit(1);
    }
  }
  
  console.log('🔍 Parsing CSV...');
  const records = parseCSV(csvContent);
  
  console.log(`Found ${records.length} records in CSV`);
  
  // Extract lesson data
  const lessons = records.map(record => {
    const summary = parseJSON(record['guidance.cs']);
    
    return {
      datocms_id: record.id,
      video_upload_id: record.reel_link || record.id,
      name: record['name.cs'] || record['name.en'] || 'Unnamed',
      kind: record.kind || 'Other',
      order: parseInt(record.order, 10) || 0,
      level: record.level || 'Zacatecnik',
      cefr: record.cefr || 'A1',
      summary: summary || { description: '', key_phrases: [], keywords: [] }
    };
  }).filter(l => l.name && l.datocms_id);
  
  console.log(`\n📊 Lessons by level:`);
  const byLevel = lessons.reduce((acc, l) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {});
  console.log(byLevel);
  
  console.log(`\n🗑️ Deleting existing lessons...`);
  const { error: deleteError } = await supabase
    .from('lessons')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('❌ Failed to delete lessons:', deleteError);
    process.exit(1);
  }
  
  console.log(`\n📤 Inserting ${lessons.length} lessons...`);
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < lessons.length; i += batchSize) {
    const batch = lessons.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('lessons')
      .insert(batch);
    
    if (insertError) {
      console.error(`❌ Failed to insert batch ${i / batchSize + 1}:`, insertError);
      console.error('First lesson in batch:', batch[0]);
      process.exit(1);
    }
    
    console.log(`  Inserted ${Math.min(i + batchSize, lessons.length)} / ${lessons.length}`);
  }
  
  console.log('\n✅ Done! Verifying...');
  
  const { data: counts } = await supabase
    .from('lessons')
    .select('level')
    .then(res => ({
      data: res.data?.reduce((acc, l) => {
        acc[l.level] = (acc[l.level] || 0) + 1;
        return acc;
      }, {})
    }));
  
  console.log('Final counts in DB:', counts);
}

main().catch(console.error);
