import { Recipe } from "@/src/types/recipe";
import { SpoonacularClient } from "./client";
import { transformSpoonacularRecipe } from "./transformers";
import { validateRecipeForGD, calculateGDScore, GD_REQUIREMENTS } from "./validators";
import { adminDb } from "@/src/lib/firebase/admin";

export class RecipeImporter {
  private client: SpoonacularClient;

  constructor(apiKey: string) {
    this.client = new SpoonacularClient(apiKey);
  }

  /**
   * Import a single recipe by ID
   */
  async importRecipe(recipeId: string): Promise<{
    success: boolean;
    recipe?: Recipe;
    error?: string;
  }> {
    try {
      // Fetch recipe details from Spoonacular
      const spoonacularRecipe = await this.client.getRecipeInfo(parseInt(recipeId));

      // Determine category based on recipe type or meal types
      let category: Recipe["category"] = "dinner"; // default
      
      if (spoonacularRecipe.dishTypes?.includes("breakfast")) {
        category = "breakfast";
      } else if (spoonacularRecipe.dishTypes?.includes("snack")) {
        category = "snack";
      } else if (spoonacularRecipe.readyInMinutes <= 30) {
        category = "lunch";
      }

      // Validate for GD compliance
      const mealType = category as keyof typeof GD_REQUIREMENTS;
      const validation = validateRecipeForGD(spoonacularRecipe, mealType);
      const gdScore = calculateGDScore(spoonacularRecipe, mealType);

      // Transform to our format
      const recipe = transformSpoonacularRecipe(spoonacularRecipe, category);

      // Add validation info
      recipe.gdValidation = {
        isValid: validation.isValid,
        score: gdScore,
        details: validation,
        warnings: validation.adjustmentSuggestions || []
      };

      // Add import metadata
      recipe.importedAt = new Date().toISOString();
      recipe.source = "spoonacular";
      recipe.spoonacularId = recipeId;

      // Save to Firebase
      const docRef = await adminDb().collection("recipes").add(recipe);
      recipe.id = docRef.id;

      return {
        success: true,
        recipe,
      };
    } catch (error) {
      console.error(`Error importing recipe ${recipeId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Import multiple recipes
   */
  async importMultiple(recipeIds: string[]): Promise<{
    imported: Recipe[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const imported: Recipe[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const recipeId of recipeIds) {
      const result = await this.importRecipe(recipeId);
      
      if (result.success && result.recipe) {
        imported.push(result.recipe);
      } else {
        failed.push({
          id: recipeId,
          error: result.error || "Unknown error",
        });
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { imported, failed };
  }
}