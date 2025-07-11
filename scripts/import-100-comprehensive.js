#!/usr/bin/env node

/**
 * Comprehensive 100 Recipe Import
 * Uses broader search terms to find more GD-friendly recipes
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

// Broader search strategy with simpler terms
const COMPREHENSIVE_SEARCHES = [
  // Breakfast - simpler terms (20 recipes)
  { query: 'eggs', maxCarbs: 30, minProtein: 10, count: 10 },
  { query: 'oatmeal', maxCarbs: 35, minProtein: 5, count: 10 },
  
  // Protein-focused searches (30 recipes)
  { query: 'chicken', maxCarbs: 40, minProtein: 20, count: 10 },
  { query: 'beef', maxCarbs: 35, minProtein: 20, count: 10 },
  { query: 'fish', maxCarbs: 30, minProtein: 20, count: 10 },
  
  // Vegetable-based (20 recipes)
  { query: 'salad', maxCarbs: 35, minProtein: 10, count: 10 },
  { query: 'vegetables', maxCarbs: 40, minProtein: 5, count: 10 },
  
  // Soups and stews (15 recipes)
  { query: 'soup', maxCarbs: 35, minProtein: 10, count: 15 },
  
  // Snacks (15 recipes)
  { query: 'snack', maxCarbs: 25, minProtein: 5, count: 15 }
];

// Search function with better parameters
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
      offset: Math.floor(Math.random() * 100).toString() // Random offset for variety
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

// Get recipe details for better filtering
async function getRecipeDetails(recipeId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.spoonacular.com',
      path: `/recipes/${recipeId}/information?apiKey=${CONFIG.spoonacularApiKey}&includeNutrition=true`,
      method: 'GET'
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Import recipes
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

// Get current count
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

// Main import
async function runComprehensiveImport() {
  console.log('🚀 Starting Comprehensive 100 Recipe Import\n');
  
  try {
    const startCount = await getRecipeCount();
    console.log(`📊 Current recipe count: ${startCount}`);
    console.log(`🎯 Target: ${startCount + CONFIG.targetRecipes} recipes\n`);
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allRecipeIds = [];
    const seenIds = new Set();
    
    console.log('🔍 Searching for GD-friendly recipes...\n');
    
    // Search with broader terms
    for (const searchConfig of COMPREHENSIVE_SEARCHES) {
      if (totalImported >= CONFIG.targetRecipes) break;
      
      console.log(`\n📍 Searching: "${searchConfig.query}" (max ${searchConfig.maxCarbs}g carbs)`);
      
      try {
        const recipes = await searchRecipes(searchConfig);
        console.log(`   ✓ Found ${recipes.length} recipes`);
        
        // Filter and collect unique IDs
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
    
    // Additional search if we need more
    if (allRecipeIds.length < CONFIG.targetRecipes) {
      console.log('\n🔍 Running additional searches...');
      
      const additionalSearches = [
        { query: 'turkey', maxCarbs: 35, minProtein: 15, count: 20 },
        { query: 'pork', maxCarbs: 35, minProtein: 15, count: 20 },
        { query: 'shrimp', maxCarbs: 30, minProtein: 15, count: 20 },
        { query: 'tofu', maxCarbs: 35, minProtein: 10, count: 20 },
        { query: 'quinoa', maxCarbs: 40, minProtein: 8, count: 20 }
      ];
      
      for (const search of additionalSearches) {
        if (allRecipeIds.length >= CONFIG.targetRecipes * 1.5) break;
        
        console.log(`\n   Trying: "${search.query}"`);
        try {
          const recipes = await searchRecipes(search);
          const newIds = recipes
            .map(r => r.id)
            .filter(id => id && !seenIds.has(id));
          
          newIds.forEach(id => seenIds.add(id));
          allRecipeIds.push(...newIds);
          
          console.log(`   ✓ Added ${newIds.length} more recipes`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`   ❌ Failed: ${error.message}`);
        }
      }
    }
    
    console.log(`\n📋 Final unique recipe count: ${allRecipeIds.length}`);
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
          
          // Progress
          const progress = Math.min(100, Math.round((totalImported / CONFIG.targetRecipes) * 100));
          console.log(`   📊 Progress: ${progress}% (${totalImported}/${CONFIG.targetRecipes})`);
          
          if (totalImported >= CONFIG.targetRecipes) {
            console.log(`\n🎯 Reached target of ${CONFIG.targetRecipes} imports!`);
            break;
          }
        }
      } catch (error) {
        console.error(`   ❌ Import error: ${error.message}`);
        totalFailed += batch.length;
      }
      
      // Delay
      if (i + CONFIG.batchSize < recipesToImport.length && totalImported < CONFIG.targetRecipes) {
        console.log(`   ⏱️  Waiting ${CONFIG.delayBetweenBatches / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    // Final count
    const endCount = await getRecipeCount();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${totalImported} recipes`);
    console.log(`⏭️  Skipped (duplicates): ${totalSkipped} recipes`);
    console.log(`❌ Failed: ${totalFailed} recipes`);
    console.log(`📈 Recipe count: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(60));
    
    if (totalImported > 0) {
      console.log('\n🎉 Import completed!');
      console.log('\n📝 Next steps:');
      console.log('1. Sync offline files: node scripts/sync-all-recipes-admin.js');
      console.log('2. Check recipes: http://localhost:3001/recipes');
      console.log('3. Review in admin: http://localhost:3001/admin/recipes');
    }
    
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
  }
}

// Run
runComprehensiveImport();