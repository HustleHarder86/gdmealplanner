import { SpoonacularRecipeInfo } from "../types";
import crypto from "crypto";

/**
 * Deduplication Service for Automated Recipe Import
 * Prevents duplicate recipes from being imported into the database
 */

export interface DeduplicationResult {
  isDuplicate: boolean;
  duplicateType?: "exact" | "similar" | "variant";
  matchedRecipeId?: string;
  confidence?: number;
  reason?: string;
}

export interface RecipeFingerprint {
  id: string;
  titleHash: string;
  normalizedTitle: string;
  ingredientHash: string;
  nutritionHash: string;
  cookingTime: number;
  servings: number;
  mainIngredients: string[];
}

/**
 * Main deduplication class
 */
export class RecipeDeduplicator {
  private existingFingerprints: Map<string, RecipeFingerprint> = new Map();
  private titleIndex: Map<string, Set<string>> = new Map();
  private ingredientIndex: Map<string, Set<string>> = new Map();

  constructor() {
    // Initialize indexes
  }

  /**
   * Load existing recipe fingerprints from database
   */
  async loadExistingRecipes(recipes: Array<{ id: string; data: any }>): Promise<void> {
    for (const recipe of recipes) {
      const fingerprint = this.createFingerprint(recipe.data);
      this.existingFingerprints.set(recipe.id, fingerprint);
      
      // Update indexes
      this.indexRecipe(fingerprint);
    }
  }

  /**
   * Check if a recipe is a duplicate
   */
  checkDuplicate(recipe: SpoonacularRecipeInfo): DeduplicationResult {
    const fingerprint = this.createFingerprint(recipe);

    // 1. Check exact ID match (Spoonacular ID)
    const exactMatch = this.checkExactIdMatch(recipe.id);
    if (exactMatch.isDuplicate) {
      return exactMatch;
    }

    // 2. Check exact title match
    const titleMatch = this.checkExactTitleMatch(fingerprint.normalizedTitle);
    if (titleMatch.isDuplicate) {
      return titleMatch;
    }

    // 3. Check similar recipes (fuzzy matching)
    const similarMatch = this.checkSimilarRecipe(fingerprint);
    if (similarMatch.isDuplicate) {
      return similarMatch;
    }

    // 4. Check recipe variants
    const variantMatch = this.checkRecipeVariant(fingerprint);
    if (variantMatch.isDuplicate) {
      return variantMatch;
    }

    return { isDuplicate: false };
  }

  /**
   * Add a recipe to the deduplication index
   */
  addRecipe(recipeId: string, recipe: SpoonacularRecipeInfo): void {
    const fingerprint = this.createFingerprint(recipe);
    this.existingFingerprints.set(recipeId, fingerprint);
    this.indexRecipe(fingerprint);
  }

  /**
   * Create a fingerprint for a recipe
   */
  private createFingerprint(recipe: any): RecipeFingerprint {
    // Normalize title
    const normalizedTitle = this.normalizeTitle(recipe.title || "");
    
    // Hash title for quick comparison
    const titleHash = this.hash(normalizedTitle);
    
    // Extract and sort main ingredients
    const mainIngredients = this.extractMainIngredients(recipe);
    const ingredientHash = this.hash(mainIngredients.sort().join(","));
    
    // Create nutrition hash
    const nutritionHash = this.createNutritionHash(recipe);

    return {
      id: String(recipe.id),
      titleHash,
      normalizedTitle,
      ingredientHash,
      nutritionHash,
      cookingTime: recipe.readyInMinutes || 0,
      servings: recipe.servings || 0,
      mainIngredients,
    };
  }

  /**
   * Normalize recipe title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .split(" ")
      .filter((word) => word.length > 2) // Remove short words
      .filter((word) => !this.isStopWord(word)) // Remove stop words
      .sort()
      .join(" ");
  }

  /**
   * Check if a word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "about", "into", "through", "during",
      "before", "after", "above", "below", "between", "under", "over",
      "recipe", "easy", "quick", "simple", "best", "homemade", "healthy",
      "delicious", "tasty", "yummy"
    ]);
    return stopWords.has(word);
  }

  /**
   * Extract main ingredients from recipe
   */
  private extractMainIngredients(recipe: any): string[] {
    const ingredients = recipe.extendedIngredients || recipe.ingredients || [];
    const mainIngredients: string[] = [];

    for (const ingredient of ingredients) {
      const name = (ingredient.nameClean || ingredient.name || "").toLowerCase();
      
      // Skip common seasonings and small amounts
      if (this.isSeasoningOrMinor(name, ingredient.amount)) {
        continue;
      }

      // Extract the core ingredient name
      const coreName = this.extractCoreIngredientName(name);
      if (coreName && !mainIngredients.includes(coreName)) {
        mainIngredients.push(coreName);
      }
    }

    return mainIngredients.slice(0, 10); // Limit to top 10 ingredients
  }

