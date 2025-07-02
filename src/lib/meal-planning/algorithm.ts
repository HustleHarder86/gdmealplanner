import { Recipe, NutritionInfo, User } from '@/types/firebase';
import {
  MealSlot,
  DailyMealPlan,
  WeeklyMealPlan,
  MealPlanGenerationOptions,
  RecipeScore,
  NutritionTargets,
  MealPlanPreferences,
  RecipeWithCategory,
  ShoppingListItem
} from './types';

// Define meal slots with carb targets for gestational diabetes
const GD_MEAL_SLOTS: MealSlot[] = [
  { type: 'breakfast', targetCarbs: 30, minCarbs: 25, maxCarbs: 45, minProtein: 15, minFiber: 5 },
  { type: 'morningSnack', targetCarbs: 15, minCarbs: 10, maxCarbs: 20, minProtein: 5 },
  { type: 'lunch', targetCarbs: 45, minCarbs: 30, maxCarbs: 50, minProtein: 20, minFiber: 7 },
  { type: 'afternoonSnack', targetCarbs: 15, minCarbs: 10, maxCarbs: 20, minProtein: 5 },
  { type: 'dinner', targetCarbs: 45, minCarbs: 30, maxCarbs: 50, minProtein: 25, minFiber: 8 },
  { type: 'eveningSnack', targetCarbs: 20, minCarbs: 15, maxCarbs: 25, minProtein: 7 }
];

export class MealPlanningAlgorithm {
  private options: MealPlanGenerationOptions;
  private nutritionTargets: NutritionTargets;
  private usedRecipeTracking: Map<string, number> = new Map(); // Track recipe usage

  constructor(options: MealPlanGenerationOptions) {
    this.options = options;
    this.nutritionTargets = this.calculateNutritionTargets();
  }

  /**
   * Generate a complete weekly meal plan
   */
  async generateWeeklyMealPlan(): Promise<WeeklyMealPlan> {
    const days: DailyMealPlan[] = [];
    const startDate = new Date(this.options.startDate);
    
    // Filter recipes based on preferences
    const eligibleRecipes = this.filterRecipesByPreferences(this.options.availableRecipes);
    
    // Categorize recipes for better meal planning
    const categorizedRecipes = this.categorizeRecipes(eligibleRecipes);

    for (let day = 0; day < this.options.daysToGenerate; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      const dailyPlan = await this.generateDailyMealPlan(
        currentDate,
        categorizedRecipes,
        days
      );
      
      days.push(dailyPlan);
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + this.options.daysToGenerate - 1);

    return {
      startDate,
      endDate,
      days,
      shoppingList: this.generateShoppingList(days),
      userId: this.options.user.id || ''
    };
  }

  /**
   * Generate meal plan for a single day
   */
  private async generateDailyMealPlan(
    date: Date,
    categorizedRecipes: Map<string, Recipe[]>,
    previousDays: DailyMealPlan[]
  ): Promise<DailyMealPlan> {
    const dailyPlan: DailyMealPlan = {
      date,
      breakfast: null,
      morningSnack: null,
      lunch: null,
      afternoonSnack: null,
      dinner: null,
      eveningSnack: null,
      totalNutrition: this.createEmptyNutrition(),
      nutritionTargets: this.nutritionTargets
    };

    // Plan main meals first (breakfast, lunch, dinner)
    dailyPlan.breakfast = this.selectMealForSlot(
      GD_MEAL_SLOTS[0],
      categorizedRecipes.get('breakfast') || [],
      dailyPlan,
      previousDays
    );

    dailyPlan.lunch = this.selectMealForSlot(
      GD_MEAL_SLOTS[2],
      categorizedRecipes.get('lunch') || [],
      dailyPlan,
      previousDays
    );

    dailyPlan.dinner = this.selectMealForSlot(
      GD_MEAL_SLOTS[4],
      categorizedRecipes.get('dinner') || [],
      dailyPlan,
      previousDays
    );

    // Then plan snacks to balance the day
    dailyPlan.morningSnack = this.selectSnackForBalance(
      GD_MEAL_SLOTS[1],
      categorizedRecipes.get('snack') || [],
      dailyPlan,
      previousDays
    );

    dailyPlan.afternoonSnack = this.selectSnackForBalance(
      GD_MEAL_SLOTS[3],
      categorizedRecipes.get('snack') || [],
      dailyPlan,
      previousDays
    );

    dailyPlan.eveningSnack = this.selectSnackForBalance(
      GD_MEAL_SLOTS[5],
      categorizedRecipes.get('snack') || [],
      dailyPlan,
      previousDays
    );

    // Calculate total nutrition for the day
    dailyPlan.totalNutrition = this.calculateDayNutrition(dailyPlan);

    return dailyPlan;
  }

