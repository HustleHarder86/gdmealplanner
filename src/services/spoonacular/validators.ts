import {
  SpoonacularRecipeInfo,
  SpoonacularNutrient,
  GDValidation,
} from "./types";

/**
 * Validators for Gestational Diabetes compliance
 * Based on medical guidelines from MEDICAL_GUIDELINES.md
 */

// GD Requirements per meal/snack
export const GD_REQUIREMENTS = {
  breakfast: {
    minCarbs: 15,
    maxCarbs: 30,
    minProtein: 7,
    minFiber: 3,
  },
  lunch: {
    minCarbs: 30,
    maxCarbs: 45,
    minProtein: 15,
    minFiber: 5,
  },
  dinner: {
    minCarbs: 30,
    maxCarbs: 45,
    minProtein: 15,
    minFiber: 5,
  },
  snack: {
    minCarbs: 10,
    maxCarbs: 20,
    minProtein: 5,
    minFiber: 2,
  },
  morningSnack: {
    minCarbs: 10,
    maxCarbs: 15,
    minProtein: 5,
    minFiber: 2,
  },
  afternoonSnack: {
    minCarbs: 15,
    maxCarbs: 20,
    minProtein: 5,
    minFiber: 2,
  },
  eveningSnack: {
    minCarbs: 10,
    maxCarbs: 20,
    minProtein: 7,
    minFiber: 2,
  },
};

/**
 * Extract nutrient value from Spoonacular nutrients array
 */
function getNutrientValue(
  nutrients: SpoonacularNutrient[],
  nutrientName: string,
): number {
  const nutrient = nutrients.find(
    (n) =>
      n.name.toLowerCase() === nutrientName.toLowerCase() ||
      n.name.toLowerCase().includes(nutrientName.toLowerCase()),
  );
  return nutrient?.amount || 0;
}

/**
 * Validate a recipe for GD compliance
 */
export function validateRecipeForGD(
  recipe: SpoonacularRecipeInfo,
  mealType: keyof typeof GD_REQUIREMENTS,
): GDValidation {
  const warnings: string[] = [];
  const adjustmentSuggestions: string[] = [];

  // Get requirements for this meal type
  const requirements = GD_REQUIREMENTS[mealType];

  // Extract nutrition values
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");
  const fiber = getNutrientValue(nutrients, "fiber");
  const sugar = getNutrientValue(nutrients, "sugar");
  const saturatedFat = getNutrientValue(nutrients, "saturated fat");

  // Validate carbs
  const carbsInRange =
    carbs >= requirements.minCarbs && carbs <= requirements.maxCarbs;
  if (!carbsInRange) {
    if (carbs < requirements.minCarbs) {
      warnings.push(
        `Carbs too low: ${carbs}g (min: ${requirements.minCarbs}g)`,
      );
      adjustmentSuggestions.push(
        "Add whole grain bread, fruit, or starchy vegetables",
      );
    } else {
      warnings.push(
        `Carbs too high: ${carbs}g (max: ${requirements.maxCarbs}g)`,
      );
      adjustmentSuggestions.push(
        "Reduce portion size or remove some carb sources",
      );
    }
  }

  // Validate protein
  const adequateProtein = protein >= requirements.minProtein;
  if (!adequateProtein) {
    warnings.push(
      `Protein too low: ${protein}g (min: ${requirements.minProtein}g)`,
    );
    adjustmentSuggestions.push("Add lean meat, eggs, Greek yogurt, or legumes");
  }

  // Validate fiber
  const adequateFiber = fiber >= requirements.minFiber;
  if (!adequateFiber) {
    warnings.push(`Fiber too low: ${fiber}g (min: ${requirements.minFiber}g)`);
    adjustmentSuggestions.push("Add vegetables, whole grains, or beans");
  }

  // Additional checks
  if (sugar > carbs * 0.5) {
    warnings.push(
      `High sugar content: ${sugar}g (${Math.round((sugar / carbs) * 100)}% of carbs)`,
    );
    adjustmentSuggestions.push("Choose options with less added sugar");
  }

  if (saturatedFat > 7) {
    warnings.push(`High saturated fat: ${saturatedFat}g`);
    adjustmentSuggestions.push(
      "Choose leaner protein sources or reduce cheese/butter",
    );
  }

  // Check for beneficial ingredients
  const ingredients =
    recipe.extendedIngredients?.map((i) => i.nameClean?.toLowerCase() || "") ||
    [];
  const hasWholeGrains = ingredients.some(
    (i) =>
      i.includes("whole wheat") ||
      i.includes("whole grain") ||
      i.includes("brown rice") ||
      i.includes("quinoa") ||
      i.includes("oats"),
  );
  const hasLeanProtein = ingredients.some(
    (i) =>
      i.includes("chicken breast") ||
      i.includes("turkey") ||
      i.includes("fish") ||
      i.includes("tofu") ||
      i.includes("egg"),
  );
  const hasVegetables = ingredients.some(
    (i) =>
      i.includes("spinach") ||
      i.includes("broccoli") ||
      i.includes("carrot") ||
      i.includes("tomato") ||
      i.includes("pepper") ||
      i.includes("lettuce"),
  );

  if (!hasWholeGrains && mealType !== "snack") {
    warnings.push("No whole grains detected");
    adjustmentSuggestions.push("Serve with whole grain bread or brown rice");
  }

  if (!hasLeanProtein) {
    warnings.push("No lean protein source detected");
  }

  if (!hasVegetables && mealType !== "snack") {
    warnings.push("Limited vegetables detected");
    adjustmentSuggestions.push("Add a side salad or steamed vegetables");
  }

  // Determine overall validity
  const isValid =
    carbsInRange && adequateProtein && adequateFiber && warnings.length <= 2;

  return {
    isValid,
    carbsInRange,
    adequateProtein,
    adequateFiber,
    warnings,
    adjustmentSuggestions:
      adjustmentSuggestions.length > 0 ? adjustmentSuggestions : undefined,
  };
}

