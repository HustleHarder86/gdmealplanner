#!/usr/bin/env tsx
/**
 * Automated Recipe Import via API
 * Uses the existing API endpoint to import recipes
 */

import * as readline from 'readline';

// Recipe distribution plan
const IMPORT_PLAN = {
  breakfast: 50,
  lunch: 50,
  dinner: 50,
  snack: 50,
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

async function callImportAPI(category: string, count: number, strategyIndex: number = 0) {
  const url = 'http://localhost:3000/api/recipes/import-batch';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        count,
        strategyIndex
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to call import API:`, error);
    throw error;
  }
}

async function importRecipesForCategory(category: string, targetCount: number) {
  console.log(`\n📂 Importing ${targetCount} ${category} recipes...`);
  
  let imported = 0;
  let strategyIndex = 0;
  const batchSize = 10; // Import 10 at a time
  
  while (imported < targetCount) {
    const remainingCount = Math.min(batchSize, targetCount - imported);
    
    try {
      console.log(`   🔍 Batch ${Math.floor(imported / batchSize) + 1}: Importing ${remainingCount} recipes...`);
      
      const result = await callImportAPI(category, remainingCount, strategyIndex);
      
      if (result.success) {
        const successCount = result.data.successful || 0;
        const duplicateCount = result.data.duplicates || 0;
        const failedCount = result.data.failed || 0;
        
        imported += successCount;
        totalImported += successCount;
        totalDuplicates += duplicateCount;
        totalFailed += failedCount;
        
        console.log(`   ✅ Imported: ${successCount}`);
        console.log(`   🔁 Duplicates: ${duplicateCount}`);
        console.log(`   ❌ Failed: ${failedCount}`);
        
        // Store results
        if (!results[category]) results[category] = { imported: 0, duplicates: 0, failed: 0 };
        results[category].imported += successCount;
        results[category].duplicates += duplicateCount;
        results[category].failed += failedCount;
        
        // If we're not getting new recipes, try next strategy
        if (successCount === 0 && duplicateCount > 5) {
          strategyIndex++;
          console.log(`   📌 Switching to strategy ${strategyIndex + 1}`);
        }
      } else {
        console.error(`   ❌ API Error: ${result.error}`);
        totalFailed += remainingCount;
      }
      
      // Rate limiting
      console.log(`   ⏳ Waiting 3 seconds before next batch...`);
      await sleep(3000);
      
    } catch (error) {
      console.error(`   ❌ Error during import:`, error);
      totalFailed += remainingCount;
      await sleep(5000);
    }
  }
  
  console.log(`✅ Completed ${category}: ${imported}/${targetCount} recipes imported`);
}

async function getRecipeStats() {
  try {
    const response = await fetch('http://localhost:3000/api/recipes/import-batch', {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.stats || null;
    }
  } catch (error) {
    console.error('Failed to get recipe stats:', error);
  }
  return null;
}

async function exportToOfflineDatabase() {
  console.log('\n📤 Exporting recipes to offline database...');
  
  try {
    // First prepare offline data
    console.log('   🔄 Preparing offline data in Firebase...');
    const prepareResponse = await fetch('http://localhost:3000/api/recipes/prepare-offline', {
      method: 'POST',
    });
    
    if (!prepareResponse.ok) {
      throw new Error(`Prepare offline failed: ${prepareResponse.statusText}`);
    }
    
    const prepareResult = await prepareResponse.json();
    console.log(`   ✅ Offline data prepared: ${prepareResult.message}`);
    
    // Then export to JSON
    console.log('   💾 Exporting to JSON files...');
    const exportResponse = await fetch('http://localhost:3000/api/recipes/export');
    
    if (!exportResponse.ok) {
      throw new Error(`Export failed: ${exportResponse.statusText}`);
    }
    
    const exportData = await exportResponse.json();
    
    console.log('   ✅ Export completed!');
    console.log(`      Total recipes: ${exportData.totalRecipes}`);
    console.log(`      File size: ${(exportData.sizeInBytes / 1024 / 1024).toFixed(2)} MB`);
    
    return exportData;
  } catch (error) {
    console.error('   ❌ Export failed:', error);
    return null;
  }
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
  console.log('🚀 Automated Recipe Import System (via API)');
  console.log('='.repeat(60));
  console.log(`📋 Import Plan: ${IMPORT_PLAN.total} recipes`);
  console.log(`   - Breakfast: ${IMPORT_PLAN.breakfast}`);
  console.log(`   - Lunch: ${IMPORT_PLAN.lunch}`);
  console.log(`   - Dinner: ${IMPORT_PLAN.dinner}`);
  console.log(`   - Snacks: ${IMPORT_PLAN.snack}`);
  console.log('='.repeat(60));
  
  try {
    // Get current stats
    const currentStats = await getRecipeStats();
    if (currentStats) {
      console.log(`\n📊 Current Database Status:`);
      console.log(`   Total Recipes: ${currentStats.totalRecipes}`);
      console.log(`   Breakfast: ${currentStats.byCategory.breakfast || 0}`);
      console.log(`   Lunch: ${currentStats.byCategory.lunch || 0}`);
      console.log(`   Dinner: ${currentStats.byCategory.dinner || 0}`);
      console.log(`   Snacks: ${currentStats.byCategory.snack || 0}`);
    }
    
    // Confirm before starting
    console.log('\n⚠️  Note: Make sure the Next.js dev server is running (npm run dev)');
    const shouldContinue = await promptToContinue();
    if (!shouldContinue) {
      console.log('❌ Import cancelled by user');
      process.exit(0);
    }
    
    console.log('\n🏁 Starting import process...');
    const startTime = Date.now();
    
    // Import recipes for each category
    for (const [category, count] of Object.entries(IMPORT_PLAN)) {
      if (category === 'total') continue;
      await importRecipesForCategory(category, count);
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
    }
    
    // Get final stats
    const finalStats = await getRecipeStats();
    if (finalStats) {
      console.log(`\n📊 Final Database Status:`);
      console.log(`   Total Recipes: ${finalStats.totalRecipes} (+ ${finalStats.totalRecipes - (currentStats?.totalRecipes || 0)})`);
      console.log(`   Breakfast: ${finalStats.byCategory.breakfast || 0}`);
      console.log(`   Lunch: ${finalStats.byCategory.lunch || 0}`);
      console.log(`   Dinner: ${finalStats.byCategory.dinner || 0}`);
      console.log(`   Snacks: ${finalStats.byCategory.snack || 0}`);
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱️  Total time: ${Math.floor(duration / 60)}m ${duration % 60}s`);
    
    // Export to offline database
    console.log('\n' + '='.repeat(60));
    const exportResult = await exportToOfflineDatabase();
    
    if (exportResult) {
      console.log('\n🎉 SUCCESS! Recipe import and export completed!');
      console.log(`\n📚 FINAL OFFLINE LIBRARY STATUS:`);
      console.log(`   Total Recipes: ${exportResult.totalRecipes}`);
      console.log(`   Breakfast: ${exportResult.categories?.breakfast || 0}`);
      console.log(`   Lunch: ${exportResult.categories?.lunch || 0}`);
      console.log(`   Dinner: ${exportResult.categories?.dinner || 0}`);
      console.log(`   Snacks: ${exportResult.categories?.snack || 0}`);
      console.log(`   File Size: ${(exportResult.sizeInBytes / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log('\n✅ All done! The offline recipe library has been updated.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);