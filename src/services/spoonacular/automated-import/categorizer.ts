import { SpoonacularRecipeInfo } from "../types";
import { GD_REQUIREMENTS } from "../validators";

/**
 * Auto-categorization Service for Automated Recipe Import
 * Intelligently categorizes recipes into meal types based on multiple factors
 */

export interface CategorizationResult {
  primaryCategory: keyof typeof GD_REQUIREMENTS;
  confidence: number;
  alternativeCategories?: Array<{
    category: keyof typeof GD_REQUIREMENTS;
    confidence: number;
  }>;
  reasoning: string[];
  tags: string[];
}

export interface CategoryFeatures {
  nutritionProfile: {
    carbs: number;
    protein: number;
    calories: number;
    fiber: number;
  };
  timeOfDay: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  ingredients: {
    breakfastIngredients: number;
    lunchIngredients: number;
    dinnerIngredients: number;
    snackIngredients: number;
  };
  preparation: {
    cookingTime: number;
    servings: number;
    complexity: number;
  };
}

/**
 * Main categorization class
 */
type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

// Map simplified categories to GD_REQUIREMENTS keys
function mapToGDCategory(category: MealCategory): keyof typeof GD_REQUIREMENTS {
  // For now, use the base categories which exist in GD_REQUIREMENTS
  return category;
}

export class RecipeCategorizer {
  // Keyword mappings for different meal types
  private readonly mealKeywords: Record<
    MealCategory,
    {
      strong: string[];
      moderate: string[];
      ingredients: string[];
    }
  > = {
    breakfast: {
      strong: [
        "breakfast",
        "morning",
        "brunch",
        "pancake",
        "waffle",
        "cereal",
        "oatmeal",
        "porridge",
        "muesli",
        "granola",
      ],
      moderate: [
        "egg",
        "bacon",
        "sausage",
        "toast",
        "muffin",
        "smoothie",
        "coffee",
        "omelet",
        "frittata",
      ],
      ingredients: [
        "eggs",
        "oats",
        "yogurt",
        "berries",
        "banana",
        "milk",
        "cream cheese",
        "maple syrup",
        "bacon",
        "sausage",
      ],
    },
    lunch: {
      strong: ["lunch", "midday", "sandwich", "salad", "wrap", "soup"],
      moderate: [
        "bowl",
        "pita",
        "hummus",
        "tuna",
        "chicken salad",
        "pasta salad",
      ],
      ingredients: [
        "lettuce",
        "tomato",
        "cucumber",
        "deli meat",
        "cheese",
        "bread",
        "tortilla",
        "avocado",
      ],
    },
    dinner: {
      strong: [
        "dinner",
        "supper",
        "main course",
        "entree",
        "casserole",
        "roast",
      ],
      moderate: [
        "steak",
        "salmon",
        "chicken breast",
        "pasta",
        "rice",
        "curry",
        "stir fry",
        "lasagna",
      ],
      ingredients: [
        "beef",
        "pork",
        "fish",
        "chicken",
        "pasta",
        "rice",
        "potatoes",
        "vegetables",
      ],
    },
    snack: {
      strong: ["snack", "appetizer", "bite", "mini", "energy ball", "bar"],
      moderate: ["dip", "crackers", "nuts", "trail mix", "popcorn", "chips"],
      ingredients: [
        "nuts",
        "seeds",
        "crackers",
        "hummus",
        "fruit",
        "cheese",
        "yogurt",
      ],
    },
  };

  // Typical nutrition ranges for each meal type
  private readonly nutritionProfiles: Record<
    MealCategory,
    {
      carbs: { min: number; max: number; ideal: number };
      protein: { min: number; max: number; ideal: number };
      calories: { min: number; max: number; ideal: number };
    }
  > = {
    breakfast: {
      carbs: { min: 15, max: 35, ideal: 25 },
      protein: { min: 7, max: 20, ideal: 12 },
      calories: { min: 200, max: 400, ideal: 300 },
    },
    lunch: {
      carbs: { min: 30, max: 45, ideal: 35 },
      protein: { min: 15, max: 30, ideal: 22 },
      calories: { min: 350, max: 550, ideal: 450 },
    },
    dinner: {
      carbs: { min: 30, max: 45, ideal: 40 },
      protein: { min: 20, max: 40, ideal: 30 },
      calories: { min: 400, max: 600, ideal: 500 },
    },
    snack: {
      carbs: { min: 10, max: 20, ideal: 15 },
      protein: { min: 5, max: 15, ideal: 8 },
      calories: { min: 100, max: 250, ideal: 150 },
    },
  };

