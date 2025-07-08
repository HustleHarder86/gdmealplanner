#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("📥 Downloading recipes from production deployment...\n");

// Check common deployment URLs
const possibleUrls = [
  "https://gdmealplanner.vercel.app",
  "https://pregnancy-plate-planner.vercel.app",
  "https://app.pregnancyplateplanner.com",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

async function findWorkingUrl() {
  for (const url of possibleUrls) {
    try {
      console.log(`Trying ${url}...`);
      const response = await fetch(`${url}/api/recipes/count`);
      if (response.ok) {
        console.log(`✅ Found working URL: ${url}\n`);
        return url;
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  return null;
}

async function downloadRecipes() {
  try {
    // Find working URL
    const baseUrl = await findWorkingUrl();

    if (!baseUrl) {
      console.error("❌ Could not find working deployment URL");
      console.log("\nPlease provide the URL as an argument:");
      console.log(
        "node scripts/download-from-production.js https://your-app.vercel.app",
      );
      process.exit(1);
    }

    // First, get the count
    console.log("📊 Fetching recipe count...");
    const countResponse = await fetch(`${baseUrl}/api/recipes/count`);
    const countData = await countResponse.json();
    console.log(`Found ${countData.total} recipes`);
    console.log("Categories:", countData.byCategory);

    // Then fetch all recipes
    console.log("\n📥 Downloading all recipes...");
    const listResponse = await fetch(`${baseUrl}/api/recipes/list`);

    if (!listResponse.ok) {
      throw new Error(`Failed to fetch recipes: ${listResponse.status}`);
    }

    const data = await listResponse.json();
    const recipes = data.recipes || [];

    console.log(`✅ Downloaded ${recipes.length} recipes`);

    // Save to file
    const outputDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const outputPath = path.join(outputDir, "production-recipes.json");
    const exportData = {
      exportDate: new Date().toISOString(),
      source: baseUrl,
      recipeCount: recipes.length,
      byCategory: countData.byCategory,
      recipes: recipes,
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Saved to: ${outputPath}`);

    // Show summary
    console.log("\n📊 Recipe Summary:");
    const categories = {};
    recipes.forEach((recipe) => {
      categories[recipe.category] = (categories[recipe.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });

    // Initialize LocalRecipeService with the data
    console.log("\n🔧 Testing LocalRecipeService integration...");
    const {
      LocalRecipeService,
    } = require("../src/services/local-recipe-service");
    await LocalRecipeService.initialize(recipes);

    const stats = LocalRecipeService.getStats();
    console.log("✅ LocalRecipeService initialized successfully");
    console.log(`  - Quick recipes: ${stats.quickRecipes}`);
    console.log(`  - Bedtime snacks: ${stats.bedtimeSnacks}`);
    console.log(`  - With local images: ${stats.withLocalImages}`);

    console.log("\n✨ Done! You can now use the offline recipe system.");
    console.log("\nNext steps:");
    console.log("1. The recipes are saved in data/production-recipes.json");
    console.log("2. Update components to load from this file");
    console.log("3. Or use the export API endpoint to serve the data");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Support custom URL as argument
if (process.argv[2]) {
  possibleUrls.unshift(process.argv[2]);
}

downloadRecipes();
