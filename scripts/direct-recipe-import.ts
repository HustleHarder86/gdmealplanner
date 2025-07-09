#!/usr/bin/env tsx
/**
 * Direct Recipe Import Script
 * Imports recipes directly using Firebase Admin SDK
 */

import { config } from 'dotenv';
config();

import { adminDb } from '../src/lib/firebase/admin';
import { RecipeImportScheduler } from '../src/services/spoonacular/automated-import/scheduler';
import { RecipeCategory } from '../src/types/recipe';
import * as fs from 'fs/promises';
import * as path from 'path';

// Recipe distribution plan - adjusted based on current distribution
const IMPORT_PLAN = {
  breakfast: 20,  // Currently have 81, need fewer
  lunch: 60,      // Currently have 41, need more
  dinner: 40,     // Currently have 105, moderate addition
  snack: 80,      // Currently have 15, need many more
  total: 200
};

// Progress tracking
let totalImported = 0;
let totalDuplicates = 0;
let totalFailed = 0;
const results: { [key: string]: any } = {};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importRecipesForCategory(
  scheduler: RecipeImportScheduler,
  category: RecipeCategory,
  targetCount: number
): Promise<void> {
  console.log(`\n📂 Importing ${targetCount} ${category} recipes...`);
  
  let imported = 0;
  let strategyIndex = 0;
  const batchSize = 10;
  
  // Get available strategies
  const strategies = scheduler.getStrategiesForCategory(category);
  console.log(`   Found ${strategies.length} import strategies for ${category}`);
  
  while (imported < targetCount) {
    const remainingCount = Math.min(batchSize, targetCount - imported);
    
    try {
      console.log(`\n   🔍 Using strategy ${strategyIndex + 1}/${strategies.length}`);
      console.log(`   📦 Importing batch of ${remainingCount} recipes...`);
      
      const importResults = await scheduler.importRecipes(category, remainingCount, strategyIndex);
      
      const successCount = importResults.filter(r => r.success).length;
      const duplicateCount = importResults.filter(r => !r.success && r.error?.includes('duplicate')).length;
      const failedCount = importResults.filter(r => !r.success && !r.error?.includes('duplicate')).length;
      
      imported += successCount;
      totalImported += successCount;
      totalDuplicates += duplicateCount;
      totalFailed += failedCount;
      
      console.log(`   ✅ Imported: ${successCount}`);
      console.log(`   🔁 Duplicates: ${duplicateCount}`);
      console.log(`   ❌ Failed: ${failedCount}`);
      console.log(`   📊 Category progress: ${imported}/${targetCount}`);
      
      // Store results
      if (!results[category]) results[category] = { imported: 0, duplicates: 0, failed: 0, recipes: [] };
      results[category].imported += successCount;
      results[category].duplicates += duplicateCount;
      results[category].failed += failedCount;
      
      // Store successful recipes
      const successfulImports = importResults.filter(r => r.success);
      results[category].recipes.push(...successfulImports);
      
      // If we're hitting too many duplicates, try next strategy
      if (successCount === 0 && duplicateCount > 5) {
        strategyIndex = (strategyIndex + 1) % strategies.length;
        console.log(`   📌 Too many duplicates, switching to strategy ${strategyIndex + 1}`);
      }
      
      // Rate limiting
      console.log(`   ⏳ Waiting 5 seconds before next batch...`);
      await sleep(5000);
      
    } catch (error) {
      console.error(`   ❌ Error during import:`, error);
      totalFailed += remainingCount;
      
      // Try next strategy on error
      strategyIndex = (strategyIndex + 1) % strategies.length;
      await sleep(5000);
    }
  }
  
  console.log(`\n✅ Completed ${category}: ${imported}/${targetCount} recipes imported`);
}

