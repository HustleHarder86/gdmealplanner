import { Recipe } from "@/src/types/recipe";
import { adminDb } from "@/src/lib/firebase/admin";

interface UpdateResult {
  success: boolean;
  recipesUpdated: number;
  errors: string[];
  timestamp: string;
  data?: any;
}

interface RecipeExport {
  exportDate: string;
  source: string;
  recipeCount: number;
  recipes: Recipe[];
}

/**
 * Vercel-compatible Offline Updater
 * This version doesn't write to the filesystem, instead it returns the data
 * that can be saved manually or served via an API endpoint
 */
export class OfflineUpdaterVercel {
  /**
   * Fetch all recipes from Firebase and return the export data
   */
  static async getOfflineRecipeData(): Promise<UpdateResult> {
    const result: UpdateResult = {
      success: false,
      recipesUpdated: 0,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Fetch all recipes from Firebase
      console.log("Fetching recipes from Firebase...");
      const recipesSnapshot = await adminDb().collection("recipes").get();
      const recipes: Recipe[] = [];

      recipesSnapshot.forEach((doc) => {
        const data = doc.data();
        recipes.push({
          id: doc.id,
          ...data,
        } as Recipe);
      });

      console.log(`Fetched ${recipes.length} recipes from Firebase`);
      result.recipesUpdated = recipes.length;

      // Group by category for stats
      const categoryStats = recipes.reduce(
        (acc, recipe) => {
          acc[recipe.category] = (acc[recipe.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Create the export object
      const recipeExport: RecipeExport = {
        exportDate: result.timestamp,
        source: process.env.NEXT_PUBLIC_APP_URL || "https://gdmealplanner.vercel.app",
        recipeCount: recipes.length,
        recipes,
      };

      // Add the data to the result
      result.data = {
        export: recipeExport,
        metadata: {
          lastUpdate: result.timestamp,
          recipeCount: recipes.length,
          categories: categoryStats,
          dataSize: JSON.stringify(recipeExport).length,
        },
      };

      result.success = true;
      console.log("Offline recipe data prepared successfully");
    } catch (error) {
      console.error("Error preparing offline recipes:", error);
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  /**
   * Store the offline data in Firebase for later retrieval
   * This is an alternative to filesystem storage
   */
  static async storeOfflineDataInFirebase(data: RecipeExport): Promise<void> {
    try {
      // Store in a special collection for offline data
      await adminDb()
        .collection("offlineData")
        .doc("production-recipes")
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        });

      // Also store metadata
      await adminDb()
        .collection("offlineData")
        .doc("metadata")
        .set({
          lastUpdate: new Date().toISOString(),
          recipeCount: data.recipeCount,
          categories: data.recipes.reduce(
            (acc, recipe) => {
              acc[recipe.category] = (acc[recipe.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        });

      console.log("Offline data stored in Firebase successfully");
    } catch (error) {
      console.error("Error storing offline data in Firebase:", error);
      throw error;
    }
  }

  /**
   * Retrieve offline data from Firebase
   */
  static async getOfflineDataFromFirebase(): Promise<RecipeExport | null> {
    try {
      const doc = await adminDb()
        .collection("offlineData")
        .doc("production-recipes")
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as RecipeExport;
    } catch (error) {
      console.error("Error retrieving offline data from Firebase:", error);
      return null;
    }
  }
}