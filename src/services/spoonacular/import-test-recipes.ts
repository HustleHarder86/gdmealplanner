#!/usr/bin/env node

/**
 * Script to import 10 test recipes from Spoonacular
 * Run with: npx tsx src/services/spoonacular/import-test-recipes.ts
 */

import { RecipeImportService } from "./recipe-import";
import { writeFileSync } from "fs";
import { join } from "path";

async function importTestRecipes() {
  console.log("🍽️  Starting Spoonacular Test Recipe Import...\n");

  try {
    const importService = new RecipeImportService();

    console.log("📥 Importing recipes for each category...");
    const results = await importService.importTestRecipes();

    // Display results
    console.log("\n📊 Import Results:");
    console.log(`✅ Successfully imported: ${results.stats.imported} recipes`);
    console.log(`❌ Failed to import: ${results.stats.failed} recipes`);
    console.log(`📁 Total processed: ${results.stats.total} recipes`);

    console.log("\n📂 By Category:");
    Object.entries(results.stats.byCategory).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} recipes`);
    });

    // Show imported recipes
    console.log("\n✅ Imported Recipes:");
    results.success.forEach((recipe, index) => {
      console.log(`\n${index + 1}. ${recipe.title} (${recipe.category})`);
      console.log(
        `   - Carbs: ${recipe.nutrition.carbohydrates}g (${recipe.carbChoices} choices)`,
      );
      console.log(`   - Protein: ${recipe.nutrition.protein}g`);
      console.log(`   - Fiber: ${recipe.nutrition.fiber}g`);
      console.log(`   - Time: ${recipe.totalTime} minutes`);
    });

    // Show failed recipes
    if (results.failed.length > 0) {
      console.log("\n❌ Failed Recipes:");
      results.failed.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.recipe.title}`);
        console.log(`   - Reason: ${failure.reason}`);
      });
    }

    // Save results to file for review
    const outputDir = join(process.cwd(), "data", "spoonacular-import");
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const outputFile = join(outputDir, `import-${timestamp}.json`);

    // Create directory if it doesn't exist
    const fs = await import("fs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the imported recipes
    const outputData = {
      timestamp: new Date().toISOString(),
      stats: results.stats,
      recipes: results.success,
      failed: results.failed.map((f) => ({
        title: f.recipe.title,
        id: f.recipe.id,
        reason: f.reason,
      })),
    };

    writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Results saved to: ${outputFile}`);

    // Save recipes in the format expected by the app
    const recipesByCategory = results.success.reduce(
      (acc, recipe) => {
        if (!acc[recipe.category]) {
          acc[recipe.category] = [];
        }
        acc[recipe.category].push(recipe);
        return acc;
      },
      {} as Record<string, typeof results.success>,
    );

    // Save each category file
    for (const [category, recipes] of Object.entries(recipesByCategory)) {
      const categoryFile = join(outputDir, `${category}.json`);
      writeFileSync(categoryFile, JSON.stringify(recipes, null, 2));
      console.log(`💾 ${category} recipes saved to: ${categoryFile}`);
    }

    console.log("\n✅ Import completed successfully!");

    // Check quota at the end
    const quota = await importService.checkQuota();
    if (quota.limit > 0) {
      console.log(`\n📊 API Quota Status:`);
      console.log(`   - Used: ${quota.used}/${quota.limit}`);
      console.log(`   - Remaining: ${quota.remaining}`);
    }
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    if (error instanceof Error && error.message.includes("API key")) {
      console.error(
        "\n💡 Make sure to set SPOONACULAR_API_KEY in your .env.local file",
      );
      console.error(
        "   You can get a free API key at: https://spoonacular.com/food-api",
      );
    }
    process.exit(1);
  }
}

// Run the import
importTestRecipes().catch(console.error);
