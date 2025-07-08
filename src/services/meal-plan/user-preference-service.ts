/**
 * User Preference Service
 * Manages user dietary preferences, restrictions, and meal planning settings
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  UserPreferences,
  DietaryRestriction,
  Allergen,
  DEFAULT_NUTRITIONAL_TARGETS,
} from "@/src/types/user-preferences";
import { Recipe } from "@/src/types/recipe";

export class UserPreferenceService {
  private static instance: UserPreferenceService;
  private db: Firestore;
  private collectionName = "userPreferences";

  private constructor() {
    this.db = db;
  }

  static getInstance(): UserPreferenceService {
    if (!UserPreferenceService.instance) {
      UserPreferenceService.instance = new UserPreferenceService();
    }
    return UserPreferenceService.instance;
  }

  /**
   * Get user preferences from Firebase
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const docRef = doc(this.db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as UserPreferences;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      throw error;
    }
  }

  /**
   * Create or update user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const { id, userId, ...data } = preferences;
      const docRef = doc(this.db, this.collectionName, userId);

      const saveData = {
        ...data,
        userId,
        updatedAt: serverTimestamp(),
      };

      if (id) {
        // Update existing
        await updateDoc(docRef, saveData);
      } else {
        // Create new
        await setDoc(docRef, {
          ...saveData,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving user preferences:", error);
      throw error;
    }
  }

  /**
   * Create default preferences for a new user
   */
  createDefaultPreferences(userId: string): UserPreferences {
    return {
      userId,
      dietaryRestrictions: [],
      allergens: [],
      preferredCookingTime: "under-30",
      mealComplexity: "moderate",
      preferredCuisines: [],
      dislikedIngredients: [],
      favoriteIngredients: [],
      includeLeftovers: true,
      batchCookingPreferred: false,
      avoidRepeatDays: 3,
      preferHighProtein: false,
      preferHighFiber: true,
      limitSodium: false,
      budgetConscious: false,
      preferOrganic: false,
    };
  }

  /**
   * Check if a recipe matches user dietary restrictions
   */
  recipeMatchesDietaryRestrictions(
    recipe: Recipe,
    restrictions: DietaryRestriction[],
  ): boolean {
    for (const restriction of restrictions) {
      switch (restriction) {
        case "vegetarian":
          if (!this.isVegetarian(recipe)) return false;
          break;
        case "vegan":
          if (!this.isVegan(recipe)) return false;
          break;
        case "gluten-free":
          if (!this.isGlutenFree(recipe)) return false;
          break;
        case "dairy-free":
          if (!this.isDairyFree(recipe)) return false;
          break;
        case "nut-free":
          if (!this.isNutFree(recipe)) return false;
          break;
        case "shellfish-free":
          if (!this.isShellfishFree(recipe)) return false;
          break;
        case "egg-free":
          if (!this.isEggFree(recipe)) return false;
          break;
        case "soy-free":
          if (!this.isSoyFree(recipe)) return false;
          break;
        case "pescatarian":
          if (!this.isPescatarian(recipe)) return false;
          break;
        case "low-sodium":
          if (!this.isLowSodium(recipe)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Check if a recipe contains allergens
   */
  recipeContainsAllergens(recipe: Recipe, allergens: Allergen[]): boolean {
    const ingredientNames = recipe.ingredients.map((ing) =>
      ing.name.toLowerCase(),
    );

    for (const allergen of allergens) {
      const allergenKeywords = this.getAllergenKeywords(allergen);

      for (const keyword of allergenKeywords) {
        if (ingredientNames.some((ing) => ing.includes(keyword))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if recipe contains disliked ingredients
   */
  recipeContainsDislikedIngredients(
    recipe: Recipe,
    dislikedIngredients: string[],
  ): boolean {
    const ingredientNames = recipe.ingredients.map((ing) =>
      ing.name.toLowerCase(),
    );

    for (const disliked of dislikedIngredients) {
      if (ingredientNames.some((ing) => ing.includes(disliked.toLowerCase()))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate preference match score for a recipe
   */
  calculatePreferenceScore(
    recipe: Recipe,
    preferences: UserPreferences,
  ): number {
    let score = 100;

    // Dietary restrictions (must match)
    if (
      !this.recipeMatchesDietaryRestrictions(
        recipe,
        preferences.dietaryRestrictions,
      )
    ) {
      return 0;
    }

    // Allergens (must not contain)
    if (this.recipeContainsAllergens(recipe, preferences.allergens)) {
      return 0;
    }

    // Disliked ingredients (heavy penalty)
    if (
      this.recipeContainsDislikedIngredients(
        recipe,
        preferences.dislikedIngredients,
      )
    ) {
      score -= 50;
    }

    // Cooking time preference
    if (!this.matchesCookingTime(recipe, preferences.preferredCookingTime)) {
      score -= 20;
    }

    // Meal complexity
    if (!this.matchesComplexity(recipe, preferences.mealComplexity)) {
      score -= 15;
    }

    // Favorite ingredients (bonus)
    const favoriteCount = this.countFavoriteIngredients(
      recipe,
      preferences.favoriteIngredients,
    );
    score += Math.min(favoriteCount * 5, 20); // Up to 20 bonus points

    // Cuisine preference (bonus)
    if (preferences.preferredCuisines.length > 0) {
      const cuisineMatch = recipe.tags.some((tag) =>
        preferences.preferredCuisines.includes(tag.toLowerCase() as any),
      );
      if (cuisineMatch) score += 10;
    }

    // Nutritional preferences
    if (preferences.preferHighProtein && recipe.nutrition.protein >= 20) {
      score += 5;
    }

    if (preferences.preferHighFiber && recipe.nutrition.fiber >= 5) {
      score += 5;
    }

    if (
      preferences.limitSodium &&
      recipe.nutrition.sodium &&
      recipe.nutrition.sodium > 600
    ) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Helper methods for dietary restrictions
  private isVegetarian(recipe: Recipe): boolean {
    const meatKeywords = [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "turkey",
      "bacon",
      "sausage",
      "ham",
      "meat",
    ];
    const seafoodKeywords = [
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "crab",
      "lobster",
      "seafood",
    ];
    const allMeatKeywords = [...meatKeywords, ...seafoodKeywords];

    return !recipe.ingredients.some((ing) =>
      allMeatKeywords.some((keyword) =>
        ing.name.toLowerCase().includes(keyword),
      ),
    );
  }

  private isVegan(recipe: Recipe): boolean {
    if (!this.isVegetarian(recipe)) return false;

    const animalProducts = [
      "milk",
      "cheese",
      "yogurt",
      "butter",
      "cream",
      "egg",
      "honey",
      "dairy",
    ];
    return !recipe.ingredients.some((ing) =>
      animalProducts.some((keyword) =>
        ing.name.toLowerCase().includes(keyword),
      ),
    );
  }

  private isGlutenFree(recipe: Recipe): boolean {
    const glutenKeywords = [
      "wheat",
      "flour",
      "bread",
      "pasta",
      "couscous",
      "barley",
      "rye",
      "malt",
    ];
    return !recipe.ingredients.some((ing) =>
      glutenKeywords.some((keyword) =>
        ing.name.toLowerCase().includes(keyword),
      ),
    );
  }

  private isDairyFree(recipe: Recipe): boolean {
    const dairyKeywords = [
      "milk",
      "cheese",
      "yogurt",
      "butter",
      "cream",
      "dairy",
      "whey",
      "casein",
    ];
    return !recipe.ingredients.some((ing) =>
      dairyKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword)),
    );
  }

  private isNutFree(recipe: Recipe): boolean {
    const nutKeywords = [
      "almond",
      "walnut",
      "pecan",
      "cashew",
      "pistachio",
      "hazelnut",
      "macadamia",
      "nut",
    ];
    return !recipe.ingredients.some((ing) =>
      nutKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword)),
    );
  }

  private isShellfishFree(recipe: Recipe): boolean {
    const shellfishKeywords = [
      "shrimp",
      "crab",
      "lobster",
      "oyster",
      "clam",
      "mussel",
      "scallop",
      "shellfish",
    ];
    return !recipe.ingredients.some((ing) =>
      shellfishKeywords.some((keyword) =>
        ing.name.toLowerCase().includes(keyword),
      ),
    );
  }

  private isEggFree(recipe: Recipe): boolean {
    const eggKeywords = ["egg", "mayonnaise", "aioli"];
    return !recipe.ingredients.some((ing) =>
      eggKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword)),
    );
  }

  private isSoyFree(recipe: Recipe): boolean {
    const soyKeywords = ["soy", "tofu", "tempeh", "edamame", "miso", "tamari"];
    return !recipe.ingredients.some((ing) =>
      soyKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword)),
    );
  }

  private isPescatarian(recipe: Recipe): boolean {
    const meatKeywords = [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "turkey",
      "bacon",
      "sausage",
      "ham",
      "meat",
    ];
    return !recipe.ingredients.some((ing) =>
      meatKeywords.some((keyword) => ing.name.toLowerCase().includes(keyword)),
    );
  }

  private isLowSodium(recipe: Recipe): boolean {
    return !recipe.nutrition.sodium || recipe.nutrition.sodium < 140; // mg per serving
  }

  private getAllergenKeywords(allergen: Allergen): string[] {
    const allergenMap: Record<Allergen, string[]> = {
      milk: [
        "milk",
        "cheese",
        "yogurt",
        "butter",
        "cream",
        "dairy",
        "whey",
        "casein",
        "lactose",
      ],
      eggs: ["egg", "mayonnaise", "aioli", "meringue"],
      fish: [
        "fish",
        "salmon",
        "tuna",
        "cod",
        "halibut",
        "tilapia",
        "bass",
        "trout",
      ],
      shellfish: [
        "shrimp",
        "crab",
        "lobster",
        "oyster",
        "clam",
        "mussel",
        "scallop",
      ],
      "tree-nuts": [
        "almond",
        "walnut",
        "pecan",
        "cashew",
        "pistachio",
        "hazelnut",
        "macadamia",
      ],
      peanuts: ["peanut"],
      wheat: ["wheat", "flour", "bread", "pasta", "couscous"],
      soybeans: ["soy", "tofu", "tempeh", "edamame", "miso"],
      sesame: ["sesame", "tahini"],
    };

    return allergenMap[allergen] || [];
  }

  private matchesCookingTime(recipe: Recipe, preference: string): boolean {
    const timeMap = {
      "under-15": 15,
      "under-30": 30,
      "under-45": 45,
      "under-60": 60,
      any: Infinity,
    };

    return recipe.totalTime <= (timeMap[preference] || Infinity);
  }

  private matchesComplexity(recipe: Recipe, preference: string): boolean {
    // Estimate complexity based on number of ingredients and steps
    const ingredientCount = recipe.ingredients.length;
    const stepCount = recipe.instructions.length;
    const totalTime = recipe.totalTime;

    let complexity: string;
    if (ingredientCount <= 5 && stepCount <= 3 && totalTime <= 20) {
      complexity = "simple";
    } else if (ingredientCount <= 10 && stepCount <= 6 && totalTime <= 45) {
      complexity = "moderate";
    } else {
      complexity = "complex";
    }

    return preference === "any" || complexity === preference;
  }

  private countFavoriteIngredients(
    recipe: Recipe,
    favorites: string[],
  ): number {
    const ingredientNames = recipe.ingredients.map((ing) =>
      ing.name.toLowerCase(),
    );

    return favorites.filter((fav) =>
      ingredientNames.some((ing) => ing.includes(fav.toLowerCase())),
    ).length;
  }
}

// Export singleton instance
export const userPreferenceService = UserPreferenceService.getInstance();