  /**
   * Check if ingredient is a seasoning or minor ingredient
   */
  private isSeasoningOrMinor(name: string, amount?: number): boolean {
    const seasonings = new Set([
      "salt", "pepper", "oil", "butter", "sugar", "flour", "water",
      "garlic", "onion", "vanilla", "cinnamon", "paprika", "oregano",
      "basil", "thyme", "rosemary", "parsley", "bay leaf", "cumin"
    ]);

    // Check if it's a seasoning
    if (seasonings.has(name)) {
      return true;
    }

    // Check if amount is very small (likely a seasoning)
    if (amount && amount < 0.5) {
      return true;
    }

    return false;
  }

  /**
   * Extract core ingredient name (remove descriptors)
   */
  private extractCoreIngredientName(name: string): string {
    // Remove common descriptors
    const descriptors = [
      "fresh", "frozen", "canned", "dried", "ground", "whole", "chopped",
      "diced", "sliced", "minced", "crushed", "shredded", "grated",
      "boneless", "skinless", "lean", "low-fat", "fat-free", "organic"
    ];

    let coreName = name;
    for (const descriptor of descriptors) {
      coreName = coreName.replace(new RegExp(`\\b${descriptor}\\b`, "g"), "");
    }

    return coreName.trim();
  }

  /**
   * Create nutrition hash for comparison
   */
  private createNutritionHash(recipe: any): string {
    const nutrients = recipe.nutrition?.nutrients || [];
    
    // Extract key nutrients
    const carbs = this.getNutrientValue(nutrients, "carbohydrates");
    const protein = this.getNutrientValue(nutrients, "protein");
    const fat = this.getNutrientValue(nutrients, "fat");
    const calories = this.getNutrientValue(nutrients, "calories");

    // Round to reduce minor variations
    const roundedNutrition = {
      carbs: Math.round(carbs / 5) * 5,
      protein: Math.round(protein / 5) * 5,
      fat: Math.round(fat / 5) * 5,
      calories: Math.round(calories / 50) * 50,
    };

    return this.hash(JSON.stringify(roundedNutrition));
  }

  /**
   * Get nutrient value from nutrients array
   */
  private getNutrientValue(nutrients: any[], name: string): number {
    const nutrient = nutrients.find((n: any) =>
      n.name.toLowerCase().includes(name.toLowerCase())
    );
    return nutrient?.amount || 0;
  }

  /**
   * Create SHA256 hash
   */
  private hash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  /**
   * Index a recipe for fast lookup
   */
  private indexRecipe(fingerprint: RecipeFingerprint): void {
    // Index by title words
    const titleWords = fingerprint.normalizedTitle.split(" ");
    for (const word of titleWords) {
      if (!this.titleIndex.has(word)) {
        this.titleIndex.set(word, new Set());
      }
      this.titleIndex.get(word)!.add(fingerprint.id);
    }

    // Index by main ingredients
    for (const ingredient of fingerprint.mainIngredients) {
      if (!this.ingredientIndex.has(ingredient)) {
        this.ingredientIndex.set(ingredient, new Set());
      }
      this.ingredientIndex.get(ingredient)!.add(fingerprint.id);
    }
  }

