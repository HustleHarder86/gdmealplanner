/**
 * Meal Plan Validator
 * Validates meal plans against medical guidelines and user preferences
 */

import { WeeklyMealPlan, DailyMealPlan } from "@/src/types/meal-plan";
import {
  NutritionalTargets,
  DEFAULT_NUTRITIONAL_TARGETS,
} from "@/src/types/user-preferences";
import { NutritionCalculator } from "./nutrition-calculator";

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  type: "nutrition" | "medical" | "preference" | "structure";
  severity: "error" | "critical";
  message: string;
  details?: any;
}

export interface ValidationWarning {
  type: "nutrition" | "variety" | "balance" | "preparation";
  message: string;
  details?: any;
}

export class MealPlanValidator {
  private targets: NutritionalTargets;

  constructor(customTargets?: Partial<NutritionalTargets>) {
    this.targets = { ...DEFAULT_NUTRITIONAL_TARGETS, ...customTargets };
  }

  /**
   * Validate a complete weekly meal plan
   */
  validateWeeklyPlan(plan: WeeklyMealPlan): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;

    // Validate each day
    const dailyResults = plan.days.map((day) => this.validateDailyPlan(day));

    // Aggregate daily validation results
    for (const result of dailyResults) {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      suggestions.push(...result.suggestions);
      totalScore += result.score;
    }

    // Weekly-level validations
    this.validateWeeklyVariety(plan, warnings, suggestions);
    this.validateWeeklyBalance(plan, warnings, suggestions);
    this.validatePrepComplexity(plan, warnings, suggestions);

    // Calculate final score
    const avgDailyScore = totalScore / plan.days.length;
    const varietyPenalty = this.calculateVarietyPenalty(plan);
    const finalScore = Math.max(0, avgDailyScore - varietyPenalty);

