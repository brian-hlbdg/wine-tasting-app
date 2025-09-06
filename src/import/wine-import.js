// Minimal Wine Catalog Importer - Only core columns from your schema
// Based on your actual table definition

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://ieiocioccehoshfldvhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaW9jaW9jY2Vob3NoZmxkdmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTc5NzAsImV4cCI6MjA2NTU5Mzk3MH0.3CVqnDECtg5k8CoLOUKgJHpvVeOxspBzm-xLJTegyAM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple CSV parser
function parseCSV(csvString) {
  const lines = csvString.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

// Wine type mapping
function mapWineType(wineType) {
  if (!wineType) return 'red';
  
  const type = wineType.toLowerCase();
  if (type.includes('white') || type.includes('blanc')) return 'white';
  if (type.includes('rosé') || type.includes('rose') || type.includes('pink')) return 'rosé';
  if (type.includes('sparkling') || type.includes('champagne') || type.includes('prosecco') || type.includes('cava')) return 'sparkling';
  if (type.includes('dessert') || type.includes('sweet') || type.includes('port') || type.includes('sherry')) return 'dessert';
  return 'red';
}

// Extract vintage year
function extractVintage(wineName, year) {
  if (year && !isNaN(parseInt(year))) {
    return parseInt(year);
  }
  
  const yearMatch = wineName?.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  return null;
}

// Import X-Wines data - ONLY core columns from your schema
async function importXWinesData(csvFilePath) {
  console.log('Reading X-Wines CSV file...');
  
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const results = parseCSV(csvData);
    
    console.log(`Parsed ${results.length} wine records`);
    
    const winesForDB = results.map((row, index) => {
      // ONLY use core columns that definitely exist in your wine_catalog table
      const wine = {
        // Core required columns
        wine_name: row.wine_name || row.Wine || row.name || `Wine ${index + 1}`,
        
        // Optional columns from your schema (only if they exist)
        wine_type: mapWineType(row.wine_type || row.type || row.Type || row.color) || null,
        sommelier_notes: row.description || row.notes || row.review || row.elaborate || null,
        country: row.country || row.Country || null,
        region: row.region || row.Region || row.RegionName || null,
        producer: row.producer || row.winery || row.Producer || row.WineryName || null,
        vintage: extractVintage(row.wine_name || row.Wine, row.year || row.Year || row.vintage) || null
      };
      
      // Remove empty values
      Object.keys(wine).forEach(key => {
        if (wine[key] === undefined || wine[key] === '') {
          delete wine[key];
        }
      });
      
      return wine;
    });
    
    console.log('Sample wine data:', JSON.stringify(winesForDB[0], null, 2));
    
    // Clear existing data
    console.log('Clearing existing wine catalog data...');
    await supabase.from('wine_catalog').delete().gte('id', 0);
    
    // Insert in small batches
    const batchSize = 25;
    let insertedCount = 0;
    
    for (let i = 0; i < winesForDB.length; i += batchSize) {
      const batch = winesForDB.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('wine_catalog')
          .insert(batch)
          .select();
        
        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          
          // Try one wine at a time to find the issue
          for (const wine of batch) {
            try {
              const { data: singleData, error: singleError } = await supabase
                .from('wine_catalog')
                .insert([wine])
                .select();
              
              if (singleError) {
                console.error(`Failed wine "${wine.wine_name}":`, singleError.message);
              } else {
                insertedCount++;
                if (insertedCount % 50 === 0) {
                  console.log(`✅ Inserted ${insertedCount} wines so far...`);
                }
              }
            } catch (singleInsertError) {
              console.error(`Single insert error for "${wine.wine_name}":`, singleInsertError.message);
            }
          }
        } else {
          insertedCount += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} - ${insertedCount} wines total`);
        }
      } catch (batchError) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, batchError.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n🎉 Import complete! Inserted ${insertedCount} wines into wine_catalog`);
    return insertedCount;
    
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

// Main import function
async function runImport(csvFilePath) {
  try {
    console.log('🚀 Starting minimal wine catalog import...');
    console.log('📋 Using only core columns: wine_name, wine_type, producer, region, country, vintage, sommelier_notes');
    
    const importedCount = await importXWinesData(csvFilePath);
    
    console.log(`\n✅ Import complete!`);
    console.log(`📊 Successfully imported ${importedCount} wines into wine_catalog`);
    console.log(`\n🔍 Core data populated - your search should work now!`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import automatically
runImport('./src/import/XWines_Slim_1K_wines.csv');

export { runImport, importXWinesData };