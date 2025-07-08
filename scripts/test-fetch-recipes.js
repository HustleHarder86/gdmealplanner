#!/usr/bin/env node

async function fetchRecipesFromProduction() {
  const productionUrls = [
    "https://gdmealplanner.vercel.app",
    "https://app.pregnancyplateplanner.com",
  ];

  console.log("Testing recipe data access from production APIs...\n");

  for (const baseUrl of productionUrls) {
    console.log(`\n=== Testing ${baseUrl} ===`);

    // Test /api/recipes/list endpoint
    try {
      console.log(`\nFetching from ${baseUrl}/api/recipes/list...`);
      const response = await fetch(`${baseUrl}/api/recipes/list`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`Total recipes: ${data.count}`);
        console.log(`Total in database: ${data.totalInDatabase || data.count}`);

        if (data.recipes && data.recipes.length > 0) {
          console.log(`\nFirst 3 recipes:`);
          data.recipes.slice(0, 3).forEach((recipe, index) => {
            console.log(`${index + 1}. ${recipe.title} (ID: ${recipe.id})`);
            console.log(
              `   Carbs: ${recipe.nutrition?.carbohydrates || "N/A"}g`,
            );
            console.log(`   Category: ${recipe.mealType || "N/A"}`);
          });
        }
      } else {
        console.log(`❌ Failed! Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }

    // Test /api/recipes/count endpoint
    try {
      console.log(`\nFetching from ${baseUrl}/api/recipes/count...`);
      const response = await fetch(`${baseUrl}/api/recipes/count`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`Recipe counts by category:`);
        Object.entries(data.byCategory || {}).forEach(([category, count]) => {
          console.log(`  ${category}: ${count}`);
        });
        console.log(`Total: ${data.total}`);
      } else {
        console.log(`❌ Failed! Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }

    // Test individual recipe endpoint (if we have an ID)
    try {
      console.log(`\nTesting individual recipe endpoint...`);
      // First get a recipe ID from the list
      const listResponse = await fetch(`${baseUrl}/api/recipes/list`);
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.recipes && listData.recipes.length > 0) {
          const firstRecipeId = listData.recipes[0].id;
          console.log(`Fetching recipe: ${firstRecipeId}`);

          const recipeResponse = await fetch(
            `${baseUrl}/api/recipes/${firstRecipeId}`,
          );
          if (recipeResponse.ok) {
            const recipeData = await recipeResponse.json();
            console.log(`✅ Success! Retrieved: ${recipeData.title}`);
            console.log(
              `Full nutrition info available: ${recipeData.nutrition ? "Yes" : "No"}`,
            );
            console.log(
              `Ingredients count: ${recipeData.ingredients?.length || 0}`,
            );
            console.log(
              `Instructions count: ${recipeData.instructions?.length || 0}`,
            );
          } else {
            console.log(
              `❌ Failed to fetch individual recipe! Status: ${recipeResponse.status}`,
            );
          }
        }
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }

    // Test export endpoint
    try {
      console.log(`\nTesting export endpoint...`);
      const exportResponse = await fetch(
        `${baseUrl}/api/recipes/export?format=json`,
      );

      if (exportResponse.ok) {
        const contentType = exportResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const exportData = await exportResponse.json();
          console.log(`✅ Export endpoint available!`);
          if (exportData.recipes) {
            console.log(
              `Total recipes available for export: ${exportData.recipeCount}`,
            );
            console.log(`Export contains full recipe data: Yes`);
          } else {
            console.log(
              `Export summary: ${JSON.stringify(exportData.summary)}`,
            );
          }
        }
      } else {
        console.log(`❌ Export failed! Status: ${exportResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }

  console.log("\n\n=== Summary ===");
  console.log("You can access recipe data from the production API using:");
  console.log("- GET /api/recipes/list - Get all recipes");
  console.log("- GET /api/recipes/count - Get recipe counts by category");
  console.log("- GET /api/recipes/[id] - Get individual recipe details");
  console.log(
    "- GET /api/recipes/export?format=json - Export all recipes as JSON file",
  );
  console.log("\nThe API is publicly accessible without authentication.");
  console.log("\nProduction URL: https://gdmealplanner.vercel.app");
}

// Run the test
fetchRecipesFromProduction().catch(console.error);
