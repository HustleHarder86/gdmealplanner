import { Recipe, NutritionInfo, User } from '@/types/firebase';

// Meal planning specific types
export interface MealSlot {
  type: 'breakfast' | 'lunch' | 'dinner' | 'morningSnack' | 'afternoonSnack' | 'eveningSnack';
  targetCarbs: number;
  minCarbs: number;
  maxCarbs: number;
  minProtein?: number;
  minFiber?: number;
}

export interface DailyMealPlan {
  date: Date;
  breakfast: Recipe | null;
  morningSnack: Recipe | null;
  lunch: Recipe | null;
  afternoonSnack: Recipe | null;
  dinner: Recipe | null;
  eveningSnack: Recipe | null;
  totalNutrition: NutritionInfo;
  nutritionTargets: NutritionTargets;
}

export interface WeeklyMealPlan {
  startDate: Date;
  endDate: Date;
  days: DailyMealPlan[];
  shoppingList: ShoppingListItem[];
  userId: string;
}

export interface ShoppingListItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
  recipeReferences: Array<{
    recipeName: string;
    day: string;
    mealType: string;
  }>;
  checked?: boolean;
}

export interface NutritionTargets {
  dailyCarbs: number; // 175g minimum for GD
  dailyProtein: number;
  dailyFiber: number; // 25-30g
  dailyCalories: number;
  maxSugar?: number;
  maxSodium?: number;
}

export interface MealPlanPreferences {
  dietaryRestrictions: string[];
  allergens: string[];
  dislikedIngredients: string[];
  favoriteRecipeIds: string[];
  mealsPerDay: number; // Usually 6 for GD
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  prepTimePreference?: 'quick' | 'moderate' | 'any'; // quick < 20min, moderate < 45min
  varietyLevel?: 'low' | 'medium' | 'high'; // How often to repeat meals
  mealPrepMode?: boolean; // Group similar ingredients for batch cooking
}

export interface MealPlanGenerationOptions {
  user: User;
  preferences: MealPlanPreferences;
  startDate: Date;
  daysToGenerate: number;
  availableRecipes: Recipe[];
  previousMealPlans?: WeeklyMealPlan[]; // To ensure variety
}

export interface MealSwapOptions {
  currentRecipe: Recipe;
  mealType: MealSlot['type'];
  targetNutrition: Partial<NutritionInfo>;
  excludeRecipeIds: string[]; // Already used in the week
}

export interface RecipeScore {
  recipe: Recipe;
  score: number;
  nutritionMatch: number;
  preferenceMatch: number;
  varietyScore: number;
  prepTimeScore: number;
}

// Prenatal specific nutrition requirements
export interface PrenatalNutritionRequirements {
  minFolicAcid: number; // mcg
  minIron: number; // mg
  minCalcium: number; // mg
  minVitaminD: number; // IU
  minOmega3: number; // mg
  minCholine: number; // mg
}

// Meal categories for better organization
export type MealCategory = 
  | 'quick-breakfast'
  | 'hearty-breakfast'
  | 'protein-snack'
  | 'fruit-snack'
  | 'light-lunch'
  | 'hearty-lunch'
  | 'light-dinner'
  | 'hearty-dinner'
  | 'bedtime-snack';

export interface RecipeWithCategory extends Recipe {
  category?: MealCategory;
  glycemicIndex?: 'low' | 'medium' | 'high';
  prepMethod?: 'no-cook' | 'microwave' | 'stovetop' | 'oven' | 'slow-cooker';
}