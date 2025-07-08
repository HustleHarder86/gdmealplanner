/**
 * Meal Plan Algorithm
 * Core algorithm for generating gestational diabetes-compliant meal plans
 */

import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { userPreferenceService } from "./user-preference-service";
import {
  UserPreferences,
  NutritionalTargets,
  DEFAULT_NUTRITIONAL_TARGETS,
} from "@/src/types/user-preferences";
import {
  WeeklyMealPlan,
  DailyMealPlan,
  MealAssignment,
  MealType,
  DayOfWeek,
  MealPlanGenerationOptions,
} from "@/src/types/meal-plan";
import { Recipe } from "@/src/types/recipe";

interface RecipeSelection {
  recipe: Recipe;
  score: number;
  reasons: string[];
}

interface MealTypeConstraints {
  carbsMin: number;
  carbsMax: number;
  minProtein?: number;
  category: string;
  tags?: string[];
}

export class MealPlanAlgorithm {
  private targets: NutritionalTargets;
  private usedRecipeIds: Set<string> = new Set();
  private recentMealHistory: Map<string, Date> = new Map();

  constructor(customTargets?: Partial<NutritionalTargets>) {
    this.targets = { ...DEFAULT_NUTRITIONAL_TARGETS, ...customTargets };
  }

  /**
   * Generate a complete weekly meal plan
   */
  async generateWeeklyPlan(
    userId: string,
    options: MealPlanGenerationOptions,
  ): Promise<WeeklyMealPlan> {
    // Get user preferences
    const preferences =
      (await userPreferenceService.getUserPreferences(userId)) ||
      userPreferenceService.createDefaultPreferences(userId);

    // Initialize tracking
    this.usedRecipeIds.clear();
    this.recentMealHistory.clear();

    // Generate 7 days of meals
    const days: DailyMealPlan[] = [];
    const daysOfWeek: DayOfWeek[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(options.startDate);
      date.setDate(date.getDate() + i);

      const dayPlan = await this.generateDailyPlan(
        date,
        daysOfWeek[i],
        preferences,
        options,
      );

      days.push(dayPlan);
    }

    // Calculate weekly summary
    const summary = this.calculateWeeklySummary(days);

    // Create the weekly plan
    const weeklyPlan: WeeklyMealPlan = {
      userId,
      weekStartDate: options.startDate,
      days,
      summary,
      customizations: [],
      generatedAt: new Date(),
      basedOnPreferencesVersion: preferences.id,
      status: "draft",
    };

    return weeklyPlan;
  }

  /**
   * Generate a single day's meal plan
   */
  private async generateDailyPlan(
    date: Date,
    dayOfWeek: DayOfWeek,
    preferences: UserPreferences,
    options: MealPlanGenerationOptions,
  ): Promise<DailyMealPlan> {
    const meals: MealAssignment[] = [];

    // Define meal constraints based on medical guidelines
    const mealConstraints: Record<MealType, MealTypeConstraints> = {
      breakfast: {
        carbsMin: this.targets.breakfast.carbsMin,
        carbsMax: this.targets.breakfast.carbsMax,
        category: "breakfast",
        tags: options.quickBreakfasts ? ["quick", "easy"] : undefined,
      },
      morningSnack: {
        carbsMin: this.targets.snack.carbsMin,
        carbsMax: this.targets.snack.carbsMax,
        category: "snack",
        tags: ["morning-snack", "fruit", "yogurt"],
      },
      lunch: {
        carbsMin: this.targets.lunch.carbsMin,
        carbsMax: this.targets.lunch.carbsMax,
        category: "lunch",
      },
      afternoonSnack: {
        carbsMin: this.targets.snack.carbsMin,
        carbsMax: this.targets.snack.carbsMax,
        category: "snack",
        tags: ["afternoon-snack", "savory", "protein"],
      },
      dinner: {
        carbsMin: this.targets.dinner.carbsMin,
        carbsMax: this.targets.dinner.carbsMax,
        category: "dinner",
      },
      eveningSnack: {
        carbsMin: this.targets.bedtimeSnack.carbsMin,
        carbsMax: this.targets.bedtimeSnack.carbsMax,
        minProtein: this.targets.bedtimeSnack.minProtein,
        category: "snack",
        tags: ["bedtime-snack", "protein"],
      },
    };

    // Select recipes for each meal
    for (const [mealType, constraints] of Object.entries(mealConstraints)) {
      const recipe = await this.selectRecipeForMeal(
        mealType as MealType,
        constraints,
        preferences,
        options,
      );

      if (recipe) {
        meals.push({
          mealType: mealType as MealType,
          recipeId: recipe.id,
          recipe,
          servings: 1,
          notes: recipe.gdValidation?.warnings?.join(", "),
        });

        // Track recipe usage
        this.usedRecipeIds.add(recipe.id);
        this.recentMealHistory.set(recipe.id, date);
      }
    }

    // Calculate daily nutrition
    const nutrition = this.calculateDailyNutrition(meals);

    // Generate prep notes
    const prepNotes = this.generatePrepNotes(meals, options.mealPrepFriendly);

    return {
      date,
      dayOfWeek,
      meals,
      nutrition,
      prepNotes,
    };
  }

