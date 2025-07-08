/**
 * Meal plan types for gestational diabetes management
 */

import { Recipe } from "./recipe";

export type MealType =
  | "breakfast"
  | "morningSnack"
  | "lunch"
  | "afternoonSnack"
  | "dinner"
  | "eveningSnack";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface MealAssignment {
  mealType: MealType;
  recipeId: string;
  recipe?: Recipe; // Populated when loaded
  servings: number;
  notes?: string;
}

export interface DailyMealPlan {
  date: Date;
  dayOfWeek: DayOfWeek;
  meals: MealAssignment[];

  // Daily nutrition summary
  nutrition: {
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    totalFiber: number;
    carbDistribution: {
      breakfast: number;
      morningSnack: number;
      lunch: number;
      afternoonSnack: number;
      dinner: number;
      eveningSnack: number;
    };
  };

  // Prep notes
  prepNotes?: string[];

  // User feedback
  completed?: boolean;
  rating?: number; // 1-5
  notes?: string;
}

export interface WeeklyMealPlan {
  id?: string;
  userId: string;
  weekStartDate: Date;

  // 7 days of meals
  days: DailyMealPlan[];

  // Weekly summary
  summary: {
    avgDailyCalories: number;
    avgDailyCarbs: number;
    avgDailyProtein: number;
    avgDailyFat: number;
    avgDailyFiber: number;

    totalUniqueRecipes: number;
    totalPrepTime: number;
    estimatedCost?: number;
  };

  // User customizations
  customizations: MealCustomization[];

  // Metadata
  generatedAt: Date;
  lastModified?: Date;
  basedOnPreferencesVersion?: string;

  // Status
  status: "draft" | "active" | "completed" | "archived";
}

export interface MealCustomization {
  dayIndex: number;
  mealType: MealType;
  originalRecipeId: string;
  newRecipeId: string;
  reason?: string;
  customizedAt: Date;
}

export interface MealPlanGenerationOptions {
  startDate: Date;
  userPreferencesId: string;

  // Optional constraints
  reuseRecipesFromPlanId?: string; // Copy recipes from another plan
  excludeRecipeIds?: string[]; // Don't use these recipes
  includeFavorites?: boolean; // Prioritize favorite recipes

  // Meal complexity distribution
  complexityDistribution?: {
    simple: number; // percentage
    moderate: number;
    complex: number;
  };

  // Special requirements
  quickBreakfasts?: boolean; // All breakfasts under 15 min
  mealPrepFriendly?: boolean; // Optimize for batch cooking
  budgetLimit?: number; // Target cost per week
}

export interface MealSwapOptions {
  planId: string;
  dayIndex: number;
  mealType: MealType;

  // Constraints for the new recipe
  maintainNutrition?: boolean; // Keep similar carb/protein levels
  maintainComplexity?: boolean; // Keep similar prep time
  excludeCurrentRecipe?: boolean; // Don't suggest the same recipe
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;

  // Template meals (recipe IDs)
  meals: {
    [key in DayOfWeek]: {
      [key in MealType]: string;
    };
  };

  // Metadata
  tags: string[];
  season?: "spring" | "summer" | "fall" | "winter" | "any";
  createdBy: "system" | "user";
  createdAt: Date;

  // Usage stats
  timesUsed?: number;
  avgRating?: number;
}

export interface MealPlanRating {
  planId: string;
  userId: string;

  overallRating: number; // 1-5

  // Detailed ratings
  varietyRating: number;
  tasteRating: number;
  easeOfPrepRating: number;
  glucoseControlRating: number;

  // Feedback
  favoriteRecipes: string[];
  dislikedRecipes: string[];
  comments?: string;

  wouldUseAgain: boolean;

  createdAt: Date;
}