  /**
   * Select the best meal for a given slot
   */
  private selectMealForSlot(
    slot: MealSlot,
    availableRecipes: Recipe[],
    currentDay: DailyMealPlan,
    previousDays: DailyMealPlan[]
  ): Recipe | null {
    if (availableRecipes.length === 0) return null;

    // Score all available recipes
    const scoredRecipes = availableRecipes.map(recipe => 
      this.scoreRecipe(recipe, slot, currentDay, previousDays)
    );

    // Sort by score and select the best
    scoredRecipes.sort((a, b) => b.score - a.score);

    // Select from top candidates to add some variety
    const topCandidates = scoredRecipes.slice(0, Math.min(5, scoredRecipes.length));
    const selected = this.selectWithVariety(topCandidates);

    if (selected) {
      // Track usage
      const useCount = this.usedRecipeTracking.get(selected.recipe.id || '') || 0;
      this.usedRecipeTracking.set(selected.recipe.id || '', useCount + 1);
    }

    return selected?.recipe || null;
  }

  /**
   * Select a snack that helps balance the day's nutrition
   */
  private selectSnackForBalance(
    slot: MealSlot,
    availableSnacks: Recipe[],
    currentDay: DailyMealPlan,
    previousDays: DailyMealPlan[]
  ): Recipe | null {
    const currentNutrition = this.calculateDayNutrition(currentDay);
    const remainingCarbs = this.nutritionTargets.dailyCarbs - currentNutrition.carbs;
    const remainingProtein = this.nutritionTargets.dailyProtein - currentNutrition.protein;
    const remainingFiber = this.nutritionTargets.dailyFiber - (currentNutrition.fiber || 0);

    // Adjust slot targets based on what's needed
    const adjustedSlot: MealSlot = {
      ...slot,
      targetCarbs: Math.min(slot.targetCarbs, Math.max(slot.minCarbs, remainingCarbs / this.countRemainingMeals(currentDay))),
      minProtein: remainingProtein > 50 ? 7 : 5,
      minFiber: remainingFiber > 15 ? 3 : 1
    };

    return this.selectMealForSlot(adjustedSlot, availableSnacks, currentDay, previousDays);
  }

