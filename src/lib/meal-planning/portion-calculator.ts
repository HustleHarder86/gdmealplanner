import { User, Recipe, Ingredient, NutritionInfo } from '@/types/firebase';

export interface PortionAdjustment {
  multiplier: number;
  reason: string;
  adjustedIngredients: Ingredient[];
  adjustedNutrition: NutritionInfo;
}

export class PortionCalculator {
  /**
   * Calculate portion adjustments based on user profile
   */
  static calculatePortionAdjustment(
    recipe: Recipe,
    user: User,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): PortionAdjustment {
    let multiplier = 1.0;
    const reasons: string[] = [];

    // Base adjustments based on pregnancy profile
    if (user.pregnancyProfile) {
      const profile = user.pregnancyProfile;
      
      // Trimester-based adjustments
      const weekOfPregnancy = profile.weekOfPregnancy || 20;
      if (weekOfPregnancy <= 12) {
        // First trimester - may need smaller portions due to nausea
        multiplier *= 0.9;
        reasons.push('First trimester adjustment');
      } else if (weekOfPregnancy > 27) {
        // Third trimester - increased caloric needs
        multiplier *= 1.1;
        reasons.push('Third trimester adjustment');
      }

      // Multiple pregnancy adjustment
      if (profile.multiplePregnancy) {
        multiplier *= 1.15;
        reasons.push('Multiple pregnancy adjustment');
      }

      // BMI-based adjustments (if we can calculate it)
      if (profile.height && profile.prePregnancyWeight) {
        const heightInM = profile.height / 100;
        const bmi = profile.prePregnancyWeight / (heightInM * heightInM);
        
        if (bmi < 18.5) {
          // Underweight - may need larger portions
          multiplier *= 1.15;
          reasons.push('Pre-pregnancy underweight adjustment');
        } else if (bmi > 30) {
          // Obese - may need controlled portions
          multiplier *= 0.95;
          reasons.push('Weight management adjustment');
        }
      }
    }

    // Meal-type specific adjustments
    if (mealType === 'snack' && recipe.nutrition.carbs > 20) {
      // Reduce snack portions if carbs are high
      const carbReduction = 20 / recipe.nutrition.carbs;
      multiplier *= carbReduction;
      reasons.push('Snack carb adjustment to meet 15-20g target');
    }

    // Activity level adjustments (if tracked)
    // This would be based on user activity data if available

    // Round to nearest 0.25 for practical cooking
    multiplier = Math.round(multiplier * 4) / 4;

    // Don't go below 0.5 or above 2.0 for safety
    multiplier = Math.max(0.5, Math.min(2.0, multiplier));

    // Calculate adjusted ingredients and nutrition
    const adjustedIngredients = this.adjustIngredients(recipe.ingredients, multiplier);
    const adjustedNutrition = this.adjustNutrition(recipe.nutrition, multiplier);

    return {
      multiplier,
      reason: reasons.join(', ') || 'Standard portion',
      adjustedIngredients,
      adjustedNutrition
    };
  }

  /**
   * Calculate serving size for a specific carb target
   */
  static calculateServingForCarbTarget(
    recipe: Recipe,
    targetCarbs: number,
    tolerance: number = 5
  ): PortionAdjustment {
    const currentCarbs = recipe.nutrition.carbs;
    const multiplier = targetCarbs / currentCarbs;

    // Check if adjustment would result in reasonable portion
    if (multiplier < 0.25) {
      return {
        multiplier: 0.25,
        reason: 'Minimum portion size reached. Consider a different recipe.',
        adjustedIngredients: this.adjustIngredients(recipe.ingredients, 0.25),
        adjustedNutrition: this.adjustNutrition(recipe.nutrition, 0.25)
      };
    }

    if (multiplier > 3.0) {
      return {
        multiplier: 3.0,
        reason: 'Maximum portion size reached. Consider adding another item.',
        adjustedIngredients: this.adjustIngredients(recipe.ingredients, 3.0),
        adjustedNutrition: this.adjustNutrition(recipe.nutrition, 3.0)
      };
    }

    // Round to nearest 0.25 for practical cooking
    const roundedMultiplier = Math.round(multiplier * 4) / 4;
    const resultingCarbs = currentCarbs * roundedMultiplier;

    let reason = `Adjusted to ${resultingCarbs.toFixed(1)}g carbs`;
    if (Math.abs(resultingCarbs - targetCarbs) > tolerance) {
      reason += ` (target was ${targetCarbs}g)`;
    }

    return {
      multiplier: roundedMultiplier,
      reason,
      adjustedIngredients: this.adjustIngredients(recipe.ingredients, roundedMultiplier),
      adjustedNutrition: this.adjustNutrition(recipe.nutrition, roundedMultiplier)
    };
  }

  /**
   * Adjust ingredient amounts based on multiplier
   */
  private static adjustIngredients(
    ingredients: Ingredient[],
    multiplier: number
  ): Ingredient[] {
    return ingredients.map(ingredient => ({
      ...ingredient,
      amount: this.roundIngredientAmount(ingredient.amount * multiplier, ingredient.unit)
    }));
  }