  /**
   * Categorize a recipe based on multiple factors
   */
  categorizeRecipe(recipe: SpoonacularRecipeInfo): CategorizationResult {
    const features = this.extractFeatures(recipe);
    const scores = this.calculateCategoryScores(features, recipe);
    const reasoning: string[] = [];
    const tags: string[] = [];

    // Sort categories by score
    const sortedCategories = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([category, score]) => ({
        category: category as keyof typeof GD_REQUIREMENTS,
        confidence: Math.round(score * 100),
      }));

    const primaryCategory = sortedCategories[0];
    const alternativeCategories = sortedCategories
      .slice(1)
      .filter((cat) => cat.confidence > 30);

    // Add reasoning
    reasoning.push(
      ...this.generateReasoning(features, primaryCategory.category, recipe),
    );

    // Add tags
    tags.push(...this.generateTags(recipe, primaryCategory.category));

    return {
      primaryCategory: primaryCategory.category,
      confidence: primaryCategory.confidence,
      alternativeCategories:
        alternativeCategories.length > 0 ? alternativeCategories : undefined,
      reasoning,
      tags,
    };
  }

  /**
   * Extract features from recipe for categorization
   */
  private extractFeatures(recipe: SpoonacularRecipeInfo): CategoryFeatures {
    const nutrients = recipe.nutrition?.nutrients || [];
    const carbs = this.getNutrientValue(nutrients, "carbohydrates");
    const protein = this.getNutrientValue(nutrients, "protein");
    const calories = this.getNutrientValue(nutrients, "calories");
    const fiber = this.getNutrientValue(nutrients, "fiber");

    // Calculate time of day scores based on keywords
    const timeOfDay = this.calculateTimeOfDayScores(recipe);

    // Calculate ingredient-based scores
    const ingredients = this.calculateIngredientScores(recipe);

    // Calculate preparation complexity
    const complexity = this.calculateComplexity(recipe);

    return {
      nutritionProfile: { carbs, protein, calories, fiber },
      timeOfDay,
      ingredients,
      preparation: {
        cookingTime: recipe.readyInMinutes || 0,
        servings: recipe.servings || 0,
        complexity,
      },
    };
  }

  /**
   * Calculate scores for each category
   */
  private calculateCategoryScores(
    features: CategoryFeatures,
    recipe: SpoonacularRecipeInfo,
  ): Record<keyof typeof GD_REQUIREMENTS, number> {
    const scores: Record<MealCategory, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    // Weight factors
    const weights = {
      nutrition: 0.3,
      timeOfDay: 0.25,
      ingredients: 0.25,
      preparation: 0.1,
      explicitType: 0.1,
    };

    for (const category of Object.keys(scores) as MealCategory[]) {
      // Nutrition score
      const nutritionScore = this.calculateNutritionScore(
        features.nutritionProfile,
        category,
      );

      // Time of day score
      const timeScore = features.timeOfDay[category];

      // Ingredient score
      const ingredientScore =
        features.ingredients[
          `${category}Ingredients` as keyof typeof features.ingredients
        ];

      // Preparation score
      const prepScore = this.calculatePreparationScore(
        features.preparation,
        category,
      );

      // Explicit type score
      const explicitScore = this.calculateExplicitTypeScore(recipe, category);

      // Combined score
      scores[category] =
        nutritionScore * weights.nutrition +
        timeScore * weights.timeOfDay +
        ingredientScore * weights.ingredients +
        prepScore * weights.preparation +
        explicitScore * weights.explicitType;
    }

    // Apply modifiers based on special cases
    this.applySpecialCaseModifiers(scores, recipe);

    // Normalize scores to ensure they sum to 1
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    if (total > 0) {
      for (const category of Object.keys(scores) as MealCategory[]) {
        scores[category] = scores[category] / total;
      }
    }

    // Convert to GD_REQUIREMENTS format
    const gdScores: Partial<Record<keyof typeof GD_REQUIREMENTS, number>> = {};
    for (const [category, score] of Object.entries(scores)) {
      gdScores[mapToGDCategory(category as MealCategory)] = score;
    }

    // Fill in missing GD categories with 0
    const allGDScores = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
      morningSnack: 0,
      afternoonSnack: 0,
      eveningSnack: 0,
      ...gdScores,
    };

    return allGDScores;
  }

  /**
   * Calculate nutrition-based score for a category
   */
  private calculateNutritionScore(
    nutrition: CategoryFeatures["nutritionProfile"],
    category: MealCategory,
  ): number {
    const profile = this.nutritionProfiles[category];
    let score = 0;

    // Carbs score
    if (
      nutrition.carbs >= profile.carbs.min &&
      nutrition.carbs <= profile.carbs.max
    ) {
      const deviation = Math.abs(nutrition.carbs - profile.carbs.ideal);
      const maxDeviation = Math.max(
        profile.carbs.ideal - profile.carbs.min,
        profile.carbs.max - profile.carbs.ideal,
      );
      score += 0.4 * (1 - deviation / maxDeviation);
    }

    // Protein score
    if (
      nutrition.protein >= profile.protein.min &&
      nutrition.protein <= profile.protein.max
    ) {
      const deviation = Math.abs(nutrition.protein - profile.protein.ideal);
      const maxDeviation = Math.max(
        profile.protein.ideal - profile.protein.min,
        profile.protein.max - profile.protein.ideal,
      );
      score += 0.3 * (1 - deviation / maxDeviation);
    }

    // Calories score
    if (
      nutrition.calories >= profile.calories.min &&
      nutrition.calories <= profile.calories.max
    ) {
      const deviation = Math.abs(nutrition.calories - profile.calories.ideal);
      const maxDeviation = Math.max(
        profile.calories.ideal - profile.calories.min,
        profile.calories.max - profile.calories.ideal,
      );
      score += 0.3 * (1 - deviation / maxDeviation);
    }

    return score;
  }

  /**
   * Calculate time of day scores based on keywords
   */
  private calculateTimeOfDayScores(
    recipe: SpoonacularRecipeInfo,
  ): CategoryFeatures["timeOfDay"] {
    const title = recipe.title.toLowerCase();
    const summary = (recipe.summary || "").toLowerCase();
    const instructions = (recipe.instructions || "").toLowerCase();
    const text = `${title} ${summary} ${instructions}`;

    const scores = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    for (const [category, keywords] of Object.entries(this.mealKeywords)) {
      let score = 0;

      // Check strong keywords
      for (const keyword of keywords.strong) {
        if (text.includes(keyword)) {
          score += 0.5;
        }
      }

      // Check moderate keywords
      for (const keyword of keywords.moderate) {
        if (text.includes(keyword)) {
          score += 0.3;
        }
      }

      scores[category as keyof typeof scores] = Math.min(score, 1);
    }

    return scores;
  }

  /**
   * Calculate ingredient-based scores
   */
  private calculateIngredientScores(
    recipe: SpoonacularRecipeInfo,
  ): CategoryFeatures["ingredients"] {
    const ingredients = recipe.extendedIngredients || [];
    const ingredientNames = ingredients.map((ing) =>
      (ing.nameClean || ing.name || "").toLowerCase(),
    );

    const scores = {
      breakfastIngredients: 0,
      lunchIngredients: 0,
      dinnerIngredients: 0,
      snackIngredients: 0,
    };

    for (const [category, keywords] of Object.entries(this.mealKeywords)) {
      let score = 0;
      let matches = 0;

      for (const ingredient of ingredientNames) {
        for (const keyword of keywords.ingredients) {
          if (ingredient.includes(keyword)) {
            matches++;
            break;
          }
        }
      }

      // Calculate score based on percentage of matching ingredients
      if (ingredients.length > 0) {
        score =
          matches / Math.min(ingredients.length, keywords.ingredients.length);
      }

      scores[`${category}Ingredients` as keyof typeof scores] = score;
    }

    return scores;
  }

  /**
   * Calculate preparation complexity
   */
  private calculateComplexity(recipe: SpoonacularRecipeInfo): number {
    const steps = recipe.analyzedInstructions?.[0]?.steps || [];
    const ingredients = recipe.extendedIngredients || [];
    const cookingTime = recipe.readyInMinutes || 0;

    let complexity = 0;

    // Step count factor
    if (steps.length < 5) complexity += 0.2;
    else if (steps.length < 10) complexity += 0.5;
    else complexity += 0.8;

    // Ingredient count factor
    if (ingredients.length < 5) complexity += 0.2;
    else if (ingredients.length < 10) complexity += 0.4;
    else complexity += 0.6;

    // Cooking time factor
    if (cookingTime < 15) complexity += 0.1;
    else if (cookingTime < 30) complexity += 0.3;
    else if (cookingTime < 60) complexity += 0.5;
    else complexity += 0.7;

    return complexity / 3; // Average of three factors
  }

  /**
   * Calculate preparation score for a category
   */
  private calculatePreparationScore(
    preparation: CategoryFeatures["preparation"],
    category: MealCategory,
  ): number {
    let score = 0;

    switch (category) {
      case "breakfast":
        // Breakfast should be quick
        if (preparation.cookingTime <= 20) score += 0.5;
        if (preparation.complexity < 0.3) score += 0.3;
        if (preparation.servings >= 1 && preparation.servings <= 4)
          score += 0.2;
        break;
      case "lunch":
        // Lunch can be moderate
        if (preparation.cookingTime <= 30) score += 0.4;
        if (preparation.complexity < 0.5) score += 0.3;
        if (preparation.servings >= 2 && preparation.servings <= 4)
          score += 0.3;
        break;
      case "dinner":
        // Dinner can be more complex
        if (preparation.cookingTime <= 60) score += 0.3;
        if (preparation.complexity >= 0.3) score += 0.4;
        if (preparation.servings >= 4) score += 0.3;
        break;
      case "snack":
        // Snacks should be very quick
        if (preparation.cookingTime <= 15) score += 0.6;
        if (preparation.complexity < 0.2) score += 0.3;
        if (preparation.servings >= 1) score += 0.1;
        break;
    }

    return score;
  }

  /**
   * Calculate score based on explicit type information
   */
  private calculateExplicitTypeScore(
    recipe: SpoonacularRecipeInfo,
    category: MealCategory,
  ): number {
    const dishTypes = recipe.dishTypes || [];
    const occasions = recipe.occasions || [];

    const typeMapping: Record<string, MealCategory> = {
      breakfast: "breakfast",
      brunch: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      "main course": "dinner",
      "main dish": "dinner",
      snack: "snack",
      appetizer: "snack",
      "side dish": "snack",
    };

    let score = 0;

    // Check dish types
    for (const dishType of dishTypes) {
      if (typeMapping[dishType.toLowerCase()] === category) {
        score += 0.5;
      }
    }

    // Check occasions
    for (const occasion of occasions) {
      const lowerOccasion = occasion.toLowerCase();
      if (
        (category === "breakfast" && lowerOccasion.includes("morning")) ||
        (category === "dinner" && lowerOccasion.includes("dinner")) ||
        (category === "snack" && lowerOccasion.includes("snack"))
      ) {
        score += 0.3;
      }
    }

    return Math.min(score, 1);
  }

  /**
   * Apply special case modifiers
   */
  private applySpecialCaseModifiers(
    scores: Record<string, number>,
    recipe: SpoonacularRecipeInfo,
  ): void {
    const title = recipe.title.toLowerCase();

    // Smoothies and shakes are usually breakfast or snack
    if (title.includes("smoothie") || title.includes("shake")) {
      scores.breakfast *= 1.5;
      scores.snack *= 1.3;
      scores.lunch *= 0.5;
      scores.dinner *= 0.3;
    }

    // Soups can be lunch or dinner
    if (title.includes("soup") || title.includes("stew")) {
      scores.lunch *= 1.3;
      scores.dinner *= 1.2;
      scores.breakfast *= 0.3;
    }

    // Salads are usually lunch
    if (title.includes("salad") && !title.includes("fruit salad")) {
      scores.lunch *= 1.5;
      scores.dinner *= 0.8;
    }

    // Casseroles are usually dinner
    if (title.includes("casserole") || title.includes("bake")) {
      scores.dinner *= 1.5;
      scores.lunch *= 0.7;
    }

    // Very low calorie items are likely snacks
    const calories = this.getNutrientValue(
      recipe.nutrition?.nutrients || [],
      "calories",
    );
    if (calories < 200) {
      scores.snack *= 1.5;
      scores.dinner *= 0.5;
    }
  }

  /**
   * Generate reasoning for the categorization
   */
  private generateReasoning(
    features: CategoryFeatures,
    category: keyof typeof GD_REQUIREMENTS,
    recipe: SpoonacularRecipeInfo,
  ): string[] {
    const reasoning: string[] = [];
    // Map to simplified category for nutrition profiles
    const simplifiedCategory = [
      "morningSnack",
      "afternoonSnack",
      "eveningSnack",
    ].includes(category)
      ? ("snack" as MealCategory)
      : (category as MealCategory);

    if (!this.nutritionProfiles[simplifiedCategory]) {
      return reasoning;
    }

    const profile = this.nutritionProfiles[simplifiedCategory];

    // Nutrition reasoning
    if (
      features.nutritionProfile.carbs >= profile.carbs.min &&
      features.nutritionProfile.carbs <= profile.carbs.max
    ) {
      reasoning.push(
        `Carbohydrate content (${features.nutritionProfile.carbs}g) fits ${category} range`,
      );
    }

    // Time reasoning
    if (features.timeOfDay[simplifiedCategory] > 0.3) {
      reasoning.push(`Recipe contains ${category}-related keywords`);
    }

    // Ingredient reasoning
    if (
      features.ingredients[
        `${simplifiedCategory}Ingredients` as keyof typeof features.ingredients
      ] > 0.3
    ) {
      reasoning.push(`Ingredients typical of ${category} meals`);
    }

    // Preparation reasoning
    if (category === "breakfast" && features.preparation.cookingTime <= 20) {
      reasoning.push("Quick preparation time suitable for breakfast");
    } else if (
      category === "dinner" &&
      features.preparation.cookingTime >= 30
    ) {
      reasoning.push("Cooking time appropriate for dinner meal");
    } else if (category === "snack" && features.preparation.cookingTime <= 15) {
      reasoning.push("Very quick preparation ideal for snacks");
    }

    // Explicit type reasoning
    if (recipe.dishTypes?.includes(category)) {
      reasoning.push(`Explicitly marked as ${category} dish`);
    }

    return reasoning;
  }

  /**
   * Generate tags for the recipe
   */
  private generateTags(
    recipe: SpoonacularRecipeInfo,
    category: keyof typeof GD_REQUIREMENTS,
  ): string[] {
    const tags: string[] = [category];

    // Add dietary tags
    if (recipe.vegetarian) tags.push("vegetarian");
    if (recipe.vegan) tags.push("vegan");
    if (recipe.glutenFree) tags.push("gluten-free");
    if (recipe.dairyFree) tags.push("dairy-free");

    // Add time-based tags
    if (recipe.readyInMinutes <= 15) tags.push("quick");
    else if (recipe.readyInMinutes <= 30) tags.push("30-minutes");

    // Add health tags
    if (recipe.veryHealthy) tags.push("healthy");
    if (recipe.cheap) tags.push("budget-friendly");

    // Add cuisine tags
    if (recipe.cuisines && recipe.cuisines.length > 0) {
      tags.push(...recipe.cuisines.map((c) => c.toLowerCase()));
    }

    // Add special tags based on ingredients
    const ingredients = recipe.extendedIngredients || [];
    const hasWholeGrains = ingredients.some((ing) => {
      const name = (ing.nameClean || ing.name || "").toLowerCase();
      return (
        name.includes("whole") &&
        (name.includes("grain") || name.includes("wheat"))
      );
    });
    if (hasWholeGrains) tags.push("whole-grains");

    // Add protein source tags
    const proteinSources = [
      "chicken",
      "beef",
      "fish",
      "tofu",
      "beans",
      "eggs",
      "turkey",
      "pork",
    ];
    for (const protein of proteinSources) {
      if (
        ingredients.some((ing) =>
          (ing.nameClean || ing.name || "").toLowerCase().includes(protein),
        )
      ) {
        tags.push(protein);
        break;
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get nutrient value from nutrients array
   */
  private getNutrientValue(nutrients: any[], name: string): number {
    const nutrient = nutrients.find((n: any) =>
      n.name.toLowerCase().includes(name.toLowerCase()),
    );
    return nutrient?.amount || 0;
  }

  /**
   * Bulk categorize recipes
   */
  categorizeRecipes(
    recipes: SpoonacularRecipeInfo[],
  ): Map<string, CategorizationResult> {
    const results = new Map<string, CategorizationResult>();

    for (const recipe of recipes) {
      const result = this.categorizeRecipe(recipe);
      results.set(String(recipe.id), result);
    }

    return results;
  }

  /**
   * Get category distribution statistics
   */
  getCategoryDistribution(
    results: Map<string, CategorizationResult>,
  ): Record<string, number> {
    const distribution: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    for (const result of results.values()) {
      distribution[result.primaryCategory]++;
    }

    return distribution;
  }
}
