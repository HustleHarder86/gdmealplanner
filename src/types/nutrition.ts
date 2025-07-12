/**
 * Nutrition tracking types for gestational diabetes management
 */

import { Recipe } from "./recipe";

// Main nutrition entry interface
export interface NutritionEntry {
  id?: string;
  userId: string;
  timestamp: Date;
  mealType: MealType;
  foods: FoodItem[];
  totalNutrition: NutritionInfo;
  notes?: string;
  mealPlanId?: string; // Link to meal plan if following one
  recipeId?: string; // If from a meal plan recipe
  createdAt?: Date;
  updatedAt?: Date;
}

// Meal types aligned with GD meal schedule
export type MealType = 
  | "breakfast"
  | "morning-snack"
  | "lunch"
  | "afternoon-snack"
  | "dinner"
  | "bedtime-snack";

// Individual food item in an entry
export interface FoodItem {
  id?: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  nutrition: NutritionInfo;
  recipeId?: string; // If from a recipe
  isCustom?: boolean;
  barcode?: string;
}

// Comprehensive nutrition information
export interface NutritionInfo {
  calories: number;
  // Macronutrients (in grams)
  carbohydrates: number;
  fiber: number;
  sugar: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  // Key micronutrients for pregnancy (in mg unless specified)
  folate?: number; // in mcg
  iron?: number;
  calcium?: number;
  vitaminD?: number; // in IU
  dha?: number;
  sodium?: number;
  potassium?: number;
}

// Daily nutrition goals based on GD guidelines
export interface NutritionGoals {
  calories: { min: number; max: number };
  carbohydrates: { min: number; max: number; distribution: MealCarbTargets };
  protein: { min: number; max: number };
  fat: { min: number; max: number };
  fiber: { min: number; max: number };
  // Micronutrient daily targets
  folate: number; // mcg
  iron: number; // mg
  calcium: number; // mg
  vitaminD: number; // IU
  dha: number; // mg
}

// Carb targets per meal type
export interface MealCarbTargets {
  breakfast: { min: number; max: number };
  "morning-snack": { min: number; max: number };
  lunch: { min: number; max: number };
  "afternoon-snack": { min: number; max: number };
  dinner: { min: number; max: number };
  "bedtime-snack": { min: number; max: number };
}

// Default GD nutrition goals
export const DEFAULT_GD_NUTRITION_GOALS: NutritionGoals = {
  calories: { min: 2000, max: 2400 },
  carbohydrates: { 
    min: 175, 
    max: 200,
    distribution: {
      breakfast: { min: 25, max: 35 },
      "morning-snack": { min: 15, max: 30 },
      lunch: { min: 40, max: 50 },
      "afternoon-snack": { min: 15, max: 30 },
      dinner: { min: 40, max: 50 },
      "bedtime-snack": { min: 14, max: 16 } // Specific for overnight glucose control
    }
  },
  protein: { min: 71, max: 100 }, // Pregnancy needs
  fat: { min: 56, max: 93 }, // 25-35% of calories
  fiber: { min: 25, max: 35 },
  // Pregnancy-specific micronutrients
  folate: 600, // mcg
  iron: 27, // mg
  calcium: 1000, // mg
  vitaminD: 600, // IU
  dha: 200 // mg
};

// Daily nutrition summary
export interface DailyNutritionSummary {
  date: Date;
  userId: string;
  entries: NutritionEntry[];
  totalNutrition: NutritionInfo;
  goalAdherence: {
    calories: number; // percentage
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
  };
  mealPlanAdherence?: number; // percentage if following meal plan
  waterIntake?: number; // glasses
  prenatalVitamin?: boolean;
  notes?: string;
}

// Common food item for quick adding
export interface CommonFood {
  id?: string;
  userId?: string; // null for system foods, userId for custom
  name: string;
  brand?: string;
  category: FoodCategory;
  defaultQuantity: number;
  defaultUnit: string;
  nutrition: NutritionInfo;
  barcode?: string;
  isVerified?: boolean;
  usageCount?: number;
}

