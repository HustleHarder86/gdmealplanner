export interface Recipe {
  id: string;
  title: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
  
  // Metadata
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  
  // Import metadata
  importedFrom?: string;
  importedAt?: string;
  verified?: boolean;
  
  // User engagement
  popularity?: number;
  userRatings?: any[];
  timesViewed?: number;
  timesAddedToPlan?: number;
  
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
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