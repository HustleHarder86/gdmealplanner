#!/usr/bin/env node

/**
 * Import 50 New Recipes
 * Targeted import to add variety to existing 397 recipes
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  spoonacularApiKey: '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001',
  batchSize: 5,
  delayBetweenBatches: 3000,
  targetRecipes: 50
};

// Diverse search strategy focusing on gaps in our collection
const NEW_RECIPE_SEARCHES = [
  // More protein variety
  { query: 'salmon', maxCarbs: 35, minProtein: 20, count: 8 },
  { query: 'tuna', maxCarbs: 30, minProtein: 25, count: 6 },
  { query: 'turkey ground', maxCarbs: 35, minProtein: 20, count: 8 },
  
  // Vegetarian options (we need more)
  { query: 'tofu stir fry', maxCarbs: 40, minProtein: 15, count: 6 },
  { query: 'lentil', maxCarbs: 45, minProtein: 15, count: 8 },
  { query: 'chickpea', maxCarbs: 40, minProtein: 12, count: 6 },
  
  // Quick meal options
  { query: 'quick dinner', maxCarbs: 45, minProtein: 20, count: 8 },
  { query: 'sheet pan', maxCarbs: 40, minProtein: 18, count: 6 },
  
  // International flavors
  { query: 'mediterranean', maxCarbs: 40, minProtein: 15, count: 6 },
  { query: 'asian', maxCarbs: 45, minProtein: 15, count: 6 },
  
  // Healthy snacks (we're low on snacks)
  { query: 'protein smoothie', maxCarbs: 25, minProtein: 10, count: 4 },
  { query: 'greek yogurt', maxCarbs: 20, minProtein: 15, count: 4 }
];

async function searchRecipes(searchConfig) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      apiKey: CONFIG.spoonacularApiKey,
      query: searchConfig.query,
      number: searchConfig.count.toString(),
      maxCarbs: searchConfig.maxCarbs.toString(),
      minProtein: searchConfig.minProtein.toString(),
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true',
      instructionsRequired: 'true',
      sort: 'random',
      offset: Math.floor(Math.random() * 100).toString()
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

async function import50NewRecipes() {
  console.log('🚀 Importing 50 New Recipes for Added Variety\n');
  console.log('🎯 Focus: Protein variety, vegetarian options, quick meals, international flavors\n');
  
  try {
    const startCount = await getRecipeCount();
    console.log(`📊 Current recipe count: ${startCount}`);
    console.log(`🎯 Target: ${startCount + CONFIG.targetRecipes} recipes\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allRecipeIds = [];
    const seenIds = new Set();
    
    console.log('🔍 Searching for diverse new recipes...\n');
    
    for (const searchConfig of NEW_RECIPE_SEARCHES) {
      if (totalImported >= CONFIG.targetRecipes) break;
      
      console.log(`\n📍 Searching: "${searchConfig.query}" (max ${searchConfig.maxCarbs}g carbs, min ${searchConfig.minProtein}g protein)`);
      
      try {
        const recipes = await searchRecipes(searchConfig);
        console.log(`   ✓ Found ${recipes.length} recipes`);
        
        // Filter unique recipes
        const newRecipeIds = recipes
          .map(r => r.id)
          .filter(id => id && !seenIds.has(id));
        
        newRecipeIds.forEach(id => seenIds.add(id));
        allRecipeIds.push(...newRecipeIds);
        
        console.log(`   ✓ ${newRecipeIds.length} new unique recipes to import`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Search failed: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Total unique recipes found: ${allRecipeIds.length}`);
    console.log('🔄 Starting import process...\n');
    
    // Import in batches
    const recipesToImport = allRecipeIds.slice(0, Math.min(allRecipeIds.length, CONFIG.targetRecipes * 2));
    const totalBatches = Math.ceil(recipesToImport.length / CONFIG.batchSize);
    
    for (let i = 0; i < recipesToImport.length && totalImported < CONFIG.targetRecipes; i += CONFIG.batchSize) {
      const batch = recipesToImport.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} recipes)`);
      
      try {
        const result = await importRecipes(batch);
        
        if (result.success) {
          totalImported += result.imported || 0;
          totalSkipped += result.skipped || 0;
          totalFailed += result.failed || 0;
          
          console.log(`   ✅ Imported: ${result.imported}`);
          console.log(`   ⏭️  Skipped: ${result.skipped}`);
          if (result.failed > 0) {
            console.log(`   ❌ Failed: ${result.failed}`);
          }
          
          const progress = Math.min(100, Math.round((totalImported / CONFIG.targetRecipes) * 100));
          console.log(`   📊 Progress: ${progress}% (${totalImported}/${CONFIG.targetRecipes})`);
          
          if (totalImported >= CONFIG.targetRecipes) {
            console.log(`\n🎯 Reached target of ${CONFIG.targetRecipes} imports!`);
            break;
          }
        } else {
          console.error(`   ❌ Batch failed: ${result.error}`);
          totalFailed += batch.length;
        }
      } catch (error) {
        console.error(`   ❌ Import error: ${error.message}`);
        totalFailed += batch.length;
      }
      
      if (i + CONFIG.batchSize < recipesToImport.length && totalImported < CONFIG.targetRecipes) {
        console.log(`   ⏱️  Waiting ${CONFIG.delayBetweenBatches / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    const endCount = await getRecipeCount();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${totalImported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${totalSkipped} recipes`);
    console.log(`❌ Failed: ${totalFailed} recipes`);
    console.log(`📈 Recipe count: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(60));
    
    if (totalImported > 0) {
      console.log('\n🎉 Import completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Sync to offline files: node scripts/sync-all-recipes-admin.js');
      console.log('2. Test system: node scripts/test-offline-recipes.js');
      console.log('3. Deploy: git add -A && git commit && git push');
    }
    
  } catch (error) {
    console.error('\n❌ Import process failed:', error.message);
  }
}

// Run the import
import50NewRecipes();