  /**
   * Select the best recipe for a specific meal
   */
  private async selectRecipeForMeal(
    mealType: MealType,
    constraints: MealTypeConstraints,
    preferences: UserPreferences,
    options: MealPlanGenerationOptions,
  ): Promise<Recipe | null> {
    // Get candidate recipes
    let candidates = LocalRecipeService.getRecipesByCategory(
      constraints.category,
    );

    // Apply nutritional constraints
    candidates = candidates.filter(
      (recipe) =>
        recipe.nutrition.carbohydrates >= constraints.carbsMin &&
        recipe.nutrition.carbohydrates <= constraints.carbsMax &&
        (!constraints.minProtein ||
          recipe.nutrition.protein >= constraints.minProtein),
    );

    // Apply user preferences
    candidates = candidates.filter((recipe) => {
      // Check dietary restrictions
      if (
        !userPreferenceService.recipeMatchesDietaryRestrictions(
          recipe,
          preferences.dietaryRestrictions,
        )
      ) {
        return false;
      }

      // Check allergens
      if (
        userPreferenceService.recipeContainsAllergens(
          recipe,
          preferences.allergens,
        )
      ) {
        return false;
      }

      // Check disliked ingredients
      if (
        userPreferenceService.recipeContainsDislikedIngredients(
          recipe,
          preferences.dislikedIngredients,
        )
      ) {
        return false;
      }

      // Check if recipe was recently used
      if (this.wasRecentlyUsed(recipe.id, preferences.avoidRepeatDays)) {
        return false;
      }

      return true;
    });

    // Apply tag filters if specified
    if (constraints.tags && constraints.tags.length > 0) {
      const taggedCandidates = candidates.filter((recipe) =>
        constraints.tags!.some((tag) => recipe.tags.includes(tag)),
      );
      // Use tagged candidates if available, otherwise fall back to all candidates
      if (taggedCandidates.length > 0) {
        candidates = taggedCandidates;
      }
    }

    // Score and rank candidates
    const scoredCandidates = candidates.map((recipe) =>
      this.scoreRecipe(recipe, mealType, preferences, options),
    );

    // Sort by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Return the top recipe
    return scoredCandidates[0]?.recipe || null;
  }

