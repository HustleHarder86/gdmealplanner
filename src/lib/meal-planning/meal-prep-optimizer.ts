import { Recipe, Ingredient } from '@/types/firebase';
import { WeeklyMealPlan, DailyMealPlan } from './types';

export interface PrepBatch {
  ingredients: Ingredient[];
  recipes: Array<{
    recipe: Recipe;
    day: string;
    mealType: string;
  }>;
  prepInstructions: string[];
  storageInstructions: string;
  prepTime: number;
}

export interface MealPrepPlan {
  prepDay: Date;
  batches: PrepBatch[];
  totalPrepTime: number;
  storageGuide: Map<string, string>;
  reheatingInstructions: Map<string, string>;
}

export class MealPrepOptimizer {
  /**
   * Optimize meal plan for batch cooking
   */
  static optimizeForMealPrep(weeklyPlan: WeeklyMealPlan): MealPrepPlan {
    const prepBatches: PrepBatch[] = [];
    const ingredientGroups = this.groupSimilarIngredients(weeklyPlan);
    const recipeGroups = this.groupSimilarRecipes(weeklyPlan);

    // Create batches for proteins
    const proteinBatch = this.createProteinBatch(weeklyPlan);
    if (proteinBatch) prepBatches.push(proteinBatch);

    // Create batches for grains
    const grainBatch = this.createGrainBatch(weeklyPlan);
    if (grainBatch) prepBatches.push(grainBatch);

    // Create batches for chopped vegetables
    const vegBatch = this.createVegetableBatch(weeklyPlan);
    if (vegBatch) prepBatches.push(vegBatch);

    // Create batches for similar recipes
    recipeGroups.forEach((recipes, groupKey) => {
      if (recipes.length > 1) {
        const batch = this.createRecipeBatch(recipes);
        if (batch) prepBatches.push(batch);
      }
    });

    const totalPrepTime = prepBatches.reduce((sum, batch) => sum + batch.prepTime, 0);

    return {
      prepDay: new Date(weeklyPlan.startDate.getTime() - 24 * 60 * 60 * 1000), // Day before
      batches: prepBatches,
      totalPrepTime,
      storageGuide: this.createStorageGuide(),
      reheatingInstructions: this.createReheatingGuide()
    };
  }

  /**
   * Group ingredients that can be prepped together
   */
  private static groupSimilarIngredients(plan: WeeklyMealPlan): Map<string, Ingredient[]> {
    const groups = new Map<string, Ingredient[]>();

    plan.days.forEach(day => {
      const meals = this.getAllMealsFromDay(day);
      
      meals.forEach(({ recipe }) => {
        recipe.ingredients.forEach(ingredient => {
          const category = this.categorizeIngredient(ingredient);
          if (!groups.has(category)) {
            groups.set(category, []);
          }
          groups.get(category)!.push(ingredient);
        });
      });
    });

    return groups;
  }

  /**
   * Group similar recipes that can be batch cooked
   */
  private static groupSimilarRecipes(plan: WeeklyMealPlan): Map<string, Array<{recipe: Recipe, day: string, mealType: string}>> {
    const groups = new Map<string, Array<{recipe: Recipe, day: string, mealType: string}>>();

    plan.days.forEach((day, dayIndex) => {
      const meals = this.getAllMealsFromDay(day);
      
      meals.forEach(({ recipe, mealType }) => {
        const groupKey = this.getRecipeGroupKey(recipe);
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push({
          recipe,
          day: `Day ${dayIndex + 1}`,
          mealType
        });
      });
    });

    return groups;
  }

  /**
   * Create batch for proteins
   */
  private static createProteinBatch(plan: WeeklyMealPlan): PrepBatch | null {
    const proteins: Map<string, number> = new Map();
    const proteinRecipes: Array<{recipe: Recipe, day: string, mealType: string}> = [];

    plan.days.forEach((day, dayIndex) => {
      const meals = this.getAllMealsFromDay(day);
      
      meals.forEach(({ recipe, mealType }) => {
        recipe.ingredients.forEach(ing => {
          if (this.isProtein(ing.name)) {
            const current = proteins.get(ing.name) || 0;
            proteins.set(ing.name, current + ing.amount);
            
            if (!proteinRecipes.some(pr => pr.recipe.id === recipe.id && pr.day === `Day ${dayIndex + 1}`)) {
              proteinRecipes.push({
                recipe,
                day: `Day ${dayIndex + 1}`,
                mealType
              });
            }
          }
        });
      });
    });

    if (proteins.size === 0) return null;

    const ingredients = Array.from(proteins.entries()).map(([name, amount]) => ({
      name,
      amount,
      unit: this.getProteinUnit(name),
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0
    }));

    return {
      ingredients,
      recipes: proteinRecipes,
      prepInstructions: [
        'Season all proteins with basic salt and pepper',
        'Cook chicken breasts in batches at 375°F for 20-25 minutes',
        'Cook ground meats in large skillet, breaking apart as they cook',
        'Let cool completely before storing',
        'Divide into meal-sized portions'
      ],
      storageInstructions: 'Store cooked proteins in airtight containers for up to 4 days',
      prepTime: 45
    };
  }

