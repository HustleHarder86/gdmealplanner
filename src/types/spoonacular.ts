// Re-export types from the service module for easier imports
export type {
  SpoonacularRecipeInfo as SpoonacularRecipe,
  SpoonacularSearchResponse,
  SpoonacularSearchResult,
  SpoonacularInstruction,
  SpoonacularStep,
  SpoonacularIngredient,
  SpoonacularNutritionInfo,
  SpoonacularNutrient,
  SpoonacularProperty,
  SpoonacularFlavonoid,
  SpoonacularNutrientByIngredient,
  GDValidation,
  SpoonacularSearchParams,
  SpoonacularError,
} from "@/src/services/spoonacular/types";