  /**
   * Check for exact ID match
   */
  private checkExactIdMatch(spoonacularId: number): DeduplicationResult {
    const idStr = String(spoonacularId);
    
    for (const [recipeId, fingerprint] of this.existingFingerprints) {
      if (fingerprint.id === idStr) {
        return {
          isDuplicate: true,
          duplicateType: "exact",
          matchedRecipeId: recipeId,
          confidence: 100,
          reason: "Exact Spoonacular ID match",
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Check for exact title match
   */
  private checkExactTitleMatch(normalizedTitle: string): DeduplicationResult {
    const titleHash = this.hash(normalizedTitle);

    for (const [recipeId, fingerprint] of this.existingFingerprints) {
      if (fingerprint.titleHash === titleHash) {
        return {
          isDuplicate: true,
          duplicateType: "exact",
          matchedRecipeId: recipeId,
          confidence: 95,
          reason: "Exact title match",
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Check for similar recipes using fuzzy matching
   */
  private checkSimilarRecipe(fingerprint: RecipeFingerprint): DeduplicationResult {
    const candidates = this.findCandidateRecipes(fingerprint);

    for (const candidateId of candidates) {
      const candidate = this.existingFingerprints.get(candidateId);
      if (!candidate) continue;

      const similarity = this.calculateSimilarity(fingerprint, candidate);

      if (similarity >= 85) {
        return {
          isDuplicate: true,
          duplicateType: "similar",
          matchedRecipeId: candidateId,
          confidence: similarity,
          reason: "High similarity in title and ingredients",
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Check for recipe variants (same dish, different preparation)
   */
  private checkRecipeVariant(fingerprint: RecipeFingerprint): DeduplicationResult {
    // Check if nutrition is very similar
    for (const [recipeId, existing] of this.existingFingerprints) {
      if (fingerprint.nutritionHash === existing.nutritionHash) {
        // Check if ingredients are mostly the same
        const ingredientOverlap = this.calculateIngredientOverlap(
          fingerprint.mainIngredients,
          existing.mainIngredients
        );

        if (ingredientOverlap >= 0.7) {
          return {
            isDuplicate: true,
            duplicateType: "variant",
            matchedRecipeId: recipeId,
            confidence: 75,
            reason: "Recipe variant with same nutrition profile",
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Find candidate recipes for similarity comparison
   */
  private findCandidateRecipes(fingerprint: RecipeFingerprint): string[] {
    const candidates = new Set<string>();

    // Find recipes with common title words
    const titleWords = fingerprint.normalizedTitle.split(" ");
    for (const word of titleWords) {
      const matches = this.titleIndex.get(word);
      if (matches) {
        matches.forEach((id) => candidates.add(id));
      }
    }

    // Find recipes with common ingredients
    for (const ingredient of fingerprint.mainIngredients) {
      const matches = this.ingredientIndex.get(ingredient);
      if (matches) {
        matches.forEach((id) => candidates.add(id));
      }
    }

    return Array.from(candidates);
  }

  /**
   * Calculate similarity between two recipes
   */
  private calculateSimilarity(fp1: RecipeFingerprint, fp2: RecipeFingerprint): number {
    const weights = {
      title: 0.3,
      ingredients: 0.4,
      cookingTime: 0.1,
      servings: 0.1,
      nutrition: 0.1,
    };

    // Title similarity
    const titleSimilarity = this.calculateTitleSimilarity(
      fp1.normalizedTitle,
      fp2.normalizedTitle
    );

    // Ingredient similarity
    const ingredientSimilarity = this.calculateIngredientOverlap(
      fp1.mainIngredients,
      fp2.mainIngredients
    );

    // Cooking time similarity
    const timeSimilarity =
      1 - Math.abs(fp1.cookingTime - fp2.cookingTime) / Math.max(fp1.cookingTime, fp2.cookingTime);

    // Servings similarity
    const servingsSimilarity =
      1 - Math.abs(fp1.servings - fp2.servings) / Math.max(fp1.servings, fp2.servings);

    // Nutrition similarity
    const nutritionSimilarity = fp1.nutritionHash === fp2.nutritionHash ? 1 : 0;

    const totalSimilarity =
      titleSimilarity * weights.title +
      ingredientSimilarity * weights.ingredients +
      timeSimilarity * weights.cookingTime +
      servingsSimilarity * weights.servings +
      nutritionSimilarity * weights.nutrition;

    return Math.round(totalSimilarity * 100);
  }

  /**
   * Calculate title similarity using Jaccard index
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = new Set(title1.split(" "));
    const words2 = new Set(title2.split(" "));

    const intersection = new Set(Array.from(words1).filter((x) => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);

    return intersection.size / union.size;
  }

  /**
   * Calculate ingredient overlap
   */
  private calculateIngredientOverlap(ingredients1: string[], ingredients2: string[]): number {
    const set1 = new Set(ingredients1);
    const set2 = new Set(ingredients2);

    const intersection = new Set(Array.from(set1).filter((x) => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Clear all indexes
   */
  clearIndexes(): void {
    this.existingFingerprints.clear();
    this.titleIndex.clear();
    this.ingredientIndex.clear();
  }

  /**
   * Get deduplication statistics
   */
  getStatistics(): {
    totalRecipes: number;
    uniqueTitles: number;
    uniqueIngredientCombinations: number;
  } {
    const uniqueTitles = new Set(
      Array.from(this.existingFingerprints.values()).map((fp) => fp.titleHash)
    );
    const uniqueIngredients = new Set(
      Array.from(this.existingFingerprints.values()).map((fp) => fp.ingredientHash)
    );

    return {
      totalRecipes: this.existingFingerprints.size,
      uniqueTitles: uniqueTitles.size,
      uniqueIngredientCombinations: uniqueIngredients.size,
    };
  }
}