  /**
   * Create batch for grains
   */
  private static createGrainBatch(plan: WeeklyMealPlan): PrepBatch | null {
    const grains: Map<string, number> = new Map();
    const grainRecipes: Array<{recipe: Recipe, day: string, mealType: string}> = [];

    plan.days.forEach((day, dayIndex) => {
      const meals = this.getAllMealsFromDay(day);
      
      meals.forEach(({ recipe, mealType }) => {
        recipe.ingredients.forEach(ing => {
          if (this.isGrain(ing.name)) {
            const current = grains.get(ing.name) || 0;
            grains.set(ing.name, current + ing.amount);
            
            if (!grainRecipes.some(gr => gr.recipe.id === recipe.id && gr.day === `Day ${dayIndex + 1}`)) {
              grainRecipes.push({
                recipe,
                day: `Day ${dayIndex + 1}`,
                mealType
              });
            }
          }
        });
      });
    });

    if (grains.size === 0) return null;

    const ingredients = Array.from(grains.entries()).map(([name, amount]) => ({
      name,
      amount,
      unit: 'cups',
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0
    }));

    return {
      ingredients,
      recipes: grainRecipes,
      prepInstructions: [
        'Cook quinoa with 2:1 water ratio, bring to boil then simmer 15 minutes',
        'Cook brown rice with 2.5:1 water ratio for 45 minutes',
        'Let grains cool completely before storing',
        'Fluff with fork before storing'
      ],
      storageInstructions: 'Store cooked grains in airtight containers for up to 5 days',
      prepTime: 30
    };
  }

  /**
   * Create batch for vegetables
   */
  private static createVegetableBatch(plan: WeeklyMealPlan): PrepBatch | null {
    const vegetables: Map<string, number> = new Map();
    const vegRecipes: Array<{recipe: Recipe, day: string, mealType: string}> = [];

    plan.days.forEach((day, dayIndex) => {
      const meals = this.getAllMealsFromDay(day);
      
      meals.forEach(({ recipe, mealType }) => {
        recipe.ingredients.forEach(ing => {
          if (this.isVegetable(ing.name) && this.canBePrepped(ing.name)) {
            const current = vegetables.get(ing.name) || 0;
            vegetables.set(ing.name, current + ing.amount);
            
            if (!vegRecipes.some(vr => vr.recipe.id === recipe.id && vr.day === `Day ${dayIndex + 1}`)) {
              vegRecipes.push({
                recipe,
                day: `Day ${dayIndex + 1}`,
                mealType
              });
            }
          }
        });
      });
    });

    if (vegetables.size === 0) return null;

    const ingredients = Array.from(vegetables.entries()).map(([name, amount]) => ({
      name,
      amount,
      unit: 'cups',
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0
    }));

    return {
      ingredients,
      recipes: vegRecipes,
      prepInstructions: [
        'Wash all vegetables thoroughly',
        'Chop bell peppers, carrots, and celery into uniform pieces',
        'Store leafy greens with paper towel to absorb moisture',
        'Keep cut vegetables in separate containers'
      ],
      storageInstructions: 'Store prepped vegetables in airtight containers with damp paper towel for up to 4 days',
      prepTime: 20
    };
  }

  /**
   * Create batch for similar recipes
   */
  private static createRecipeBatch(
    recipes: Array<{recipe: Recipe, day: string, mealType: string}>
  ): PrepBatch | null {
    if (recipes.length < 2) return null;

    const firstRecipe = recipes[0].recipe;
    const commonIngredients = this.findCommonIngredients(recipes.map(r => r.recipe));

    if (commonIngredients.length < 3) return null; // Not enough similarity

    return {
      ingredients: commonIngredients,
      recipes,
      prepInstructions: [
        `Prepare base ingredients for ${firstRecipe.title}`,
        'Cook components that are shared across recipes',
        'Store separately and combine when reheating'
      ],
      storageInstructions: 'Store components separately for maximum freshness',
      prepTime: Math.max(...recipes.map(r => r.recipe.prepTime))
    };
  }

  /**
   * Helper methods
   */
  private static getAllMealsFromDay(day: DailyMealPlan): Array<{recipe: Recipe, mealType: string}> {
    const meals: Array<{recipe: Recipe, mealType: string}> = [];
    
    if (day.breakfast) meals.push({ recipe: day.breakfast, mealType: 'breakfast' });
    if (day.morningSnack) meals.push({ recipe: day.morningSnack, mealType: 'morning snack' });
    if (day.lunch) meals.push({ recipe: day.lunch, mealType: 'lunch' });
    if (day.afternoonSnack) meals.push({ recipe: day.afternoonSnack, mealType: 'afternoon snack' });
    if (day.dinner) meals.push({ recipe: day.dinner, mealType: 'dinner' });
    if (day.eveningSnack) meals.push({ recipe: day.eveningSnack, mealType: 'evening snack' });
    
    return meals;
  }

