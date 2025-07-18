import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase/client';
import { Recipe, UserRecipeInput, Nutrition } from '@/src/types/recipe';
import { v4 as uuidv4 } from 'uuid';

const USER_RECIPES_COLLECTION = 'user_recipes';

export class UserRecipeService {
  /**
   * Create a new user recipe
   */
  static async createRecipe(userId: string, recipeInput: UserRecipeInput): Promise<Recipe> {
    try {
      const recipeId = uuidv4();
      
      // Calculate nutrition if not provided
      const nutrition = await this.calculateNutrition(recipeInput);
      
      // Calculate carb choices (15g carbs = 1 choice)
      const carbChoices = Math.round(nutrition.carbohydrates / 15);
      
      const recipe: Recipe = {
        id: recipeId,
        ...recipeInput,
        totalTime: recipeInput.prepTime + recipeInput.cookTime,
        nutrition,
        carbChoices,
        source: 'user',
        isUserCreated: true,
        userId,
        isPrivate: recipeInput.isPrivate || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add to Firebase
      await addDoc(collection(db, USER_RECIPES_COLLECTION), {
        ...recipe,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`[USER_RECIPE_SERVICE] Created recipe: ${recipe.title}`);
      return recipe;
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error creating recipe:', error);
      throw new Error(`Failed to create recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all recipes for a user
   */
  static async getUserRecipes(userId: string): Promise<Recipe[]> {
    try {
      const q = query(
        collection(db, USER_RECIPES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const recipes: Recipe[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        recipes.push({
          ...data,
          id: doc.id,
        } as Recipe);
      });
      
      console.log(`[USER_RECIPE_SERVICE] Retrieved ${recipes.length} recipes for user ${userId}`);
      return recipes;
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error getting user recipes:', error);
      throw new Error(`Failed to get user recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public user recipes (for community sharing)
   */
  static async getPublicUserRecipes(limit: number = 50): Promise<Recipe[]> {
    try {
      const q = query(
        collection(db, USER_RECIPES_COLLECTION),
        where('isPrivate', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const recipes: Recipe[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        recipes.push({
          ...data,
          id: doc.id,
        } as Recipe);
      });
      
      return recipes.slice(0, limit);
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error getting public recipes:', error);
      throw new Error(`Failed to get public recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific user recipe by ID
   */
  static async getRecipeById(recipeId: string, userId: string): Promise<Recipe | null> {
    try {
      const docRef = doc(db, USER_RECIPES_COLLECTION, recipeId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const recipe = docSnap.data() as Recipe;
      
      // Check if user has access to this recipe
      if (recipe.isPrivate && recipe.userId !== userId) {
        return null;
      }
      
      return {
        ...recipe,
        id: docSnap.id,
      };
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error getting recipe:', error);
      throw new Error(`Failed to get recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a user recipe
   */
  static async updateRecipe(recipeId: string, userId: string, updates: Partial<UserRecipeInput>): Promise<Recipe> {
    try {
      const docRef = doc(db, USER_RECIPES_COLLECTION, recipeId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Recipe not found');
      }
      
      const existingRecipe = docSnap.data() as Recipe;
      
      // Check if user owns this recipe
      if (existingRecipe.userId !== userId) {
        throw new Error('Unauthorized: You can only update your own recipes');
      }
      
      // Recalculate nutrition if ingredients or servings changed
      let nutrition = existingRecipe.nutrition;
      if (updates.ingredients || updates.servings) {
        const recipeForCalc = {
          ...existingRecipe,
          ...updates,
          ingredients: updates.ingredients || existingRecipe.ingredients,
          servings: updates.servings || existingRecipe.servings,
        };
        nutrition = await this.calculateNutrition(recipeForCalc);
      }
      
      const updatedData = {
        ...updates,
        nutrition,
        carbChoices: Math.round(nutrition.carbohydrates / 15),
        totalTime: updates.prepTime && updates.cookTime 
          ? updates.prepTime + updates.cookTime 
          : existingRecipe.totalTime,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(docRef, updatedData);
      
      const updatedRecipe = {
        ...existingRecipe,
        ...updatedData,
        id: recipeId,
      };
      
      console.log(`[USER_RECIPE_SERVICE] Updated recipe: ${updatedRecipe.title}`);
      return updatedRecipe;
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error updating recipe:', error);
      throw new Error(`Failed to update recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user recipe
   */
  static async deleteRecipe(recipeId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, USER_RECIPES_COLLECTION, recipeId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Recipe not found');
      }
      
      const recipe = docSnap.data() as Recipe;
      
      // Check if user owns this recipe
      if (recipe.userId !== userId) {
        throw new Error('Unauthorized: You can only delete your own recipes');
      }
      
      await deleteDoc(docRef);
      console.log(`[USER_RECIPE_SERVICE] Deleted recipe: ${recipe.title}`);
    } catch (error) {
      console.error('[USER_RECIPE_SERVICE] Error deleting recipe:', error);
      throw new Error(`Failed to delete recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate nutrition for a recipe
   * This is a simplified calculation - in a real app you'd use a nutrition API
   */
  private static async calculateNutrition(recipe: UserRecipeInput | Recipe): Promise<Nutrition> {
    // If nutrition is already provided (and complete), use it
    if (recipe.nutrition && 
        recipe.nutrition.calories && 
        recipe.nutrition.carbohydrates && 
        recipe.nutrition.protein && 
        recipe.nutrition.fat) {
      return recipe.nutrition as Nutrition;
    }
    
    // Simple nutrition estimation based on ingredients
    // In a real app, you'd integrate with a nutrition API like Spoonacular or USDA
    const estimatedNutrition = this.estimateNutritionFromIngredients(recipe.ingredients);
    
    // Adjust for servings
    const perServing = {
      calories: Math.round(estimatedNutrition.calories / recipe.servings),
      carbohydrates: Math.round(estimatedNutrition.carbohydrates / recipe.servings),
      protein: Math.round(estimatedNutrition.protein / recipe.servings),
      fat: Math.round(estimatedNutrition.fat / recipe.servings),
      fiber: Math.round(estimatedNutrition.fiber / recipe.servings),
      sugar: Math.round((estimatedNutrition.sugar || 0) / recipe.servings),
      sodium: Math.round((estimatedNutrition.sodium || 0) / recipe.servings),
    };
    
    return perServing;
  }

  /**
   * Estimate nutrition from ingredients
   * This is a very basic estimation - replace with proper nutrition API
   */
  private static estimateNutritionFromIngredients(ingredients: any[]): Nutrition {
    // Basic nutrition estimation based on common ingredients
    // This is just a placeholder - you should integrate with a proper nutrition API
    let calories = 0;
    let carbs = 0;
    let protein = 0;
    let fat = 0;
    let fiber = 0;
    let sugar = 0;
    let sodium = 0;
    
    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      const amount = ingredient.amount || 1;
      
      // Very basic estimation based on common ingredients
      if (name.includes('flour') || name.includes('bread')) {
        calories += amount * 100;
        carbs += amount * 20;
        protein += amount * 3;
        fiber += amount * 2;
      } else if (name.includes('sugar') || name.includes('honey')) {
        calories += amount * 300;
        carbs += amount * 75;
        sugar += amount * 75;
      } else if (name.includes('oil') || name.includes('butter')) {
        calories += amount * 800;
        fat += amount * 90;
      } else if (name.includes('egg')) {
        calories += amount * 70;
        protein += amount * 6;
        fat += amount * 5;
      } else if (name.includes('milk') || name.includes('yogurt')) {
        calories += amount * 50;
        carbs += amount * 5;
        protein += amount * 3;
        fat += amount * 2;
      } else if (name.includes('meat') || name.includes('chicken') || name.includes('fish')) {
        calories += amount * 150;
        protein += amount * 25;
        fat += amount * 5;
      } else if (name.includes('vegetable') || name.includes('lettuce') || name.includes('spinach')) {
        calories += amount * 20;
        carbs += amount * 4;
        fiber += amount * 2;
      } else if (name.includes('rice') || name.includes('pasta')) {
        calories += amount * 130;
        carbs += amount * 28;
        protein += amount * 3;
      } else {
        // Default estimation for unknown ingredients
        calories += amount * 50;
        carbs += amount * 10;
        protein += amount * 2;
      }
    });
    
    return {
      calories,
      carbohydrates: carbs,
      protein,
      fat,
      fiber,
      sugar,
      sodium,
    };
  }

  /**
   * Validate recipe for GD guidelines
   */
  static validateForGD(recipe: Recipe): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;
    
    const carbs = recipe.nutrition.carbohydrates;
    const fiber = recipe.nutrition.fiber;
    const protein = recipe.nutrition.protein;
    
    // Check carb content based on meal type
    if (recipe.category === 'breakfast' && (carbs < 15 || carbs > 45)) {
      warnings.push(`Breakfast should have 15-45g carbs, this has ${carbs}g`);
      isValid = false;
    } else if ((recipe.category === 'lunch' || recipe.category === 'dinner') && (carbs < 30 || carbs > 60)) {
      warnings.push(`Main meals should have 30-60g carbs, this has ${carbs}g`);
      isValid = false;
    } else if (recipe.category === 'snack' && (carbs < 10 || carbs > 30)) {
      warnings.push(`Snacks should have 10-30g carbs, this has ${carbs}g`);
      isValid = false;
    }
    
    // Check fiber content
    if (fiber < 3) {
      warnings.push(`Low fiber content (${fiber}g). Aim for 3g+ per serving.`);
    }
    
    // Check protein content
    if (protein < 5) {
      warnings.push(`Low protein content (${protein}g). Include protein to help stabilize blood sugar.`);
    }
    
    return { isValid, warnings };
  }
}