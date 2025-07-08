#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

async function downloadProductionRecipes() {
  const baseUrl = "https://gdmealplanner.vercel.app";
  const outputDir = path.join(__dirname, "production-recipes");

  console.log("Downloading all recipes from production API...\n");

  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Fetch all recipes from the list endpoint
    console.log("Fetching recipe list...");
    const response = await fetch(`${baseUrl}/api/recipes/list`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recipes: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`Found ${data.count} recipes in production database\n`);

    if (!data.recipes || data.recipes.length === 0) {
      console.log("No recipes found to download");
      return;
    }

    // Save the full list
    const listOutputPath = path.join(outputDir, "recipe-list.json");
    await fs.writeFile(listOutputPath, JSON.stringify(data, null, 2));
    console.log(`Saved recipe list to: ${listOutputPath}`);

    // Organize recipes by category
    const recipesByCategory = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      uncategorized: [],
    };

    // Process each recipe
    for (const recipe of data.recipes) {
      const category = recipe.mealType || recipe.category || "uncategorized";
      const categoryKey = category.toLowerCase();

      if (recipesByCategory[categoryKey]) {
        recipesByCategory[categoryKey].push(recipe);
      } else {
        recipesByCategory.uncategorized.push(recipe);
      }
    }

    // Save recipes by category
    console.log("\nSaving recipes by category:");
    for (const [category, recipes] of Object.entries(recipesByCategory)) {
      if (recipes.length > 0) {
        const categoryPath = path.join(outputDir, `${category}-recipes.json`);
        await fs.writeFile(
          categoryPath,
          JSON.stringify(
            {
              category: category,
              count: recipes.length,
              recipes: recipes,
            },
            null,
            2,
          ),
        );
        console.log(`- ${category}: ${recipes.length} recipes saved`);
      }
    }

    // Create a summary file
    const summary = {
      downloadedAt: new Date().toISOString(),
      source: baseUrl,
      totalRecipes: data.count,
      byCategory: Object.fromEntries(
        Object.entries(recipesByCategory).map(([cat, recipes]) => [
          cat,
          recipes.length,
        ]),
      ),
      sampleRecipes: data.recipes.slice(0, 5).map((r) => ({
        id: r.id,
        title: r.title,
        carbs: r.nutrition?.carbohydrates || "N/A",
        category: r.mealType || r.category || "uncategorized",
      })),
    };

    const summaryPath = path.join(outputDir, "download-summary.json");
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log("\n✅ Download complete!");
    console.log(`\nAll files saved to: ${outputDir}`);
    console.log("\nFiles created:");
    console.log("- recipe-list.json (all recipes)");
    console.log("- download-summary.json (summary info)");
    for (const [category, recipes] of Object.entries(recipesByCategory)) {
      if (recipes.length > 0) {
        console.log(`- ${category}-recipes.json`);
      }
    }

    // Nutrition analysis
    console.log("\n=== Nutrition Analysis ===");
    const recipesWithNutrition = data.recipes.filter(
      (r) => r.nutrition && r.nutrition.carbohydrates,
    );
    console.log(
      `Recipes with nutrition data: ${recipesWithNutrition.length}/${data.count}`,
    );

    if (recipesWithNutrition.length > 0) {
      const carbValues = recipesWithNutrition.map((r) =>
        parseFloat(r.nutrition.carbohydrates),
      );
      const avgCarbs =
        carbValues.reduce((a, b) => a + b, 0) / carbValues.length;
      const minCarbs = Math.min(...carbValues);
      const maxCarbs = Math.max(...carbValues);

      console.log(`\nCarbohydrate content:`);
      console.log(`- Average: ${avgCarbs.toFixed(1)}g`);
      console.log(`- Min: ${minCarbs}g`);
      console.log(`- Max: ${maxCarbs}g`);

      // Check GD compliance (15-45g carbs per meal)
      const gdCompliant = recipesWithNutrition.filter((r) => {
        const carbs = parseFloat(r.nutrition.carbohydrates);
        return carbs >= 15 && carbs <= 45;
      });

      console.log(
        `\nGD-compliant recipes (15-45g carbs): ${gdCompliant.length}/${recipesWithNutrition.length} (${((gdCompliant.length / recipesWithNutrition.length) * 100).toFixed(1)}%)`,
      );
    }
  } catch (error) {
    console.error("Error downloading recipes:", error.message);
    process.exit(1);
  }
}

// Run the download
downloadProductionRecipes().catch(console.error);
