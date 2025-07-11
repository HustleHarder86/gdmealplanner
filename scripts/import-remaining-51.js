#!/usr/bin/env node

/**
 * Import Remaining 51 Recipes
 * Quick import to complete our 100 recipe goal
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  spoonacularApiKey: '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001',
  batchSize: 10, // Larger batches for speed
  delayBetweenBatches: 2000,
  targetRecipes: 51
};

// Quick diverse searches
const QUICK_SEARCHES = [
  { query: 'lamb', maxCarbs: 35, minProtein: 20, count: 15 },
  { query: 'pasta', maxCarbs: 45, minProtein: 10, count: 15 },
  { query: 'rice', maxCarbs: 45, minProtein: 5, count: 15 },
  { query: 'beans', maxCarbs: 40, minProtein: 10, count: 15 },
  { query: 'cheese', maxCarbs: 25, minProtein: 10, count: 15 }
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
      offset: Math.floor(Math.random() * 50).toString()
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

async function runQuickImport() {
  console.log('🚀 Importing Remaining 51 Recipes\n');
  
  try {
    const startCount = await getRecipeCount();
    console.log(`📊 Current: ${startCount} recipes`);
    console.log(`🎯 Target: ${startCount + CONFIG.targetRecipes} recipes\n`);
    
    let totalImported = 0;
    const allRecipeIds = [];
    
    // Quick search
    for (const search of QUICK_SEARCHES) {
      console.log(`🔍 Searching: "${search.query}"`);
      
      try {
        const recipes = await searchRecipes(search);
        const ids = recipes.map(r => r.id).filter(id => id);
        allRecipeIds.push(...ids);
        console.log(`   ✓ Found ${ids.length} recipes`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Total found: ${allRecipeIds.length} recipes`);
    console.log('🔄 Importing...\n');
    
    // Import quickly
    const recipesToImport = allRecipeIds.slice(0, CONFIG.targetRecipes * 2);
    
    for (let i = 0; i < recipesToImport.length && totalImported < CONFIG.targetRecipes; i += CONFIG.batchSize) {
      const batch = recipesToImport.slice(i, i + CONFIG.batchSize);
      console.log(`📦 Importing batch of ${batch.length}...`);
      
      try {
        const result = await importRecipes(batch);
        if (result.success) {
          totalImported += result.imported || 0;
          console.log(`   ✅ Imported: ${result.imported}, Skipped: ${result.skipped}`);
          
          if (totalImported >= CONFIG.targetRecipes) {
            console.log(`\n🎯 Target reached!`);
            break;
          }
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
      
      if (i + CONFIG.batchSize < recipesToImport.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
    
    const endCount = await getRecipeCount();
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Imported: ${totalImported} new recipes`);
    console.log(`📈 Total: ${startCount} → ${endCount} (+${endCount - startCount})`);
    console.log('='.repeat(50));
    
    if (endCount >= 395) {
      console.log('\n🎉 Successfully reached 100+ new recipes!');
      console.log('📝 Next: Run sync-all-recipes-admin.js');
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

runQuickImport();