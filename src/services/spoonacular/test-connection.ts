#!/usr/bin/env node

/**
 * Test script to verify Spoonacular API connectivity
 * Run with: npx tsx src/services/spoonacular/test-connection.ts
 */

import { SpoonacularClient } from "./client";
import { RecipeImportService } from "./recipe-import";
import { validateRecipeForGD, calculateGDScore } from "./validators";

async function testConnection() {
  console.log("🧪 Testing Spoonacular API Connection...\n");

  try {
    // Initialize client
    const client = new SpoonacularClient();
    console.log("✅ Client initialized successfully");

    // Test 1: Basic search
    console.log("\n📍 Test 1: Basic recipe search");
    const searchResults = await client.searchRecipes({
      query: "chicken salad",
      number: 3,
      addRecipeNutrition: true,
    });
    console.log(`✅ Found ${searchResults.totalResults} total results`);
    console.log(`✅ Retrieved ${searchResults.results.length} recipes`);

    // Test 2: Get detailed recipe info
    if (searchResults.results.length > 0) {
      console.log("\n📍 Test 2: Get detailed recipe information");
      const recipeId = searchResults.results[0].id;
      const recipeInfo = await client.getRecipeInfo(recipeId);
      console.log(`✅ Retrieved details for: ${recipeInfo.title}`);
      console.log(`   - Ready in: ${recipeInfo.readyInMinutes} minutes`);
      console.log(`   - Servings: ${recipeInfo.servings}`);
      console.log(`   - Health Score: ${recipeInfo.healthScore}/100`);
    }

    // Test 3: Search with GD-specific filters
    console.log("\n📍 Test 3: Search with GD-specific filters");
    const gdResults = await client.searchRecipes({
      type: "breakfast",
      minCarbs: 15,
      maxCarbs: 30,
      minProtein: 7,
      minFiber: 3,
      number: 5,
      addRecipeNutrition: true,
    });
    console.log(
      `✅ Found ${gdResults.results.length} GD-friendly breakfast recipes`,
    );

    // Test 4: Validate a recipe for GD
    if (gdResults.results.length > 0) {
      console.log("\n📍 Test 4: GD validation");
      const testRecipeId = gdResults.results[0].id;
      const testRecipe = await client.getRecipeInfo(testRecipeId);
      const validation = validateRecipeForGD(testRecipe, "breakfast");
      const gdScore = calculateGDScore(testRecipe, "breakfast");

      console.log(`✅ Validated recipe: ${testRecipe.title}`);
      console.log(`   - GD Score: ${gdScore}/100`);
      console.log(`   - Valid: ${validation.isValid}`);
      console.log(`   - Carbs in range: ${validation.carbsInRange}`);
      console.log(`   - Adequate protein: ${validation.adequateProtein}`);
      console.log(`   - Adequate fiber: ${validation.adequateFiber}`);
      if (validation.warnings.length > 0) {
        console.log(`   - Warnings: ${validation.warnings.join("; ")}`);
      }
    }

    // Test 5: Check quota (if available)
    console.log("\n📍 Test 5: Check API quota");
    const quota = await client.getQuotaStatus();
    if (quota.limit > 0) {
      console.log(`✅ API Quota:`);
      console.log(`   - Used: ${quota.used}`);
      console.log(`   - Limit: ${quota.limit}`);
      console.log(`   - Remaining: ${quota.remaining}`);
    } else {
      console.log(
        "⚠️  Quota information not available (this is normal for some plans)",
      );
    }

    // Test 6: Import service
    console.log("\n📍 Test 6: Recipe Import Service");
    const importService = new RecipeImportService();
    const breakfastRecipes = await importService.searchGDCompliantRecipes(
      "breakfast",
      {
        number: 3,
      },
    );
    console.log(
      `✅ Import service found ${breakfastRecipes.length} valid breakfast recipes`,
    );

    if (breakfastRecipes.length > 0) {
      console.log("   Sample recipe:");
      const sample = breakfastRecipes[0];
      console.log(`   - Title: ${sample.title}`);
      console.log(
        `   - Carbs: ${sample.nutrition.carbs}g (${sample.nutrition.carbChoices} choices)`,
      );
      console.log(`   - Protein: ${sample.nutrition.protein}g`);
      console.log(`   - Fiber: ${sample.nutrition.fiber}g`);
    }

    console.log("\n✅ All tests passed! API connection is working correctly.");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if (error.message.includes("API key")) {
        console.error(
          "\n💡 Make sure to set SPOONACULAR_API_KEY in your .env.local file",
        );
        console.error(
          "   You can get a free API key at: https://spoonacular.com/food-api",
        );
      }
    }
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);
