export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  weekStartDate: string; // ISO date string
  days: DayMealPlan[];
  preferences: MealPlanPreferences;
  createdAt: string;
  updatedAt: string;
  version: number; // For tracking when recipes are updated
}

export interface DayMealPlan {
  date: string; // ISO date string
  meals: {
    breakfast: MealSlot;
    morningSnack: MealSlot;
    lunch: MealSlot;
    afternoonSnack: MealSlot;
    dinner: MealSlot;
    eveningSnack: MealSlot;
  };
  totalNutrition: DayNutrition;
}

export interface MealSlot {
  recipeId: string;
  recipeName: string;
  servings: number;
  nutrition: MealNutrition;
  cookTime: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  isBackup?: boolean; // If this recipe was auto-substituted
}

export interface MealNutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
}

export interface DayNutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  fiber: number;
  mealsCount: number;
  snacksCount: number;
}

export interface MealPlanPreferences {
  dietaryRestrictions: string[]; // ['vegetarian', 'gluten-free', 'dairy-free', etc.]
  allergies: string[]; // ['nuts', 'shellfish', 'eggs', etc.]
  dislikedIngredients: string[];
  preferredCookTime: 'quick' | 'medium' | 'any'; // <= 15, <= 30, any
  mealPrepFriendly: boolean;
  familySize: number;
  
  // GD-specific preferences
  carbDistribution: {
    breakfast: number; // target carbs for breakfast (25-35g)
    lunch: number; // target carbs for lunch (40-50g)  
    dinner: number; // target carbs for dinner (40-50g)
    morningSnack: number; // 15-30g
    afternoonSnack: number; // 15-30g
    eveningSnack: number; // 14-16g with protein
  };
  
  // Meal timing preferences
  skipMorningSnack?: boolean;
  skipAfternoonSnack?: boolean;
  requireEveningSnack: boolean; // Usually true for GD
}

export interface MealPlanGenerationOptions {
  startDate: string; // ISO date
  daysToGenerate: number; // Usually 7
  useExistingPlan?: MealPlan; // For updating existing plans
  prioritizeNew: boolean; // Prefer newly added recipes
  avoidRecentMeals: boolean; // Don't repeat recent meals
  maxRecipeRepeats: number; // Max times a recipe can appear in the plan
}

export interface MealPlanStats {
  totalRecipes: number;
  uniqueRecipes: number;
  recipesByCategory: Record<string, number>;
  nutritionAverages: DayNutrition;
  gdCompliance: {
    daysInRange: number;
    totalDays: number;
    issues: string[];
  };
  variety: {
    cuisineTypes: string[];
    cookingMethods: string[];
    proteinSources: string[];
  };
}

export interface ShoppingList {
  mealPlanId: string;
  weekStartDate: string;
  categories: ShoppingCategory[];
  totalItems: number;
  estimatedCost?: number;
  generatedAt: string;
}

export interface ShoppingCategory {
  name: string; // 'Produce', 'Proteins', 'Dairy', etc.
  items: ShoppingItem[];
}

export interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  recipes: string[]; // Which recipes use this ingredient
  isOptional: boolean;
  estimatedCost?: number;
  notes?: string; // e.g., "organic preferred", "any brand"
}