  /**
   * Score a recipe for a given meal slot
   */
  private scoreRecipe(
    recipe: Recipe,
    slot: MealSlot,
    currentDay: DailyMealPlan,
    previousDays: DailyMealPlan[]
  ): RecipeScore {
    let score = 100; // Base score
    let nutritionMatch = 0;
    let preferenceMatch = 0;
    let varietyScore = 0;
    let prepTimeScore = 0;

    // Nutrition matching (40% of score)
    const carbDiff = Math.abs(recipe.nutrition.carbs - slot.targetCarbs);
    if (recipe.nutrition.carbs >= slot.minCarbs && recipe.nutrition.carbs <= slot.maxCarbs) {
      nutritionMatch += 30 - carbDiff; // Closer to target is better
    } else {
      nutritionMatch -= carbDiff * 2; // Penalty for being outside range
    }

    if (slot.minProtein && recipe.nutrition.protein >= slot.minProtein) {
      nutritionMatch += 10;
    }

    if (slot.minFiber && recipe.nutrition.fiber && recipe.nutrition.fiber >= slot.minFiber) {
      nutritionMatch += 10;
    }

    // Preference matching (30% of score)
    if (this.options.preferences.favoriteRecipeIds.includes(recipe.id || '')) {
      preferenceMatch += 30;
    }

    // Variety scoring (20% of score)
    const recentUseCount = this.countRecentUses(recipe, previousDays);
    const totalUseCount = this.usedRecipeTracking.get(recipe.id || '') || 0;
    
    if (recentUseCount === 0) {
      varietyScore += 20;
    } else {
      varietyScore -= recentUseCount * 5;
    }

    if (totalUseCount > 2) {
      varietyScore -= (totalUseCount - 2) * 3;
    }

    // Prep time scoring (10% of score)
    if (this.options.preferences.prepTimePreference === 'quick' && 
        (recipe.prepTime + recipe.cookTime) <= 20) {
      prepTimeScore += 10;
    } else if (this.options.preferences.prepTimePreference === 'moderate' && 
               (recipe.prepTime + recipe.cookTime) <= 45) {
      prepTimeScore += 10;
    } else if (this.options.preferences.prepTimePreference === 'any') {
      prepTimeScore += 5;
    }

    // Calculate final score
    score = nutritionMatch * 0.4 + preferenceMatch * 0.3 + varietyScore * 0.2 + prepTimeScore * 0.1;

    // Apply penalties
    if (this.hasDietaryConflict(recipe)) {
      score = -1000; // Eliminate from consideration
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
   * Filter recipes based on user preferences and restrictions
   */
  private filterRecipesByPreferences(recipes: Recipe[]): Recipe[] {
    return recipes.filter(recipe => {
      // Check dietary restrictions
      if (this.hasDietaryConflict(recipe)) {
        return false;
      }

      // Check allergens
      if (this.hasAllergen(recipe)) {
        return false;
      }

      // Check disliked ingredients
      if (this.hasDislikedIngredient(recipe)) {
        return false;
      }

      // Must be GD-friendly (check tags)
      if (!recipe.tags.includes('gd-friendly')) {
        return false;
      }

      return true;
    });
  }

  /**
   * Categorize recipes by meal type
   */
  private categorizeRecipes(recipes: Recipe[]): Map<string, Recipe[]> {
    const categories = new Map<string, Recipe[]>();
    
    recipes.forEach(recipe => {
      const mealTypes = this.determineMealTypes(recipe);
      mealTypes.forEach(type => {
        if (!categories.has(type)) {
          categories.set(type, []);
        }
        categories.get(type)!.push(recipe);
      });
    });

    return categories;
  }

  /**
   * Determine which meal types a recipe is suitable for
   */
  private determineMealTypes(recipe: Recipe): string[] {
    const types: string[] = [];
    const tags = recipe.tags.map(t => t.toLowerCase());

    // Check explicit tags
    if (tags.includes('breakfast')) types.push('breakfast');
    if (tags.includes('lunch')) types.push('lunch');
    if (tags.includes('dinner')) types.push('dinner');
    if (tags.includes('snack')) types.push('snack');

    // If no explicit tags, infer from nutrition
    if (types.length === 0) {
      const carbs = recipe.nutrition.carbs;
      const protein = recipe.nutrition.protein;

      if (carbs >= 25 && carbs <= 50) {
        // Main meal range
        if (protein >= 20) {
          types.push('lunch', 'dinner');
        } else {
          types.push('breakfast');
        }
      } else if (carbs >= 10 && carbs <= 25) {
        // Snack range
        types.push('snack');
      }
    }

    return types.length > 0 ? types : ['lunch', 'dinner']; // Default to lunch/dinner
  }

  /**
   * Calculate nutrition targets based on user profile
   */
  private calculateNutritionTargets(): NutritionTargets {
    const profile = this.options.user.pregnancyProfile;
    let dailyCalories = 2200; // Base for pregnancy

    if (profile) {
      // Adjust based on trimester (estimated from weeks)
      const weekOfPregnancy = profile.weekOfPregnancy || 20;
      if (weekOfPregnancy <= 12) {
        dailyCalories = 2000;
      } else if (weekOfPregnancy <= 27) {
        dailyCalories = 2200;
      } else {
        dailyCalories = 2400;
      }

      // Adjust for multiple pregnancy
      if (profile.multiplePregnancy) {
        dailyCalories += 300;
      }
    }

    return {
      dailyCarbs: 175, // Minimum for GD
      dailyProtein: Math.round(dailyCalories * 0.20 / 4), // 20% of calories from protein
      dailyFiber: 28, // Pregnancy recommendation
      dailyCalories,
      maxSugar: 50, // Limit added sugars
      maxSodium: 2300 // mg per day
    };
  }

  /**
   * Helper methods
   */

  private hasDietaryConflict(recipe: Recipe): boolean {
    const restrictions = this.options.preferences.dietaryRestrictions.map(r => r.toLowerCase());
    const tags = recipe.tags.map(t => t.toLowerCase());

    // Check vegetarian
    if (restrictions.includes('vegetarian')) {
      const meatKeywords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'bacon'];
      const hasNeat = recipe.ingredients.some(ing => 
        meatKeywords.some(meat => ing.name.toLowerCase().includes(meat))
      );
      if (hasNeat && !tags.includes('vegetarian')) return true;
    }

    // Check vegan
    if (restrictions.includes('vegan')) {
      const animalProducts = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 
                             'bacon', 'milk', 'cheese', 'yogurt', 'butter', 'egg', 'honey'];
      const hasAnimalProduct = recipe.ingredients.some(ing => 
        animalProducts.some(product => ing.name.toLowerCase().includes(product))
      );
      if (hasAnimalProduct && !tags.includes('vegan')) return true;
    }

    // Check gluten-free
    if (restrictions.includes('gluten-free')) {
      const glutenIngredients = ['wheat', 'flour', 'bread', 'pasta', 'couscous', 'barley', 'rye'];
      const hasGluten = recipe.ingredients.some(ing => 
        glutenIngredients.some(gluten => ing.name.toLowerCase().includes(gluten))
      );
      if (hasGluten && !tags.includes('gluten-free')) return true;
    }

    return false;
  }

