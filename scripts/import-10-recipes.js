#!/usr/bin/env node

/**
 * Import 10 Test Recipes
 * A smaller version to test the bulk import process
 */

const http = require('http');
const https = require('https');

const CONFIG = {
  spoonacularApiKey: '8ad82ca088dd45c683b3e6ff388fcf19',
  localApiUrl: 'http://localhost:3001'
};

// Search for 10 healthy recipes
async function findHealthyRecipes() {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      apiKey: CONFIG.spoonacularApiKey,
      query: 'healthy',
      number: '10',
      maxCarbs: '40',
      minProtein: '15',
      addRecipeInformation: 'true'
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

async function main() {
  console.log('🔍 Finding 10 healthy recipes for gestational diabetes...\n');
  
  try {
    // Search for recipes
    const recipes = await findHealthyRecipes();
    console.log(`✅ Found ${recipes.length} recipes:\n`);
    
    recipes.forEach((recipe, i) => {
      console.log(`${i + 1}. ${recipe.title}`);
      console.log(`   Carbs: ${recipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 'N/A'}g`);
    });
    
    // Extract IDs
    const recipeIds = recipes.map(r => r.id);
    
    console.log('\n📥 Importing recipes...');
    const result = await importRecipes(recipeIds);
    
    if (result.success) {
      console.log('\n✅ Import Results:');
      console.log(`   Imported: ${result.imported}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Failed: ${result.failed}`);
      
      if (result.imported > 0) {
        console.log('\n🎉 Success! New recipes are now available.');
        console.log('\n📝 Next: Run "npm run sync-recipes" to update offline files');
      }
    } else {
      console.error('\n❌ Import failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();