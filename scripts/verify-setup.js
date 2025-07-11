#!/usr/bin/env node

/**
 * Verify local development setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Local Development Setup...\n');

let errors = 0;
let warnings = 0;

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  console.error('❌ Node.js version 18+ required. Current:', nodeVersion);
  errors++;
} else {
  console.log('✅ Node.js version:', nodeVersion);
}

// Check if node_modules exists
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.error('❌ node_modules not found. Run: npm install');
  errors++;
} else {
  console.log('✅ Dependencies installed');
}

// Check .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found');
  errors++;
} else {
  console.log('✅ .env.local exists');
  
  // Check if placeholder values are still there
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_firebase_api_key')) {
    console.warn('⚠️  Firebase credentials not configured in .env.local');
    warnings++;
  } else {
    console.log('✅ Firebase credentials appear to be configured');
  }
  
  if (envContent.includes('your_actual_spoonacular_api_key_here')) {
    console.warn('⚠️  Spoonacular API key not configured (optional for basic testing)');
    warnings++;
  }
}

// Check offline recipe data
const recipePaths = [
  'public/data/recipes.json',
  'public/data/recipes.min.json',
  'public/data/production-recipes.json'
];

let recipeDataOk = true;
for (const recipePath of recipePaths) {
  if (!fs.existsSync(path.join(process.cwd(), recipePath))) {
    console.error(`❌ Missing recipe data: ${recipePath}`);
    errors++;
    recipeDataOk = false;
  }
}

if (recipeDataOk) {
  console.log('✅ Offline recipe data found');
  
  // Check recipe count
  try {
    const recipesContent = fs.readFileSync(path.join(process.cwd(), 'public/data/recipes.json'), 'utf8');
    const recipes = JSON.parse(recipesContent);
    const recipeCount = Array.isArray(recipes) ? recipes.length : Object.keys(recipes).length;
    console.log(`✅ ${recipeCount} recipes loaded`);
  } catch (e) {
    console.error('❌ Error reading recipe data:', e.message);
    errors++;
  }
}

// Check meal plan data
const mealPlanDir = path.join(process.cwd(), 'data/meal-plans');
if (!fs.existsSync(mealPlanDir)) {
  console.error('❌ Meal plan data directory not found');
  errors++;
} else {
  const mealPlanFiles = fs.readdirSync(mealPlanDir).filter(f => f.endsWith('.json'));
  console.log(`✅ ${mealPlanFiles.length} meal plan weeks found`);
}

// Summary
console.log('\n📊 Setup Summary:');
console.log('─'.repeat(40));

if (errors === 0 && warnings === 0) {
  console.log('✅ Everything looks good! You can run: npm run dev');
} else {
  if (errors > 0) {
    console.error(`❌ ${errors} error(s) found - these must be fixed`);
  }
  if (warnings > 0) {
    console.warn(`⚠️  ${warnings} warning(s) found - these are optional`);
  }
  
  console.log('\n📚 Next Steps:');
  if (errors > 0) {
    console.log('1. Fix the errors above');
  }
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('2. Run: npm install');
  }
  if (warnings > 0) {
    console.log('3. Configure Firebase credentials in .env.local (see LOCAL_SETUP_GUIDE.md)');
  }
}

console.log('\n🔗 For detailed setup instructions, see: LOCAL_SETUP_GUIDE.md');

process.exit(errors > 0 ? 1 : 0);