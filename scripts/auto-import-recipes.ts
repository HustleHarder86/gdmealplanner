#!/usr/bin/env tsx
/**
 * Automated Recipe Import Script
 * Imports 200 recipes from Spoonacular API with GD validation
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { RecipeImportScheduler } from '../src/services/spoonacular/automated-import/scheduler';
import { RecipeCategory } from '../src/types/recipe';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Recipe distribution plan
const IMPORT_PLAN = {
  breakfast: 50,
  lunch: 50,
  dinner: 50,
  snack: 50,
  total: 200
};

// API rate limiting configuration
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 5000; // 5 seconds between batches
const MAX_DAILY_CALLS = 90; // Stay under free tier limit

// Progress tracking
let totalImported = 0;
let duplicatesFound = 0;
let failedImports = 0;
const importResults: { [key: string]: any[] } = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: []
};

async function initializeFirebase() {
  console.log('🔥 Initializing Firebase...');
  
  const firebaseConfig = {
    apiKey: process.env.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  // Sign in as admin
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    throw new Error('Admin credentials not found in environment variables');
  }
  
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('✅ Firebase initialized and authenticated');
  
  return app;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importRecipesForCategory(
  scheduler: RecipeImportScheduler,
  category: RecipeCategory,
  targetCount: number
): Promise<void> {
  console.log(`\n📂 Importing ${targetCount} ${category} recipes...`);
  
  const strategies = scheduler.getStrategiesForCategory(category);
  let imported = 0;
  let strategyIndex = 0;
  let apiCallsToday = 0;
  
  while (imported < targetCount && apiCallsToday < MAX_DAILY_CALLS) {
    const remainingCount = Math.min(BATCH_SIZE, targetCount - imported, MAX_DAILY_CALLS - apiCallsToday);
    
    if (remainingCount <= 0) break;
    
    try {
      console.log(`\n🔍 Using strategy ${strategyIndex + 1}/${strategies.length} for ${category}`);
      console.log(`   Importing batch of ${remainingCount} recipes...`);
      
      const results = await scheduler.importRecipes(category, remainingCount, strategyIndex);
      
      const successCount = results.filter(r => r.success).length;
      const duplicateCount = results.filter(r => !r.success && r.error?.includes('duplicate')).length;
      const failureCount = results.filter(r => !r.success && !r.error?.includes('duplicate')).length;
      
      imported += successCount;
      totalImported += successCount;
      duplicatesFound += duplicateCount;
      failedImports += failureCount;
      apiCallsToday += remainingCount;
      
      // Store results
      importResults[category].push(...results.filter(r => r.success));
      
      console.log(`   ✅ Imported: ${successCount}`);
      console.log(`   🔁 Duplicates: ${duplicateCount}`);
      console.log(`   ❌ Failed: ${failureCount}`);
      console.log(`   📊 Category progress: ${imported}/${targetCount}`);
      
      // Rotate strategies for variety
      strategyIndex = (strategyIndex + 1) % strategies.length;
      
      // Rate limiting delay
      if (imported < targetCount) {
        console.log(`   ⏳ Waiting ${BATCH_DELAY_MS / 1000} seconds before next batch...`);
        await sleep(BATCH_DELAY_MS);
      }
      
    } catch (error) {
      console.error(`   ❌ Error during import:`, error);
      failedImports += remainingCount;
      
      // Try next strategy
      strategyIndex = (strategyIndex + 1) % strategies.length;
      await sleep(BATCH_DELAY_MS);
    }
  }
  
  console.log(`\n✅ Completed ${category}: ${imported}/${targetCount} recipes imported`);
}

async function generateImportReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Imported: ${totalImported}`);
  console.log(`   Duplicates Found: ${duplicatesFound}`);
  console.log(`   Failed Imports: ${failedImports}`);
  console.log(`   Success Rate: ${((totalImported / IMPORT_PLAN.total) * 100).toFixed(1)}%`);
  
  console.log(`\n📂 Category Breakdown:`);
  for (const [category, recipes] of Object.entries(importResults)) {
    console.log(`   ${category}: ${recipes.length} recipes`);
    if (recipes.length > 0) {
      const avgScore = recipes.reduce((sum, r) => sum + (r.recipe?.gdValidation?.score || 0), 0) / recipes.length;
      console.log(`     Average GD Score: ${avgScore.toFixed(1)}/100`);
    }
  }
  
  console.log(`\n🎯 Recipe Quality:`);
  const allRecipes = Object.values(importResults).flat();
  const scoreRanges = {
    excellent: allRecipes.filter(r => r.recipe?.gdValidation?.score >= 70).length,
    good: allRecipes.filter(r => r.recipe?.gdValidation?.score >= 50 && r.recipe?.gdValidation?.score < 70).length,
    acceptable: allRecipes.filter(r => r.recipe?.gdValidation?.score >= 30 && r.recipe?.gdValidation?.score < 50).length,
  };
  
  console.log(`   Excellent (70+): ${scoreRanges.excellent} recipes`);
  console.log(`   Good (50-69): ${scoreRanges.good} recipes`);
  console.log(`   Acceptable (30-49): ${scoreRanges.acceptable} recipes`);
  
  console.log('\n' + '='.repeat(60));
}

async function promptToContinue(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n🤔 Continue with import? (y/n): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log('🚀 Automated Recipe Import System');
  console.log('='.repeat(60));
  console.log(`📋 Import Plan: ${IMPORT_PLAN.total} recipes`);
  console.log(`   - Breakfast: ${IMPORT_PLAN.breakfast}`);
  console.log(`   - Lunch: ${IMPORT_PLAN.lunch}`);
  console.log(`   - Dinner: ${IMPORT_PLAN.dinner}`);
  console.log(`   - Snacks: ${IMPORT_PLAN.snack}`);
  console.log('='.repeat(60));
  
  try {
    // Initialize Firebase
    await initializeFirebase();
    
    // Check Spoonacular API key
    if (!process.env.SPOONACULAR_API_KEY) {
      throw new Error('SPOONACULAR_API_KEY not found in environment variables');
    }
    
    // Initialize scheduler
    const scheduler = new RecipeImportScheduler();
    console.log('✅ Recipe Import Scheduler initialized');
    
    // Get current recipe count
    const currentStats = await scheduler.getImportStatus();
    console.log(`\n📊 Current Database Status:`);
    console.log(`   Total Recipes: ${currentStats.totalRecipes}`);
    console.log(`   Breakfast: ${currentStats.byCategory.breakfast || 0}`);
    console.log(`   Lunch: ${currentStats.byCategory.lunch || 0}`);
    console.log(`   Dinner: ${currentStats.byCategory.dinner || 0}`);
    console.log(`   Snacks: ${currentStats.byCategory.snack || 0}`);
    
    // Confirm before starting
    const shouldContinue = await promptToContinue();
    if (!shouldContinue) {
      console.log('❌ Import cancelled by user');
      process.exit(0);
    }
    
    console.log('\n🏁 Starting import process...');
    const startTime = Date.now();
    
    // Import recipes for each category
    const categories: RecipeCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    for (const category of categories) {
      await importRecipesForCategory(scheduler, category, IMPORT_PLAN[category]);
      
      // Check if we're approaching daily limit
      if (totalImported >= MAX_DAILY_CALLS - 10) {
        console.log('\n⚠️  Approaching daily API limit. Stopping import.');
        break;
      }
    }
    
    // Generate report
    await generateImportReport();
    
    // Get final recipe count
    const finalStats = await scheduler.getImportStatus();
    console.log(`\n📊 Final Database Status:`);
    console.log(`   Total Recipes: ${finalStats.totalRecipes} (+ ${finalStats.totalRecipes - currentStats.totalRecipes})`);
    console.log(`   Breakfast: ${finalStats.byCategory.breakfast || 0}`);
    console.log(`   Lunch: ${finalStats.byCategory.lunch || 0}`);
    console.log(`   Dinner: ${finalStats.byCategory.dinner || 0}`);
    console.log(`   Snacks: ${finalStats.byCategory.snack || 0}`);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️  Total time: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    
    if (totalImported < IMPORT_PLAN.total) {
      console.log(`\n⚠️  Note: Only imported ${totalImported}/${IMPORT_PLAN.total} recipes.`);
      console.log(`   This may be due to API limits, duplicates, or validation failures.`);
      console.log(`   You can run the script again tomorrow to import more.`);
    }
    
    console.log('\n✅ Import process completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the export script to update offline JSON files');
    console.log('   2. Test the recipes in the meal planner');
    console.log('   3. Clear browser cache to load new recipes');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);