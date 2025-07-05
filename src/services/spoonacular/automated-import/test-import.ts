#!/usr/bin/env tsx

/**
 * Test script for the Automated Recipe Import System
 * 
 * This script demonstrates:
 * 1. Testing individual components
 * 2. Running a small test import
 * 3. Generating a sample report
 */

import { config } from "dotenv";
import { RecipeImportScheduler } from "./scheduler";
import { RecipeCategorizer } from "./categorizer";
import { RecipeDeduplicator } from "./deduplicator";
import { validateRecipeForImport } from "./quality-validator";
import { formatReportForDisplay } from "./reporter";
import { BREAKFAST_STRATEGIES } from "./import-strategies";
import { SpoonacularClient } from "../client";

// Load environment variables
config();

async function testCategorizer() {
  console.log("\n🧪 Testing Recipe Categorizer...\n");
  
  const categorizer = new RecipeCategorizer();
  
  // Test with mock recipe data
  const mockRecipes = [
    {
      id: 1,
      title: "Scrambled Eggs with Whole Wheat Toast",
      readyInMinutes: 15,
      servings: 2,
      dishTypes: ["breakfast"],
      nutrition: {
        nutrients: [
          { name: "Carbohydrates", amount: 25, unit: "g" },
          { name: "Protein", amount: 15, unit: "g" },
          { name: "Calories", amount: 280, unit: "cal" },
          { name: "Fiber", amount: 4, unit: "g" },
        ],
      },
    },
    {
      id: 2,
      title: "Grilled Chicken Salad",
      readyInMinutes: 20,
      servings: 1,
      dishTypes: ["salad", "lunch"],
      nutrition: {
        nutrients: [
          { name: "Carbohydrates", amount: 35, unit: "g" },
          { name: "Protein", amount: 28, unit: "g" },
          { name: "Calories", amount: 420, unit: "cal" },
          { name: "Fiber", amount: 7, unit: "g" },
        ],
      },
    },
  ];

  for (const recipe of mockRecipes) {
    const result = categorizer.categorizeRecipe(recipe as any);
    console.log(`Recipe: ${recipe.title}`);
    console.log(`Category: ${result.primaryCategory} (${result.confidence}% confidence)`);
    console.log(`Reasoning: ${result.reasoning.join(", ")}`);
    console.log(`Tags: ${result.tags.join(", ")}`);
    console.log("");
  }
}

async function testQualityValidator() {
  console.log("\n🧪 Testing Quality Validator...\n");
  
  const mockRecipe = {
    id: 123,
    title: "Overnight Oats with Berries",
    readyInMinutes: 10,
    servings: 1,
    instructions: "Mix oats with milk and berries, refrigerate overnight",
    analyzedInstructions: [{ steps: [{ number: 1, step: "Mix ingredients" }] }],
    extendedIngredients: [
      { nameClean: "rolled oats", amount: 0.5, unit: "cup" },
      { nameClean: "milk", amount: 0.5, unit: "cup" },
      { nameClean: "blueberries", amount: 0.25, unit: "cup" },
    ],
    nutrition: {
      nutrients: [
        { name: "Carbohydrates", amount: 28, unit: "g" },
        { name: "Protein", amount: 10, unit: "g" },
        { name: "Fiber", amount: 5, unit: "g" },
        { name: "Sugar", amount: 8, unit: "g" },
      ],
    },
    spoonacularScore: 85,
    aggregateLikes: 250,
  };

  const validation = validateRecipeForImport(mockRecipe as any, "breakfast");
  
  console.log(`Recipe: ${mockRecipe.title}`);
  console.log(`Valid: ${validation.isValid ? "✓" : "✗"}`);
  console.log(`Quality Score: ${validation.qualityScore.totalScore}/100`);
  console.log(`  - GD Compliance: ${validation.qualityScore.gdComplianceScore}/40`);
  console.log(`  - Practicality: ${validation.qualityScore.practicalityScore}/30`);
  console.log(`  - Popularity: ${validation.qualityScore.popularityScore}/30`);
  
  if (validation.qualityScore.warnings.length > 0) {
    console.log(`Warnings: ${validation.qualityScore.warnings.join(", ")}`);
  }
  if (validation.rejectionReasons) {
    console.log(`Rejection Reasons: ${validation.rejectionReasons.join(", ")}`);
  }
}

