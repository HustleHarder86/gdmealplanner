#!/usr/bin/env npx tsx
/**
 * Generate category-specific recipe files from the main recipes.json
 */

import * as fs from "fs";
import * as path from "path";

async function generateCategoryFiles() {
  console.log("📦 Generating category-specific recipe files...\n");

  try {
    // Read the main recipes file
    const mainFilePath = path.join(process.cwd(), "public", "data", "recipes.json");
    const mainData = JSON.parse(fs.readFileSync(mainFilePath, "utf-8"));
    
    console.log(`📖 Loaded ${mainData.recipeCount} recipes from main file`);
    
    // Group recipes by category
    const categories = ["breakfast", "lunch", "dinner", "snack"];
    const recipesByCategory: Record<string, any[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    
    // Sort recipes into categories
    mainData.recipes.forEach((recipe: any) => {
      const category = recipe.category || "dinner"; // default to dinner if no category
      if (recipesByCategory[category]) {
        recipesByCategory[category].push(recipe);
      }
    });
    
    // Generate files for each category
    const publicDataDir = path.join(process.cwd(), "public", "data");
    
    for (const category of categories) {
      const categoryRecipes = recipesByCategory[category];
      
      // Create category-specific data structure
      const categoryData = {
        exportDate: mainData.exportDate,
        source: mainData.source,
        category: category,
        recipeCount: categoryRecipes.length,
        recipes: categoryRecipes,
      };
      
      // Write full JSON
      const categoryPath = path.join(publicDataDir, `recipes-${category}.json`);
      fs.writeFileSync(categoryPath, JSON.stringify(categoryData, null, 2));
      const fullSize = fs.statSync(categoryPath).size;
      console.log(`✅ Written recipes-${category}.json (${(fullSize / 1024).toFixed(0)} KB) - ${categoryRecipes.length} recipes`);
      
      // Write minified JSON
      const minPath = path.join(publicDataDir, `recipes-${category}.min.json`);
      fs.writeFileSync(minPath, JSON.stringify(categoryData));
      const minSize = fs.statSync(minPath).size;
      console.log(`✅ Written recipes-${category}.min.json (${(minSize / 1024).toFixed(0)} KB)`);
    }
    
    // Also update the summary file
    const summaryData = {
      exportDate: mainData.exportDate,
      totalRecipes: mainData.recipeCount,
      categoryBreakdown: mainData.categoryBreakdown,
      lastUpdated: new Date().toISOString(),
    };
    
    const summaryPath = path.join(publicDataDir, "recipes-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`\n✅ Written recipes-summary.json`);
    
    // Also ensure production-recipes.json exists in data directory
    const dataDir = path.join(process.cwd(), "data");
    const prodPath = path.join(dataDir, "production-recipes.json");
    if (fs.existsSync(prodPath)) {
      console.log(`\n📊 production-recipes.json already up to date`);
    }
    
    console.log("\n📊 Category Breakdown:");
    console.log(`   Breakfast: ${recipesByCategory.breakfast.length} recipes`);
    console.log(`   Lunch: ${recipesByCategory.lunch.length} recipes`);
    console.log(`   Dinner: ${recipesByCategory.dinner.length} recipes`);
    console.log(`   Snack: ${recipesByCategory.snack.length} recipes`);
    console.log(`   Total: ${mainData.recipeCount} recipes`);
    
    console.log("\n✅ Category files generated successfully!");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the generation
generateCategoryFiles();