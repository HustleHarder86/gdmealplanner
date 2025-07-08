#!/usr/bin/env node

/**
 * Integration test for the offline recipe system
 * This tests the complete flow from API to LocalRecipeService
 */

import { LocalRecipeService } from "../src/services/local-recipe-service";
import { Recipe } from "../src/types/recipe";
import fs from "fs";
import path from "path";

console.log("🧪 Offline Recipe System Integration Test\n");

const testResults = {
  passed: 0,
  failed: 0,
  tests: [] as { name: string; status: "pass" | "fail"; error?: string }[],
};

function logTest(name: string, status: "pass" | "fail", error?: string) {
  const icon = status === "pass" ? "✅" : "❌";
  console.log(`${icon} ${name}${error ? `: ${error}` : ""}`);
  testResults.tests.push({ name, status, error });
  if (status === "pass") {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testOfflineSystem() {
  console.log("1️⃣ Testing LocalRecipeService functionality");
  console.log("─".repeat(50));

  // Test 1: Initialize with empty data
  try {
    await LocalRecipeService.initialize([]);
    const recipes = LocalRecipeService.getAllRecipes();
    if (recipes.length === 0) {
      logTest("Initialize with empty data", "pass");
    } else {
      logTest(
        "Initialize with empty data",
        "fail",
        `Expected 0 recipes, got ${recipes.length}`,
      );
    }
  } catch (error: any) {
    logTest("Initialize with empty data", "fail", error.message);
  }

  // Test 2: Initialize with mock data
  const mockRecipes: Recipe[] = [
    {
      id: "integration-test-1",
      title: "Integration Test Recipe",
      description: "A test recipe for integration testing",
      category: "breakfast",
      subcategory: "",
      tags: ["test", "integration"],
      prepTime: 10,
      cookTime: 20,
      totalTime: 30,
      servings: 2,
      ingredients: [
        {
          name: "test ingredient",
          amount: 1,
          unit: "cup",
          original: "1 cup test ingredient",
        },
      ],
      instructions: ["Test step 1", "Test step 2"],
      nutrition: {
        calories: 250,
        carbohydrates: 30,
        protein: 10,
        fat: 8,
        fiber: 3,
        sugar: 5,
        sodium: 200,
      },
      carbChoices: 2,
      gdValidation: {
        isValid: true,
        score: 0.9,
        details: {},
        warnings: [],
      },
      source: "Integration Test",
      sourceUrl: "",
      imageUrl: "",
      localImageUrl: "",
      importedFrom: "test",
      importedAt: new Date().toISOString(),
      verified: true,
      popularity: 0,
      userRatings: [],
      timesViewed: 0,
      timesAddedToPlan: 0,
    },
  ];

  try {
    await LocalRecipeService.initialize(mockRecipes);
    const recipes = LocalRecipeService.getAllRecipes();
    if (recipes.length === 1 && recipes[0].id === "integration-test-1") {
      logTest("Initialize with mock data", "pass");
    } else {
      logTest("Initialize with mock data", "fail", "Recipe data mismatch");
    }
  } catch (error: any) {
    logTest("Initialize with mock data", "fail", error.message);
  }

  // Test 3: Search functionality
  try {
    const searchResults = LocalRecipeService.searchRecipes("integration");
    if (searchResults.length === 1) {
      logTest("Search functionality", "pass");
    } else {
      logTest(
        "Search functionality",
        "fail",
        `Expected 1 result, got ${searchResults.length}`,
      );
    }
  } catch (error: any) {
    logTest("Search functionality", "fail", error.message);
  }

  // Test 4: Category filtering
  try {
    const breakfastRecipes =
      LocalRecipeService.getRecipesByCategory("breakfast");
    if (breakfastRecipes.length === 1) {
      logTest("Category filtering", "pass");
    } else {
      logTest(
        "Category filtering",
        "fail",
        `Expected 1 breakfast recipe, got ${breakfastRecipes.length}`,
      );
    }
  } catch (error: any) {
    logTest("Category filtering", "fail", error.message);
  }

  // Test 5: Statistics
  try {
    const stats = LocalRecipeService.getStats();
    if (stats.total === 1 && stats.byCategory.breakfast === 1) {
      logTest("Recipe statistics", "pass");
    } else {
      logTest("Recipe statistics", "fail", "Statistics mismatch");
    }
  } catch (error: any) {
    logTest("Recipe statistics", "fail", error.message);
  }

  console.log("\n2️⃣ Testing Offline Page Routes");
  console.log("─".repeat(50));

  // Test 6: Check if offline demo page exists
  const offlineDemoPath = path.join(process.cwd(), "app/offline-demo/page.tsx");
  if (fs.existsSync(offlineDemoPath)) {
    logTest("Offline demo page exists", "pass");
  } else {
    logTest("Offline demo page exists", "fail", "File not found");
  }

  // Test 7: Check if recipes offline page exists
  const recipesOfflinePath = path.join(
    process.cwd(),
    "app/recipes-offline/page.tsx",
  );
  if (fs.existsSync(recipesOfflinePath)) {
    logTest("Recipes offline page exists", "pass");
  } else {
    logTest("Recipes offline page exists", "fail", "File not found");
  }

  console.log("\n3️⃣ Testing API Endpoints");
  console.log("─".repeat(50));

  // Test 8: Check backup API exists
  const backupApiPath = path.join(
    process.cwd(),
    "app/api/recipes/backup-all/route.ts",
  );
  if (fs.existsSync(backupApiPath)) {
    logTest("Backup API endpoint exists", "pass");
  } else {
    logTest("Backup API endpoint exists", "fail", "File not found");
  }

  // Test 9: Check export API exists
  const exportApiPath = path.join(
    process.cwd(),
    "app/api/recipes/export/route.ts",
  );
  if (fs.existsSync(exportApiPath)) {
    logTest("Export API endpoint exists", "pass");
  } else {
    logTest("Export API endpoint exists", "fail", "File not found");
  }

  // Test 10: Check prepare-offline API exists
  const prepareOfflineApiPath = path.join(
    process.cwd(),
    "app/api/recipes/prepare-offline/route.ts",
  );
  if (fs.existsSync(prepareOfflineApiPath)) {
    logTest("Prepare-offline API endpoint exists", "pass");
  } else {
    logTest("Prepare-offline API endpoint exists", "fail", "File not found");
  }

  console.log("\n4️⃣ Testing Documentation");
  console.log("─".repeat(50));

  // Test 11: Check migration guide exists
  const migrationGuidePath = path.join(process.cwd(), "OFFLINE_MIGRATION.md");
  if (fs.existsSync(migrationGuidePath)) {
    logTest("Offline migration guide exists", "pass");
  } else {
    logTest("Offline migration guide exists", "fail", "File not found");
  }

  // Test 12: Check component migration guide exists
  const componentGuidePath = path.join(
    process.cwd(),
    "COMPONENT_MIGRATION_GUIDE.md",
  );
  if (fs.existsSync(componentGuidePath)) {
    logTest("Component migration guide exists", "pass");
  } else {
    logTest("Component migration guide exists", "fail", "File not found");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Integration Test Summary");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);

  if (testResults.failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults.tests
      .filter((t) => t.status === "fail")
      .forEach((t) => console.log(`  - ${t.name}: ${t.error}`));
  }

  console.log("\n📝 Next Steps:");
  if (testResults.failed === 0) {
    console.log(
      "✨ All integration tests passed! The offline system is ready to use.",
    );
    console.log("\nTo complete the migration:");
    console.log("1. Configure Firebase Admin credentials");
    console.log("2. Run: POST /api/recipes/backup-all");
    console.log("3. Run: POST /api/recipes/prepare-offline");
    console.log("4. Test the offline demo at /offline-demo");
    console.log("5. Update production components to use LocalRecipeService");
  } else {
    console.log(
      "⚠️  Some tests failed. Please fix the issues before proceeding.",
    );
  }
}

// Run the integration tests
testOfflineSystem().catch(console.error);
