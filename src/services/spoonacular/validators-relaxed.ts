import {
  SpoonacularRecipeInfo,
  SpoonacularNutrient,
  GDValidation,
} from "./types";

/**
 * Relaxed validators for initial recipe import
 * These are less strict than the medical guidelines to allow more recipes
 */

// Relaxed GD Requirements per meal/snack
export const GD_REQUIREMENTS_RELAXED = {
  breakfast: {
    minCarbs: 10,
    maxCarbs: 50,
    minProtein: 5,
    minFiber: 1,
  },
  lunch: {
    minCarbs: 20,
    maxCarbs: 60,
    minProtein: 10,
    minFiber: 2,
  },
  dinner: {
    minCarbs: 20,
    maxCarbs: 60,
    minProtein: 10,
    minFiber: 2,
  },
  snack: {
    minCarbs: 5,
    maxCarbs: 30,
    minProtein: 3,
    minFiber: 0,
  },
  morningSnack: {
    minCarbs: 5,
    maxCarbs: 25,
    minProtein: 3,
    minFiber: 0,
  },
  afternoonSnack: {
    minCarbs: 10,
    maxCarbs: 30,
    minProtein: 3,
    minFiber: 0,
  },
  eveningSnack: {
    minCarbs: 5,
    maxCarbs: 30,
    minProtein: 5,
    minFiber: 0,
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
 * Validate a recipe for GD compliance with relaxed rules
 */
export function validateRecipeForGDRelaxed(
  recipe: SpoonacularRecipeInfo,
  mealType: keyof typeof GD_REQUIREMENTS_RELAXED,
): GDValidation {
  const warnings: string[] = [];
  const adjustmentSuggestions: string[] = [];

  // Get requirements for this meal type
  const requirements = GD_REQUIREMENTS_RELAXED[mealType];

  // Extract nutrition values
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");
  const fiber = getNutrientValue(nutrients, "fiber");
  const sugar = getNutrientValue(nutrients, "sugar");

  // Validate carbs (relaxed)
  const carbsInRange =
    carbs >= requirements.minCarbs && carbs <= requirements.maxCarbs;

  // Validate protein (relaxed)
  const adequateProtein = protein >= requirements.minProtein;

  // Validate fiber (relaxed)
  const adequateFiber = fiber >= requirements.minFiber;

  // Only warn about extreme sugar content
  if (sugar > carbs * 0.7) {
    warnings.push(
      `Very high sugar content: ${sugar}g (${Math.round((sugar / carbs) * 100)}% of carbs)`,
    );
  }

  // Determine overall validity - much more lenient
  const isValid =
    carbsInRange || (adequateProtein && carbs <= requirements.maxCarbs);

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

// Export the original function name for compatibility
export { validateRecipeForGDRelaxed as validateRecipeForGD };
export { GD_REQUIREMENTS_RELAXED as GD_REQUIREMENTS };

/**
 * Calculate carb choices (for diabetes management)
 */
export function calculateCarbChoices(carbs: number): number {
  return Math.round((carbs / 15) * 10) / 10; // Round to 1 decimal place
}

/**
 * Determine if a recipe is suitable for morning
 */
export function isSuitableForMorning(recipe: SpoonacularRecipeInfo): boolean {
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");

  // Relaxed morning criteria
  return carbs <= 35 && protein >= 7;
}

/**
 * Score a recipe for GD suitability (0-100) - more lenient scoring
 */
export function calculateGDScore(
  recipe: SpoonacularRecipeInfo,
  mealType: keyof typeof GD_REQUIREMENTS_RELAXED,
): number {
  const validation = validateRecipeForGDRelaxed(recipe, mealType);
  let score = 100;

  // Smaller deductions
  if (!validation.carbsInRange) score -= 15;
  if (!validation.adequateProtein) score -= 10;
  if (!validation.adequateFiber) score -= 5;

  // Smaller deduction for warnings
  score -= validation.warnings.length * 3;

  // Ensure minimum score
  return Math.max(score, 40);
}
