import { Recipe } from "./types";

// Master meal plan types
export interface WeeklyMasterPlan {
  weekNumber: number; // 1-12
  theme: string;
  description: string;
  meals: WeekMeals;
  stats: WeekStats;
  groceryList: GroceryList;
  season: "spring" | "summer" | "fall" | "winter" | "any";
}

export interface WeekMeals {
  monday: DayMeals;
  tuesday: DayMeals;
  wednesday: DayMeals;
  thursday: DayMeals;
  friday: DayMeals;
  saturday: DayMeals;
  sunday: DayMeals;
}

export interface DayMeals {
  breakfast: string; // recipe ID
  morningSnack: string;
  lunch: string;
  afternoonSnack: string;
  dinner: string;
  eveningSnack: string; // bedtime snack with protein
}

export interface WeekStats {
  avgDailyCarbs: number;
  avgDailyCalories: number;
  avgPrepTime: number;
  totalUniqueIngredients: number;
  estimatedGroceryCost?: number;
}

export interface GroceryList {
  categories: GroceryCategory[];
  totalItems: number;
  estimatedCost?: number;
}

export interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

export interface GroceryItem {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  fromRecipes: string[]; // recipe IDs
}

// User interaction types
export interface UserMealPlan {
  id: string;
  userId: string;
  masterPlanWeek: number;
  startDate: Date;
  customizations: MealCustomization[];
  groceryListChecked: string[]; // checked item IDs
  createdAt: Date;
}

export interface MealCustomization {
  day: string;
  mealType:
    | "breakfast"
    | "morningSnack"
    | "lunch"
    | "afternoonSnack"
    | "dinner"
    | "eveningSnack";
  originalRecipeId: string;
  newRecipeId: string;
  reason?: string;
}

// Weekly themes
export const WEEKLY_THEMES = [
  {
    week: 1,
    theme: "Mediterranean Inspired",
    description:
      "Fresh flavors from the Mediterranean with olive oil, whole grains, and lean proteins",
  },
  {
    week: 2,
    theme: "Quick & Easy",
    description: "All meals under 30 minutes - perfect for busy weeks",
  },
  {
    week: 3,
    theme: "Comfort Classics",
    description: "Healthified versions of your favorite comfort foods",
  },
  {
    week: 4,
    theme: "Asian Fusion",
    description: "Flavorful Asian-inspired dishes with balanced nutrition",
  },
  {
    week: 5,
    theme: "Farm Fresh",
    description:
      "Seasonal vegetables and wholesome ingredients take center stage",
  },
  {
    week: 6,
    theme: "Global Flavors",
    description: "A culinary journey with dishes from around the world",
  },
  {
    week: 7,
    theme: "Summer Lighter",
    description: "Light, refreshing meals perfect for warmer weather",
  },
  {
    week: 8,
    theme: "Hearty & Wholesome",
    description: "Satisfying meals that keep you full and energized",
  },
  {
    week: 9,
    theme: "30-Minute Meals",
    description: "Complete meals from start to finish in 30 minutes or less",
  },
  {
    week: 10,
    theme: "Batch Cooking Friendly",
    description: "Meals that prep well for efficient weekly cooking",
  },
  {
    week: 11,
    theme: "Budget Conscious",
    description: "Delicious meals that won't break the bank",
  },
  {
    week: 12,
    theme: "Holiday Favorites",
    description: "Special occasion meals that everyone will enjoy",
  },
];
