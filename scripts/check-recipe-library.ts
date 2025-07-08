import { RecipeModel } from "../src/lib/firebase/models/recipe";
import { initializeFirebaseAdmin } from "../src/lib/firebase/admin";

async function checkRecipeLibrary() {
  console.log("🔍 Checking Recipe Library Status...\n");

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Get total recipe count
    const totalCount = await RecipeModel.getCount();
    console.log(`📊 Total Recipes in Library: ${totalCount}`);

    // Get count by category
    const categoryBreakdown = await RecipeModel.getCountByCategory();
    console.log("\n📂 Recipes by Category:");
    console.log(`   🍳 Breakfast: ${categoryBreakdown.breakfast || 0}`);
    console.log(`   🥗 Lunch: ${categoryBreakdown.lunch || 0}`);
    console.log(`   🍽️  Dinner: ${categoryBreakdown.dinner || 0}`);
    console.log(`   🥨 Snack: ${categoryBreakdown.snack || 0}`);

    // Calculate percentage of each category
    if (totalCount > 0) {
      console.log("\n📈 Category Distribution:");
      console.log(
        `   Breakfast: ${(((categoryBreakdown.breakfast || 0) / totalCount) * 100).toFixed(1)}%`,
      );
      console.log(
        `   Lunch: ${(((categoryBreakdown.lunch || 0) / totalCount) * 100).toFixed(1)}%`,
      );
      console.log(
        `   Dinner: ${(((categoryBreakdown.dinner || 0) / totalCount) * 100).toFixed(1)}%`,
      );
      console.log(
        `   Snack: ${(((categoryBreakdown.snack || 0) / totalCount) * 100).toFixed(1)}%`,
      );
    }

    // Sample a few recipes to show quality
    console.log("\n🔎 Sample Recipes:");
    const categories = ["breakfast", "lunch", "dinner", "snack"];

    for (const category of categories) {
      const recipes = await RecipeModel.getByCategory(category as any, 1);
      if (recipes.length > 0) {
        const recipe = recipes[0];
        console.log(`\n${category.toUpperCase()}: ${recipe.title}`);
        console.log(`   - Carbs: ${recipe.nutrition.carbohydrates}g`);
        console.log(`   - Protein: ${recipe.nutrition.protein}g`);
        console.log(`   - GD Score: ${recipe.gdValidation?.score || "N/A"}`);
      }
    }

    // Check for optimal library size
    console.log("\n📋 Library Status:");
    const optimalSizes = {
      breakfast: 150,
      lunch: 150,
      dinner: 200,
      snack: 100,
    };

    const totalOptimal = Object.values(optimalSizes).reduce((a, b) => a + b, 0);
    console.log(`   Target Library Size: ${totalOptimal} recipes`);
    console.log(
      `   Current Progress: ${((totalCount / totalOptimal) * 100).toFixed(1)}% complete`,
    );

    console.log("\n🎯 Category Goals:");
    for (const [category, target] of Object.entries(optimalSizes)) {
      const current = categoryBreakdown[category] || 0;
      const percentage = ((current / target) * 100).toFixed(1);
      const status = current >= target ? "✅" : "⏳";
      console.log(
        `   ${status} ${category}: ${current}/${target} (${percentage}%)`,
      );
    }

    // Estimate days remaining
    const dailyImportRate = 100; // Based on your scheduler config
    const recipesNeeded = Math.max(0, totalOptimal - totalCount);
    const daysRemaining = Math.ceil(recipesNeeded / dailyImportRate);

    console.log(`\n⏰ Estimated Time to Complete Library:`);
    console.log(`   Recipes needed: ${recipesNeeded}`);
    console.log(
      `   Days remaining: ${daysRemaining} (at ${dailyImportRate} recipes/day)`,
    );
    console.log(
      `   Completion date: ${new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
    );
  } catch (error) {
    console.error("❌ Error checking recipe library:", error);
    process.exit(1);
  }
}

// Run the check
checkRecipeLibrary().then(() => {
  console.log("\n✅ Recipe library check complete!");
  process.exit(0);
});