    return {
      isValid: errors.length === 0,
      score: Math.round(finalScore),
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate a single day's meal plan
   */
  validateDailyPlan(day: DailyMealPlan): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check meal structure
    const mealTypes = new Set(day.meals.map((m) => m.mealType));
    const requiredMeals = [
      "breakfast",
      "lunch",
      "dinner",
      "morningSnack",
      "afternoonSnack",
      "eveningSnack",
    ];

    for (const required of requiredMeals) {
      if (!mealTypes.has(required as any)) {
        errors.push({
          type: "structure",
          severity: "error",
          message: `Missing required meal: ${required}`,
        });
        score -= 10;
      }
    }

    // Validate nutrition
    const nutritionResult = NutritionCalculator.validateDailyPlan(
      day,
      this.targets,
    );

    // Convert nutrition validation to our format
    for (const error of nutritionResult.errors) {
      errors.push({
        type: "nutrition",
        severity: "error",
        message: error,
      });
      score -= 5;
    }

    for (const warning of nutritionResult.warnings) {
      warnings.push({
        type: "nutrition",
        message: warning,
      });
      score -= 2;
    }

    // Check meal spacing and timing
    this.validateMealTiming(day, warnings, suggestions);

    // Check nutritional balance within meals
    this.validateMealBalance(day, warnings, suggestions);

    // Ensure bedtime snack has protein
    const bedtimeSnack = day.meals.find((m) => m.mealType === "eveningSnack");
    if (bedtimeSnack?.recipe) {
      const protein = bedtimeSnack.recipe.nutrition.protein;
      if (protein < this.targets.bedtimeSnack.minProtein) {
        errors.push({
          type: "medical",
          severity: "critical",
          message: `Bedtime snack protein too low: ${protein}g (minimum: ${this.targets.bedtimeSnack.minProtein}g)`,
          details: {
            actual: protein,
            required: this.targets.bedtimeSnack.minProtein,
          },
        });
        score -= 10;
      }
    }

    return {
      isValid: errors.length === 0,
      score: Math.max(0, score),
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Validate meal timing and spacing
   */
  private validateMealTiming(
    day: DailyMealPlan,
    warnings: ValidationWarning[],
    suggestions: string[],
  ): void {
    // Check if meals are properly distributed
    const mealOrder = [
      "breakfast",
      "morningSnack",
      "lunch",
      "afternoonSnack",
      "dinner",
      "eveningSnack",
    ];
    const meals = day.meals.sort(
      (a, b) => mealOrder.indexOf(a.mealType) - mealOrder.indexOf(b.mealType),
    );

    // Ensure carbs are distributed throughout the day
    let lastMealCarbs = 0;
    let carbGaps = 0;

    for (const meal of meals) {
      if (meal.recipe) {
        const carbs = meal.recipe.nutrition.carbohydrates;

        // Check for large carb gaps
        if (lastMealCarbs > 0 && Math.abs(carbs - lastMealCarbs) > 30) {
          carbGaps++;
        }

        lastMealCarbs = carbs;
      }
    }

    if (carbGaps > 2) {
      warnings.push({
        type: "balance",
        message: "Large variations in carbohydrate distribution between meals",
      });
      suggestions.push(
        "Try to distribute carbohydrates more evenly throughout the day",
      );
    }
  }

  /**
   * Validate nutritional balance within meals
   */
  private validateMealBalance(
    day: DailyMealPlan,
    warnings: ValidationWarning[],
    suggestions: string[],
  ): void {
    for (const meal of day.meals) {
      if (meal.recipe) {
        const gdScore = NutritionCalculator.calculateGDScore(meal.recipe);

        if (gdScore < 60) {
          warnings.push({
            type: "nutrition",
            message: `${meal.recipe.title} has low GD compliance score: ${gdScore}/100`,
            details: { meal: meal.mealType, score: gdScore },
          });

          // Provide specific suggestions
          const ratio = NutritionCalculator.calculateCarbToProteinRatio(
            meal.recipe,
          );
          if (ratio > 3) {
            suggestions.push(
              `Consider adding protein to ${meal.recipe.title} to improve blood sugar control`,
            );
          }

          if (meal.recipe.nutrition.fiber < 3) {
            suggestions.push(
              `${meal.recipe.title} is low in fiber - consider adding vegetables or whole grains`,
            );
          }
        }
      }
    }
  }

  /**
   * Validate weekly variety
   */
  private validateWeeklyVariety(
    plan: WeeklyMealPlan,
    warnings: ValidationWarning[],
    suggestions: string[],
  ): void {
    const recipeFrequency = new Map<string, number>();

    // Count recipe frequency
    for (const day of plan.days) {
      for (const meal of day.meals) {
        const count = recipeFrequency.get(meal.recipeId) || 0;
        recipeFrequency.set(meal.recipeId, count + 1);
      }
    }

    // Check for overused recipes
    const overusedRecipes: string[] = [];
    for (const [recipeId, count] of recipeFrequency) {
      if (count > 3) {
        const recipe = plan.days[0].meals.find(
          (m) => m.recipeId === recipeId,
        )?.recipe;
        if (recipe) {
          overusedRecipes.push(recipe.title);
        }
      }
    }

    if (overusedRecipes.length > 0) {
      warnings.push({
        type: "variety",
        message: `Some recipes appear too frequently: ${overusedRecipes.join(", ")}`,
        details: { overusedRecipes },
      });
      suggestions.push("Consider adding more variety to prevent meal fatigue");
    }

    // Check category variety
    const categoryCount = new Map<string, number>();
    for (const day of plan.days) {
      for (const meal of day.meals) {
        if (meal.recipe) {
          const count = categoryCount.get(meal.recipe.category) || 0;
          categoryCount.set(meal.recipe.category, count + 1);
        }
      }
    }
  }

  /**
   * Validate weekly nutritional balance
   */
  private validateWeeklyBalance(
    plan: WeeklyMealPlan,
    warnings: ValidationWarning[],
    suggestions: string[],
  ): void {
    const summary = plan.summary;

    // Check average daily carbs
    if (summary.avgDailyCarbs < this.targets.dailyCarbs.min) {
      warnings.push({
        type: "nutrition",
        message: `Average daily carbs too low: ${summary.avgDailyCarbs}g (minimum: ${this.targets.dailyCarbs.min}g)`,
      });
      suggestions.push(
        "Consider adding more whole grains or starchy vegetables to meet carbohydrate targets",
      );
    }

    // Check fiber
    if (summary.avgDailyFiber < this.targets.dailyFiber.min) {
      warnings.push({
        type: "nutrition",
        message: `Average daily fiber low: ${summary.avgDailyFiber}g (recommended: ${this.targets.dailyFiber.min}g)`,
      });
      suggestions.push(
        "Add more vegetables, fruits, whole grains, and legumes to increase fiber intake",
      );
    }

    // Check protein balance
    const avgProteinCalories = summary.avgDailyProtein * 4;
    const proteinPercentage =
      (avgProteinCalories / summary.avgDailyCalories) * 100;

    if (proteinPercentage < this.targets.dailyProtein.minPercentage) {
      warnings.push({
        type: "nutrition",
        message: `Protein percentage low: ${Math.round(proteinPercentage)}% (recommended: ${this.targets.dailyProtein.minPercentage}-${this.targets.dailyProtein.maxPercentage}%)`,
      });
      suggestions.push(
        "Include lean proteins like chicken, fish, tofu, or legumes with each meal",
      );
    }
  }

  /**
   * Validate meal prep complexity
   */
  private validatePrepComplexity(
    plan: WeeklyMealPlan,
    warnings: ValidationWarning[],
    suggestions: string[],
  ): void {
    let totalPrepTime = 0;
    let complexMealCount = 0;
    const dailyPrepTimes: number[] = [];

    for (const day of plan.days) {
      let dayPrepTime = 0;

      for (const meal of day.meals) {
        if (meal.recipe) {
          dayPrepTime += meal.recipe.totalTime;
          totalPrepTime += meal.recipe.totalTime;

          if (meal.recipe.totalTime > 45) {
            complexMealCount++;
          }
        }
      }

      dailyPrepTimes.push(dayPrepTime);
    }

    // Check if any day has excessive prep time
    const maxDailyPrep = Math.max(...dailyPrepTimes);
    if (maxDailyPrep > 180) {
      // 3 hours
      warnings.push({
        type: "preparation",
        message: "Some days require over 3 hours of cooking time",
        details: { maxDailyPrep },
      });
      suggestions.push(
        "Consider meal prepping on weekends or using quick recipes on busy days",
      );
    }

    // Check complex meal distribution
    if (complexMealCount > plan.days.length * 2) {
      warnings.push({
        type: "preparation",
        message: "Many complex recipes requiring significant preparation time",
      });
      suggestions.push(
        "Balance complex recipes with simpler options for sustainability",
      );
    }
  }

  /**
   * Calculate variety penalty for the weekly plan
   */
  private calculateVarietyPenalty(plan: WeeklyMealPlan): number {
    const recipeFrequency = new Map<string, number>();
    let penalty = 0;

    // Count recipe frequency
    for (const day of plan.days) {
      for (const meal of day.meals) {
        const count = recipeFrequency.get(meal.recipeId) || 0;
        recipeFrequency.set(meal.recipeId, count + 1);
      }
    }

    // Apply penalties for overuse
    for (const count of recipeFrequency.values()) {
      if (count > 3) {
        penalty += (count - 3) * 5; // 5 points per extra occurrence
      }
    }

    return penalty;
  }
}

export default MealPlanValidator;
