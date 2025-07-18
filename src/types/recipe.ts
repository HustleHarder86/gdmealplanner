import { DietaryInfo, AllergenInfo } from './dietary';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  subcategory?: string;
  tags: string[];

  // Timing
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes

  // Servings
  servings: number;

  // Ingredients
  ingredients: Ingredient[];

  // Instructions
  instructions: string[];

  // Nutrition (per serving)
  nutrition: Nutrition;

  // GD-specific fields
  carbChoices: number;
  gdValidation?: {
    isValid: boolean;
    score: number;
    details: any;
    warnings: string[];
  };

  // Dietary information
  dietaryInfo?: DietaryInfo;
  allergenInfo?: AllergenInfo;

  // Metadata
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  localImageUrl?: string;

  // Import metadata
  importedFrom?: string;
  importedAt?: string;
  verified?: boolean;
  spoonacularId?: string;

  // User-created recipe fields
  isUserCreated?: boolean;
  userId?: string; // ID of the user who created this recipe
  isPrivate?: boolean; // If true, only visible to the creator
  originalRecipeId?: string; // If this is a modified version of an existing recipe

  // User engagement
  popularity?: number;
  userRatings?: any[];
  timesViewed?: number;
  timesAddedToPlan?: number;

  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

// Interface for creating new user recipes
export interface UserRecipeInput {
  title: string;
  description?: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  tags: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Partial<Nutrition>; // Allow partial nutrition data - will be calculated
  dietaryInfo?: DietaryInfo;
  allergenInfo?: AllergenInfo;
  imageUrl?: string;
  isPrivate?: boolean;
}

export interface Ingredient {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  original: string;
  meta?: string[];
  image?: string;
}

export interface Nutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  saturatedFat?: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;

  // Micronutrients important for pregnancy
  iron?: number;
  calcium?: number;
  folate?: number;
  vitaminD?: number;
  omega3?: number;
}
