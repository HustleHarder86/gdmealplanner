/**
 * Nutrition Calculator Utilities
 * Helper functions for nutritional calculations and validations
 */

import { Recipe } from "@/src/types/recipe";
import { DailyMealPlan, MealAssignment } from "@/src/types/meal-plan";
import {
  NutritionalTargets,
  DEFAULT_NUTRITIONAL_TARGETS,
} from "@/src/types/user-preferences";

export class NutritionCalculator {
  /**
   * Calculate total nutrition for a set of meals
   */
  static calculateTotalNutrition(meals: MealAssignment[]): {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
    fiber: number;
    sodium?: number;
  } {
    const totals = {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
    };

    for (const meal of meals) {
      if (meal.recipe) {
        const nutrition = meal.recipe.nutrition;
        const servings = meal.servings || 1;

        totals.calories += nutrition.calories * servings;
        totals.carbohydrates += nutrition.carbohydrates * servings;
        totals.protein += nutrition.protein * servings;
        totals.fat += nutrition.fat * servings;
        totals.fiber += nutrition.fiber * servings;

        if (nutrition.sodium) {
          totals.sodium += nutrition.sodium * servings;
        }
      }
    }

    return totals;
  }

  /**
   * Calculate macronutrient percentages
   */
  static calculateMacroPercentages(nutrition: {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
  }): {
    carbsPercentage: number;
    proteinPercentage: number;
    fatPercentage: number;
  } {
    const carbCalories = nutrition.carbohydrates * 4;
    const proteinCalories = nutrition.protein * 4;
    const fatCalories = nutrition.fat * 9;

    const totalCalories =
      nutrition.calories || carbCalories + proteinCalories + fatCalories;

    return {
      carbsPercentage: Math.round((carbCalories / totalCalories) * 100),
      proteinPercentage: Math.round((proteinCalories / totalCalories) * 100),
      fatPercentage: Math.round((fatCalories / totalCalories) * 100),
    };
  }

  /**
   * Validate daily meal plan against GD targets
   */
  static validateDailyPlan(
    dailyPlan: DailyMealPlan,
    targets: NutritionalTargets = DEFAULT_NUTRITIONAL_TARGETS,
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    const nutrition = dailyPlan.nutrition;
    const carbDist = nutrition.carbDistribution;

    // Check total daily carbs
    if (nutrition.totalCarbs < targets.dailyCarbs.min) {
      errors.push(
        `Daily carbs too low: ${nutrition.totalCarbs}g (minimum: ${targets.dailyCarbs.min}g)`,
      );
    } else if (nutrition.totalCarbs > targets.dailyCarbs.max) {
      warnings.push(
        `Daily carbs high: ${nutrition.totalCarbs}g (maximum: ${targets.dailyCarbs.max}g)`,
      );
    }

    // Check meal-specific carb distribution
    if (carbDist.breakfast < targets.breakfast.carbsMin) {
      errors.push(
        `Breakfast carbs too low: ${carbDist.breakfast}g (minimum: ${targets.breakfast.carbsMin}g)`,
      );
    } else if (carbDist.breakfast > targets.breakfast.carbsMax) {
      warnings.push(
        `Breakfast carbs high: ${carbDist.breakfast}g (maximum: ${targets.breakfast.carbsMax}g)`,
      );
    }

    if (carbDist.lunch < targets.lunch.carbsMin) {
      errors.push(
        `Lunch carbs too low: ${carbDist.lunch}g (minimum: ${targets.lunch.carbsMin}g)`,
      );
    } else if (carbDist.lunch > targets.lunch.carbsMax) {
      warnings.push(
        `Lunch carbs high: ${carbDist.lunch}g (maximum: ${targets.lunch.carbsMax}g)`,
      );
    }

    if (carbDist.dinner < targets.dinner.carbsMin) {
      errors.push(
        `Dinner carbs too low: ${carbDist.dinner}g (minimum: ${targets.dinner.carbsMin}g)`,
      );
    } else if (carbDist.dinner > targets.dinner.carbsMax) {
      warnings.push(
        `Dinner carbs high: ${carbDist.dinner}g (maximum: ${targets.dinner.carbsMax}g)`,
      );
    }

    // Check snacks
    const snackMeals = ["morningSnack", "afternoonSnack"] as const;
    for (const snack of snackMeals) {
      const snackCarbs = carbDist[snack];
      if (snackCarbs < targets.snack.carbsMin) {
        warnings.push(
          `${snack} carbs low: ${snackCarbs}g (recommended: ${targets.snack.carbsMin}-${targets.snack.carbsMax}g)`,
        );
      } else if (snackCarbs > targets.snack.carbsMax) {
        warnings.push(
          `${snack} carbs high: ${snackCarbs}g (maximum: ${targets.snack.carbsMax}g)`,
        );
      }
    }

    // Check bedtime snack
    if (carbDist.eveningSnack < targets.bedtimeSnack.carbsMin) {
      errors.push(
        `Bedtime snack carbs too low: ${carbDist.eveningSnack}g (minimum: ${targets.bedtimeSnack.carbsMin}g)`,
      );
    } else if (carbDist.eveningSnack > targets.bedtimeSnack.carbsMax) {
      warnings.push(
        `Bedtime snack carbs high: ${carbDist.eveningSnack}g (maximum: ${targets.bedtimeSnack.carbsMax}g)`,
      );
    }

    // Check bedtime snack protein
    const bedtimeSnack = dailyPlan.meals.find(
      (m) => m.mealType === "eveningSnack",
    );
    if (
      bedtimeSnack?.recipe &&
      bedtimeSnack.recipe.nutrition.protein < targets.bedtimeSnack.minProtein
    ) {
      errors.push(
        `Bedtime snack needs more protein: ${bedtimeSnack.recipe.nutrition.protein}g (minimum: ${targets.bedtimeSnack.minProtein}g)`,
      );
    }

    // Check fiber
    if (nutrition.totalFiber < targets.dailyFiber.min) {
      warnings.push(
        `Daily fiber low: ${nutrition.totalFiber}g (recommended: ${targets.dailyFiber.min}g)`,
      );
    }

    // Check macronutrient balance
    const macros = this.calculateMacroPercentages(nutrition);

    if (macros.proteinPercentage < targets.dailyProtein.minPercentage) {
      warnings.push(
        `Protein percentage low: ${macros.proteinPercentage}% (recommended: ${targets.dailyProtein.minPercentage}-${targets.dailyProtein.maxPercentage}%)`,
      );
    }

    if (macros.fatPercentage < targets.dailyFat.minPercentage) {
      warnings.push(
        `Fat percentage low: ${macros.fatPercentage}% (recommended: ${targets.dailyFat.minPercentage}-${targets.dailyFat.maxPercentage}%)`,
      );
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    };
  }