async function testDeduplicator() {
  console.log("\n🧪 Testing Recipe Deduplicator...\n");
  
  const deduplicator = new RecipeDeduplicator();
  
  // Add some existing recipes
  const existingRecipes = [
    {
      id: "sp-1001",
      data: {
        id: 1001,
        title: "Classic Scrambled Eggs",
        extendedIngredients: [
          { nameClean: "eggs" },
          { nameClean: "butter" },
          { nameClean: "salt" },
        ],
        nutrition: {
          nutrients: [
            { name: "Carbohydrates", amount: 2 },
            { name: "Protein", amount: 18 },
          ],
        },
        readyInMinutes: 10,
        servings: 2,
      },
    },
  ];
  
  await deduplicator.loadExistingRecipes(existingRecipes);
  
  // Test with similar recipe
  const newRecipe = {
    id: 2001,
    title: "Scrambled Eggs Classic Style",
    extendedIngredients: [
      { nameClean: "eggs" },
      { nameClean: "butter" },
      { nameClean: "salt" },
      { nameClean: "pepper" },
    ],
    nutrition: {
      nutrients: [
        { name: "Carbohydrates", amount: 3 },
        { name: "Protein", amount: 17 },
      ],
    },
    readyInMinutes: 12,
    servings: 2,
  };
  
  const result = deduplicator.checkDuplicate(newRecipe as any);
  
  console.log(`Checking: ${newRecipe.title}`);
  console.log(`Is Duplicate: ${result.isDuplicate ? "Yes" : "No"}`);
  if (result.isDuplicate) {
    console.log(`Type: ${result.duplicateType}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Reason: ${result.reason}`);
  }
  
  const stats = deduplicator.getStatistics();
  console.log(`\nDeduplicator Statistics:`);
  console.log(`Total Recipes: ${stats.totalRecipes}`);
  console.log(`Unique Titles: ${stats.uniqueTitles}`);
  console.log(`Unique Ingredient Combinations: ${stats.uniqueIngredientCombinations}`);
}

async function testSmallImport() {
  console.log("\n🚀 Running Small Test Import...\n");
  
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error("❌ SPOONACULAR_API_KEY not found in environment variables");
    return;
  }

  // Create scheduler with test configuration
  const scheduler = new RecipeImportScheduler(apiKey, {
    campaignStartDate: new Date().toISOString().split('T')[0],
    dailyQuota: 10, // Small test import
    minQualityScore: 50,
    rateLimitDelay: 1500, // Be nice to the API
  });

  // Use a breakfast strategy for testing
  const testStrategy = {
    ...BREAKFAST_STRATEGIES[0],
    targetCount: 10, // Limit for testing
  };

  try {
    console.log("Starting test import with strategy:", testStrategy.name);
    console.log("This will import up to 10 recipes...\n");

    const report = await scheduler.manualImport(testStrategy, 10);
    
    console.log("\n" + "=".repeat(60));
    console.log("IMPORT COMPLETED");
    console.log("=".repeat(60));
    console.log(formatReportForDisplay(report));
    
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

async function testAPIConnection() {
  console.log("\n🔌 Testing API Connection...\n");
  
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    console.error("❌ SPOONACULAR_API_KEY not found in environment variables");
    return false;
  }

  const client = new SpoonacularClient(apiKey);
  
  try {
    const response = await client.searchRecipes({
      query: "breakfast",
      number: 1,
      addRecipeNutrition: true,
    });
    
    console.log("✓ API connection successful");
    console.log(`Found ${response.totalResults} total results`);
    if (response.results.length > 0) {
      console.log(`Sample recipe: ${response.results[0].title}`);
    }
    return true;
  } catch (error) {
    console.error("❌ API connection failed:", error);
    return false;
  }
}

async function main() {
  console.log("🤖 Automated Recipe Import System - Test Suite");
  console.log("=" .repeat(60));

  // Test individual components
  await testCategorizer();
  await testQualityValidator();
  await testDeduplicator();

  // Test API connection
  const apiConnected = await testAPIConnection();

  // Run small import if API is connected
  if (apiConnected) {
    const runImport = process.argv.includes("--import");
    if (runImport) {
      await testSmallImport();
    } else {
      console.log("\n💡 Tip: Run with --import flag to test actual recipe import");
      console.log("   Example: npm run test-import -- --import");
    }
  }

  console.log("\n✅ Test suite completed!");
}

// Run tests
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});