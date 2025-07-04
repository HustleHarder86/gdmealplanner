// Recipe types
export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: "breakfast" | "lunch" | "dinner" | "snacks";
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  tags: string[];
  image?: string;
  originalImage?: string;
  source: string;
  url: string;
  scraped_at?: string;
  medicallyCompliant?: boolean;
  adjustmentNote?: string;
}

export interface Ingredient {
  amount: string;
  unit: string;
  item: string;
}

export interface Nutrition {
  calories: number;
  carbs: number;
  carbChoices?: number; // carbs divided by 15
  fiber: number;
  sugar: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
}

// Meal Plan types
export interface MealPlan {
  id: string;
  week: string;
  days: DayPlan[];
}

export interface DayPlan {
  day: string;
  meals: {
    breakfast?: Recipe;
    morningSnack?: Recipe;
    lunch?: Recipe;
    afternoonSnack?: Recipe;
    dinner?: Recipe;
    eveningSnack?: Recipe;
  };
}

// Glucose tracking types
export interface GlucoseReading {
  id: string;
  timestamp: Date;
  value: number;
  unit: "mmol/L" | "mg/dL";
  type:
    | "fasting"
    | "1hr-post-breakfast"
    | "2hr-post-breakfast"
    | "2hr-post-lunch"
    | "2hr-post-dinner"
    | "other";
  mealAssociation?: string; // meal ID if applicable
  notes?: string;
  withinTarget: boolean;
}

// User types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dueDate: Date;
  diagnosisDate: Date;
  targetRanges: {
    fasting: { max: 5.3 }; // mmol/L
    oneHourPost: { max: 7.8 }; // mmol/L
    twoHourPost: { max: 6.7 }; // mmol/L
  };
  dietaryRestrictions: string[];
  preferences: {
    avoidFoods: string[];
    favoriteFoods: string[];
  };
  morningSensitivity?: boolean; // Some users need lower breakfast carbs
}
