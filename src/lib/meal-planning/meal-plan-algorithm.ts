import { Recipe } from '@/src/types/recipe';
import { 
  MealPlan, 
  DayMealPlan, 
  MealSlot, 
  MealPlanPreferences, 
  MealPlanGenerationOptions,
  MealNutrition,
  DayNutrition
} from '@/src/types/meal-plan';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { DietaryFilterService } from '@/src/services/dietary-filter-service';
import { DietaryPreferences } from '@/src/types/dietary';

/**
 * GD Meal Planning Algorithm
 * 
 * Automatically generates meal plans that:
 * - Follow GD nutritional guidelines
 * - Use all available recipes dynamically
 * - Update when new recipes are added
 * - Provide variety and balance
 */
export class MealPlanAlgorithm {
  
  /**
   * Generate a complete meal plan
   */
  static async generateMealPlan(
    preferences: MealPlanPreferences,
    options: MealPlanGenerationOptions
  ): Promise<MealPlan> {
    
    console.log(`[MEAL_PLAN] Generating ${options.daysToGenerate}-day meal plan`);
    console.log(`[MEAL_PLAN] Start date: ${options.startDate}`);
    
    // Get all available recipes
    const allRecipes = LocalRecipeService.getAllRecipes();
    console.log(`[MEAL_PLAN] Using ${allRecipes.length} available recipes`);
    
    // Filter recipes based on preferences
    const suitableRecipes = this.filterRecipesByPreferences(allRecipes, preferences);
    console.log(`[MEAL_PLAN] ${suitableRecipes.suitable.length} recipes match preferences`);
    
    // Generate each day
    const days: DayMealPlan[] = [];
    const usedRecipes = new Map<string, number>(); // Track recipe usage
    
    const startDate = new Date(options.startDate);
    
    for (let dayIndex = 0; dayIndex < options.daysToGenerate; dayIndex++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayIndex);
      
      console.log(`[MEAL_PLAN] Planning day ${dayIndex + 1}: ${currentDate.toISOString().split('T')[0]}`);
      
      const dayPlan = await this.generateDayPlan(
        currentDate.toISOString().split('T')[0],
        preferences,
        suitableRecipes,
        usedRecipes,
        options
      );
      
      days.push(dayPlan);
    }
    
    // Create the meal plan
    const mealPlan: MealPlan = {
      id: this.generateId(),
      userId: '', // Will be set by the service
      name: this.generatePlanName(options.startDate, options.daysToGenerate),
      weekStartDate: options.startDate,
      days,
      preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    console.log(`[MEAL_PLAN] Generated plan with ${days.length} days`);
    this.logPlanStats(mealPlan);
    
    return mealPlan;
  }
  
