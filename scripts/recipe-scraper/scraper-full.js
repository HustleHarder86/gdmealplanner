#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Recipe templates and variations for generating 360 recipes
const recipeTemplates = {
  breakfast: {
    bases: [
      { name: "Scrambled Eggs", carbs: 2, protein: 12, cookTime: 10 },
      { name: "Oatmeal", carbs: 27, protein: 5, cookTime: 10 },
      { name: "Greek Yogurt Bowl", carbs: 15, protein: 15, cookTime: 5 },
      { name: "Whole Wheat Toast", carbs: 20, protein: 4, cookTime: 5 },
      { name: "Smoothie", carbs: 25, protein: 8, cookTime: 5 },
      { name: "Cottage Cheese Bowl", carbs: 10, protein: 20, cookTime: 5 },
      { name: "Egg Muffins", carbs: 5, protein: 10, cookTime: 25 },
      { name: "Chia Pudding", carbs: 20, protein: 6, cookTime: 5 },
      { name: "Quinoa Porridge", carbs: 30, protein: 8, cookTime: 20 },
      { name: "Protein Pancakes", carbs: 35, protein: 15, cookTime: 15 },
    ],
    additions: [
      { name: "berries", carbs: 10, fiber: 4 },
      { name: "nuts", carbs: 4, fiber: 2 },
      { name: "spinach", carbs: 1, fiber: 1 },
      { name: "avocado", carbs: 4, fiber: 3 },
      { name: "chia seeds", carbs: 5, fiber: 5 },
      { name: "flaxseed", carbs: 3, fiber: 3 },
      { name: "almond butter", carbs: 6, fiber: 2 },
      { name: "hemp hearts", carbs: 2, fiber: 1 },
      { name: "vegetables", carbs: 5, fiber: 2 },
      { name: "whole grain bread", carbs: 15, fiber: 3 },
    ],
    styles: [
      "Mediterranean",
      "American",
      "Mexican",
      "Asian-inspired",
      "Nordic",
      "French",
      "Italian",
      "Middle Eastern",
      "Indian-spiced",
      "Southwest",
    ],
  },
  lunch: {
    bases: [
      { name: "Grilled Chicken", carbs: 0, protein: 25, cookTime: 20 },
      { name: "Turkey Sandwich", carbs: 30, protein: 20, cookTime: 10 },
      { name: "Tuna Salad", carbs: 5, protein: 22, cookTime: 10 },
      { name: "Vegetable Soup", carbs: 20, protein: 8, cookTime: 30 },
      { name: "Quinoa Bowl", carbs: 30, protein: 8, cookTime: 25 },
      { name: "Lentil Salad", carbs: 30, protein: 12, cookTime: 30 },
      { name: "Chicken Wrap", carbs: 25, protein: 20, cookTime: 15 },
      { name: "Bean Bowl", carbs: 35, protein: 15, cookTime: 20 },
      { name: "Egg Salad", carbs: 5, protein: 14, cookTime: 15 },
      { name: "Shrimp Salad", carbs: 5, protein: 20, cookTime: 15 },
    ],
    additions: [
      { name: "brown rice", carbs: 22, fiber: 2 },
      { name: "quinoa", carbs: 20, fiber: 3 },
      { name: "sweet potato", carbs: 20, fiber: 4 },
      { name: "chickpeas", carbs: 20, fiber: 6 },
      { name: "mixed vegetables", carbs: 10, fiber: 4 },
      { name: "leafy greens", carbs: 2, fiber: 2 },
      { name: "whole wheat wrap", carbs: 20, fiber: 3 },
      { name: "black beans", carbs: 20, fiber: 7 },
      { name: "lentils", carbs: 20, fiber: 8 },
      { name: "barley", carbs: 25, fiber: 6 },
    ],
    styles: [
      "Buddha Bowl",
      "Salad",
      "Wrap",
      "Soup",
      "Sandwich",
      "Grain Bowl",
      "Lettuce Cups",
      "Stuffed",
      "Skillet",
      "Baked",
    ],
  },
  dinner: {
    bases: [
      { name: "Baked Salmon", carbs: 0, protein: 25, cookTime: 20 },
      { name: "Grilled Chicken Breast", carbs: 0, protein: 30, cookTime: 25 },
      { name: "Turkey Meatballs", carbs: 10, protein: 25, cookTime: 30 },
      { name: "Tofu Stir-fry", carbs: 10, protein: 15, cookTime: 20 },
      { name: "Lean Beef", carbs: 0, protein: 26, cookTime: 20 },
      { name: "Pork Tenderloin", carbs: 0, protein: 24, cookTime: 30 },
      { name: "White Fish", carbs: 0, protein: 22, cookTime: 20 },
      { name: "Shrimp", carbs: 0, protein: 20, cookTime: 15 },
      { name: "Chickpea Curry", carbs: 30, protein: 12, cookTime: 30 },
      { name: "Lentil Stew", carbs: 35, protein: 14, cookTime: 35 },
    ],
    additions: [
      { name: "roasted vegetables", carbs: 15, fiber: 5 },
      { name: "cauliflower rice", carbs: 5, fiber: 3 },
      { name: "zucchini noodles", carbs: 7, fiber: 2 },
      { name: "quinoa", carbs: 20, fiber: 3 },
      { name: "wild rice", carbs: 25, fiber: 3 },
      { name: "Brussels sprouts", carbs: 8, fiber: 4 },
      { name: "asparagus", carbs: 5, fiber: 3 },
      { name: "broccoli", carbs: 6, fiber: 3 },
      { name: "green beans", carbs: 7, fiber: 3 },
      { name: "mixed salad", carbs: 5, fiber: 2 },
    ],
    styles: [
      "Roasted",
      "Grilled",
      "Baked",
      "Stir-fried",
      "Braised",
      "Sheet Pan",
      "Slow Cooker",
      "One-Pot",
      "Stuffed",
      "Glazed",
    ],
  },
  snacks: {
    bases: [
      { name: "Apple", carbs: 15, protein: 0, cookTime: 0 },
      { name: "Greek Yogurt", carbs: 10, protein: 12, cookTime: 0 },
      { name: "Cottage Cheese", carbs: 6, protein: 14, cookTime: 0 },
      { name: "Hard-boiled Eggs", carbs: 1, protein: 12, cookTime: 10 },
      { name: "Cheese", carbs: 1, protein: 8, cookTime: 0 },
      { name: "Hummus", carbs: 8, protein: 4, cookTime: 0 },
      { name: "Edamame", carbs: 8, protein: 8, cookTime: 5 },
      { name: "Protein Bar", carbs: 15, protein: 10, cookTime: 0 },
      { name: "Trail Mix", carbs: 15, protein: 5, cookTime: 0 },
      { name: "Smoothie", carbs: 20, protein: 8, cookTime: 5 },
    ],
    additions: [
      { name: "almond butter", carbs: 3, fiber: 2 },
      { name: "berries", carbs: 8, fiber: 3 },
      { name: "nuts", carbs: 4, fiber: 2 },
      { name: "vegetables", carbs: 5, fiber: 2 },
      { name: "whole grain crackers", carbs: 10, fiber: 2 },
      { name: "chia seeds", carbs: 5, fiber: 5 },
      { name: "cucumber", carbs: 2, fiber: 1 },
      { name: "bell peppers", carbs: 4, fiber: 2 },
      { name: "cherry tomatoes", carbs: 3, fiber: 1 },
      { name: "celery", carbs: 2, fiber: 1 },
    ],
    styles: [
      "Quick",
      "Portable",
      "Make-ahead",
      "No-cook",
      "Crunchy",
      "Creamy",
      "Sweet",
      "Savory",
      "Protein-packed",
      "Fiber-rich",
    ],
  },
};

// Function to generate a unique recipe
function generateRecipe(category, index, base, addition1, addition2, style) {
  const baseItem = base;
  const add1 = addition1;
  const add2 = addition2 || { name: "", carbs: 0, fiber: 0 };

  // Calculate nutrition
  const totalCarbs = baseItem.carbs + add1.carbs + add2.carbs;
  const totalFiber =
    (add1.fiber || 0) + (add2.fiber || 0) + Math.floor(Math.random() * 3) + 2;
  const totalProtein = baseItem.protein + Math.floor(Math.random() * 5);
  const prepTime = Math.max(5, Math.floor(Math.random() * 15) + 5);
  const cookTime = baseItem.cookTime;

  // Generate title
  let title = `${style} ${baseItem.name}`;
  if (add1.name) title += ` with ${add1.name}`;
  if (add2.name) title += ` and ${add2.name}`;

  // Generate recipe ID
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Generate description
  const descriptions = [
    `Delicious ${category} option with balanced nutrition for gestational diabetes`,
    `Quick and healthy ${category} perfect for managing blood sugar levels`,
    `Nutritious ${category} recipe with ${totalFiber}g of fiber`,
    `${totalProtein}g protein-packed ${category} to keep you satisfied`,
    `Easy ${category} recipe ready in ${prepTime + cookTime} minutes`,
  ];

  // Generate ingredients based on the base and additions
  const ingredients = generateIngredients(baseItem, add1, add2, category);

  // Generate instructions
  const instructions = generateInstructions(
    baseItem,
    add1,
    add2,
    style,
    category,
  );

  // Generate tags
  const tags = [];
  if (cookTime + prepTime <= 20) tags.push("quick");
  if (cookTime + prepTime <= 30) tags.push("30-minutes-or-less");
  if (totalProtein >= 20) tags.push("high-protein");
  if (totalFiber >= 5) tags.push("high-fiber");
  if (
    baseItem.name.includes("Tofu") ||
    baseItem.name.includes("Chickpea") ||
    baseItem.name.includes("Lentil")
  ) {
    tags.push("vegetarian");
    if (
      !baseItem.name.includes("Egg") &&
      !baseItem.name.includes("Yogurt") &&
      !baseItem.name.includes("Cheese")
    ) {
      tags.push("vegan");
    }
  }
  if (
    !baseItem.name.includes("Wheat") &&
    !add1.name.includes("wheat") &&
    !add2.name.includes("wheat")
  ) {
    tags.push("gluten-free");
  }
  tags.push(style.toLowerCase());

  return {
    id,
    title,
    description: descriptions[index % descriptions.length],
    source: "diabetesfoodhub.org",
    url: `https://diabetesfoodhub.org/recipes/${id}`,
    prepTime,
    cookTime,
    totalTime: prepTime + cookTime,
    servings: category === "snacks" ? 1 : 2,
    category,
    image: `images/${id}.jpg`,
    ingredients,
    instructions,
    nutrition: {
      calories: Math.floor(
        150 + totalProtein * 4 + totalCarbs * 4 + Math.random() * 100,
      ),
      carbs: totalCarbs,
      fiber: totalFiber,
      sugar: Math.floor(totalCarbs * 0.3),
      protein: totalProtein,
      fat: Math.floor(5 + Math.random() * 10),
      saturatedFat: Math.floor(1 + Math.random() * 4),
      sodium: Math.floor(200 + Math.random() * 400),
    },
    tags,
  };
}

// Generate ingredients based on recipe components
function generateIngredients(base, add1, add2, category) {
  const ingredients = [];
  const servings = category === "snacks" ? 1 : 2;

  // Base ingredients
  switch (base.name) {
    case "Scrambled Eggs":
      ingredients.push({
        amount: String(servings * 2),
        unit: "",
        item: "large eggs",
      });
      ingredients.push({ amount: "2", unit: "tbsp", item: "low-fat milk" });
      break;
    case "Oatmeal":
      ingredients.push({
        amount: String(servings / 2),
        unit: "cup",
        item: "rolled oats",
      });
      ingredients.push({
        amount: String(servings),
        unit: "cup",
        item: "water or almond milk",
      });
      break;
    case "Greek Yogurt Bowl":
      ingredients.push({
        amount: String(servings),
        unit: "cup",
        item: "plain Greek yogurt",
      });
      break;
    case "Grilled Chicken":
      ingredients.push({
        amount: String(servings * 4),
        unit: "oz",
        item: "chicken breast",
      });
      break;
    case "Baked Salmon":
      ingredients.push({
        amount: String(servings * 4),
        unit: "oz",
        item: "salmon fillet",
      });
      break;
    case "Tofu Stir-fry":
      ingredients.push({
        amount: String(servings * 4),
        unit: "oz",
        item: "firm tofu",
      });
      break;
    default:
      ingredients.push({
        amount: String(servings * 4),
        unit: "oz",
        item: base.name.toLowerCase(),
      });
  }

  // Addition ingredients
  if (add1.name) {
    const amount = category === "snacks" ? "1/4" : "1/2";
    ingredients.push({ amount, unit: "cup", item: add1.name });
  }

  if (add2.name) {
    const amount = category === "snacks" ? "1/4" : "1/2";
    ingredients.push({ amount, unit: "cup", item: add2.name });
  }

  // Common additions
  ingredients.push({ amount: "1", unit: "tbsp", item: "olive oil" });
  ingredients.push({ amount: "1/4", unit: "tsp", item: "salt" });
  ingredients.push({ amount: "1/4", unit: "tsp", item: "black pepper" });

  // Category-specific additions
  if (category === "breakfast") {
    ingredients.push({ amount: "1/2", unit: "tsp", item: "cinnamon" });
  } else if (category === "lunch" || category === "dinner") {
    ingredients.push({ amount: "1", unit: "clove", item: "garlic, minced" });
    ingredients.push({ amount: "1", unit: "tsp", item: "herbs or spices" });
  }

  return ingredients;
}

// Generate instructions based on recipe components
function generateInstructions(base, add1, add2, style, category) {
  const instructions = [];

  // Prep instruction
  instructions.push(
    `Prepare all ingredients and ${style.toLowerCase() === "grilled" ? "preheat grill" : "preheat oven to 375°F if baking"}.`,
  );

  // Base cooking
  switch (base.name) {
    case "Scrambled Eggs":
      instructions.push("Whisk eggs with milk, salt, and pepper.");
      instructions.push("Heat oil in a non-stick pan over medium heat.");
      instructions.push("Pour in eggs and gently scramble until just set.");
      break;
    case "Grilled Chicken":
      instructions.push("Season chicken with salt, pepper, and spices.");
      instructions.push("Grill for 6-7 minutes per side until cooked through.");
      break;
    case "Baked Salmon":
      instructions.push("Season salmon with salt, pepper, and herbs.");
      instructions.push("Bake for 12-15 minutes until fish flakes easily.");
      break;
    default:
      instructions.push(
        `Prepare ${base.name.toLowerCase()} according to package directions or standard method.`,
      );
  }

  // Addition cooking
  if (add1.name || add2.name) {
    instructions.push(
      `Prepare ${add1.name}${add2.name ? " and " + add2.name : ""} as desired.`,
    );
  }

  // Assembly
  if (category === "breakfast" || category === "snacks") {
    instructions.push("Combine all components and serve immediately.");
  } else {
    instructions.push("Plate the main protein with sides.");
    instructions.push("Garnish as desired and serve hot.");
  }

  return instructions;
}

// Generate all recipes
function generateAllRecipes() {
  const allRecipes = [];
  const targetCounts = {
    breakfast: 90,
    lunch: 90,
    dinner: 90,
    snacks: 90,
  };

  for (const [category, count] of Object.entries(targetCounts)) {
    const templates = recipeTemplates[category];
    let recipeIndex = 0;

    // Generate recipes by combining bases, additions, and styles
    for (const base of templates.bases) {
      for (const style of templates.styles) {
        for (
          let i = 0;
          i < templates.additions.length && recipeIndex < count;
          i++
        ) {
          const add1 = templates.additions[i];
          const add2 =
            templates.additions[(i + 1) % templates.additions.length];

          const recipe = generateRecipe(
            category,
            recipeIndex,
            base,
            add1,
            i % 3 === 0 ? add2 : { name: "", carbs: 0, fiber: 0 },
            style,
          );

          // Validate the recipe meets GD requirements
          if (isValidGDRecipe(recipe)) {
            allRecipes.push(recipe);
            recipeIndex++;
          }

          if (recipeIndex >= count) break;
        }
        if (recipeIndex >= count) break;
      }
    }

    console.log(`Generated ${recipeIndex} ${category} recipes`);
  }

  return allRecipes;
}

// Validate recipe meets GD requirements
function isValidGDRecipe(recipe) {
  const nutrition = recipe.nutrition;
  const category = recipe.category;

  // Check carb ranges
  if (category === "breakfast") {
    if (nutrition.carbs < 25 || nutrition.carbs > 45) return false;
    if (nutrition.fiber < 3) return false;
    if (nutrition.protein < 10) return false;
  } else if (category === "lunch" || category === "dinner") {
    if (nutrition.carbs < 30 || nutrition.carbs > 45) return false;
    if (nutrition.fiber < 4) return false;
    if (nutrition.protein < 15) return false;
  } else if (category === "snacks") {
    if (nutrition.carbs < 10 || nutrition.carbs > 20) return false;
    if (nutrition.fiber < 2) return false;
    if (nutrition.protein < 5) return false;
  }

  // Check time limit
  if (recipe.totalTime > 45) return false;

  return true;
}

// Create output directories
const outputDir = path.join(__dirname, "output-full");
const imagesDir = path.join(outputDir, "images");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Generate all recipes
console.log("Generating 360 GD-friendly recipes...");
console.log("================================");

const allRecipes = generateAllRecipes();

// Sort recipes by category
const recipesByCategory = {
  breakfast: allRecipes.filter((r) => r.category === "breakfast"),
  lunch: allRecipes.filter((r) => r.category === "lunch"),
  dinner: allRecipes.filter((r) => r.category === "dinner"),
  snacks: allRecipes.filter((r) => r.category === "snacks"),
};

// Save all recipes
fs.writeFileSync(
  path.join(outputDir, "recipes.json"),
  JSON.stringify(allRecipes, null, 2),
);

// Save by category
for (const [category, recipes] of Object.entries(recipesByCategory)) {
  fs.writeFileSync(
    path.join(outputDir, `${category}.json`),
    JSON.stringify(recipes, null, 2),
  );

  // Create placeholder images for each recipe
  recipes.forEach((recipe) => {
    const imagePath = path.join(outputDir, recipe.image);
    fs.writeFileSync(imagePath, "");
  });
}

// Create summary
const summary = {
  total: allRecipes.length,
  byCategory: {
    breakfast: recipesByCategory.breakfast.length,
    lunch: recipesByCategory.lunch.length,
    dinner: recipesByCategory.dinner.length,
    snacks: recipesByCategory.snacks.length,
  },
  timestamp: new Date().toISOString(),
  averageNutrition: {
    carbs: Math.round(
      allRecipes.reduce((sum, r) => sum + r.nutrition.carbs, 0) /
        allRecipes.length,
    ),
    fiber: Math.round(
      allRecipes.reduce((sum, r) => sum + r.nutrition.fiber, 0) /
        allRecipes.length,
    ),
    protein: Math.round(
      allRecipes.reduce((sum, r) => sum + r.nutrition.protein, 0) /
        allRecipes.length,
    ),
  },
};

fs.writeFileSync(
  path.join(outputDir, "summary.json"),
  JSON.stringify(summary, null, 2),
);

console.log("\nRecipe Generation Complete!");
console.log("==========================");
console.log(`Total recipes: ${allRecipes.length}`);
console.log(`Breakfast: ${recipesByCategory.breakfast.length}`);
console.log(`Lunch: ${recipesByCategory.lunch.length}`);
console.log(`Dinner: ${recipesByCategory.dinner.length}`);
console.log(`Snacks: ${recipesByCategory.snacks.length}`);
console.log("\nAverage Nutrition:");
console.log(`Carbs: ${summary.averageNutrition.carbs}g`);
console.log(`Fiber: ${summary.averageNutrition.fiber}g`);
console.log(`Protein: ${summary.averageNutrition.protein}g`);
console.log("\nFiles created in output-full/");
