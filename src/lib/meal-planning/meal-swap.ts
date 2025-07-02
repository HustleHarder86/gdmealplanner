import { Recipe, NutritionInfo } from '@/types/firebase';
import { MealSwapOptions, RecipeScore, MealSlot } from './types';

export class MealSwapService {
  /**
   * Find suitable replacement recipes for a meal
   */
  static findSwapOptions(
    options: MealSwapOptions,
    availableRecipes: Recipe[],
    limit: number = 5
  ): RecipeScore[] {
    // Filter out excluded recipes and the current recipe
    const eligibleRecipes = availableRecipes.filter(recipe => 
      recipe.id !== options.currentRecipe.id &&
      !options.excludeRecipeIds.includes(recipe.id || '')
    );

    // Score each recipe based on how well it matches
    const scoredRecipes = eligibleRecipes.map(recipe => 
      this.scoreSwapCandidate(recipe, options)
    );

    // Filter out recipes with negative scores (incompatible)
    const validSwaps = scoredRecipes.filter(score => score.score > 0);

    // Sort by score and return top options
    validSwaps.sort((a, b) => b.score - a.score);
    
    return validSwaps.slice(0, limit);
  }

  /**
   * Score a recipe as a swap candidate
   */
  private static scoreSwapCandidate(
    recipe: Recipe,
    options: MealSwapOptions
  ): RecipeScore {
    let score = 100;
    let nutritionMatch = 0;
    let preferenceMatch = 0;
    let varietyScore = 20; // Base variety score
    let prepTimeScore = 0;

    // Determine target nutrition values
    const targetNutrition = {
      carbs: options.targetNutrition.carbs || options.currentRecipe.nutrition.carbs,
      protein: options.targetNutrition.protein || options.currentRecipe.nutrition.protein,
      calories: options.targetNutrition.calories || options.currentRecipe.nutrition.calories,
      fiber: options.targetNutrition.fiber || options.currentRecipe.nutrition.fiber
    };

    // Nutrition matching (60% of score for swaps)
    const carbDiff = Math.abs(recipe.nutrition.carbs - targetNutrition.carbs);
    const proteinDiff = Math.abs(recipe.nutrition.protein - targetNutrition.protein);
    const calorieDiff = Math.abs(recipe.nutrition.calories - targetNutrition.calories);

    // Carb matching is most important for GD
    if (carbDiff <= 5) {
      nutritionMatch += 30;
    } else if (carbDiff <= 10) {
      nutritionMatch += 20;
    } else if (carbDiff <= 15) {
      nutritionMatch += 10;
    } else {
      nutritionMatch -= carbDiff;
    }

    // Protein matching
    if (proteinDiff <= 5) {
      nutritionMatch += 15;
    } else if (proteinDiff <= 10) {
      nutritionMatch += 10;
    }

    // Calorie matching
    if (calorieDiff <= 50) {
      nutritionMatch += 10;
    } else if (calorieDiff <= 100) {
      nutritionMatch += 5;
    }

    // Fiber bonus
    if (recipe.nutrition.fiber && recipe.nutrition.fiber >= (targetNutrition.fiber || 0)) {
      nutritionMatch += 5;
    }

    // Meal type matching (20% of score)
    if (this.matchesMealType(recipe, options.mealType)) {
      preferenceMatch += 20;
    }

    // Prep time comparison (10% of score)
    const currentTotalTime = options.currentRecipe.prepTime + options.currentRecipe.cookTime;
    const recipeTotalTime = recipe.prepTime + recipe.cookTime;
    
    if (recipeTotalTime <= currentTotalTime) {
      prepTimeScore += 10;
    } else if (recipeTotalTime <= currentTotalTime + 10) {
      prepTimeScore += 5;
    }

    // Calculate final score
    score = nutritionMatch * 0.6 + preferenceMatch * 0.2 + varietyScore * 0.1 + prepTimeScore * 0.1;

    // Apply penalties for poor matches
    if (!this.isCompatibleMealType(recipe, options.mealType)) {
      score *= 0.5; // 50% penalty for incompatible meal types
    }

    return {
      recipe,
      score,
      nutritionMatch,
      preferenceMatch,
      varietyScore,
      prepTimeScore
    };
  }

  /**
   * Check if recipe matches the meal type
   */
  private static matchesMealType(recipe: Recipe, mealType: MealSlot['type']): boolean {
    const tags = recipe.tags.map(t => t.toLowerCase());
    
    switch (mealType) {
      case 'breakfast':
        return tags.includes('breakfast');
      case 'lunch':
        return tags.includes('lunch') || tags.includes('light-meal');
      case 'dinner':
        return tags.includes('dinner') || tags.includes('main-course');
      case 'morningSnack':
      case 'afternoonSnack':
      case 'eveningSnack':
        return tags.includes('snack');
      default:
        return false;
    }
  }

  /**
   * Check if recipe is compatible with meal type based on nutrition
   */
  private static isCompatibleMealType(recipe: Recipe, mealType: MealSlot['type']): boolean {
    const carbs = recipe.nutrition.carbs;
    
    switch (mealType) {
      case 'breakfast':
      case 'lunch':
      case 'dinner':
        // Main meals should have 25-50g carbs
        return carbs >= 25 && carbs <= 50;
      case 'morningSnack':
      case 'afternoonSnack':
        // Day snacks should have 10-20g carbs
        return carbs >= 10 && carbs <= 20;
      case 'eveningSnack':
        // Evening snack can have slightly more carbs
        return carbs >= 15 && carbs <= 25;
      default:
        return true;
    }
  }