  private static categorizeIngredient(ingredient: Ingredient): string {
    const name = ingredient.name.toLowerCase();
    
    if (this.isProtein(name)) return 'proteins';
    if (this.isGrain(name)) return 'grains';
    if (this.isVegetable(name)) return 'vegetables';
    if (this.isDairy(name)) return 'dairy';
    
    return 'other';
  }

  private static isProtein(name: string): boolean {
    const proteins = ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna', 'egg', 'tofu', 'beans', 'lentils'];
    return proteins.some(p => name.toLowerCase().includes(p));
  }

  private static isGrain(name: string): boolean {
    const grains = ['rice', 'quinoa', 'oats', 'pasta', 'bread', 'couscous', 'barley'];
    return grains.some(g => name.toLowerCase().includes(g));
  }

  private static isVegetable(name: string): boolean {
    const vegetables = ['lettuce', 'tomato', 'cucumber', 'carrot', 'broccoli', 'spinach', 'pepper', 'onion', 'celery', 'cauliflower'];
    return vegetables.some(v => name.toLowerCase().includes(v));
  }

  private static isDairy(name: string): boolean {
    const dairy = ['milk', 'yogurt', 'cheese', 'butter', 'cream'];
    return dairy.some(d => name.toLowerCase().includes(d));
  }

  private static canBePrepped(vegName: string): boolean {
    const preppable = ['pepper', 'carrot', 'celery', 'onion', 'broccoli', 'cauliflower'];
    return preppable.some(p => vegName.toLowerCase().includes(p));
  }

  private static getProteinUnit(name: string): string {
    if (name.includes('ground')) return 'lbs';
    return 'oz';
  }

  private static getRecipeGroupKey(recipe: Recipe): string {
    // Group by main protein or cooking method
    const protein = recipe.ingredients.find(ing => this.isProtein(ing.name));
    if (protein) {
      return `protein_${protein.name.split(' ')[0]}`;
    }
    
    // Group by meal type tag
    if (recipe.tags.includes('breakfast')) return 'breakfast';
    if (recipe.tags.includes('snack')) return 'snack';
    
    return 'other';
  }

  private static findCommonIngredients(recipes: Recipe[]): Ingredient[] {
    if (recipes.length === 0) return [];
    
    const firstRecipe = recipes[0];
    const commonIngredients: Ingredient[] = [];
    
    firstRecipe.ingredients.forEach(ing => {
      const isCommon = recipes.every(recipe => 
        recipe.ingredients.some(ri => 
          ri.name.toLowerCase() === ing.name.toLowerCase()
        )
      );
      
      if (isCommon) {
        commonIngredients.push(ing);
      }
    });
    
    return commonIngredients;
  }

  private static createStorageGuide(): Map<string, string> {
    const guide = new Map<string, string>();
    
    guide.set('cooked_grains', 'Store in airtight containers in refrigerator for up to 5 days. Add a splash of water when reheating.');
    guide.set('cooked_proteins', 'Store in airtight containers for up to 4 days. Can freeze for up to 3 months.');
    guide.set('chopped_vegetables', 'Store in airtight containers with paper towel for up to 4 days. Keep onions separate.');
    guide.set('prepared_salads', 'Store dressing separately. Assemble just before eating.');
    guide.set('cooked_eggs', 'Hard-boiled eggs keep for up to 7 days in shell, 3 days peeled.');
    guide.set('soups_stews', 'Store in portioned containers for up to 4 days, or freeze for up to 3 months.');
    
    return guide;
  }

  private static createReheatingGuide(): Map<string, string> {
    const guide = new Map<string, string>();
    
    guide.set('grains', 'Add 1-2 tbsp water per cup, microwave covered for 1-2 minutes, stirring halfway.');
    guide.set('proteins', 'Microwave at 50% power for 1-2 minutes to prevent drying out.');
    guide.set('vegetables', 'Steam in microwave with 1 tbsp water for 1-2 minutes.');
    guide.set('soups', 'Heat on stovetop over medium heat, stirring occasionally, or microwave in 1-minute intervals.');
    guide.set('eggs', 'Best eaten cold or at room temperature. Do not reheat hard-boiled eggs.');
    
    return guide;
  }

  /**
   * Generate meal prep schedule
   */
  static generatePrepSchedule(prepPlan: MealPrepPlan): string[] {
    const schedule: string[] = [];
    const totalHours = Math.ceil(prepPlan.totalPrepTime / 60);
    
    schedule.push(`Total prep time: ${totalHours} hours`);
    schedule.push('');
    schedule.push('Suggested prep order:');
    schedule.push('1. Start grains (45 min mostly hands-off)');
    schedule.push('2. Season and cook proteins (30-45 min)');
    schedule.push('3. While proteins cook, chop vegetables (20 min)');
    schedule.push('4. Prepare any sauces or dressings (15 min)');
    schedule.push('5. Let everything cool before storing (20 min)');
    schedule.push('6. Portion and label containers (15 min)');
    
    return schedule;
  }
}