  private hasAllergen(recipe: Recipe): boolean {
    const allergens = this.options.preferences.allergens.map(a => a.toLowerCase());
    return recipe.ingredients.some(ing => 
      allergens.some(allergen => ing.name.toLowerCase().includes(allergen))
    );
  }

  private hasDislikedIngredient(recipe: Recipe): boolean {
    const disliked = this.options.preferences.dislikedIngredients.map(d => d.toLowerCase());
    return recipe.ingredients.some(ing => 
      disliked.some(dis => ing.name.toLowerCase().includes(dis))
    );
  }

  private countRecentUses(recipe: Recipe, previousDays: DailyMealPlan[]): number {
    let count = 0;
    const recentDays = previousDays.slice(-3); // Look at last 3 days

    recentDays.forEach(day => {
      if (day.breakfast?.id === recipe.id) count++;
      if (day.lunch?.id === recipe.id) count++;
      if (day.dinner?.id === recipe.id) count++;
      if (day.morningSnack?.id === recipe.id) count++;
      if (day.afternoonSnack?.id === recipe.id) count++;
      if (day.eveningSnack?.id === recipe.id) count++;
    });

    return count;
  }

  private countRemainingMeals(day: DailyMealPlan): number {
    let count = 0;
    if (!day.breakfast) count++;
    if (!day.morningSnack) count++;
    if (!day.lunch) count++;
    if (!day.afternoonSnack) count++;
    if (!day.dinner) count++;
    if (!day.eveningSnack) count++;
    return count;
  }

  private selectWithVariety(candidates: RecipeScore[]): RecipeScore | null {
    if (candidates.length === 0) return null;

    // Add some randomness for variety
    const varietyLevel = this.options.preferences.varietyLevel || 'medium';
    let selectionSize = 1;

    if (varietyLevel === 'high') {
      selectionSize = Math.min(3, candidates.length);
    } else if (varietyLevel === 'medium') {
      selectionSize = Math.min(2, candidates.length);
    }

    const topCandidates = candidates.slice(0, selectionSize);
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    
    return topCandidates[randomIndex];
  }