// Food categories
export type FoodCategory = 
  | "fruits"
  | "vegetables"
  | "grains"
  | "protein"
  | "dairy"
  | "fats"
  | "snacks"
  | "beverages"
  | "condiments"
  | "other";

// Water tracking
export interface WaterIntake {
  id?: string;
  userId: string;
  date: Date;
  glasses: number;
  notes?: string;
}

// Meal timing tracking
export interface MealTiming {
  userId: string;
  date: Date;
  mealTimes: {
    [key in MealType]?: Date;
  };
}

// Analytics and insights
export interface NutritionInsights {
  period: "week" | "month";
  startDate: Date;
  endDate: Date;
  averageDailyNutrition: NutritionInfo;
  carbDistribution: {
    withinTarget: number; // percentage of meals
    aboveTarget: number;
    belowTarget: number;
  };
  mealPlanAdherence?: number;
  topPatterns: string[];
  recommendations: string[];
  streaks: {
    currentStreak: number;
    longestStreak: number;
  };
}

// Helper functions
export const calculateNutritionTotals = (foods: FoodItem[]): NutritionInfo => {
  return foods.reduce((total, food) => {
    return {
      calories: total.calories + food.nutrition.calories,
      carbohydrates: total.carbohydrates + food.nutrition.carbohydrates,
      fiber: total.fiber + food.nutrition.fiber,
      sugar: total.sugar + food.nutrition.sugar,
      protein: total.protein + food.nutrition.protein,
      fat: total.fat + food.nutrition.fat,
      saturatedFat: total.saturatedFat + food.nutrition.saturatedFat,
      folate: (total.folate || 0) + (food.nutrition.folate || 0),
      iron: (total.iron || 0) + (food.nutrition.iron || 0),
      calcium: (total.calcium || 0) + (food.nutrition.calcium || 0),
      vitaminD: (total.vitaminD || 0) + (food.nutrition.vitaminD || 0),
      dha: (total.dha || 0) + (food.nutrition.dha || 0),
      sodium: (total.sodium || 0) + (food.nutrition.sodium || 0),
      potassium: (total.potassium || 0) + (food.nutrition.potassium || 0)
    };
  }, {
    calories: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    protein: 0,
    fat: 0,
    saturatedFat: 0,
    folate: 0,
    iron: 0,
    calcium: 0,
    vitaminD: 0,
    dha: 0,
    sodium: 0,
    potassium: 0
  });
};

// Convert recipe to food item
export const recipeToFoodItem = (recipe: Recipe, servings: number = 1): FoodItem => {
  const scaleFactor = servings / recipe.servings;
  
  return {
    name: recipe.title,
    quantity: servings,
    unit: "serving",
    nutrition: {
      calories: Math.round(recipe.nutrition.calories * scaleFactor),
      carbohydrates: Math.round(recipe.nutrition.carbohydrates * scaleFactor),
      fiber: Math.round(recipe.nutrition.fiber * scaleFactor),
      sugar: Math.round((recipe.nutrition.sugar || 0) * scaleFactor),
      protein: Math.round(recipe.nutrition.protein * scaleFactor),
      fat: Math.round(recipe.nutrition.fat * scaleFactor),
      saturatedFat: Math.round((recipe.nutrition.saturatedFat || 0) * scaleFactor),
      sodium: recipe.nutrition.sodium ? Math.round(recipe.nutrition.sodium * scaleFactor) : 0
    },
    recipeId: recipe.id,
    isCustom: false
  };
};

// Meal type display labels
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  "morning-snack": "Morning Snack",
  lunch: "Lunch",
  "afternoon-snack": "Afternoon Snack",
  dinner: "Dinner",
  "bedtime-snack": "Bedtime Snack"
};

// Recommended meal times for GD
export const RECOMMENDED_MEAL_TIMES: Record<MealType, string> = {
  breakfast: "7:00 - 8:00 AM",
  "morning-snack": "10:00 - 10:30 AM",
  lunch: "12:00 - 1:00 PM",
  "afternoon-snack": "3:00 - 3:30 PM",
  dinner: "6:00 - 7:00 PM",
  "bedtime-snack": "9:00 - 10:00 PM"
};