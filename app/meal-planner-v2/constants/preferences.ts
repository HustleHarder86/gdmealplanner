import { MealPlanPreferences } from '@/src/types/meal-plan';

export const DEFAULT_PREFERENCES: MealPlanPreferences = {
  dietaryRestrictions: [],
  allergies: [],
  dislikedIngredients: [],
  preferredCookTime: 'any',
  mealPrepFriendly: false,
  familySize: 1,
  carbDistribution: {
    breakfast: 30,        // 25-35g
    lunch: 45,           // 40-50g
    dinner: 45,          // 40-50g
    morningSnack: 20,    // 15-30g
    afternoonSnack: 20,  // 15-30g
    eveningSnack: 15     // 14-16g with protein
  },
  skipMorningSnack: false,
  skipAfternoonSnack: false,
  requireEveningSnack: true
};