async function exportToOfflineJSON() {
  console.log('\n📤 Exporting recipes to offline JSON...');
  
  try {
    // Get all recipes from Firebase
    const recipesSnapshot = await adminDb().collection('recipes').get();
    const recipes = recipesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`   Found ${recipes.length} total recipes in Firebase`);
    
    // Group by category
    const byCategory: { [key: string]: number } = {};
    recipes.forEach((r: any) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });
    
    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      source: 'https://gdmealplanner.vercel.app',
      recipeCount: recipes.length,
      recipes: recipes
    };
    
    // Write to file
    const outputPath = path.join(process.cwd(), 'data', 'production-recipes.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`   ✅ Exported ${recipes.length} recipes to production-recipes.json`);
    console.log(`   📊 File size: ${fileSizeMB} MB`);
    console.log(`   📂 By category:`, byCategory);
    
    return { totalRecipes: recipes.length, byCategory, fileSizeMB };
    
  } catch (error) {
    console.error('   ❌ Export failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Direct Recipe Import System');
  console.log('='.repeat(60));
  console.log(`📋 Import Plan: ${IMPORT_PLAN.total} recipes`);
  console.log(`   - Breakfast: ${IMPORT_PLAN.breakfast} (currently have 81)`);
  console.log(`   - Lunch: ${IMPORT_PLAN.lunch} (currently have 41)`);
  console.log(`   - Dinner: ${IMPORT_PLAN.dinner} (currently have 105)`);
  console.log(`   - Snacks: ${IMPORT_PLAN.snack} (currently have 15)`);
  console.log('='.repeat(60));
  
  try {
    // Initialize Firebase Admin
    console.log('\n🔥 Initializing Firebase Admin...');
    // Admin SDK initializes lazily when adminDb is first called
    const testCollection = await adminDb().collection('recipes').limit(1).get();
    console.log(`✅ Firebase Admin initialized (found ${testCollection.size} test record)`);
    
    // Check Spoonacular API key
    if (!process.env.SPOONACULAR_API_KEY) {
      throw new Error('SPOONACULAR_API_KEY not found in environment variables');
    }
    console.log('✅ Spoonacular API key found');
    
    // Initialize scheduler
    const scheduler = new RecipeImportScheduler();
    console.log('✅ Recipe Import Scheduler initialized');
    
    // Get current stats
    const currentStats = await scheduler.getImportStatus();
    console.log(`\n📊 Current Database Status:`);
    console.log(`   Total Recipes: ${currentStats.totalRecipes}`);
    console.log(`   Breakfast: ${currentStats.byCategory.breakfast || 0}`);
    console.log(`   Lunch: ${currentStats.byCategory.lunch || 0}`);
    console.log(`   Dinner: ${currentStats.byCategory.dinner || 0}`);
    console.log(`   Snacks: ${currentStats.byCategory.snack || 0}`);
    
    console.log('\n🏁 Starting import process...');
    console.log('   Note: This will take several minutes due to API rate limiting');
    const startTime = Date.now();
    
    // Import recipes for each category
    const categories: RecipeCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    for (const category of categories) {
      await importRecipesForCategory(scheduler, category, IMPORT_PLAN[category]);
    }
    
    // Generate report
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Imported: ${totalImported}`);
    console.log(`   Duplicates Found: ${totalDuplicates}`);
    console.log(`   Failed Imports: ${totalFailed}`);
    console.log(`   Success Rate: ${((totalImported / IMPORT_PLAN.total) * 100).toFixed(1)}%`);
    
    console.log(`\n📂 Category Breakdown:`);
    for (const [category, stats] of Object.entries(results)) {
      console.log(`   ${category}:`);
      console.log(`     Imported: ${stats.imported}`);
      console.log(`     Duplicates: ${stats.duplicates}`);
      console.log(`     Failed: ${stats.failed}`);
      
      // Show average GD score
      if (stats.recipes && stats.recipes.length > 0) {
        const avgScore = stats.recipes.reduce((sum: number, r: any) => 
          sum + (r.recipe?.gdValidation?.score || 0), 0) / stats.recipes.length;
        console.log(`     Avg GD Score: ${avgScore.toFixed(1)}/100`);
      }
    }
    
    // Get final stats
    const finalStats = await scheduler.getImportStatus();
    console.log(`\n📊 Final Database Status:`);
    console.log(`   Total Recipes: ${finalStats.totalRecipes} (+ ${finalStats.totalRecipes - currentStats.totalRecipes})`);
    console.log(`   Breakfast: ${finalStats.byCategory.breakfast || 0}`);
    console.log(`   Lunch: ${finalStats.byCategory.lunch || 0}`);
    console.log(`   Dinner: ${finalStats.byCategory.dinner || 0}`);
    console.log(`   Snacks: ${finalStats.byCategory.snack || 0}`);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️  Total time: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    
    // Export to offline JSON
    console.log('\n' + '='.repeat(60));
    const exportResult = await exportToOfflineJSON();
    
    console.log('\n🎉 SUCCESS! Recipe import and export completed!');
    console.log(`\n📚 FINAL OFFLINE LIBRARY STATUS:`);
    console.log(`   Total Recipes: ${exportResult.totalRecipes}`);
    console.log(`   Breakfast: ${exportResult.byCategory.breakfast || 0}`);
    console.log(`   Lunch: ${exportResult.byCategory.lunch || 0}`);
    console.log(`   Dinner: ${exportResult.byCategory.dinner || 0}`);
    console.log(`   Snacks: ${exportResult.byCategory.snack || 0}`);
    console.log(`   File Size: ${exportResult.fileSizeMB} MB`);
    
    console.log('\n✅ The offline recipe library has been updated successfully!');
    console.log('   The new recipes are now available in data/production-recipes.json');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);