  /**
   * Calculate carb to protein ratio (important for GD management)
   */
  static calculateCarbToProteinRatio(recipe: Recipe): number {
    if (recipe.nutrition.protein === 0) return Infinity;
    return recipe.nutrition.carbohydrates / recipe.nutrition.protein;
  }

  /**
   * Calculate glycemic load estimate (simplified)
   */
  static estimateGlycemicLoad(recipe: Recipe): "low" | "medium" | "high" {
    const carbs = recipe.nutrition.carbohydrates;
    const fiber = recipe.nutrition.fiber;
    const protein = recipe.nutrition.protein;
    const fat = recipe.nutrition.fat;

    // Simplified GL estimation based on macronutrient balance
    const netCarbs = carbs - fiber * 0.5; // Fiber reduces GL
    const proteinFatBalance = (protein + fat) / carbs;

    if (netCarbs < 10 || proteinFatBalance > 1) {
      return "low";
    } else if (netCarbs < 20 || proteinFatBalance > 0.5) {
      return "medium";
    } else {
      return "high";
    }
  }

  /**
   * Check if recipe is suitable for a specific meal type
   */
  static isRecipeSuitableForMealType(
    recipe: Recipe,
    mealType: string,
    targets: NutritionalTargets = DEFAULT_NUTRITIONAL_TARGETS,
  ): boolean {
    const carbs = recipe.nutrition.carbohydrates;

    switch (mealType) {
      case "breakfast":
        return (
          carbs >= targets.breakfast.carbsMin &&
          carbs <= targets.breakfast.carbsMax
        );

      case "lunch":
        return (
          carbs >= targets.lunch.carbsMin && carbs <= targets.lunch.carbsMax
        );

      case "dinner":
        return (
          carbs >= targets.dinner.carbsMin && carbs <= targets.dinner.carbsMax
        );

      case "morningSnack":
      case "afternoonSnack":
        return (
          carbs >= targets.snack.carbsMin && carbs <= targets.snack.carbsMax
        );

      case "eveningSnack":
        return (
          carbs >= targets.bedtimeSnack.carbsMin &&
          carbs <= targets.bedtimeSnack.carbsMax &&
          recipe.nutrition.protein >= targets.bedtimeSnack.minProtein
        );

      default:
        return true;
    }
  }

  /**
   * Calculate nutrition score for GD management (0-100)
   */
  static calculateGDScore(recipe: Recipe): number {
    let score = 100;

    // Carb to protein ratio (ideal is 2:1 or lower)
    const carbProteinRatio = this.calculateCarbToProteinRatio(recipe);
    if (carbProteinRatio > 4) {
      score -= 20;
    } else if (carbProteinRatio > 3) {
      score -= 10;
    }

    // Fiber content (higher is better)
    const fiberPerServing = recipe.nutrition.fiber;
    if (fiberPerServing >= 5) {
      score += 0; // No penalty
    } else if (fiberPerServing >= 3) {
      score -= 5;
    } else {
      score -= 10;
    }

    // Glycemic load estimate
    const gl = this.estimateGlycemicLoad(recipe);
    if (gl === "high") {
      score -= 15;
    } else if (gl === "medium") {
      score -= 5;
    }

    // Sugar content (if available)
    if (recipe.nutrition.sugar) {
      const sugarPercentage =
        (recipe.nutrition.sugar / recipe.nutrition.carbohydrates) * 100;
      if (sugarPercentage > 50) {
        score -= 20;
      } else if (sugarPercentage > 30) {
        score -= 10;
      }
    }

    // Healthy fat presence
    const fatCalories = recipe.nutrition.fat * 9;
    const totalCalories = recipe.nutrition.calories;
    const fatPercentage = (fatCalories / totalCalories) * 100;

    if (fatPercentage >= 20 && fatPercentage <= 35) {
      score += 0; // Good fat balance
    } else if (fatPercentage < 20) {
      score -= 5; // Too low fat
    } else {
      score -= 10; // Too high fat
    }

    return Math.max(0, Math.min(100, score));
  }
}

export default NutritionCalculator;