  /**
   * Validate if a swap maintains daily nutrition balance
   */
  static validateSwap(
    originalRecipe: Recipe,
    newRecipe: Recipe,
    dayTotalNutrition: NutritionInfo,
    dailyTargets: {
      minCarbs: number;
      maxCarbs: number;
      minProtein: number;
      minFiber: number;
    }
  ): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Calculate new totals after swap
    const newTotals: NutritionInfo = {
      calories: dayTotalNutrition.calories - originalRecipe.nutrition.calories + newRecipe.nutrition.calories,
      carbs: dayTotalNutrition.carbs - originalRecipe.nutrition.carbs + newRecipe.nutrition.carbs,
      protein: dayTotalNutrition.protein - originalRecipe.nutrition.protein + newRecipe.nutrition.protein,
      fat: dayTotalNutrition.fat - originalRecipe.nutrition.fat + newRecipe.nutrition.fat,
      fiber: (dayTotalNutrition.fiber || 0) - (originalRecipe.nutrition.fiber || 0) + (newRecipe.nutrition.fiber || 0),
      sugar: (dayTotalNutrition.sugar || 0) - (originalRecipe.nutrition.sugar || 0) + (newRecipe.nutrition.sugar || 0),
      sodium: (dayTotalNutrition.sodium || 0) - (originalRecipe.nutrition.sodium || 0) + (newRecipe.nutrition.sodium || 0),
      cholesterol: (dayTotalNutrition.cholesterol || 0) - (originalRecipe.nutrition.cholesterol || 0) + (newRecipe.nutrition.cholesterol || 0),
      saturatedFat: (dayTotalNutrition.saturatedFat || 0) - (originalRecipe.nutrition.saturatedFat || 0) + (newRecipe.nutrition.saturatedFat || 0),
      transFat: (dayTotalNutrition.transFat || 0) - (originalRecipe.nutrition.transFat || 0) + (newRecipe.nutrition.transFat || 0)
    };

    // Check carb limits
    if (newTotals.carbs < dailyTargets.minCarbs) {
      warnings.push(`This swap would bring daily carbs below the minimum of ${dailyTargets.minCarbs}g`);
    }
    if (newTotals.carbs > dailyTargets.maxCarbs) {
      warnings.push(`This swap would exceed the maximum daily carbs of ${dailyTargets.maxCarbs}g`);
    }

    // Check protein minimum
    if (newTotals.protein < dailyTargets.minProtein) {
      warnings.push(`This swap would bring daily protein below the minimum of ${dailyTargets.minProtein}g`);
    }

    // Check fiber minimum
    if ((newTotals.fiber || 0) < dailyTargets.minFiber) {
      warnings.push(`This swap would bring daily fiber below the recommended ${dailyTargets.minFiber}g`);
    }

    // Check individual meal carb difference
    const carbDifference = Math.abs(newRecipe.nutrition.carbs - originalRecipe.nutrition.carbs);
    if (carbDifference > 15) {
      warnings.push(`This swap has a ${carbDifference}g carb difference, which may affect blood sugar management`);
    }

    const valid = warnings.length === 0 || 
                  warnings.every(w => w.includes('recommended') || w.includes('may affect'));

    return { valid, warnings };
  }

  /**
   * Get quick swap suggestions based on common substitutions
   */
  static getQuickSwapSuggestions(recipe: Recipe): string[] {
    const suggestions: string[] = [];
    const title = recipe.title.toLowerCase();
    const ingredients = recipe.ingredients.map(i => i.name.toLowerCase()).join(' ');

    // Breakfast swaps
    if (title.includes('oatmeal') || title.includes('porridge')) {
      suggestions.push('Try Greek yogurt parfait for more protein');
      suggestions.push('Consider scrambled eggs with whole grain toast');
    }
    
    if (title.includes('toast') || title.includes('bread')) {
      suggestions.push('Swap for whole grain or ezekiel bread');
      suggestions.push('Try a low-carb wrap instead');
    }

    // Protein swaps
    if (ingredients.includes('chicken')) {
      suggestions.push('Substitute with turkey, fish, or tofu');
    }
    
    if (ingredients.includes('beef')) {
      suggestions.push('Try lean ground turkey or plant-based protein');
    }

    // Grain swaps
    if (ingredients.includes('rice')) {
      suggestions.push('Replace with cauliflower rice or quinoa');
    }
    
    if (ingredients.includes('pasta')) {
      suggestions.push('Try zucchini noodles or shirataki noodles');
    }

    // Snack swaps
    if (recipe.tags.includes('snack')) {
      if (recipe.nutrition.carbs > 20) {
        suggestions.push('Pair with protein to slow carb absorption');
      }
      if (recipe.nutrition.protein < 5) {
        suggestions.push('Add nuts, cheese, or Greek yogurt for protein');
      }
    }

    return suggestions;
  }
}