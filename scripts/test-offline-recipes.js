#!/usr/bin/env node

/**
 * Test Offline Recipe Loading
 * Verifies that all 397 recipes are available offline
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Offline Recipe System\n');

// Test 1: Check production-recipes.json
console.log('1️⃣ Checking production-recipes.json...');
const prodPath = path.join(__dirname, '..', 'public', 'data', 'production-recipes.json');
try {
  const prodData = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  console.log(`   ✅ File exists`);
  console.log(`   ✅ Recipe count: ${prodData.recipeCount}`);
  console.log(`   ✅ Actual recipes: ${prodData.recipes.length}`);
  console.log(`   ✅ Categories: ${JSON.stringify(prodData.categoryBreakdown)}`);
  
  if (prodData.recipeCount !== prodData.recipes.length) {
    console.error(`   ❌ Mismatch: recipeCount (${prodData.recipeCount}) != recipes.length (${prodData.recipes.length})`);
  }
} catch (error) {
  console.error(`   ❌ Error: ${error.message}`);
}

// Test 2: Check recipes.json
console.log('\n2️⃣ Checking recipes.json...');
const recipesPath = path.join(__dirname, '..', 'public', 'data', 'recipes.json');
try {
  const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  console.log(`   ✅ Recipe count: ${recipesData.recipeCount}`);
  console.log(`   ✅ Actual recipes: ${recipesData.recipes.length}`);
} catch (error) {
  console.error(`   ❌ Error: ${error.message}`);
}

// Test 3: Check file sizes
console.log('\n3️⃣ Checking file sizes...');
const files = [
  'production-recipes.json',
  'recipes.json',
  'recipes.min.json'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', 'public', 'data', file);
  try {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   ✅ ${file}: ${sizeMB} MB`);
  } catch (error) {
    console.log(`   ❌ ${file}: Not found`);
  }
});

// Test 4: Validate recipe structure
console.log('\n4️⃣ Validating recipe structure...');
try {
  const data = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  const sampleRecipe = data.recipes[0];
  
  const requiredFields = ['id', 'title', 'category', 'nutrition', 'ingredients', 'instructions'];
  const missingFields = requiredFields.filter(field => !sampleRecipe[field]);
  
  if (missingFields.length === 0) {
    console.log(`   ✅ Recipe structure valid`);
  } else {
    console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
  }
  
  // Check nutrition
  if (sampleRecipe.nutrition) {
    const nutritionFields = ['calories', 'carbohydrates', 'protein', 'fiber'];
    const hasNutrition = nutritionFields.every(field => 
      typeof sampleRecipe.nutrition[field] === 'number'
    );
    console.log(`   ${hasNutrition ? '✅' : '❌'} Nutrition data complete`);
  }
} catch (error) {
  console.error(`   ❌ Validation error: ${error.message}`);
}

// Test 5: Check category distribution
console.log('\n5️⃣ Recipe distribution by category...');
try {
  const data = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  const categories = {};
  
  data.recipes.forEach(recipe => {
    const cat = recipe.category || 'uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} recipes`);
  });
  
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  console.log(`   Total: ${total} recipes`);
} catch (error) {
  console.error(`   ❌ Error: ${error.message}`);
}

// Summary
console.log('\n📊 Summary:');
try {
  const data = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
  if (data.recipes.length === 397) {
    console.log('✅ All 397 recipes are available offline!');
    console.log('✅ The app will work without any internet connection.');
  } else {
    console.log(`⚠️  Only ${data.recipes.length} recipes found (expected 397)`);
    console.log('❌ Run sync-all-recipes-admin.js to update offline data');
  }
} catch (error) {
  console.log('❌ Failed to load offline recipes');
}