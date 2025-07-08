import { Recipe } from '@/src/types/recipe';

/**
 * Local Recipe Service - Works without API connection
 * This service can be used when the Spoonacular API is removed
 */
export class LocalRecipeService {
  private static recipes: Map<string, Recipe> = new Map();
  private static initialized = false;

  /**
   * Initialize the service with recipe data
   * This can be called with data from:
   * 1. A JSON file exported from the database
   * 2. Local storage
   * 3. IndexedDB for larger datasets
   */
  static async initialize(recipeData?: Recipe[]) {
    if (this.initialized && !recipeData) return;

    if (recipeData) {
      // Load from provided data
      this.recipes.clear();
      recipeData.forEach(recipe => {
        this.recipes.set(recipe.id, recipe);
      });
    } else {
      // Try to load from local storage
      const stored = localStorage.getItem('recipes_data');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((recipe: Recipe) => {
          this.recipes.set(recipe.id, recipe);
        });
      }
    }

    this.initialized = true;
    console.log(`LocalRecipeService initialized with ${this.recipes.size} recipes`);
  }

  /**
   * Get all recipes
   */
  static getAllRecipes(): Recipe[] {
    return Array.from(this.recipes.values());
  }

  /**
   * Get recipe by ID
   */
  static getRecipeById(id: string): Recipe | null {
    return this.recipes.get(id) || null;
  }

  /**
   * Get recipes by category
   */
  static getRecipesByCategory(category: string): Recipe[] {
    return Array.from(this.recipes.values()).filter(
      recipe => recipe.category === category
    );
  }

  /**
   * Search recipes
   */
  static searchRecipes(query: string): Recipe[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.recipes.values()).filter(recipe => {
      return (
        recipe.title.toLowerCase().includes(searchTerm) ||
        recipe.description?.toLowerCase().includes(searchTerm) ||
        recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(searchTerm)
        ) ||
        recipe.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        )
      );
    });
  }

  /**
   * Get recipes by nutrition criteria
   */
  static getRecipesByNutrition(criteria: {
    maxCarbs?: number;
    minProtein?: number;
    maxCalories?: number;
  }): Recipe[] {
    return Array.from(this.recipes.values()).filter(recipe => {
      const nutrition = recipe.nutrition;
      if (criteria.maxCarbs && nutrition.carbohydrates > criteria.maxCarbs) {
        return false;
      }
      if (criteria.minProtein && nutrition.protein < criteria.minProtein) {
        return false;
      }
      if (criteria.maxCalories && nutrition.calories > criteria.maxCalories) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get bedtime snacks (15g carbs + protein)
   */
  static getBedtimeSnacks(): Recipe[] {
    return Array.from(this.recipes.values()).filter(recipe => {
      return (
        recipe.category === 'snack' &&
        recipe.nutrition.carbohydrates >= 14 &&
        recipe.nutrition.carbohydrates <= 16 &&
        recipe.nutrition.protein >= 5
      );
    });
  }

  /**
   * Get quick recipes
   */
  static getQuickRecipes(maxMinutes: number = 30): Recipe[] {
    return Array.from(this.recipes.values()).filter(
      recipe => recipe.totalTime <= maxMinutes
    );
  }

  /**
   * Get random recipes
   */
  static getRandomRecipes(count: number): Recipe[] {
    const allRecipes = this.getAllRecipes();
    const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Save recipes to local storage
   */
  static saveToLocalStorage() {
    const data = Array.from(this.recipes.values());
    localStorage.setItem('recipes_data', JSON.stringify(data));
    console.log(`Saved ${data.length} recipes to local storage`);
  }

  /**
   * Get recipe statistics
   */
  static getStats() {
    const recipes = this.getAllRecipes();
    const byCategory = recipes.reduce((acc, recipe) => {
      acc[recipe.category] = (acc[recipe.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: recipes.length,
      byCategory,
      withLocalImages: recipes.filter(r => r.localImageUrl).length,
      quickRecipes: recipes.filter(r => r.totalTime <= 30).length,
      bedtimeSnacks: this.getBedtimeSnacks().length
    };
  }
}