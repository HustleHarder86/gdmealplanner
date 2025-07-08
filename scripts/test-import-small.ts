import { RecipeImportScheduler } from "../src/services/spoonacular/automated-import/scheduler";
import { initializeFirebaseAdmin } from "../src/lib/firebase/admin";
import { BREAKFAST_STRATEGIES } from "../src/services/spoonacular/automated-import/import-strategies";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testSmallImport() {
  console.log("🧪 Running Small Test Import (5 recipes)...\n");

  // Check for API key
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey || apiKey === "your_actual_spoonacular_api_key_here") {
    console.error(
      "❌ Error: Please add your actual SPOONACULAR_API_KEY to .env.local",
    );
    console.log(
      "\nEdit .env.local and replace 'your_actual_spoonacular_api_key_here' with your real API key",
    );
    process.exit(1);
  }

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Create scheduler with test configuration
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate: new Date().toISOString().split("T")[0],
      dailyQuota: 5, // Only import 5 recipes for testing
      minQualityScore: 50,
      rateLimitDelay: 2000, // 2 seconds between API calls to be extra safe
    });

    // Use the first breakfast strategy for testing
    const testStrategy = {
      ...BREAKFAST_STRATEGIES[0],
      targetCount: 5, // Override to only get 5 recipes
    };

    console.log("📋 Test Import Strategy:");
    console.log(`   Name: ${testStrategy.name}`);
    console.log(`   Description: ${testStrategy.description}`);
    console.log(`   Max Carbs: ${testStrategy.filters.maxCarbs}g`);
    console.log(`   Min Protein: ${testStrategy.filters.minProtein}g`);
    console.log(`   Min Fiber: ${testStrategy.filters.minFiber}g`);
    console.log("");

    // Execute manual import with the test strategy
    console.log("🔄 Starting test import...\n");
    const report = await scheduler.manualImport(testStrategy, 5);

    // Display results
    console.log("\n✅ Test Import Complete!");
    console.log("\n📊 Results:");
    console.log(`   Imported: ${report.recipesImported} recipes`);
    console.log(`   Processed: ${report.recipesProcessed} recipes`);
    console.log(`   Rejected: ${report.recipesRejected} recipes`);
    console.log(`   API Calls: ${report.apiCallsUsed}`);

    if (report.recipesImported > 0) {
      console.log("\n🍳 Imported Recipes:");
      const categories = report.categoryBreakdown;
      Object.entries(categories).forEach(([category, count]) => {
        if (count > 0) {
          console.log(`   ${category}: ${count} recipes`);
        }
      });
    }

    if (report.errors.length > 0) {
      console.log("\n⚠️  Issues:");
      report.errors.forEach((error) => console.log(`   - ${error}`));
    }

    // Run the check script to see updated totals
    console.log("\n📈 Checking library status...");
    const { RecipeModel } = await import("../src/lib/firebase/models/recipe");
    const totalCount = await RecipeModel.getCount();
    const categoryBreakdown = await RecipeModel.getCountByCategory();

    console.log(`\n📚 Current Library Status:`);
    console.log(`   Total Recipes: ${totalCount}`);
    console.log(`   Breakfast: ${categoryBreakdown.breakfast || 0}`);
    console.log(`   Lunch: ${categoryBreakdown.lunch || 0}`);
    console.log(`   Dinner: ${categoryBreakdown.dinner || 0}`);
    console.log(`   Snack: ${categoryBreakdown.snack || 0}`);
  } catch (error) {
    console.error("\n❌ Test import failed:", error);
    if (error instanceof Error && error.message.includes("Firebase")) {
      console.log("\n📝 Firebase Setup Required:");
      console.log(
        "1. Add your Firebase service account JSON to FIREBASE_ADMIN_KEY in .env.local",
      );
      console.log(
        "2. Make sure all Firebase client config variables are set in .env.local",
      );
    }
    process.exit(1);
  }
}

// Run the test import
testSmallImport()
  .then(() => {
    console.log("\n✅ Test import complete!");
    console.log("\n💡 Next steps:");
    console.log(
      "   - Run 'npm run recipes:check' to see detailed library status",
    );
    console.log(
      "   - Run 'npm run recipes:import' to do a full daily import (100 recipes)",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
