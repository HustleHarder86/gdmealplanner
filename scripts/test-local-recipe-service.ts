import { LocalRecipeService } from "../src/services/local-recipe-service";
import { Recipe } from "../src/types/recipe";

// Test data
const mockRecipes: Recipe[] = [
  {
    id: "test-1",
    title: "Scrambled Eggs with Spinach",
    description: "High protein breakfast",
    category: "breakfast",
    subcategory: "",
    tags: ["high-protein", "quick", "eggs"],
    prepTime: 5,
    cookTime: 10,
    totalTime: 15,
    servings: 2,
    ingredients: [
      { name: "eggs", amount: 3, unit: "large" },
      { name: "spinach", amount: 1, unit: "cup" },
    ],
    instructions: ["Whisk eggs", "Cook spinach", "Combine"],
    nutrition: {
      calories: 220,
      carbohydrates: 28,
      protein: 15,
      fat: 12,
      fiber: 2,
      sugar: 2,
      sodium: 300,
    },
    carbChoices: 2,
    gdValidation: {
      isAppropriate: true,
      carbRange: "breakfast",
      warnings: [],
    },
    source: "Test",
    sourceUrl: "",
    imageUrl: "",
    localImageUrl: "/images/test-1.jpg",
    importedFrom: "test",
    importedAt: new Date().toISOString(),
    verified: true,
    popularity: 0,
    userRatings: [],
    timesViewed: 0,
    timesAddedToPlan: 0,
  },
  {
    id: "test-2",
    title: "Apple Slices with Almond Butter",
    description: "Perfect bedtime snack",
    category: "snack",
    subcategory: "bedtime",
    tags: ["bedtime", "quick", "nuts"],
    prepTime: 5,
    cookTime: 0,
    totalTime: 5,
    servings: 1,
    ingredients: [
      { name: "apple", amount: 1, unit: "medium" },
      { name: "almond butter", amount: 2, unit: "tbsp" },
    ],
    instructions: ["Slice apple", "Serve with almond butter"],
    nutrition: {
      calories: 180,
      carbohydrates: 15,
      protein: 7,
      fat: 10,
      fiber: 3,
      sugar: 10,
      sodium: 50,
    },
    carbChoices: 1,
    gdValidation: {
      isAppropriate: true,
      carbRange: "snack",
      warnings: [],
    },
    source: "Test",
    sourceUrl: "",
    imageUrl: "",
    localImageUrl: "/images/test-2.jpg",
    importedFrom: "test",
    importedAt: new Date().toISOString(),
    verified: true,
    popularity: 0,
    userRatings: [],
    timesViewed: 0,
    timesAddedToPlan: 0,
  },
  {
    id: "test-3",
    title: "Grilled Chicken Salad",
    description: "Low carb lunch option",
    category: "lunch",
    subcategory: "",
    tags: ["salad", "chicken", "low-carb"],
    prepTime: 15,
    cookTime: 20,
    totalTime: 35,
    servings: 2,
    ingredients: [
      { name: "chicken breast", amount: 200, unit: "g" },
      { name: "mixed greens", amount: 4, unit: "cups" },
    ],
    instructions: ["Grill chicken", "Prepare salad", "Combine"],
    nutrition: {
      calories: 320,
      carbohydrates: 45,
      protein: 35,
      fat: 8,
      fiber: 5,
      sugar: 3,
      sodium: 400,
    },
    carbChoices: 3,
    gdValidation: {
      isAppropriate: true,
      carbRange: "main",
      warnings: [],
    },
    source: "Test",
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

console.log("🧪 Testing LocalRecipeService...\n");

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result
          .then(() => {
            console.log(`✅ ${name}`);
            passed++;
          })
          .catch((error) => {
            console.log(`❌ ${name}: ${error.message}`);
            failed++;
          });
      } else {
        console.log(`✅ ${name}`);
        passed++;
      }
    } catch (error: any) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  function assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(message);
    }
  }

  // Initialize service
  await test("Initialize with recipe data", async () => {
    await LocalRecipeService.initialize(mockRecipes);
    const recipes = LocalRecipeService.getAllRecipes();
    assert(recipes.length === 3, `Expected 3 recipes, got ${recipes.length}`);
  });

  // Test getAllRecipes
  test("Get all recipes", () => {
    const recipes = LocalRecipeService.getAllRecipes();
    assert(recipes.length === 3, `Expected 3 recipes, got ${recipes.length}`);
    assert(
      recipes[0].title === "Scrambled Eggs with Spinach",
      "First recipe title mismatch",
    );
  });

  // Test getRecipeById
  test("Get recipe by ID", () => {
    const recipe = LocalRecipeService.getRecipeById("test-2");
    assert(recipe !== null, "Recipe not found");
    assert(
      recipe!.title === "Apple Slices with Almond Butter",
      "Recipe title mismatch",
    );
  });

  test("Get non-existent recipe", () => {
    const recipe = LocalRecipeService.getRecipeById("non-existent");
    assert(recipe === null, "Should return null for non-existent recipe");
  });

  // Test getRecipesByCategory
  test("Get recipes by category", () => {
    const breakfast = LocalRecipeService.getRecipesByCategory("breakfast");
    assert(
      breakfast.length === 1,
      `Expected 1 breakfast recipe, got ${breakfast.length}`,
    );

    const snacks = LocalRecipeService.getRecipesByCategory("snack");
    assert(
      snacks.length === 1,
      `Expected 1 snack recipe, got ${snacks.length}`,
    );
  });

  // Test search
  test("Search recipes by title", () => {
    const results = LocalRecipeService.searchRecipes("eggs");
    assert(
      results.length === 1,
      `Expected 1 result for "eggs", got ${results.length}`,
    );
    assert(
      results[0].title.includes("Eggs"),
      'Search result should contain "Eggs"',
    );
  });

  test("Search recipes by ingredient", () => {
    const results = LocalRecipeService.searchRecipes("chicken");
    assert(
      results.length === 1,
      `Expected 1 result for "chicken", got ${results.length}`,
    );
  });

  test("Search recipes by tag", () => {
    const results = LocalRecipeService.searchRecipes("bedtime");
    assert(
      results.length === 1,
      `Expected 1 result for "bedtime", got ${results.length}`,
    );
  });

  test("Search is case insensitive", () => {
    const results = LocalRecipeService.searchRecipes("APPLE");
    assert(
      results.length === 1,
      `Expected 1 result for "APPLE", got ${results.length}`,
    );
  });

  // Test nutrition filtering
  test("Filter by max carbs", () => {
    const results = LocalRecipeService.getRecipesByNutrition({ maxCarbs: 30 });
    assert(
      results.length === 2,
      `Expected 2 low-carb recipes, got ${results.length}`,
    );
  });

  test("Filter by min protein", () => {
    const results = LocalRecipeService.getRecipesByNutrition({
      minProtein: 20,
    });
    assert(
      results.length === 1,
      `Expected 1 high-protein recipe, got ${results.length}`,
    );
  });

  // Test bedtime snacks
  test("Get bedtime snacks", () => {
    const bedtimeSnacks = LocalRecipeService.getBedtimeSnacks();
    assert(
      bedtimeSnacks.length === 1,
      `Expected 1 bedtime snack, got ${bedtimeSnacks.length}`,
    );
    const snack = bedtimeSnacks[0];
    assert(
      snack.nutrition.carbohydrates >= 14 &&
        snack.nutrition.carbohydrates <= 16,
      "Bedtime snack carbs should be 14-16g",
    );
    assert(
      snack.nutrition.protein >= 5,
      "Bedtime snack should have at least 5g protein",
    );
  });

  // Test quick recipes
  test("Get quick recipes (default 30 min)", () => {
    const quickRecipes = LocalRecipeService.getQuickRecipes();
    assert(
      quickRecipes.length === 2,
      `Expected 2 quick recipes, got ${quickRecipes.length}`,
    );
  });

  test("Get very quick recipes (10 min)", () => {
    const veryQuick = LocalRecipeService.getQuickRecipes(10);
    assert(
      veryQuick.length === 1,
      `Expected 1 very quick recipe, got ${veryQuick.length}`,
    );
  });

  // Test random recipes
  test("Get random recipes", () => {
    const random = LocalRecipeService.getRandomRecipes(2);
    assert(
      random.length === 2,
      `Expected 2 random recipes, got ${random.length}`,
    );
  });

  // Test statistics
  test("Get statistics", () => {
    const stats = LocalRecipeService.getStats();
    assert(stats.total === 3, `Expected 3 total recipes, got ${stats.total}`);
    assert(
      stats.withLocalImages === 2,
      `Expected 2 recipes with images, got ${stats.withLocalImages}`,
    );
    assert(
      stats.quickRecipes === 2,
      `Expected 2 quick recipes, got ${stats.quickRecipes}`,
    );
    assert(
      stats.bedtimeSnacks === 1,
      `Expected 1 bedtime snack, got ${stats.bedtimeSnacks}`,
    );
  });

  // Summary
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("✨ All tests passed!");
  } else {
    console.log("❌ Some tests failed.");
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