/**
 * Calculate carb choices (for diabetes management)
 */
export function calculateCarbChoices(carbs: number): number {
  return Math.round((carbs / 15) * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine if a recipe is suitable for morning (some women are more insulin resistant in the morning)
 */
export function isSuitableForMorning(recipe: SpoonacularRecipeInfo): boolean {
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");
  const fiber = getNutrientValue(nutrients, "fiber");

  // For morning, we want lower carbs, higher protein, and good fiber
  return carbs <= 25 && protein >= 10 && fiber >= 3;
}

/**
 * Score a recipe for GD suitability (0-100)
 */
export function calculateGDScore(
  recipe: SpoonacularRecipeInfo,
  mealType: keyof typeof GD_REQUIREMENTS,
): number {
  const validation = validateRecipeForGD(recipe, mealType);
  let score = 100;

  // Deduct points for issues
  if (!validation.carbsInRange) score -= 30;
  if (!validation.adequateProtein) score -= 20;
  if (!validation.adequateFiber) score -= 15;

  // Deduct for warnings
  score -= validation.warnings.length * 5;

  // Bonus points for good ratios
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");
  const fiber = getNutrientValue(nutrients, "fiber");

  // Good protein:carb ratio
  if (protein / carbs >= 0.5) score += 5;

  // Excellent fiber content
  if (fiber / carbs >= 0.15) score += 5;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Filter out recipes that are definitely not suitable
 */
export function filterUnsuitableRecipes(
  recipes: SpoonacularRecipeInfo[],
): SpoonacularRecipeInfo[] {
  return recipes.filter((recipe) => {
    const nutrients = recipe.nutrition?.nutrients || [];
    const carbs = getNutrientValue(nutrients, "carbohydrates");
    const sugar = getNutrientValue(nutrients, "sugar");

    // Filter out desserts and high-sugar items
    const isDessert =
      recipe.dishTypes?.includes("dessert") ||
      recipe.title.toLowerCase().includes("cake") ||
      recipe.title.toLowerCase().includes("cookie") ||
      recipe.title.toLowerCase().includes("candy");

    // Filter out items with too much sugar
    const tooMuchSugar = sugar > carbs * 0.6;

    // Filter out items with extreme carb counts
    const extremeCarbs = carbs > 60 || carbs < 5;

    return !isDessert && !tooMuchSugar && !extremeCarbs;
  });
}
