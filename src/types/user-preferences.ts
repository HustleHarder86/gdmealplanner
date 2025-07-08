/**
 * User preference types for meal planning
 */

export type DietaryRestriction =
  | "vegetarian"
  | "vegan"
  | "gluten-free"
  | "dairy-free"
  | "nut-free"
  | "shellfish-free"
  | "egg-free"
  | "soy-free"
  | "pescatarian"
  | "low-sodium"
  | "kosher"
  | "halal";

export type Allergen =
  | "milk"
  | "eggs"
  | "fish"
  | "shellfish"
  | "tree-nuts"
  | "peanuts"
  | "wheat"
  | "soybeans"
  | "sesame";

export type CookingTime =
  | "under-15"
  | "under-30"
  | "under-45"
  | "under-60"
  | "any";

export type MealComplexity = "simple" | "moderate" | "complex" | "any";

export type CuisinePreference =
  | "american"
  | "asian"
  | "chinese"
  | "indian"
  | "italian"
  | "japanese"
  | "mexican"
  | "mediterranean"
  | "middle-eastern"
  | "thai"
  | "vietnamese"
  | "other";

export interface UserPreferences {
  id?: string;
  userId: string;

  // Dietary restrictions
  dietaryRestrictions: DietaryRestriction[];
  allergens: Allergen[];

  // Cooking preferences
  preferredCookingTime: CookingTime;
  mealComplexity: MealComplexity;
  preferredCuisines: CuisinePreference[];

  // Ingredient preferences
  dislikedIngredients: string[];
  favoriteIngredients: string[];

  // Meal planning preferences
  includeLeftovers: boolean;
  batchCookingPreferred: boolean;
  avoidRepeatDays: number; // Don't repeat meals within X days

  // Nutritional preferences (within GD guidelines)
  preferHighProtein: boolean;
  preferHighFiber: boolean;
  limitSodium: boolean;

  // Shopping preferences
  budgetConscious: boolean;
  preferOrganic: boolean;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NutritionalTargets {
  // Based on medical guidelines
  dailyCarbs: {
    min: number; // 175g
    max: number; // 200g
  };

  // Per meal targets
  breakfast: {
    carbsMin: number; // 25g
    carbsMax: number; // 35g
  };

  lunch: {
    carbsMin: number; // 40g
    carbsMax: number; // 50g
  };

  dinner: {
    carbsMin: number; // 40g
    carbsMax: number; // 50g
  };

  snack: {
    carbsMin: number; // 15g
    carbsMax: number; // 30g
  };

  bedtimeSnack: {
    carbsMin: number; // 14g
    carbsMax: number; // 16g
    minProtein: number; // 5g
  };

  // Daily targets
  dailyFiber: {
    min: number; // 25g
    target: number; // 30g
  };

  dailyProtein: {
    minPercentage: number; // 25%
    maxPercentage: number; // 30%
  };

  dailyFat: {
    minPercentage: number; // 30%
    maxPercentage: number; // 35%
  };
}

// Default nutritional targets based on medical guidelines
export const DEFAULT_NUTRITIONAL_TARGETS: NutritionalTargets = {
  dailyCarbs: {
    min: 175,
    max: 200,
  },
  breakfast: {
    carbsMin: 25,
    carbsMax: 35,
  },
  lunch: {
    carbsMin: 40,
    carbsMax: 50,
  },
  dinner: {
    carbsMin: 40,
    carbsMax: 50,
  },
  snack: {
    carbsMin: 15,
    carbsMax: 30,
  },
  bedtimeSnack: {
    carbsMin: 14,
    carbsMax: 16,
    minProtein: 5,
  },
  dailyFiber: {
    min: 25,
    target: 30,
  },
  dailyProtein: {
    minPercentage: 25,
    maxPercentage: 30,
  },
  dailyFat: {
    minPercentage: 30,
    maxPercentage: 35,
  },
};
