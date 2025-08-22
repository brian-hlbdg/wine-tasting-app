// X-Wines Dataset Import Script for Supabase
// This script imports X-Wines dataset into your wine tasting app database

import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://ieiocioccehoshfldvhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllaW9jaW9jY2Vob3NoZmxkdmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTc5NzAsImV4cCI6MjA2NTU5Mzk3MH0.3CVqnDECtg5k8CoLOUKgJHpvVeOxspBzm-xLJTegyAM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Wine type mapping function
function mapWineType(wineType) {
  if (!wineType) return 'red';
  
  const type = wineType.toLowerCase();
  if (type.includes('white') || type.includes('blanc')) return 'white';
  if (type.includes('rosé') || type.includes('rose') || type.includes('pink')) return 'rosé';
  if (type.includes('sparkling') || type.includes('champagne') || type.includes('prosecco') || type.includes('cava')) return 'sparkling';
  if (type.includes('dessert') || type.includes('sweet') || type.includes('port') || type.includes('sherry')) return 'dessert';
  return 'red'; // Default to red
}

// Price point mapping based on wine price
function mapPricePoint(price) {
  if (!price || price === '') return 'Mid-range';
  
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'Mid-range';
  
  if (numPrice < 15) return 'Budget';
  if (numPrice < 40) return 'Mid-range';
  if (numPrice < 100) return 'Premium';
  return 'Luxury';
}

// Extract vintage year from wine name or year field
function extractVintage(wineName, year) {
  if (year && !isNaN(parseInt(year))) {
    return parseInt(year);
  }
  
  // Try to extract year from wine name (e.g., "Château Margaux 2015")
  const yearMatch = wineName?.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  return null;
}

// Create a master wine catalog table
async function createWineCatalogTable() {
  console.log('Creating wine_catalog table...');
  
  const { error } = await supabase.rpc('create_wine_catalog_table');
  
  if (error && !error.message.includes('already exists')) {
    console.error('Error creating wine_catalog table:', error);
    return false;
  }
  
  console.log('Wine catalog table ready');
  return true;
}

// Import X-Wines data into wine catalog
async function importXWinesData(csvFilePath) {
  console.log('Reading X-Wines CSV file...');
  
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: async function(results) {
          console.log(`Parsed ${results.data.length} wine records`);
          
          const winesForDB = results.data.map((row, index) => {
            // Map X-Wines fields to your database structure
            return {
              wine_name: row.wine_name || row.Wine || row.name || `Wine ${index + 1}`,
              producer: row.producer || row.winery || row.Producer || null,
              vintage: extractVintage(row.wine_name || row.Wine, row.year || row.Year),
              wine_type: mapWineType(row.wine_type || row.type || row.Type),
              region: row.region || row.Region || null,
              country: row.country || row.Country || null,
              price_point: mapPricePoint(row.price || row.Price),
              alcohol_content: row.alcohol_content || row.alcohol || row.Alcohol || null,
              sommelier_notes: row.description || row.notes || row.review || null,
              avg_rating: row.rating || row.Rating || null,
              x_wines_id: row.id || row.wine_id || null, // Keep reference to original dataset
              grape_variety: row.grape || row.grapes || row.Grape || null
            };
          });
          
          console.log('Sample wine data:', winesForDB[0]);
          
          // Insert in batches to avoid timeout
          const batchSize = 100;
          let insertedCount = 0;
          
          for (let i = 0; i < winesForDB.length; i += batchSize) {
            const batch = winesForDB.slice(i, i + batchSize);
            
            const { data, error } = await supabase
              .from('wine_catalog')
              .insert(batch)
              .select();
            
            if (error) {
              console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
              // Continue with next batch instead of failing completely
            } else {
              insertedCount += batch.length;
              console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} - ${insertedCount} wines total`);
            }
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          console.log(`Import complete! Inserted ${insertedCount} wines into catalog`);
          resolve(insertedCount);
        },
        error: function(error) {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }
}

// Create a function to search and add wines to events
async function createWineSearchFunction() {
  console.log('Creating wine search function...');
  
  // This creates a helper function you can use in your app
  const functionSQL = `
    CREATE OR REPLACE FUNCTION search_wines_for_event(
      search_term TEXT,
      limit_count INTEGER DEFAULT 20
    )
    RETURNS TABLE (
      id BIGINT,
      wine_name TEXT,
      producer TEXT,
      vintage INTEGER,
      wine_type TEXT,
      region TEXT,
      country TEXT,
      price_point TEXT,
      alcohol_content DECIMAL,
      sommelier_notes TEXT,
      avg_rating DECIMAL
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        wc.id,
        wc.wine_name,
        wc.producer,
        wc.vintage,
        wc.wine_type,
        wc.region,
        wc.country,
        wc.price_point,
        wc.alcohol_content,
        wc.sommelier_notes,
        wc.avg_rating
      FROM wine_catalog wc
      WHERE 
        wc.wine_name ILIKE '%' || search_term || '%' 
        OR wc.producer ILIKE '%' || search_term || '%'
        OR wc.region ILIKE '%' || search_term || '%'
      ORDER BY wc.avg_rating DESC NULLS LAST
      LIMIT limit_count;
    END;
    $$;
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql: functionSQL });
  
  if (error) {
    console.error('Error creating search function:', error);
  } else {
    console.log('Wine search function created successfully');
  }
}

// Main import function
async function runImport(csvFilePath) {
  try {
    console.log('Starting X-Wines import process...');
    
    // Step 1: Create wine catalog table
    await createWineCatalogTable();
    
    // Step 2: Import the data
    const importedCount = await importXWinesData(csvFilePath);
    
    // Step 3: Create search helper function
    await createWineSearchFunction();
    
    console.log(`\n✅ Import complete!`);
    console.log(`📊 Imported ${importedCount} wines into your database`);
    console.log(`🔍 You can now search wines using the search_wines_for_event() function`);
    console.log(`\nNext steps:`);
    console.log(`1. Update your wine form to include a search feature`);
    console.log(`2. Add wines from the catalog to your events`);
    console.log(`3. Users can rate and add notes during tastings`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Usage:
// 1. Download X-Wines dataset CSV from: https://github.com/rogerioxavier/X-Wines/tree/main/Dataset
// 2. Update SUPABASE_URL and SUPABASE_ANON_KEY above
// 3. Run: node wine_import_script.js path/to/x-wines.csv

// Example usage (uncomment to run):
// runImport('./x-wines-dataset.csv');

export { runImport, importXWinesData, createWineCatalogTable };