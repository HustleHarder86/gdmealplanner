// Spoonacular API Response Types

// Recipe Search Response
export interface SpoonacularSearchResponse {
  results: SpoonacularSearchResult[];
  offset: number;
  number: number;
  totalResults: number;
}

export interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
  nutrition?: {
    nutrients: SpoonacularNutrient[];
  };
}

// Detailed Recipe Information
export interface SpoonacularRecipeInfo {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  image: string;
  imageType: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  occasions: string[];
  instructions: string;
  analyzedInstructions: SpoonacularInstruction[];
  extendedIngredients: SpoonacularIngredient[];
  nutrition: SpoonacularNutritionInfo;
  creditsText?: string;
  sourceName?: string;
  pricePerServing: number;
  cheap: boolean;
  veryHealthy: boolean;
  sustainable: boolean;
  healthScore: number;
  weightWatcherSmartPoints: number;
  gaps: string;
  lowFodmap: boolean;
  aggregateLikes: number;
  spoonacularScore: number;
  preparationMinutes: number;
  cookingMinutes: number;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
}

export interface SpoonacularInstruction {
  name: string;
  steps: SpoonacularStep[];
}

export interface SpoonacularStep {
  number: number;
  step: string;
  ingredients: {
    id: number;
    name: string;
    localizedName: string;
    image: string;
  }[];
  equipment: {
    id: number;
    name: string;
    localizedName: string;
    image: string;
  }[];
  length?: {
    number: number;
    unit: string;
  };
}

export interface SpoonacularIngredient {
  id: number;
  aisle: string;
  image: string;
  consistency: string;
  name: string;
  nameClean: string;
  original: string;
  originalName: string;
  amount: number;
  unit: string;
  meta: string[];
  measures: {
    us: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
    metric: {
      amount: number;
      unitShort: string;
      unitLong: string;
    };
  };
}

export interface SpoonacularNutritionInfo {
  nutrients: SpoonacularNutrient[];
  properties: SpoonacularProperty[];
  flavonoids: SpoonacularFlavonoid[];
  ingredients: SpoonacularNutrientByIngredient[];
  caloricBreakdown: {
    percentProtein: number;
    percentFat: number;
    percentCarbs: number;
  };
  weightPerServing: {
    amount: number;
    unit: string;
  };
}

export interface SpoonacularNutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds?: number;
}

export interface SpoonacularProperty {
  name: string;
  amount: number;
  unit: string;
}

export interface SpoonacularFlavonoid {
  name: string;
  amount: number;
  unit: string;
}

export interface SpoonacularNutrientByIngredient {
  name: string;
  amount: number;
  unit: string;
  nutrients: SpoonacularNutrient[];
}

// GD Validation Types
export interface GDValidation {
  isValid: boolean;
  carbsInRange: boolean;
  adequateProtein: boolean;
  adequateFiber: boolean;
  warnings: string[];
  adjustmentSuggestions?: string[];
}

// Search Parameters
export interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  type?: string; // breakfast, lunch, dinner, snack
  maxReadyTime?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minProtein?: number;
  minFiber?: number;
  number?: number; // results per page
  offset?: number;
  sort?:
    | "meta-score"
    | "popularity"
    | "healthiness"
    | "price"
    | "time"
    | "random";
  sortDirection?: "asc" | "desc";
  addRecipeNutrition?: boolean;
  addRecipeInformation?: boolean;
}

// API Error Response
export interface SpoonacularError {
  status: string;
  code: number;
  message: string;
}