  /**
   * Score a recipe based on multiple factors
   */
  private scoreRecipe(
    recipe: Recipe,
    mealType: MealType,
    preferences: UserPreferences,
    options: MealPlanGenerationOptions,
  ): RecipeSelection {
    let score = 0;
    const reasons: string[] = [];

    // Base preference score (0-100)
    const preferenceScore = userPreferenceService.calculatePreferenceScore(
      recipe,
      preferences,
    );
    score += preferenceScore;
    reasons.push(`Preference match: ${preferenceScore}%`);

    // Nutritional fit score (0-50)
    const nutritionalScore = this.calculateNutritionalScore(recipe, mealType);
    score += nutritionalScore;
    reasons.push(`Nutritional fit: ${nutritionalScore}/50`);

    // Variety score (0-30)
    const varietyScore = this.calculateVarietyScore(recipe);
    score += varietyScore;
    reasons.push(`Variety: ${varietyScore}/30`);

    // Complexity balance (0-20)
    const complexityScore = this.calculateComplexityScore(recipe, preferences);
    score += complexityScore;
    reasons.push(`Complexity match: ${complexityScore}/20`);

    // Special bonuses
    if (options.mealPrepFriendly && recipe.tags.includes("meal-prep")) {
      score += 10;
      reasons.push("Meal prep friendly: +10");
    }

    if (options.budgetLimit && recipe.tags.includes("budget-friendly")) {
      score += 10;
      reasons.push("Budget friendly: +10");
    }

    // GD validation score
    if (recipe.gdValidation?.isValid) {
      score += recipe.gdValidation.score * 0.2; // Up to 20 points
      reasons.push(`GD compliance: ${recipe.gdValidation.score}/100`);
    }

    return { recipe, score, reasons };
  }

