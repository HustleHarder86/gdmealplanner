import { Recipe } from "../../types/recipe";
import { SpoonacularClient } from "./client";
import { SpoonacularRecipeInfo, SpoonacularSearchParams } from "./types";
import {
  validateRecipeForGD,
  calculateGDScore,
  filterUnsuitableRecipes,
  GD_REQUIREMENTS,
} from "./validators";
import { transformSpoonacularRecipe } from "./transformers";

/**
 * Recipe Import Service
 * Handles importing recipes from Spoonacular with GD validation
 */
export class RecipeImportService {
  private client: SpoonacularClient;

  constructor(apiKey?: string) {
    this.client = new SpoonacularClient(apiKey);
  }

  /**
   * Import test recipes for each meal category
   */
  async importTestRecipes(): Promise<{
    success: Recipe[];
    failed: Array<{ recipe: SpoonacularRecipeInfo; reason: string }>;
    stats: {
      total: number;
      imported: number;
      failed: number;
      byCategory: Record<string, number>;
    };
  }> {
    const results = {
      success: [] as Recipe[],
      failed: [] as Array<{ recipe: SpoonacularRecipeInfo; reason: string }>,
    };

    // Define search parameters for each category
    const categorySearches: Array<{
      category: Recipe["category"];
      params: SpoonacularSearchParams;
      targetCount: number;
    }> = [
      {
        category: "breakfast",
        params: {
          type: "breakfast",
          maxReadyTime: 30,
          minCarbs: GD_REQUIREMENTS.breakfast.minCarbs,
          maxCarbs: GD_REQUIREMENTS.breakfast.maxCarbs,
          minProtein: GD_REQUIREMENTS.breakfast.minProtein,
          minFiber: GD_REQUIREMENTS.breakfast.minFiber,
          sort: "healthiness",
          sortDirection: "desc",
        },
        targetCount: 3,
      },
      {
        category: "lunch",
        params: {
          type: "main course",
          query: "salad sandwich wrap",
          maxReadyTime: 45,
          minCarbs: GD_REQUIREMENTS.lunch.minCarbs,
          maxCarbs: GD_REQUIREMENTS.lunch.maxCarbs,
          minProtein: GD_REQUIREMENTS.lunch.minProtein,
          minFiber: GD_REQUIREMENTS.lunch.minFiber,
          sort: "healthiness",
          sortDirection: "desc",
        },
        targetCount: 3,
      },
      {
        category: "dinner",
        params: {
          type: "main course",
          maxReadyTime: 60,
          minCarbs: GD_REQUIREMENTS.dinner.minCarbs,
          maxCarbs: GD_REQUIREMENTS.dinner.maxCarbs,
          minProtein: GD_REQUIREMENTS.dinner.minProtein,
          minFiber: GD_REQUIREMENTS.dinner.minFiber,
          sort: "healthiness",
          sortDirection: "desc",
        },
        targetCount: 3,
      },
      {
        category: "snack",
        params: {
          type: "snack",
          maxReadyTime: 15,
          minCarbs: GD_REQUIREMENTS.snack.minCarbs,
          maxCarbs: GD_REQUIREMENTS.snack.maxCarbs,
          minProtein: GD_REQUIREMENTS.snack.minProtein,
          minFiber: GD_REQUIREMENTS.snack.minFiber,
          sort: "healthiness",
          sortDirection: "desc",
        },
        targetCount: 1,
      },
    ];

    // Process each category
    for (const { category, params, targetCount } of categorySearches) {
      console.log(`\nSearching for ${category} recipes...`);

      try {
        // Search for recipes
        const searchResults = await this.client.searchRecipes({
          ...params,
          number: targetCount * 3, // Get extra to account for filtering
          addRecipeNutrition: true,
        });

        console.log(
          `Found ${searchResults.results.length} ${category} recipes`,
        );

        // Get detailed info for promising recipes
        const recipeIds = searchResults.results
          .slice(0, targetCount * 2)
          .map((r) => r.id);
        const detailedRecipes = await this.client.getBulkRecipeInfo(recipeIds);

        // Filter out unsuitable recipes
        const suitableRecipes = filterUnsuitableRecipes(detailedRecipes);

        // Process and validate each recipe
        let imported = 0;
        for (const spoonacularRecipe of suitableRecipes) {
          if (imported >= targetCount) break;

          // Validate for GD compliance
          const mealType = category;
          const validation = validateRecipeForGD(
            spoonacularRecipe,
            mealType as keyof typeof GD_REQUIREMENTS,
          );
          const gdScore = calculateGDScore(
            spoonacularRecipe,
            mealType as keyof typeof GD_REQUIREMENTS,
          );

          console.log(
            `Validating "${spoonacularRecipe.title}": Score ${gdScore}, Valid: ${validation.isValid}`,
          );

          if (validation.isValid || gdScore >= 70) {
            // Transform to our format
            const recipe = transformSpoonacularRecipe(
              spoonacularRecipe,
              category,
            );

            // Add validation info
            recipe.gdValidation = {
              isValid: validation.isValid,
              score: 0, // We don't have a score from the old validator
              details: validation,
              warnings: validation.adjustmentSuggestions || []
            }

            results.success.push(recipe);
            imported++;
            console.log(`✓ Imported: ${recipe.title}`);
          } else {
            results.failed.push({
              recipe: spoonacularRecipe,
              reason: validation.warnings.join("; "),
            });
            console.log(
              `✗ Rejected: ${spoonacularRecipe.title} - ${validation.warnings[0]}`,
            );
          }
        }

        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error importing ${category} recipes:`, error);
      }
    }

    // Calculate stats
    const stats = {
      total: results.success.length + results.failed.length,
      imported: results.success.length,
      failed: results.failed.length,
      byCategory: results.success.reduce(
        (acc, recipe) => {
          acc[recipe.category] = (acc[recipe.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return { ...results, stats };
  }

  /**
   * Search and validate recipes for a specific meal type
   */
  async searchGDCompliantRecipes(
    mealType: keyof typeof GD_REQUIREMENTS,
    additionalParams?: Partial<SpoonacularSearchParams>,
  ): Promise<Recipe[]> {
    const requirements = GD_REQUIREMENTS[mealType];

    // Set up search parameters
    const params: SpoonacularSearchParams = {
      minCarbs: requirements.minCarbs,
      maxCarbs: requirements.maxCarbs,
      minProtein: requirements.minProtein,
      minFiber: requirements.minFiber,
      number: 20, // Get more to filter
      sort: "healthiness",
      sortDirection: "desc",
      addRecipeNutrition: true,
      ...additionalParams,
    };

    // Add meal type specific parameters
    if (mealType === "breakfast") {
      params.type = "breakfast";
    } else if (mealType === "lunch" || mealType === "dinner") {
      params.type = "main course";
    } else if (mealType.includes("snack")) {
      params.type = "snack";
    }

    // Search recipes
    const searchResults = await this.client.searchRecipes(params);

    // Get detailed info
    const recipeIds = searchResults.results.map((r) => r.id);
    const detailedRecipes = await this.client.getBulkRecipeInfo(recipeIds);

    // Filter and validate
    const suitableRecipes = filterUnsuitableRecipes(detailedRecipes);
    const validRecipes: Recipe[] = [];

    for (const spoonacularRecipe of suitableRecipes) {
      const validation = validateRecipeForGD(spoonacularRecipe, mealType);
      const gdScore = calculateGDScore(spoonacularRecipe, mealType);

      if (validation.isValid || gdScore >= 65) {
        const recipe = transformSpoonacularRecipe(
          spoonacularRecipe,
          mealType as Recipe["category"]
        );
        recipe.gdValidation = {
          isValid: validation.isValid,
          score: gdScore,
          details: validation,
          warnings: validation.adjustmentSuggestions || []
        };
        validRecipes.push(recipe);
      }
    }

    return validRecipes;
  }

  /**
   * Import a single recipe by ID
   */
  async importRecipeById(
    recipeId: number,
    category: Recipe["category"],
  ): Promise<{ recipe?: Recipe; error?: string }> {
    try {
      const spoonacularRecipe = await this.client.getRecipeInfo(recipeId);

      // Determine meal type for validation
      const mealType = category;

      // Validate
      const validation = validateRecipeForGD(
        spoonacularRecipe,
        mealType as keyof typeof GD_REQUIREMENTS,
      );
      const gdScore = calculateGDScore(
        spoonacularRecipe,
        mealType as keyof typeof GD_REQUIREMENTS,
      );

      if (!validation.isValid && gdScore < 50) {
        return {
          error: `Recipe does not meet GD requirements: ${validation.warnings.join("; ")}`,
        };
      }

      // Transform
      const recipe = transformSpoonacularRecipe(spoonacularRecipe, category);
      recipe.gdValidation = {
        isValid: validation.isValid,
        score: gdScore,
        details: validation,
        warnings: validation.adjustmentSuggestions || []
      };

      return { recipe };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to import recipe",
      };
    }
  }

  /**
   * Get API quota status
   */
  async checkQuota(): Promise<{
    used: number;
    limit: number;
    remaining: number;
  }> {
    return this.client.getQuotaStatus();
  }
}