  /**
   * Adjust nutrition values based on multiplier
   */
  private static adjustNutrition(
    nutrition: NutritionInfo,
    multiplier: number
  ): NutritionInfo {
    return {
      calories: Math.round(nutrition.calories * multiplier),
      carbs: Math.round(nutrition.carbs * multiplier * 10) / 10, // 1 decimal place
      protein: Math.round(nutrition.protein * multiplier * 10) / 10,
      fat: Math.round(nutrition.fat * multiplier * 10) / 10,
      fiber: nutrition.fiber ? Math.round(nutrition.fiber * multiplier * 10) / 10 : undefined,
      sugar: nutrition.sugar ? Math.round(nutrition.sugar * multiplier * 10) / 10 : undefined,
      sodium: nutrition.sodium ? Math.round(nutrition.sodium * multiplier) : undefined,
      cholesterol: nutrition.cholesterol ? Math.round(nutrition.cholesterol * multiplier) : undefined,
      saturatedFat: nutrition.saturatedFat ? Math.round(nutrition.saturatedFat * multiplier * 10) / 10 : undefined,
      transFat: nutrition.transFat ? Math.round(nutrition.transFat * multiplier * 10) / 10 : undefined
    };
  }

  /**
   * Round ingredient amounts to practical measurements
   */
  private static roundIngredientAmount(amount: number, unit: string): number {
    // For teaspoons and tablespoons, round to nearest 1/4
    if (unit === 'tsp' || unit === 'tbsp') {
      return Math.round(amount * 4) / 4;
    }
    
    // For cups, round to nearest 1/4
    if (unit === 'cup' || unit === 'cups') {
      return Math.round(amount * 4) / 4;
    }
    
    // For ounces, round to nearest 0.5
    if (unit === 'oz') {
      return Math.round(amount * 2) / 2;
    }
    
    // For grams, round to nearest 5
    if (unit === 'g' || unit === 'grams') {
      return Math.round(amount / 5) * 5;
    }
    
    // For count items (like eggs), round to nearest 0.5
    if (unit === '' || unit === 'each' || unit === 'whole') {
      return Math.round(amount * 2) / 2;
    }
    
    // Default: round to 1 decimal place
    return Math.round(amount * 10) / 10;
  }

  /**
   * Get portion size recommendations based on meal type
   */
  static getPortionGuidelines(mealType: string): {
    carbs: { min: number; max: number; target: number };
    protein: { min: number; target: number };
    tips: string[];
  } {
    switch (mealType) {
      case 'breakfast':
        return {
          carbs: { min: 25, max: 45, target: 30 },
          protein: { min: 15, target: 20 },
          tips: [
            'Include protein to help stabilize morning blood sugar',
            'Pair carbs with healthy fats for sustained energy',
            'Consider adding fiber-rich foods like berries or chia seeds'
          ]
        };
      
      case 'lunch':
      case 'dinner':
        return {
          carbs: { min: 30, max: 50, target: 45 },
          protein: { min: 20, target: 25 },
          tips: [
            'Fill half your plate with non-starchy vegetables',
            'Choose whole grains over refined carbohydrates',
            'Include a palm-sized portion of lean protein'
          ]
        };
      
      case 'morningSnack':
      case 'afternoonSnack':
        return {
          carbs: { min: 10, max: 20, target: 15 },
          protein: { min: 5, target: 7 },
          tips: [
            'Pair carbs with protein for better blood sugar control',
            'Choose whole foods over processed snacks',
            'Keep portions controlled to avoid blood sugar spikes'
          ]
        };
      
      case 'eveningSnack':
        return {
          carbs: { min: 15, max: 25, target: 20 },
          protein: { min: 7, target: 10 },
          tips: [
            'Include protein to help maintain overnight blood sugar',
            'Avoid high-sugar snacks before bed',
            'Consider dairy or nuts for sustained energy'
          ]
        };
      
      default:
        return {
          carbs: { min: 15, max: 45, target: 30 },
          protein: { min: 10, target: 15 },
          tips: ['Follow general gestational diabetes guidelines']
        };
    }
  }

  /**
   * Calculate daily portion distribution
   */
  static calculateDailyPortionDistribution(
    totalDailyCalories: number,
    mealsPerDay: number = 6
  ): Map<string, { calories: number; carbsTarget: number }> {
    const distribution = new Map();

    if (mealsPerDay === 6) {
      // Standard GD meal distribution
      distribution.set('breakfast', {
        calories: Math.round(totalDailyCalories * 0.20),
        carbsTarget: 30
      });
      distribution.set('morningSnack', {
        calories: Math.round(totalDailyCalories * 0.10),
        carbsTarget: 15
      });
      distribution.set('lunch', {
        calories: Math.round(totalDailyCalories * 0.25),
        carbsTarget: 45
      });
      distribution.set('afternoonSnack', {
        calories: Math.round(totalDailyCalories * 0.10),
        carbsTarget: 15
      });
      distribution.set('dinner', {
        calories: Math.round(totalDailyCalories * 0.25),
        carbsTarget: 45
      });
      distribution.set('eveningSnack', {
        calories: Math.round(totalDailyCalories * 0.10),
        carbsTarget: 20
      });
    }

    return distribution;
  }
}