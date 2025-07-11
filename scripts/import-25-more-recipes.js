#!/usr/bin/env node

/**
 * Import 25 More Recipes to Complete the 50 Recipe Goal
 * Focus on different search terms to get variety
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  spoonacularApiKey: '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001',
  batchSize: 5,
  delayBetweenBatches: 3000,
  targetRecipes: 25
};

// Different search terms to get more variety
const ADDITIONAL_SEARCHES = [
  // More protein options
  { query: 'pork', maxCarbs: 35, minProtein: 20, count: 10 },
  { query: 'seafood', maxCarbs: 30, minProtein: 20, count: 8 },
  { query: 'cod', maxCarbs: 25, minProtein: 25, count: 6 },
  
  // Vegetable-focused
  { query: 'broccoli', maxCarbs: 40, minProtein: 8, count: 8 },
  { query: 'spinach', maxCarbs: 35, minProtein: 10, count: 6 },
  { query: 'cauliflower', maxCarbs: 30, minProtein: 8, count: 8 },
  
  // Different cuisine types
  { query: 'mexican', maxCarbs: 45, minProtein: 15, count: 8 },
  { query: 'italian', maxCarbs: 45, minProtein: 15, count: 8 },
  { query: 'indian', maxCarbs: 40, minProtein: 12, count: 6 },
  
  // More breakfast options
  { query: 'breakfast bowl', maxCarbs: 35, minProtein: 15, count: 6 },
  { query: 'pancakes', maxCarbs: 35, minProtein: 10, count: 5 },
  
  // Healthy options
  { query: 'avocado', maxCarbs: 30, minProtein: 8, count: 8 }
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
      offset: Math.floor(Math.random() * 200).toString()
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

async function import25MoreRecipes() {
  console.log('🚀 Importing 25 More Recipes to Complete Our Goal\n');
  console.log('🎯 Focus: Protein variety, vegetables, international cuisines\n');
  
  try {
    const startCount = await getRecipeCount();
    console.log(`📊 Current recipe count: ${startCount}`);
    console.log(`🎯 Target: ${startCount + CONFIG.targetRecipes} recipes\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allRecipeIds = [];
    const seenIds = new Set();
    
    console.log('🔍 Searching for additional diverse recipes...\n');
    
    for (const searchConfig of ADDITIONAL_SEARCHES) {
      if (totalImported >= CONFIG.targetRecipes) break;
      
      console.log(`\n📍 Searching: "${searchConfig.query}" (max ${searchConfig.maxCarbs}g carbs, min ${searchConfig.minProtein}g protein)`);
      
      try {
        const recipes = await searchRecipes(searchConfig);
        console.log(`   ✓ Found ${recipes.length} recipes`);
        
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
    console.log('📊 FINAL IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${totalImported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${totalSkipped} recipes`);
    console.log(`❌ Failed: ${totalFailed} recipes`);
    console.log(`📈 Recipe count: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(60));
    
    const totalNewRecipes = endCount - 397; // Original count was 397
    if (totalNewRecipes >= 45) {
      console.log(`\n🎉 SUCCESS! Added ${totalNewRecipes} new recipes (target was 50)`);
    } else {
      console.log(`\n⚠️  Added ${totalNewRecipes} new recipes (target was 50)`);
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Sync to offline files: node scripts/sync-all-recipes-admin.js');
    console.log('2. Test system: node scripts/test-offline-recipes.js');
    console.log('3. Deploy: git add -A && git commit && git push');
    
  } catch (error) {
    console.error('\n❌ Import process failed:', error.message);
  }
}

// Run the import
import25MoreRecipes();