  private calculateDayNutrition(day: DailyMealPlan): NutritionInfo {
    const meals = [
      day.breakfast,
      day.morningSnack,
      day.lunch,
      day.afternoonSnack,
      day.dinner,
      day.eveningSnack
    ].filter(meal => meal !== null) as Recipe[];

    return meals.reduce((total, meal) => ({
      calories: total.calories + meal.nutrition.calories,
      carbs: total.carbs + meal.nutrition.carbs,
      protein: total.protein + meal.nutrition.protein,
      fat: total.fat + meal.nutrition.fat,
      fiber: (total.fiber || 0) + (meal.nutrition.fiber || 0),
      sugar: (total.sugar || 0) + (meal.nutrition.sugar || 0),
      sodium: (total.sodium || 0) + (meal.nutrition.sodium || 0),
      cholesterol: (total.cholesterol || 0) + (meal.nutrition.cholesterol || 0),
      saturatedFat: (total.saturatedFat || 0) + (meal.nutrition.saturatedFat || 0),
      transFat: (total.transFat || 0) + (meal.nutrition.transFat || 0)
    }), this.createEmptyNutrition());
  }

  private createEmptyNutrition(): NutritionInfo {
    return {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0
    };
  }

  /**
   * Generate shopping list from meal plan
   */
  private generateShoppingList(days: DailyMealPlan[]): ShoppingListItem[] {
    const ingredientMap = new Map<string, ShoppingListItem>();

    days.forEach((day, dayIndex) => {
      const dayString = `Day ${dayIndex + 1}`;
      const meals = [
        { recipe: day.breakfast, type: 'breakfast' },
        { recipe: day.morningSnack, type: 'morning snack' },
        { recipe: day.lunch, type: 'lunch' },
        { recipe: day.afternoonSnack, type: 'afternoon snack' },
        { recipe: day.dinner, type: 'dinner' },
        { recipe: day.eveningSnack, type: 'evening snack' }
      ];

      meals.forEach(({ recipe, type }) => {
        if (!recipe) return;

        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;
          
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.amount += ingredient.amount;
            existing.recipeReferences.push({
              recipeName: recipe.title,
              day: dayString,
              mealType: type
            });
          } else {
            ingredientMap.set(key, {
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              category: this.categorizeIngredient(ingredient.name),
              recipeReferences: [{
                recipeName: recipe.title,
                day: dayString,
                mealType: type
              }],
              checked: false
            });
          }
        });
      });
    });

    // Convert to array and sort by category
    const shoppingList = Array.from(ingredientMap.values());
    shoppingList.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return shoppingList;
  }

  private categorizeIngredient(ingredient: string): string {
    const lower = ingredient.toLowerCase();
    
    if (['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'egg'].some(meat => lower.includes(meat))) {
      return 'Protein';
    }
    if (['milk', 'yogurt', 'cheese', 'butter', 'cream'].some(dairy => lower.includes(dairy))) {
      return 'Dairy';
    }
    if (['apple', 'banana', 'orange', 'berries', 'grape', 'melon', 'peach', 'pear'].some(fruit => lower.includes(fruit))) {
      return 'Fruits';
    }
    if (['lettuce', 'tomato', 'cucumber', 'carrot', 'broccoli', 'spinach', 'pepper', 'onion'].some(veg => lower.includes(veg))) {
      return 'Vegetables';
    }
    if (['bread', 'rice', 'pasta', 'quinoa', 'oats', 'cereal'].some(grain => lower.includes(grain))) {
      return 'Grains';
    }
    if (['oil', 'nuts', 'seeds', 'avocado', 'olive'].some(fat => lower.includes(fat))) {
      return 'Healthy Fats';
    }
    if (['beans', 'lentils', 'chickpeas', 'tofu'].some(legume => lower.includes(legume))) {
      return 'Legumes';
    }
    
    return 'Other';
  }
}