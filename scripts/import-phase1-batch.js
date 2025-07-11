#!/usr/bin/env node

/**
 * Phase 1 Recipe Import - Foundation Expansion
 * Imports 100 diverse GD-friendly recipes focusing on practical family meals
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  spoonacularApiKey: '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001',
  batchSize: 5,
  delayBetweenBatches: 3000,
  targetRecipes: 100
};

// Phase 1 Search Strategy - Foundation recipes with meal prep focus
const PHASE1_SEARCHES = [
  // Meal Prep Breakfast (15 recipes)
  { query: 'meal prep breakfast egg', maxCarbs: 30, minProtein: 15, count: 5 },
  { query: 'overnight oats protein', maxCarbs: 35, minProtein: 10, count: 5 },
  { query: 'breakfast casserole healthy', maxCarbs: 30, minProtein: 15, count: 5 },
  
  // Batch Cooking Proteins (20 recipes)
  { query: 'batch cooking chicken breast', maxCarbs: 25, minProtein: 25, count: 5 },
  { query: 'meal prep ground turkey', maxCarbs: 30, minProtein: 20, count: 5 },
  { query: 'slow cooker beef healthy', maxCarbs: 35, minProtein: 25, count: 5 },
  { query: 'sheet pan salmon vegetables', maxCarbs: 30, minProtein: 20, count: 5 },
  
  // Family-Friendly Dinners (25 recipes)
  { query: 'family dinner chicken easy', maxCarbs: 40, minProtein: 20, count: 5 },
  { query: 'one pot dinner healthy', maxCarbs: 45, minProtein: 20, count: 5 },
  { query: 'casserole low carb family', maxCarbs: 35, minProtein: 20, count: 5 },
  { query: 'instant pot family meal', maxCarbs: 40, minProtein: 20, count: 5 },
  { query: 'baked chicken dinner sides', maxCarbs: 40, minProtein: 25, count: 5 },
  
  // Make-Ahead Lunches (20 recipes)
  { query: 'mason jar salad protein', maxCarbs: 35, minProtein: 15, count: 5 },
  { query: 'lunch bowl meal prep', maxCarbs: 40, minProtein: 20, count: 5 },
  { query: 'wrap sandwich healthy lunch', maxCarbs: 40, minProtein: 15, count: 5 },
  { query: 'soup meal prep healthy', maxCarbs: 35, minProtein: 15, count: 5 },
  
  // Practical Snacks (20 recipes)
  { query: 'protein snack make ahead', maxCarbs: 20, minProtein: 8, count: 5 },
  { query: 'energy balls no bake', maxCarbs: 25, minProtein: 5, count: 5 },
  { query: 'veggie snack hummus', maxCarbs: 20, minProtein: 5, count: 5 },
  { query: 'cheese snack crackers healthy', maxCarbs: 25, minProtein: 8, count: 5 }
];

// Enhanced search with more parameters
async function searchRecipes(searchConfig) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      apiKey: CONFIG.spoonacularApiKey,
      query: searchConfig.query,
      number: searchConfig.count.toString(),
      maxCarbs: searchConfig.maxCarbs.toString(),
      minProtein: searchConfig.minProtein.toString(),
      maxSaturatedFat: '15', // GD guideline
      minFiber: '3', // Ensure good fiber
      addRecipeInformation: 'true',
      addRecipeNutrition: 'true',
      instructionsRequired: 'true', // Only recipes with instructions
      sort: 'random' // Get variety
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
async function runPhase1Import() {
  console.log('🚀 Starting Phase 1 Recipe Import - Foundation Expansion\n');
  console.log('📋 Goal: Import 100 practical, family-friendly GD recipes\n');
  
  try {
    // Get starting count
    const startCount = await getRecipeCount();
    console.log(`📊 Current recipe count: ${startCount}`);
    console.log(`🎯 Target recipe count: ${startCount + CONFIG.targetRecipes}\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allRecipeIds = [];
    
    // Search for recipes
    console.log('🔍 Searching for Phase 1 recipes...\n');
    
    for (const searchConfig of PHASE1_SEARCHES) {
      console.log(`\n📍 Searching: "${searchConfig.query}"`);
      console.log(`   Limits: ${searchConfig.maxCarbs}g carbs, min ${searchConfig.minProtein}g protein`);
      
      try {
        const recipes = await searchRecipes(searchConfig);
        console.log(`   ✓ Found ${recipes.length} recipes`);
        
        // Show sample recipes found
        if (recipes.length > 0) {
          console.log('   Sample recipes:');
          recipes.slice(0, 3).forEach((r, i) => {
            const carbs = r.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 'N/A';
            console.log(`     ${i + 1}. ${r.title} (${carbs}g carbs)`);
          });
        }
        
        // Extract recipe IDs
        const recipeIds = recipes.map(r => r.id).filter(id => id);
        allRecipeIds.push(...recipeIds);
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Search failed: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Total unique recipes found: ${allRecipeIds.length}`);
    console.log('🔄 Starting import process...\n');
    
    // Import in batches
    const totalBatches = Math.ceil(allRecipeIds.length / CONFIG.batchSize);
    
    for (let i = 0; i < allRecipeIds.length; i += CONFIG.batchSize) {
      const batch = allRecipeIds.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} recipes)`);
      
      try {
        const result = await importRecipes(batch);
        
        if (result.success) {
          totalImported += result.imported || 0;
          totalSkipped += result.skipped || 0;
          totalFailed += result.failed || 0;
          
          console.log(`   ✅ Imported: ${result.imported}`);
          console.log(`   ⏭️  Skipped (duplicates): ${result.skipped}`);
          if (result.failed > 0) {
            console.log(`   ❌ Failed: ${result.failed}`);
          }
          
          // Stop if we've reached our target
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
      
      // Progress update
      const progress = Math.min(100, Math.round((totalImported / CONFIG.targetRecipes) * 100));
      console.log(`   📊 Progress: ${progress}% (${totalImported}/${CONFIG.targetRecipes})`);
      
      // Delay between batches
      if (i + CONFIG.batchSize < allRecipeIds.length && totalImported < CONFIG.targetRecipes) {
        console.log(`   ⏱️  Waiting ${CONFIG.delayBetweenBatches / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    // Get final count
    const endCount = await getRecipeCount();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 1 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${totalImported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${totalSkipped} recipes`);
    console.log(`❌ Failed: ${totalFailed} recipes`);
    console.log(`📈 Recipe count: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(60));
    
    if (totalImported > 0) {
      console.log('\n🎉 Phase 1 import completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('1. Run sync to update offline files:');
      console.log('   node scripts/sync-all-recipes-admin.js');
      console.log('2. Verify recipes at http://localhost:3001/recipes');
      console.log('3. Check quality in admin panel: http://localhost:3001/admin/recipes');
      console.log('\n📅 Phase 2: Add dietary diversity (vegetarian, gluten-free, etc.)');
    }
    
  } catch (error) {
    console.error('\n❌ Import process failed:', error.message);
  }
}

// Run the import
console.log('Phase 1: Foundation Expansion (100 recipes)\n');
console.log('Focus areas:');
console.log('- Meal prep & batch cooking recipes');
console.log('- Family-friendly dinners');
console.log('- Make-ahead options');
console.log('- Practical everyday meals\n');

runPhase1Import();