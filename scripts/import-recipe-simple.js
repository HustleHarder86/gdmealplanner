#!/usr/bin/env node

/**
 * Simple recipe import test using the API endpoint
 */

const http = require('http');

async function importRecipe(recipeId) {
  console.log(`\n🍳 Importing recipe ID: ${recipeId}...\n`);
  
  const data = JSON.stringify({
    recipeIds: [recipeId]
  });
  
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
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    // Test with a healthy recipe - Quinoa Salad
    const testRecipeId = 664090;
    
    console.log('📡 Calling import API...');
    const result = await importRecipe(testRecipeId);
    
    if (result.status === 200 && result.data.success) {
      console.log('\n✅ Import successful!');
      console.log(`   Imported: ${result.data.imported} recipes`);
      console.log(`   Skipped: ${result.data.skipped} recipes`);
      console.log(`   Failed: ${result.data.failed} recipes`);
      
      if (result.data.imported > 0) {
        console.log('\n🎉 Recipe imported successfully!');
        console.log('   The recipe is now available in:');
        console.log('   - Admin panel: http://localhost:3001/admin/recipes');
        console.log('   - Recipe browser: http://localhost:3001/recipes');
        console.log('\n📝 Next step: Run "npm run sync-recipes" to update offline files');
      } else if (result.data.skipped > 0) {
        console.log('\n⚠️  Recipe was skipped (already exists in database)');
      }
    } else {
      console.error('\n❌ Import failed:');
      console.error(`   Status: ${result.status}`);
      console.error(`   Error: ${result.data.error || 'Unknown error'}`);
      if (result.data.details) {
        console.error(`   Details: ${result.data.details}`);
      }
    }
    
    // Now let's check the current recipe count
    console.log('\n📊 Checking total recipe count...');
    const countResult = await checkRecipeCount();
    if (countResult.count) {
      console.log(`   Total recipes in database: ${countResult.count}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function checkRecipeCount() {
  return new Promise((resolve) => {
    http.get('http://localhost:3001/api/recipes/count', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Failed to parse count' });
        }
      });
    }).on('error', () => resolve({ error: 'Failed to fetch count' }));
  });
}

// Run the import
main();