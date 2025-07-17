#!/usr/bin/env npx tsx
/**
 * Batch Import 50 Recipes Script
 * Automatically imports 50 recipes distributed across categories
 */

import { RecipeImportScheduler } from "../src/services/spoonacular/automated-import/scheduler";
import { initializeFirebaseAdmin } from "../src/lib/firebase/admin";
import {
  BREAKFAST_STRATEGIES,
  LUNCH_STRATEGIES,
  DINNER_STRATEGIES,
  SNACK_STRATEGIES,
} from "../src/services/spoonacular/automated-import/import-strategies";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function batchImport50Recipes() {
  console.log("🍽️  Batch Import 50 Recipes for Pregnancy Plate Planner\n");

  try {
    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === "your_actual_spoonacular_api_key_here") {
      console.error(
        "❌ Error: Please add your actual SPOONACULAR_API_KEY to .env.local",
      );
      process.exit(1);
    }

    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase...");
    await initializeFirebaseAdmin();

    // Create scheduler
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate: new Date().toISOString().split("T")[0],
      minQualityScore: 50,
      rateLimitDelay: 2000,
    });

    // Get current status
    console.log("📊 Checking current library status...\n");
    const initialStatus = await scheduler.getCampaignStatus();
    console.log(`Initial Recipe Count: ${initialStatus.totalRecipesImported}`);
    console.log(`├─ Breakfast: ${initialStatus.categoryBreakdown.breakfast || 0}`);
    console.log(`├─ Lunch: ${initialStatus.categoryBreakdown.lunch || 0}`);
    console.log(`├─ Dinner: ${initialStatus.categoryBreakdown.dinner || 0}`);
    console.log(`└─ Snack: ${initialStatus.categoryBreakdown.snack || 0}`);
    console.log("");

    // Plan: Import 50 recipes distributed across categories
    const importPlan = [
      { category: "breakfast", count: 12, strategies: BREAKFAST_STRATEGIES },
      { category: "lunch", count: 13, strategies: LUNCH_STRATEGIES },
      { category: "dinner", count: 13, strategies: DINNER_STRATEGIES },
      { category: "snack", count: 12, strategies: SNACK_STRATEGIES },
    ];

    let totalImported = 0;
    let totalProcessed = 0;
    let totalRejected = 0;
    let totalApiCalls = 0;

    // Import recipes for each category
    for (const plan of importPlan) {
      console.log(`\n📦 Importing ${plan.count} ${plan.category} recipes...`);
      
      // Use different strategies for variety
      const strategyIndex = Math.floor(Math.random() * plan.strategies.length);
      const strategy = {
        ...plan.strategies[strategyIndex],
        targetCount: plan.count,
      };
      
      console.log(`   Using strategy: ${strategy.name}`);
      
      try {
        const report = await scheduler.manualImport(strategy, plan.count);
        
        totalImported += report.summary.recipesImported;
        totalProcessed += report.summary.recipesProcessed;
        totalRejected += report.summary.recipesRejected;
        totalApiCalls += report.summary.apiCallsUsed;
        
        console.log(`   ✅ Imported: ${report.summary.recipesImported} recipes`);
        console.log(`   ├─ Processed: ${report.summary.recipesProcessed} recipes`);
        console.log(`   ├─ Rejected: ${report.summary.recipesRejected} recipes`);
        console.log(`   └─ API Calls: ${report.summary.apiCallsUsed}`);
        
        if (report.errors.length > 0) {
          console.log(`   ⚠️  Errors: ${report.errors.length}`);
        }
        
        // Wait between categories to respect rate limits
        if (plan !== importPlan[importPlan.length - 1]) {
          console.log(`   ⏳ Waiting 3 seconds before next category...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`   ❌ Error importing ${plan.category}:`, error);
      }
    }

    // Show summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 IMPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Imported: ${totalImported} recipes`);
    console.log(`Total Processed: ${totalProcessed} recipes`);
    console.log(`Total Rejected: ${totalRejected} recipes`);
    console.log(`Total API Calls: ${totalApiCalls}`);
    
    // Get updated status
    const finalStatus = await scheduler.getCampaignStatus();
    console.log("\n📊 Updated Library Status:");
    console.log(`Total Recipes: ${finalStatus.totalRecipesImported} (+ ${finalStatus.totalRecipesImported - initialStatus.totalRecipesImported} new)`);
    console.log(`├─ Breakfast: ${finalStatus.categoryBreakdown.breakfast || 0} (+ ${(finalStatus.categoryBreakdown.breakfast || 0) - (initialStatus.categoryBreakdown.breakfast || 0)})`);
    console.log(`├─ Lunch: ${finalStatus.categoryBreakdown.lunch || 0} (+ ${(finalStatus.categoryBreakdown.lunch || 0) - (initialStatus.categoryBreakdown.lunch || 0)})`);
    console.log(`├─ Dinner: ${finalStatus.categoryBreakdown.dinner || 0} (+ ${(finalStatus.categoryBreakdown.dinner || 0) - (initialStatus.categoryBreakdown.dinner || 0)})`);
    console.log(`└─ Snack: ${finalStatus.categoryBreakdown.snack || 0} (+ ${(finalStatus.categoryBreakdown.snack || 0) - (initialStatus.categoryBreakdown.snack || 0)})`);
    
    if (totalImported > 0) {
      console.log("\n✅ Import successful! Now run:");
      console.log("   npm run sync-recipes");
      console.log("   to update the offline JSON files");
    }
    
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );

    if (error instanceof Error && error.message.includes("Firebase")) {
      console.log(
        "\n📝 Make sure your Firebase Admin key is properly set in .env.local",
      );
    }
  }
}

// Run the batch import
batchImport50Recipes()
  .then(() => {
    console.log("\n🎉 Batch import completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });