import { Recipe, Ingredient, Nutrition } from "../../../lib/types";
import {
  SpoonacularRecipeInfo,
  SpoonacularNutrient,
  SpoonacularIngredient,
} from "./types";
import { calculateCarbChoices } from "./validators";

/**
 * Transform Spoonacular recipe data to our app's Recipe format
 */
export function transformSpoonacularRecipe(
  spoonacularRecipe: SpoonacularRecipeInfo,
  category: Recipe["category"],
): Recipe {
  // Extract nutrition data
  const nutrition = transformNutrition(
    spoonacularRecipe.nutrition?.nutrients || [],
  );

  // Transform ingredients
  const ingredients = transformIngredients(
    spoonacularRecipe.extendedIngredients || [],
  );

  // Extract instructions
  const instructions = extractInstructions(spoonacularRecipe);

  // Generate tags
  const tags = generateTags(spoonacularRecipe, nutrition);

  // Create the recipe object
  const recipe: Recipe = {
    id: `spoonacular-${spoonacularRecipe.id}`,
    title: cleanTitle(spoonacularRecipe.title),
    description: generateDescription(spoonacularRecipe),
    category,
    prepTime: spoonacularRecipe.preparationMinutes || 10,
    cookTime:
      spoonacularRecipe.cookingMinutes ||
      spoonacularRecipe.readyInMinutes -
        (spoonacularRecipe.preparationMinutes || 10),
    totalTime: spoonacularRecipe.readyInMinutes,
    servings: spoonacularRecipe.servings,
    ingredients,
    instructions,
    nutrition,
    tags,
    image: spoonacularRecipe.image,
    originalImage: spoonacularRecipe.image,
    source: spoonacularRecipe.sourceName || "Spoonacular",
    url:
      spoonacularRecipe.sourceUrl ||
      `https://spoonacular.com/recipes/${spoonacularRecipe.id}`,
    scraped_at: new Date().toISOString(),
    medicallyCompliant: true, // Will be validated separately
  };

  return recipe;
}

/**
 * Transform Spoonacular nutrition data to our format
 */
function transformNutrition(nutrients: SpoonacularNutrient[]): Nutrition {
  const getNutrientValue = (name: string): number => {
    const nutrient = nutrients.find(
      (n) =>
        n.name.toLowerCase() === name.toLowerCase() ||
        n.name.toLowerCase().includes(name.toLowerCase()),
    );
    return Math.round(nutrient?.amount || 0);
  };

  const carbs = getNutrientValue("carbohydrates");

  return {
    calories: getNutrientValue("calories"),
    carbs,
    carbChoices: calculateCarbChoices(carbs),
    fiber: getNutrientValue("fiber"),
    sugar: getNutrientValue("sugar"),
    protein: getNutrientValue("protein"),
    fat: getNutrientValue("fat"),
    saturatedFat: getNutrientValue("saturated fat"),
    sodium: getNutrientValue("sodium"),
  };
}

/**
 * Transform Spoonacular ingredients to our format
 */
function transformIngredients(
  spoonacularIngredients: SpoonacularIngredient[],
): Ingredient[] {
  return spoonacularIngredients.map((ing) => {
    // Try to use metric measurements for consistency
    const amount = ing.measures.metric.amount;
    const unit = standardizeUnit(ing.measures.metric.unitShort);
    const item = ing.nameClean || ing.originalName || ing.name;

    return {
      amount: formatAmount(amount),
      unit,
      item: capitalizeWords(item),
    };
  });
}

/**
 * Extract instructions from various Spoonacular formats
 */
function extractInstructions(recipe: SpoonacularRecipeInfo): string[] {
  const instructions: string[] = [];

  // Try to use analyzed instructions first (structured format)
  if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
    recipe.analyzedInstructions.forEach((section) => {
      if (section.name) {
        instructions.push(`**${section.name}**`);
      }
      section.steps.forEach((step) => {
        instructions.push(`${step.number}. ${step.step}`);
      });
    });
  }
  // Fall back to simple instructions string
  else if (recipe.instructions) {
    // Split by common delimiters
    const steps = recipe.instructions
      .split(/(?:\r?\n|\. (?=[A-Z]))/)
      .filter((step) => step.trim().length > 0)
      .map((step) => step.trim());

    steps.forEach((step, index) => {
      // Remove existing numbering if present
      const cleanStep = step.replace(/^\d+[\.\)]\s*/, "");
      instructions.push(`${index + 1}. ${cleanStep}`);
    });
  }

  // If no instructions found, add a placeholder
  if (instructions.length === 0) {
    instructions.push("Detailed instructions available at the source.");
  }

  return instructions;
}

/**
 * Generate tags based on recipe properties
 */
function generateTags(
  recipe: SpoonacularRecipeInfo,
  nutrition: Nutrition,
): string[] {
  const tags: string[] = [];

  // Dietary tags
  if (recipe.vegetarian) tags.push("vegetarian");
  if (recipe.vegan) tags.push("vegan");
  if (recipe.glutenFree) tags.push("gluten-free");
  if (recipe.dairyFree) tags.push("dairy-free");

  // Quick recipes
  if (recipe.readyInMinutes <= 30) tags.push("quick");
  if (recipe.readyInMinutes <= 15) tags.push("15-minutes");

  // Nutrition-based tags
  if (nutrition.protein >= 20) tags.push("high-protein");
  if (nutrition.fiber >= 5) tags.push("high-fiber");
  if (nutrition.carbs <= 20) tags.push("low-carb");

  // Meal type tags from dishTypes
  if (recipe.dishTypes) {
    const mealTags = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "appetizer",
      "side dish",
    ];
    recipe.dishTypes.forEach((type) => {
      const cleanType = type.toLowerCase();
      if (mealTags.includes(cleanType)) {
        tags.push(cleanType.replace(" ", "-"));
      }
    });
  }

  // Cuisine tags
  if (recipe.cuisines && recipe.cuisines.length > 0) {
    tags.push(...recipe.cuisines.map((c) => c.toLowerCase()));
  }

  // Health score
  if (recipe.healthScore >= 80) tags.push("very-healthy");
  else if (recipe.healthScore >= 60) tags.push("healthy");

  // Budget
  if (recipe.cheap) tags.push("budget-friendly");

  // Remove duplicates
  return Array.from(new Set(tags));
}

/**
 * Generate a description from Spoonacular data
 */
function generateDescription(recipe: SpoonacularRecipeInfo): string {
  // Try to extract a clean summary
  if (recipe.summary) {
    // Remove HTML tags
    const cleanSummary = recipe.summary
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Take first 2 sentences
    const sentences = cleanSummary.split(/[.!?]+/);
    const description = sentences.slice(0, 2).join(". ").trim();

    if (description.length > 20) {
      return description + (description.endsWith(".") ? "" : ".");
    }
  }

  // Generate a basic description
  const mealType = recipe.dishTypes?.[0] || "dish";
  const cuisine = recipe.cuisines?.[0] || "";
  const time = recipe.readyInMinutes;

  return `A delicious ${cuisine} ${mealType} ready in ${time} minutes. Perfect for gestational diabetes meal planning.`.trim();
}

/**
 * Standardize units for consistency
 */
function standardizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    g: "g",
    gram: "g",
    grams: "g",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    l: "L",
    liter: "L",
    liters: "L",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    c: "cup",
    cup: "cup",
    cups: "cup",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    pound: "lb",
    pounds: "lb",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
  };

  const lower = unit.toLowerCase();
  return unitMap[lower] || unit;
}

/**
 * Format amount to be user-friendly
 */
function formatAmount(amount: number): string {
  // Round to reasonable precision
  if (amount >= 10) {
    return Math.round(amount).toString();
  } else if (amount >= 1) {
    return (Math.round(amount * 10) / 10).toString();
  } else if (amount >= 0.25) {
    // Convert to fractions for common measurements
    const fractions: { [key: number]: string } = {
      0.25: "1/4",
      0.33: "1/3",
      0.5: "1/2",
      0.67: "2/3",
      0.75: "3/4",
    };
    const rounded = Math.round(amount * 4) / 4;
    return fractions[rounded] || rounded.toString();
  } else {
    return (Math.round(amount * 100) / 100).toString();
  }
}

/**
 * Clean and format recipe title
 */
function cleanTitle(title: string): string {
  // Remove common suffixes and clean up
  return title
    .replace(/\s*\(.*?\)\s*$/, "") // Remove parenthetical info
    .replace(/\s*-\s*Recipe\s*$/i, "") // Remove "- Recipe" suffix
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Capitalize words properly
 */
function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
