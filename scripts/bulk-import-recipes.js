#!/usr/bin/env node

/**
 * Bulk Recipe Import Script
 * Imports multiple recipes from Spoonacular to build up the recipe library
 */

const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  spoonacularApiKey: process.env.SPOONACULAR_API_KEY || '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001',
  batchSize: 5, // Import 5 recipes at a time
  delayBetweenBatches: 3000, // 3 seconds between batches
  targetRecipes: 200 // Total recipes to import
};

// Recipe search criteria for GD-friendly meals
const SEARCH_QUERIES = [
  // Breakfast options (low carb, high protein)
  { query: 'egg breakfast', maxCarbs: 30, type: 'breakfast', count: 30 },
  { query: 'protein smoothie', maxCarbs: 25, type: 'breakfast', count: 20 },
  { query: 'greek yogurt breakfast', maxCarbs: 30, type: 'breakfast', count: 20 },
  { query: 'oatmeal', maxCarbs: 35, type: 'breakfast', count: 15 },
  
  // Lunch options (balanced meals)
  { query: 'chicken salad', maxCarbs: 40, type: 'lunch', count: 25 },
  { query: 'quinoa bowl', maxCarbs: 45, type: 'lunch', count: 20 },
  { query: 'vegetable soup', maxCarbs: 35, type: 'lunch', count: 20 },
  { query: 'turkey sandwich', maxCarbs: 40, type: 'lunch', count: 15 },
  
  // Dinner options (protein focused)
  { query: 'grilled salmon', maxCarbs: 30, type: 'dinner', count: 20 },
  { query: 'baked chicken', maxCarbs: 35, type: 'dinner', count: 20 },
  { query: 'beef stir fry', maxCarbs: 40, type: 'dinner', count: 15 },
  { query: 'vegetarian dinner', maxCarbs: 45, type: 'dinner', count: 15 },
  
  // Snack options (controlled portions)
  { query: 'hummus snack', maxCarbs: 20, type: 'snack', count: 15 },
  { query: 'cheese crackers', maxCarbs: 25, type: 'snack', count: 10 },
  { query: 'apple peanut butter', maxCarbs: 25, type: 'snack', count: 10 },
  { query: 'protein balls', maxCarbs: 20, type: 'snack', count: 10 }
];

// Search for recipes from Spoonacular
async function searchRecipes(query, maxCarbs, number = 10) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      apiKey: CONFIG.spoonacularApiKey,
      query: query,
      number: number.toString(),
      maxCarbs: maxCarbs.toString(),
      minProtein: '10', // Ensure adequate protein
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true'
    });
    
    const options = {
      hostname: 'api.spoonacular.com',
      path: `/recipes/complexSearch?${params}`,
      method: 'GET'
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.results || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Import recipes to our database
async function importRecipes(recipeIds) {
  const data = JSON.stringify({ recipeIds });
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/recipes/bulk-import',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Get current recipe count
async function getRecipeCount() {
  return new Promise((resolve) => {
    http.get(`${CONFIG.localApiUrl}/api/recipes/count`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.count || 0);
        } catch (e) {
          resolve(0);
        }
      });
    }).on('error', () => resolve(0));
  });
}

// Main import process
async function runBulkImport() {
  console.log('🚀 Starting Bulk Recipe Import\n');
  
  try {
    // Get starting count
    const startCount = await getRecipeCount();
    console.log(`📊 Current recipe count: ${startCount}\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allRecipeIds = [];
    
    // Search for recipes based on our criteria
    console.log('🔍 Searching for GD-friendly recipes...\n');
    
    for (const searchConfig of SEARCH_QUERIES) {
      console.log(`\n📍 Searching: "${searchConfig.query}" (max ${searchConfig.maxCarbs}g carbs)`);
      
      try {
        const recipes = await searchRecipes(
          searchConfig.query,
          searchConfig.maxCarbs,
          searchConfig.count
        );
        
        console.log(`   Found ${recipes.length} recipes`);
        
        // Extract recipe IDs
        const recipeIds = recipes.map(r => r.id).filter(id => id);
        allRecipeIds.push(...recipeIds);
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Search failed: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Total recipes found: ${allRecipeIds.length}`);
    console.log('🔄 Starting import process...\n');
    
    // Import in batches
    for (let i = 0; i < allRecipeIds.length; i += CONFIG.batchSize) {
      const batch = allRecipeIds.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(allRecipeIds.length / CONFIG.batchSize);
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} recipes)`);
      
      try {
        const result = await importRecipes(batch);
        
        if (result.success) {
          totalImported += result.imported || 0;
          totalSkipped += result.skipped || 0;
          totalFailed += result.failed || 0;
          
          console.log(`   ✅ Imported: ${result.imported}`);
          console.log(`   ⏭️  Skipped: ${result.skipped}`);
          console.log(`   ❌ Failed: ${result.failed}`);
        } else {
          console.error(`   ❌ Batch failed: ${result.error}`);
          totalFailed += batch.length;
        }
      } catch (error) {
        console.error(`   ❌ Import error: ${error.message}`);
        totalFailed += batch.length;
      }
      
      // Delay between batches
      if (i + CONFIG.batchSize < allRecipeIds.length) {
        console.log(`   ⏱️  Waiting ${CONFIG.delayBetweenBatches / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    // Get final count
    const endCount = await getRecipeCount();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${totalImported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${totalSkipped} recipes`);
    console.log(`❌ Failed: ${totalFailed} recipes`);
    console.log(`📈 Recipe count: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(50));
    
    if (totalImported > 0) {
      console.log('\n🎉 Import completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Run "npm run sync-recipes" to update offline JSON files');
      console.log('2. Check the recipes at http://localhost:3001/recipes');
      console.log('3. Verify quality in admin panel: http://localhost:3001/admin/recipes');
    }
    
  } catch (error) {
    console.error('\n❌ Import process failed:', error.message);
  }
}

// Check if Spoonacular API key is available
if (!CONFIG.spoonacularApiKey) {
  console.error('❌ Spoonacular API key not found!');
  console.error('Please set SPOONACULAR_API_KEY in your .env.local file');
  process.exit(1);
}

// Run the import
runBulkImport();