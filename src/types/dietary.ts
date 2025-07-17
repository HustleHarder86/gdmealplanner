/**
 * Dietary restriction types and interfaces
 */

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'glutenFree'
  | 'dairyFree'
  | 'nutFree'
  | 'pescatarian'
  | 'eggFree';

export interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  isPescatarian: boolean;
  isEggFree: boolean;
}

export interface AllergenInfo {
  contains: string[];      // Definite allergens
  mayContain: string[];   // Possible cross-contamination
}

export interface DietaryPreferences {
  restrictions: DietaryRestriction[];
  dislikes: string[];     // Individual ingredients to avoid
  allergies: string[];    // Severe allergies (stricter than restrictions)
}

// Helper to get human-readable labels
export const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  glutenFree: 'Gluten-Free',
  dairyFree: 'Dairy-Free',
  nutFree: 'Nut-Free',
  pescatarian: 'Pescatarian',
  eggFree: 'Egg-Free',
};

// Common allergens for tracking
export const COMMON_ALLERGENS = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
] as const;

export type Allergen = typeof COMMON_ALLERGENS[number];