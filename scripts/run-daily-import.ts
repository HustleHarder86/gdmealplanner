import { RecipeImportScheduler } from "../src/services/spoonacular/automated-import/scheduler";
import { initializeFirebaseAdmin } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function runDailyImport() {
  console.log("🚀 Starting Daily Recipe Import...\n");

  // Check for API key
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: SPOONACULAR_API_KEY not found in environment variables");
    console.log("\n📝 Please create a .env.local file with:");
    console.log("SPOONACULAR_API_KEY=your_api_key_here");
    process.exit(1);
  }

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Create scheduler with campaign configuration
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate: new Date().toISOString().split('T')[0], // Start today
      totalDays: 20,
      dailyQuota: 100,
      minQualityScore: 50,
      rateLimitDelay: 1500, // 1.5 seconds between API calls to be safe
    });

    // Check current campaign status first
    console.log("📊 Current Campaign Status:");
    const status = await scheduler.getCampaignStatus();
    console.log(`   Day: ${status.currentDay}/${status.totalDays}`);
    console.log(`   Phase: ${status.phase}`);
    console.log(`   Total Recipes: ${status.totalRecipesImported}`);
    console.log(`   Categories:`, status.categoryBreakdown);
    console.log("");

    // Confirmation prompt
    console.log("⚠️  This will use up to 200 API calls (100 searches + 100 recipe details)");
    console.log("   Continue? (Press Ctrl+C to cancel, or wait 5 seconds to proceed)");
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Execute daily import
    console.log("\n🔄 Starting import process...\n");
    const report = await scheduler.executeDailyImport();

    // Display results
    console.log("\n✅ Import Complete!");
    console.log("\n📊 Import Summary:");
    console.log(`   Total Imported: ${report.recipesImported}`);
    console.log(`   Total Processed: ${report.recipesProcessed}`);
    console.log(`   Total Rejected: ${report.recipesRejected}`);
    console.log(`   API Calls Used: ${report.apiCallsUsed}`);
    
    console.log("\n📂 Imported by Category:");
    Object.entries(report.categoryBreakdown).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    console.log("\n🎯 Quality Distribution:");
    Object.entries(report.qualityDistribution).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} recipes`);
    });

    if (report.errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      report.errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the import
runDailyImport().then(() => {
  console.log("\n✅ Daily import process complete!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});