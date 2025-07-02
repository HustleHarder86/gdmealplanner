// Recipe types
export interface Recipe {
  id: string
  title: string
  description: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  prepTime: number
  cookTime: number
  totalTime: number
  servings: number
  ingredients: Ingredient[]
  instructions: string[]
  nutrition: Nutrition
  tags: string[]
  image?: string
  originalImage?: string
  source: string
  url: string
  scraped_at?: string
}

export interface Ingredient {
  amount: string
  unit: string
  item: string
}

export interface Nutrition {
  calories: number
  carbs: number
  fiber: number
  sugar: number
  protein: number
  fat: number
  saturatedFat: number
  sodium: number
}

// Meal Plan types
export interface MealPlan {
  id: string
  week: string
  days: DayPlan[]
}

export interface DayPlan {
  day: string
  meals: {
    breakfast?: Recipe
    morningSnack?: Recipe
    lunch?: Recipe
    afternoonSnack?: Recipe
    dinner?: Recipe
    eveningSnack?: Recipe
  }
}

// Glucose tracking types
export interface GlucoseReading {
  id: string
  timestamp: Date
  value: number
  type: 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime'
  notes?: string
}

// User types
export interface UserProfile {
  id: string
  name: string
  email: string
  dueDate: Date
  diagnosisDate: Date
  targetRanges: {
    fasting: { min: number; max: number }
    postMeal: { min: number; max: number }
  }
  dietaryRestrictions: string[]
  preferences: {
    avoidFoods: string[]
    favoriteFoods: string[]
  }
}