  /**
   * Calculate nutritional score for a recipe
   */
  private calculateNutritionalScore(
    recipe: Recipe,
    mealType: MealType,
  ): number {
    let score = 50; // Start with full score

    const nutrition = recipe.nutrition;

    // Protein balance
    if (mealType === "eveningSnack") {
      // Bedtime snack needs protein
      if (nutrition.protein < this.targets.bedtimeSnack.minProtein) {
        score -= 25;
      }
    } else if (nutrition.protein >= 10) {
      // Good protein content for other meals
      score += 0; // No penalty
    } else {
      score -= 10;
    }

    // Fiber content
    if (nutrition.fiber >= 5) {
      score += 0; // Good fiber
    } else if (nutrition.fiber >= 3) {
      score -= 5; // Moderate fiber
    } else {
      score -= 10; // Low fiber
    }

    // Fat balance (should be present but not excessive)
    const fatCalories = nutrition.fat * 9;
    const totalCalories = nutrition.calories;
    const fatPercentage = (fatCalories / totalCalories) * 100;

    if (fatPercentage >= 20 && fatPercentage <= 35) {
      score += 0; // Good fat balance
    } else {
      score -= 10;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate variety score based on recent usage
   */
  private calculateVarietyScore(recipe: Recipe): number {
    // Check if this recipe was used recently
    const lastUsed = this.recentMealHistory.get(recipe.id);
    if (!lastUsed) return 30; // Full score for never used

    const daysSinceUsed = Math.floor(
      (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceUsed >= 7) return 30;
    if (daysSinceUsed >= 5) return 20;
    if (daysSinceUsed >= 3) return 10;
    return 0;
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(
    recipe: Recipe,
    preferences: UserPreferences,
  ): number {
    const recipeTime = recipe.totalTime;
    const preferredTime = preferences.preferredCookingTime;

    // Map preference to minutes
    const timePreferences: Record<string, number> = {
      "under-15": 15,
      "under-30": 30,
      "under-45": 45,
      "under-60": 60,
      any: 120,
    };

    const maxTime = timePreferences[preferredTime] || 60;

    if (recipeTime <= maxTime) {
      // Within preference
      if (recipeTime <= maxTime * 0.5) {
        return 20; // Much faster than preference
      }
      return 15; // Within preference
    } else if (recipeTime <= maxTime * 1.5) {
      return 10; // Slightly over preference
    } else {
      return 0; // Too long
    }
  }

  /**
   * Check if a recipe was recently used
   */
  private wasRecentlyUsed(recipeId: string, avoidDays: number): boolean {
    const lastUsed = this.recentMealHistory.get(recipeId);
    if (!lastUsed) return false;

    const daysSinceUsed = Math.floor(
      (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceUsed < avoidDays;
  }

  /**
   * Calculate daily nutrition totals
   */
  private calculateDailyNutrition(
    meals: MealAssignment[],
  ): DailyMealPlan["nutrition"] {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const carbDistribution: Record<MealType, number> = {
      breakfast: 0,
      morningSnack: 0,
      lunch: 0,
      afternoonSnack: 0,
      dinner: 0,
      eveningSnack: 0,
    };

    for (const meal of meals) {
      if (meal.recipe) {
        const nutrition = meal.recipe.nutrition;
        const servings = meal.servings;

        totalCalories += nutrition.calories * servings;
        totalCarbs += nutrition.carbohydrates * servings;
        totalProtein += nutrition.protein * servings;
        totalFat += nutrition.fat * servings;
        totalFiber += nutrition.fiber * servings;

        carbDistribution[meal.mealType] = nutrition.carbohydrates * servings;
      }
    }

    return {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      totalFiber,
      carbDistribution,
    };
  }

  /**
   * Generate prep notes for the day
   */
  private generatePrepNotes(
    meals: MealAssignment[],
    mealPrepFriendly?: boolean,
  ): string[] {
    const notes: string[] = [];

    // Find common ingredients
    const ingredientMap = new Map<string, string[]>();

    for (const meal of meals) {
      if (meal.recipe) {
        for (const ingredient of meal.recipe.ingredients) {
          const key = ingredient.name.toLowerCase();
          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, []);
          }
          ingredientMap.get(key)!.push(meal.recipe.title);
        }
      }
    }

    // Note shared ingredients
    for (const [ingredient, recipes] of ingredientMap.entries()) {
      if (recipes.length > 1) {
        notes.push(`${ingredient} is used in: ${recipes.join(", ")}`);
      }
    }

    // Note prep-ahead opportunities
    if (mealPrepFriendly) {
      const prepAheadMeals = meals.filter(
        (m) => m.recipe && m.recipe.tags.includes("meal-prep"),
      );

      if (prepAheadMeals.length > 0) {
        notes.push(
          `Can prep ahead: ${prepAheadMeals.map((m) => m.recipe!.title).join(", ")}`,
        );
      }
    }

    // Note quick meals
    const quickMeals = meals.filter(
      (m) => m.recipe && m.recipe.totalTime <= 15,
    );

    if (quickMeals.length > 0) {
      notes.push(
        `Quick meals (≤15 min): ${quickMeals.map((m) => m.recipe!.title).join(", ")}`,
      );
    }

    return notes;
  }

  /**
   * Calculate weekly summary statistics
   */
  private calculateWeeklySummary(
    days: DailyMealPlan[],
  ): WeeklyMealPlan["summary"] {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalPrepTime = 0;
    const uniqueRecipes = new Set<string>();

    for (const day of days) {
      totalCalories += day.nutrition.totalCalories;
      totalCarbs += day.nutrition.totalCarbs;
      totalProtein += day.nutrition.totalProtein;
      totalFat += day.nutrition.totalFat;
      totalFiber += day.nutrition.totalFiber;

      for (const meal of day.meals) {
        if (meal.recipe) {
          uniqueRecipes.add(meal.recipeId);
          totalPrepTime += meal.recipe.totalTime;
        }
      }
    }

    const dayCount = days.length || 1;

    return {
      avgDailyCalories: Math.round(totalCalories / dayCount),
      avgDailyCarbs: Math.round(totalCarbs / dayCount),
      avgDailyProtein: Math.round(totalProtein / dayCount),
      avgDailyFat: Math.round(totalFat / dayCount),
      avgDailyFiber: Math.round(totalFiber / dayCount),
      totalUniqueRecipes: uniqueRecipes.size,
      totalPrepTime,
    };
  }
}

// Export singleton instance
export const mealPlanAlgorithm = new MealPlanAlgorithm();
