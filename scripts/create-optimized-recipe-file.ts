#!/usr/bin/env npx tsx
/**
 * Create an optimized single recipe file for faster loading
 */

import * as fs from "fs";
import * as path from "path";

async function createOptimizedRecipeFile() {
  console.log("🚀 Creating optimized recipe file...\n");

  try {
    // Read the main recipes file
    const mainFilePath = path.join(process.cwd(), "public", "data", "recipes.json");
    const mainData = JSON.parse(fs.readFileSync(mainFilePath, "utf-8"));
    
    console.log(`📖 Loaded ${mainData.recipeCount} recipes`);
    
    // Create optimized structure with only essential data for initial load
    const optimizedData = {
      version: "2.0",
      count: mainData.recipeCount,
      lastUpdated: new Date().toISOString(),
      recipes: mainData.recipes.map((recipe: any) => ({
        // Include all fields but in a more compact structure
        ...recipe,
        // Remove any undefined or null values to save space
        instructions: recipe.instructions?.filter((i: any) => i) || [],
        ingredients: recipe.ingredients?.filter((i: any) => i) || [],
      }))
    };
    
    // Write optimized JSON files
    const publicDataDir = path.join(process.cwd(), "public", "data");
    
    // Single minified file for fast loading
    const allRecipesMinPath = path.join(publicDataDir, "all-recipes.min.json");
    fs.writeFileSync(allRecipesMinPath, JSON.stringify(optimizedData));
    const minSize = fs.statSync(allRecipesMinPath).size;
    console.log(`✅ Written all-recipes.min.json (${(minSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // Also create a formatted version for debugging
    const allRecipesPath = path.join(publicDataDir, "all-recipes.json");
    fs.writeFileSync(allRecipesPath, JSON.stringify(optimizedData, null, 2));
    const fullSize = fs.statSync(allRecipesPath).size;
    console.log(`✅ Written all-recipes.json (${(fullSize / 1024 / 1024).toFixed(2)} MB)`);
    
    console.log("\n✅ Optimized recipe file created!");
    console.log("📝 Update the recipe provider to load from /data/all-recipes.min.json for faster loading");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the optimization
createOptimizedRecipeFile();