  /**
   * Update existing meal plan with new recipes
   */
  static async updateMealPlanWithNewRecipes(
    existingPlan: MealPlan,
    options: { 
      replacePercentage?: number; // What % of meals to replace with new recipes
      prioritizeNewRecipes?: boolean;
    } = {}
  ): Promise<MealPlan> {
    
    const { replacePercentage = 30, prioritizeNewRecipes = true } = options;
    
    console.log(`[MEAL_PLAN] Updating existing plan: ${existingPlan.name}`);
    console.log(`[MEAL_PLAN] Will replace ~${replacePercentage}% of meals with new recipes`);
    
    // Get current available recipes
    const allRecipes = LocalRecipeService.getAllRecipes();
    const suitableRecipes = this.filterRecipesByPreferences(allRecipes, existingPlan.preferences);
    
    // Find recipes that weren't in the original plan (new recipes)
    const existingRecipeIds = new Set();
    existingPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        existingRecipeIds.add(meal.recipeId);
      });
    });
    
    const newRecipes = suitableRecipes.suitable.filter(recipe => 
      !existingRecipeIds.has(recipe.id)
    );
    
    console.log(`[MEAL_PLAN] Found ${newRecipes.length} new recipes to potentially use`);
    
    if (newRecipes.length === 0) {
      console.log(`[MEAL_PLAN] No new recipes available, returning existing plan`);
      return existingPlan;
    }
    
    // Create updated plan
    const updatedDays = existingPlan.days.map(day => {
      const updatedMeals = { ...day.meals };
      
      // Decide which meals to potentially replace
      const mealSlots = Object.keys(updatedMeals) as Array<keyof typeof updatedMeals>;
      const mealsToConsiderReplacing = mealSlots.filter(() => 
        Math.random() < (replacePercentage / 100)
      );
      
      for (const mealType of mealsToConsiderReplacing) {
        const currentMeal = updatedMeals[mealType];
        
        // Find new recipes that match this meal's requirements
        const categoryFilter = this.getMealCategoryFilter(mealType);
        const carbTarget = this.getCarbTargetForMeal(mealType, existingPlan.preferences);
        
        const replacementCandidates = newRecipes.filter(recipe => {
          if (categoryFilter && recipe.category !== categoryFilter) return false;
          
          const recipeCarbs = recipe.nutrition.carbohydrates;
          return recipeCarbs >= carbTarget.min && recipeCarbs <= carbTarget.max;
        });
        
        if (replacementCandidates.length > 0) {
          // Replace with a new recipe
          const newRecipe = replacementCandidates[
            Math.floor(Math.random() * replacementCandidates.length)
          ];
          
          updatedMeals[mealType] = this.createMealSlot(
            newRecipe, 
            currentMeal.servings,
            mealType.includes('snack') ? 'snack' : 
            mealType === 'breakfast' ? 'breakfast' :
            mealType === 'lunch' ? 'lunch' : 'dinner'
          );
          
          console.log(`[MEAL_PLAN] Replaced ${mealType} with new recipe: ${newRecipe.title}`);
        }
      }
      
      // Recalculate day nutrition
      const totalNutrition = this.calculateDayNutrition(Object.values(updatedMeals));
      
      return {
        ...day,
        meals: updatedMeals,
        totalNutrition
      };
    });
    
    const updatedPlan: MealPlan = {
      ...existingPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
      version: existingPlan.version + 1
    };
    
    console.log(`[MEAL_PLAN] Updated plan to version ${updatedPlan.version}`);
    return updatedPlan;
  }
  
  /**
   * Filter recipes based on user preferences
   */
  private static filterRecipesByPreferences(
    recipes: Recipe[], 
    preferences: MealPlanPreferences
  ) {
    // Convert string restrictions to DietaryPreferences format
    const dietaryPrefs: DietaryPreferences = {
      restrictions: preferences.dietaryRestrictions as any[], // Will be converted to proper format
      dislikes: preferences.dislikedIngredients,
      allergies: preferences.allergies
    };
    
    // Use DietaryFilterService for filtering
    const filterResult = DietaryFilterService.filterRecipes(recipes, dietaryPrefs);
    
    // Add additional filtering for allergies and cook time
    const suitable: Recipe[] = [];
    const excluded: Array<{recipe: Recipe, reason: string}> = [...filterResult.excluded];
    
    for (const recipe of filterResult.suitable) {
      // Check allergies
      let allergyFound = false;
      for (const allergy of preferences.allergies) {
        const hasAllergen = recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(allergy.toLowerCase())
        );
        if (hasAllergen) {
          excluded.push({ recipe, reason: `Contains ${allergy} (allergy)` });
          allergyFound = true;
          break;
        }
      }
      
      if (allergyFound) continue;
      
      // Check cook time preference
      if (preferences.preferredCookTime === 'quick' && recipe.totalTime > 15) {
        excluded.push({ recipe, reason: 'Takes too long (quick meals preference)' });
        continue;
      }
      if (preferences.preferredCookTime === 'medium' && recipe.totalTime > 30) {
        excluded.push({ recipe, reason: 'Takes too long (medium time preference)' });
        continue;
      }
      
      suitable.push(recipe);
    }
    
    return { suitable, excluded };
  }
  
  // Note: getExclusionReason method removed - now using DietaryFilterService
  
  /**
   * Generate a single day's meal plan
   */
  private static async generateDayPlan(
    date: string,
    preferences: MealPlanPreferences,
    suitableRecipes: { suitable: Recipe[], excluded: any[] },
    usedRecipes: Map<string, number>,
    options: MealPlanGenerationOptions
  ): Promise<DayMealPlan> {
    
    const meals = {
      breakfast: await this.selectMealForSlot(
        'breakfast', 
        preferences.carbDistribution.breakfast,
        suitableRecipes.suitable,
        usedRecipes,
        options
      ),
      morningSnack: preferences.skipMorningSnack ? 
        this.createEmptyMealSlot('morningSnack') :
        await this.selectMealForSlot(
          'morningSnack',
          preferences.carbDistribution.morningSnack,
          suitableRecipes.suitable,
          usedRecipes,
          options
        ),
      lunch: await this.selectMealForSlot(
        'lunch',
        preferences.carbDistribution.lunch,
        suitableRecipes.suitable,
        usedRecipes,
        options
      ),
      afternoonSnack: preferences.skipAfternoonSnack ?
        this.createEmptyMealSlot('afternoonSnack') :
        await this.selectMealForSlot(
          'afternoonSnack',
          preferences.carbDistribution.afternoonSnack,
          suitableRecipes.suitable,
          usedRecipes,
          options
        ),
      dinner: await this.selectMealForSlot(
        'dinner',
        preferences.carbDistribution.dinner,
        suitableRecipes.suitable,
        usedRecipes,
        options
      ),
      eveningSnack: await this.selectMealForSlot(
        'eveningSnack',
        preferences.carbDistribution.eveningSnack,
        suitableRecipes.suitable,
        usedRecipes,
        options,
        { requireProtein: true } // Evening snack needs protein for GD
      )
    };
    
    const totalNutrition = this.calculateDayNutrition(Object.values(meals));
    
    return {
      date,
      meals,
      totalNutrition
    };
  }
  
  /**
   * Select the best recipe for a specific meal slot
   */
  private static async selectMealForSlot(
    slotType: string,
    targetCarbs: number,
    availableRecipes: Recipe[],
    usedRecipes: Map<string, number>,
    options: MealPlanGenerationOptions,
    specialRequirements: { requireProtein?: boolean } = {}
  ): Promise<MealSlot> {
    
    // Filter recipes for this meal type
    const categoryFilter = this.getMealCategoryFilter(slotType);
    let candidates = availableRecipes.filter(recipe => {
      if (categoryFilter && recipe.category !== categoryFilter) return false;
      
      // Check carb range (allow some flexibility)
      const carbTolerance = targetCarbs * 0.3; // 30% tolerance
      const recipeCarbs = recipe.nutrition.carbohydrates;
      if (recipeCarbs < targetCarbs - carbTolerance || 
          recipeCarbs > targetCarbs + carbTolerance) {
        return false;
      }
      
      // Check protein requirement for evening snacks
      if (specialRequirements.requireProtein && recipe.nutrition.protein < 5) {
        return false;
      }
      
      // Limit recipe reuse
      const usageCount = usedRecipes.get(recipe.id) || 0;
      if (usageCount >= options.maxRecipeRepeats) {
        return false;
      }
      
      return true;
    });
    
    if (candidates.length === 0) {
      // Fallback: relax constraints
      console.log(`[MEAL_PLAN] No candidates for ${slotType}, relaxing constraints`);
      candidates = availableRecipes.filter(recipe => {
        if (categoryFilter && recipe.category !== categoryFilter) return false;
        const usageCount = usedRecipes.get(recipe.id) || 0;
        return usageCount < options.maxRecipeRepeats + 2; // Allow more repeats as fallback
      });
    }
    
    if (candidates.length === 0) {
      throw new Error(`No suitable recipes found for ${slotType}`);
    }
    
    // Score and select best candidate
    const scoredCandidates = candidates.map(recipe => ({
      recipe,
      score: this.scoreRecipeForSlot(recipe, targetCarbs, usedRecipes, options)
    }));
    
    // Sort by score (higher is better)
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    // Add some randomness to avoid always picking the same "best" recipe
    const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
    const selectedCandidate = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    
    const selectedRecipe = selectedCandidate.recipe;
    
    // Track usage
    const currentUsage = usedRecipes.get(selectedRecipe.id) || 0;
    usedRecipes.set(selectedRecipe.id, currentUsage + 1);
    
    console.log(`[MEAL_PLAN] Selected for ${slotType}: ${selectedRecipe.title} (${selectedRecipe.nutrition.carbohydrates}g carbs)`);
    
    return this.createMealSlot(
      selectedRecipe, 
      1, // Default serving size
      categoryFilter || 'snack'
    );
  }
  
  /**
   * Score a recipe for a specific meal slot
   */
  private static scoreRecipeForSlot(
    recipe: Recipe,
    targetCarbs: number,
    usedRecipes: Map<string, number>,
    options: MealPlanGenerationOptions
  ): number {
    let score = 100;
    
    // Carb accuracy (closer to target = higher score)
    const carbDiff = Math.abs(recipe.nutrition.carbohydrates - targetCarbs);
    score -= carbDiff * 2; // Penalty for carb deviation
    
    // Usage penalty (less used = higher score)
    const usage = usedRecipes.get(recipe.id) || 0;
    score -= usage * 20; // Penalty for repeated use
    
    // Prioritize new recipes if requested
    if (options.prioritizeNew) {
      score += usage === 0 ? 30 : 0; // Bonus for unused recipes
    }
    
    // Nutrition quality bonus
    score += recipe.nutrition.protein * 0.5; // Bonus for protein
    score += recipe.nutrition.fiber * 2; // Bonus for fiber
    
    // Time bonus (shorter cook time = slight bonus)
    score += Math.max(0, (30 - recipe.totalTime) * 0.5);
    
    return score;
  }
  
  /**
   * Create a meal slot from a recipe
   */
  private static createMealSlot(
    recipe: Recipe, 
    servings: number, 
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): MealSlot {
    return {
      recipeId: recipe.id,
      recipeName: recipe.title,
      servings,
      nutrition: {
        calories: recipe.nutrition.calories * servings,
        carbohydrates: recipe.nutrition.carbohydrates * servings,
        protein: recipe.nutrition.protein * servings,
        fat: recipe.nutrition.fat * servings,
        fiber: recipe.nutrition.fiber * servings,
        sugar: recipe.nutrition.sugar ? recipe.nutrition.sugar * servings : undefined,
        sodium: recipe.nutrition.sodium ? recipe.nutrition.sodium * servings : undefined
      },
      cookTime: recipe.totalTime,
      category
    };
  }
  
  /**
   * Create empty meal slot for skipped meals
   */
  private static createEmptyMealSlot(slotType: string): MealSlot {
    return {
      recipeId: '',
      recipeName: `No ${slotType}`,
      servings: 0,
      nutrition: {
        calories: 0,
        carbohydrates: 0,
        protein: 0,
        fat: 0,
        fiber: 0
      },
      cookTime: 0,
      category: 'snack'
    };
  }
  
  /**
   * Calculate total nutrition for a day
   */
  private static calculateDayNutrition(meals: MealSlot[]): DayNutrition {
    return meals.reduce((total, meal) => ({
      calories: total.calories + meal.nutrition.calories,
      carbohydrates: total.carbohydrates + meal.nutrition.carbohydrates,
      protein: total.protein + meal.nutrition.protein,
      fat: total.fat + meal.nutrition.fat,
      fiber: total.fiber + meal.nutrition.fiber,
      mealsCount: total.mealsCount + (meal.category !== 'snack' ? 1 : 0),
      snacksCount: total.snacksCount + (meal.category === 'snack' ? 1 : 0)
    }), {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      mealsCount: 0,
      snacksCount: 0
    });
  }
  
  /**
   * Get the recipe category filter for a meal slot
   */
  private static getMealCategoryFilter(slotType: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | null {
    if (slotType === 'breakfast') return 'breakfast';
    if (slotType === 'lunch') return 'lunch';
    if (slotType === 'dinner') return 'dinner';
    if (slotType.includes('snack') || slotType.includes('Snack')) return 'snack';
    return null;
  }
  
  /**
   * Get carb target range for a meal type
   */
  private static getCarbTargetForMeal(mealType: string, preferences: MealPlanPreferences) {
    const target = preferences.carbDistribution[mealType as keyof typeof preferences.carbDistribution] || 30;
    return {
      min: target * 0.7, // 30% below target
      max: target * 1.3  // 30% above target
    };
  }
  
  /**
   * Generate a unique ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * Generate a descriptive plan name
   */
  private static generatePlanName(startDate: string, days: number): string {
    const date = new Date(startDate);
    const weekStart = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return `GD Meal Plan - Week of ${weekStart}`;
  }
  
  /**
   * Log meal plan statistics
   */
  private static logPlanStats(mealPlan: MealPlan): void {
    const totalMeals = mealPlan.days.length * 6; // 6 meal slots per day
    const uniqueRecipes = new Set();
    let totalCarbs = 0;
    let totalProtein = 0;
    
    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        if (meal.recipeId) uniqueRecipes.add(meal.recipeId);
      });
      totalCarbs += day.totalNutrition.carbohydrates;
      totalProtein += day.totalNutrition.protein;
    });
    
    console.log(`[MEAL_PLAN] Plan Stats:`);
    console.log(`  - ${mealPlan.days.length} days planned`);
    console.log(`  - ${uniqueRecipes.size} unique recipes used`);
    console.log(`  - Avg daily carbs: ${(totalCarbs / mealPlan.days.length).toFixed(1)}g`);
    console.log(`  - Avg daily protein: ${(totalProtein / mealPlan.days.length).toFixed(1)}g`);
  }
}