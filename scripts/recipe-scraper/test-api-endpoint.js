#!/usr/bin/env node

/**
 * Test script for the recipe import API endpoint
 * Run this to verify the API is working before using the bookmarklet
 */

const testRecipe = {
  recipe: {
    title: "Test GD-Friendly Quinoa Bowl",
    description:
      "A delicious and nutritious quinoa bowl perfect for gestational diabetes management.",
    url: "https://example.com/test-recipe",
    source: "example.com",
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    servings: 4,
    ingredients: [
      {
        text: "1 cup quinoa",
        parsed: {
          amount: "1",
          unit: "cup",
          item: "quinoa",
        },
      },
      {
        text: "2 cups baby spinach",
        parsed: {
          amount: "2",
          unit: "cups",
          item: "baby spinach",
        },
      },
      {
        text: "1/2 cup cherry tomatoes",
        parsed: {
          amount: "1/2",
          unit: "cup",
          item: "cherry tomatoes",
        },
      },
      {
        text: "1/4 cup feta cheese",
        parsed: {
          amount: "1/4",
          unit: "cup",
          item: "feta cheese",
        },
      },
    ],
    instructions: [
      "Rinse quinoa in cold water until water runs clear.",
      "Cook quinoa according to package directions.",
      "While quinoa cooks, wash and chop vegetables.",
      "Combine cooked quinoa with spinach and tomatoes.",
      "Top with feta cheese and serve.",
    ],
    nutrition: {
      calories: 280,
      carbs: 32,
      protein: 12,
      fiber: 4,
      fat: 8,
      sugar: 3,
    },
    category: "lunch",
    verified: true,
    imported_at: new Date().toISOString(),
  },
  source_url: "https://example.com/test-recipe",
  imported_at: new Date().toISOString(),
};

async function testAPI() {
  console.log("🧪 Testing Recipe Import API...\n");

  const API_URL = "http://localhost:3000/api/import-recipe";

  try {
    console.log("📤 Sending test recipe data...");
    console.log(`📍 API Endpoint: ${API_URL}`);
    console.log(`🍽️  Recipe: ${testRecipe.recipe.title}`);
    console.log(
      `🥗 Nutrition: ${testRecipe.recipe.nutrition.carbs}g carbs, ${testRecipe.recipe.nutrition.protein}g protein\n`,
    );

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testRecipe),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS! Recipe imported successfully");
      console.log("📋 Response:", JSON.stringify(result, null, 2));
      console.log("\n🎉 The API endpoint is working correctly!");
      console.log("📝 You can now use the bookmarklet to import real recipes.");
    } else {
      console.log("❌ FAILED! API returned an error");
      console.log("📋 Error:", JSON.stringify(result, null, 2));
      console.log(`📊 Status: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ FAILED! Could not connect to API");
    console.log("📋 Error:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure your Next.js dev server is running: npm run dev");
    console.log("2. Verify the server is accessible at http://localhost:3000");
    console.log(
      "3. Check that the API route exists at app/api/import-recipe/route.ts",
    );
  }
}

// Run the test
testAPI();
