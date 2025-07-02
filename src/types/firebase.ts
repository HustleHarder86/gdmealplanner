import { Timestamp } from 'firebase/firestore';

// User types
export interface UserSettings {
  targetGlucoseRange: {
    min: number;
    max: number;
  };
  mealReminders: boolean;
  glucoseReminders: boolean;
  notificationPreferences: {
    email: boolean;
    push: boolean;
  };
}

export interface PregnancyProfile {
  dueDate: Timestamp;
  height: number; // in cm
  prePregnancyWeight: number; // in kg
  currentWeight?: number; // in kg
  weekOfPregnancy?: number;
  diabetesDiagnosisWeek?: number;
  multiplePregnancy?: boolean;
}

export interface User {
  id?: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionExpiresAt?: Timestamp;
  settings: UserSettings;
  dietaryRestrictions?: string[];
  allergens?: string[];
  pregnancyProfile?: PregnancyProfile;
  gdprConsent?: {
    termsAccepted: boolean;
    dataUsageAccepted: boolean;
    acceptedAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Recipe types
export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface NutritionInfo {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  transFat?: number;
}

export interface RecipeRating {
  userId: string;
  value: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  nutrition: NutritionInfo; // per serving
  tags: string[];
  imageUrl?: string;
  userId: string;
  isPublic: boolean;
  ratings?: RecipeRating[];
  averageRating?: number;
  totalRatings?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Meal Plan types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanEntry {
  recipeId: string;
  recipeName: string;
  mealType: MealType;
  servings: number;
  notes?: string;
}

export interface DayMealPlan {
  date: string; // YYYY-MM-DD format
  meals: MealPlanEntry[];
  totalNutrition?: NutritionInfo;
}

export interface MealPlan {
  id?: string;
  userId: string;
  weekStartDate: Timestamp;
  weekEndDate: Timestamp;
  meals: {
    [key: string]: DayMealPlan; // key is YYYY-MM-DD format
  };
  shoppingList?: ShoppingListItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ShoppingListItem {
  name: string;
  amount: number;
  unit: string;
  checked: boolean;
  category?: string;
}

// Glucose Reading types
export interface GlucoseReading {
  id?: string;
  userId: string;
  value: number; // mg/dL
  timestamp: Timestamp;
  mealTag?: 'before_breakfast' | 'after_breakfast' | 'before_lunch' | 'after_lunch' | 'before_dinner' | 'after_dinner' | 'bedtime' | 'other';
  notes?: string;
  createdAt: Timestamp;
}

// Nutrition Log types
export interface FoodEntry {
  name: string;
  brand?: string;
  nutrition: NutritionInfo;
  servings: number;
  mealType: MealType;
  timestamp: Timestamp;
  recipeId?: string;
}

export interface NutritionLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  meals: FoodEntry[];
  totals: NutritionInfo;
  glucoseReadings?: string[]; // Array of glucose reading IDs for this day
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper type for creating new documents (without id and timestamps)
export type NewDocument<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// Subscription types
export interface Subscription {
  id?: string;
  userId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  plan: 'monthly' | 'yearly';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAt?: Timestamp;
  canceledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics types
export interface UserAnalytics {
  userId: string;
  period: 'week' | 'month' | 'quarter';
  startDate: Timestamp;
  endDate: Timestamp;
  averageGlucose: number;
  glucoseInRangePercentage: number;
  averageDailyCarbs: number;
  averageDailyCalories: number;
  mealPlanAdherence: number; // percentage
  mostUsedRecipes: Array<{
    recipeId: string;
    recipeName: string;
    count: number;
  }>;
}