import { RecipeImportScheduler } from "../src/services/spoonacular/automated-import/scheduler";
import { initializeFirebaseAdmin } from "../src/lib/firebase/admin";
import { 
  BREAKFAST_STRATEGIES, 
  LUNCH_STRATEGIES, 
  DINNER_STRATEGIES, 
  SNACK_STRATEGIES 
} from "../src/services/spoonacular/automated-import/import-strategies";
import * as dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables
dotenv.config({ path: ".env.local" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function importRecipesCLI() {
  console.log("🍽️  Recipe Import CLI for Pregnancy Plate Planner\n");

  try {
    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey || apiKey === "your_actual_spoonacular_api_key_here") {
      console.error("❌ Error: Please add your actual SPOONACULAR_API_KEY to .env.local");
      process.exit(1);
    }

    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase...");
    await initializeFirebaseAdmin();

    // Create scheduler
    const scheduler = new RecipeImportScheduler(apiKey, {
      campaignStartDate: new Date().toISOString().split('T')[0],
      minQualityScore: 50,
      rateLimitDelay: 2000,
    });

    // Get current status
    console.log("📊 Checking current library status...\n");
    const status = await scheduler.getCampaignStatus();
    
    console.log(`Total Recipes: ${status.totalRecipesImported} / 600 (${Math.round((status.totalRecipesImported / 600) * 100)}% complete)`);
    console.log(`├─ Breakfast: ${status.categoryBreakdown.breakfast || 0}`);
    console.log(`├─ Lunch: ${status.categoryBreakdown.lunch || 0}`);
    console.log(`├─ Dinner: ${status.categoryBreakdown.dinner || 0}`);
    console.log(`└─ Snack: ${status.categoryBreakdown.snack || 0}`);
    console.log("");

    // Ask what to import
    console.log("What would you like to import?");
    console.log("1. Breakfast recipes");
    console.log("2. Lunch recipes");
    console.log("3. Dinner recipes");
    console.log("4. Snack recipes");
    console.log("5. Quick import all categories (5 each)");
    console.log("6. Exit");
    
    const choice = await question("\nEnter your choice (1-6): ");

    if (choice === "6") {
      console.log("👋 Goodbye!");
      rl.close();
      return;
    }

    if (choice === "5") {
      // Quick import all categories
      console.log("\n🚀 Starting quick import of all categories...\n");
      
      const categories = [
        { name: "breakfast", strategies: BREAKFAST_STRATEGIES },
        { name: "lunch", strategies: LUNCH_STRATEGIES },
        { name: "dinner", strategies: DINNER_STRATEGIES },
        { name: "snack", strategies: SNACK_STRATEGIES }
      ];

      for (const category of categories) {
        console.log(`\n📦 Importing ${category.name} recipes...`);
        const strategy = {
          ...category.strategies[0],
          targetCount: 5
        };
        
        const report = await scheduler.manualImport(strategy, 5);
        console.log(`✅ ${category.name}: Imported ${report.recipesImported}, Rejected ${report.recipesRejected}`);
      }
    } else {
      // Import specific category
      let strategies;
      let categoryName;
      
      switch (choice) {
        case "1":
          strategies = BREAKFAST_STRATEGIES;
          categoryName = "breakfast";
          break;
        case "2":
          strategies = LUNCH_STRATEGIES;
          categoryName = "lunch";
          break;
        case "3":
          strategies = DINNER_STRATEGIES;
          categoryName = "dinner";
          break;
        case "4":
          strategies = SNACK_STRATEGIES;
          categoryName = "snack";
          break;
        default:
          console.log("Invalid choice!");
          rl.close();
          return;
      }

      console.log(`\nAvailable ${categoryName} strategies:`);
      strategies.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} - ${s.description}`);
      });
      
      const strategyChoice = await question("\nSelect strategy (or press Enter for first one): ");
      const strategyIndex = strategyChoice ? parseInt(strategyChoice) - 1 : 0;
      
      const countStr = await question("How many recipes to import? (default: 10): ");
      const count = countStr ? parseInt(countStr) : 10;

      console.log(`\n🔄 Importing ${count} ${categoryName} recipes...`);
      console.log(`Using strategy: ${strategies[strategyIndex].name}\n`);

      const strategy = {
        ...strategies[strategyIndex],
        targetCount: count
      };

      const report = await scheduler.manualImport(strategy, count);

      console.log("\n✅ Import Complete!");
      console.log(`├─ Imported: ${report.recipesImported} recipes`);
      console.log(`├─ Processed: ${report.recipesProcessed} recipes`);
      console.log(`├─ Rejected: ${report.recipesRejected} recipes`);
      console.log(`└─ API Calls: ${report.apiCallsUsed}`);

      if (report.errors.length > 0) {
        console.log("\n⚠️  Errors:");
        report.errors.forEach(err => console.log(`  - ${err}`));
      }
    }

    // Show updated status
    const newStatus = await scheduler.getCampaignStatus();
    console.log("\n📊 Updated Library Status:");
    console.log(`Total: ${newStatus.totalRecipesImported} recipes (${Math.round((newStatus.totalRecipesImported / 600) * 100)}% complete)`);

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes("Firebase")) {
      console.log("\n📝 Make sure your Firebase Admin key is properly set in .env.local");
    }
  } finally {
    rl.close();
  }
}

// Run the CLI
importRecipesCLI().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});