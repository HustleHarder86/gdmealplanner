import { adminDb } from '../admin';
import { Recipe } from '../../../types/recipe';
import { FieldValue } from 'firebase-admin/firestore';

const RECIPES_COLLECTION = 'recipes';

export class RecipeModel {
  /**
   * Create or update a recipe in Firestore
   */
  static async save(recipe: Recipe): Promise<string> {
    try {
      const docRef = adminDb().collection(RECIPES_COLLECTION).doc(recipe.id);
      
      await docRef.set({
        ...recipe,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: recipe.createdAt || FieldValue.serverTimestamp(),
      });
      
      return recipe.id;
    } catch (error) {
      console.error('Error saving recipe:', error);
      throw new Error(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch save multiple recipes
   */
  static async batchSave(recipes: Recipe[]): Promise<void> {
    try {
      const batch = adminDb().batch();
      
      recipes.forEach(recipe => {
        const docRef = adminDb().collection(RECIPES_COLLECTION).doc(recipe.id);
        batch.set(docRef, {
          ...recipe,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: recipe.createdAt || FieldValue.serverTimestamp(),
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch saving recipes:', error);
      throw new Error(`Failed to batch save recipes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a recipe by ID
   */
  static async getById(id: string): Promise<Recipe | null> {
    try {
      const doc = await adminDb().collection(RECIPES_COLLECTION).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return doc.data() as Recipe;
    } catch (error) {
      console.error('Error getting recipe:', error);
      throw new Error(`Failed to get recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a recipe exists by ID
   */
  static async exists(id: string): Promise<boolean> {
    try {
      const doc = await adminDb().collection(RECIPES_COLLECTION).doc(id).get();
      return doc.exists;
    } catch (error) {
      console.error('Error checking recipe existence:', error);
      return false;
    }
  }

  /**
   * Get recipes by category
   */
  static async getByCategory(category: string, limit: number = 50): Promise<Recipe[]> {
    try {
      const snapshot = await adminDb()
        .collection(RECIPES_COLLECTION)
        .where('category', '==', category)
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Recipe);
    } catch (error) {
      console.error('Error getting recipes by category:', error);
      throw new Error(`Failed to get recipes by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all recipe IDs (for deduplication)
   */
  static async getAllIds(): Promise<string[]> {
    try {
      const snapshot = await adminDb()
        .collection(RECIPES_COLLECTION)
        .select() // Only get document IDs, not full data
        .get();
      
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting recipe IDs:', error);
      throw new Error(`Failed to get recipe IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total recipe count
   */
  static async getCount(): Promise<number> {
    try {
      const snapshot = await adminDb()
        .collection(RECIPES_COLLECTION)
        .count()
        .get();
      
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting recipe count:', error);
      return 0;
    }
  }

  /**
   * Get recipe count by category
   */
  static async getCountByCategory(): Promise<Record<string, number>> {
    try {
      const categories = ['breakfast', 'lunch', 'dinner', 'snack'];
      const counts: Record<string, number> = {};
      
      for (const category of categories) {
        const snapshot = await adminDb()
          .collection(RECIPES_COLLECTION)
          .where('category', '==', category)
          .count()
          .get();
        
        counts[category] = snapshot.data().count;
      }
      
      return counts;
    } catch (error) {
      console.error('Error getting recipe counts by category:', error);
      return {};
    }
  }
}