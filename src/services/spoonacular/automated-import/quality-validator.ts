import { SpoonacularRecipeInfo } from "../types";
// Use relaxed validators for import to get more recipes
import { validateRecipeForGD, calculateGDScore, GD_REQUIREMENTS } from "../validators-relaxed";

/**
 * Quality Validation System for Automated Recipe Import
 * Scores recipes 0-100 based on GD compliance, practicality, and popularity
 */

export interface QualityScore {
  totalScore: number;
  gdComplianceScore: number;
  practicalityScore: number;
  popularityScore: number;
  breakdown: {
    gdCompliance: {
      score: number;
      maxScore: number;
      details: {
        carbRange: number;
        proteinAdequacy: number;
        fiberContent: number;
      };
    };
    practicality: {
      score: number;
      maxScore: number;
      details: {
        cookingTime: number;
        ingredientAvailability: number;
        difficultyLevel: number;
      };
    };
    popularity: {
      score: number;
      maxScore: number;
      details: {
        spoonacularRating: number;
        numberOfReviews: number;
      };
    };
  };
  warnings: string[];
  recommendations: string[];
}

export interface ValidationResult {
  isValid: boolean;
  qualityScore: QualityScore;
  gdValidation: ReturnType<typeof validateRecipeForGD>;
  category: keyof typeof GD_REQUIREMENTS | null;
  rejectionReasons?: string[];
}

/**
 * Calculate comprehensive quality score for a recipe
 */
export function calculateQualityScore(
  recipe: SpoonacularRecipeInfo,
  category: keyof typeof GD_REQUIREMENTS
): QualityScore {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // 1. GD Compliance Score (40 points max)
  const gdScore = calculateGDComplianceScore(recipe, category);
  
  // 2. Practicality Score (30 points max)
  const practicalityScore = calculatePracticalityScore(recipe);
  
  // 3. Popularity Score (30 points max)
  const popularityScore = calculatePopularityScore(recipe);

  // Add warnings based on scores
  if (gdScore.total < 20) {
    warnings.push("Low GD compliance - may not be suitable for gestational diabetes");
  }
  if (practicalityScore.total < 15) {
    warnings.push("May be impractical for regular meal planning");
  }
  if (popularityScore.total < 10) {
    warnings.push("Low popularity - consider user acceptance");
  }

  // Add recommendations
  if (recipe.readyInMinutes > 45) {
    recommendations.push("Consider batch cooking or meal prep for efficiency");
  }
  if (gdScore.details.fiberContent < 5) {
    recommendations.push("Serve with high-fiber sides like vegetables or whole grains");
  }

  const totalScore = gdScore.total + practicalityScore.total + popularityScore.total;

  return {
    totalScore: Math.round(totalScore),
    gdComplianceScore: gdScore.total,
    practicalityScore: practicalityScore.total,
    popularityScore: popularityScore.total,
    breakdown: {
      gdCompliance: {
        score: gdScore.total,
        maxScore: 40,
        details: gdScore.details,
      },
      practicality: {
        score: practicalityScore.total,
        maxScore: 30,
        details: practicalityScore.details,
      },
      popularity: {
        score: popularityScore.total,
        maxScore: 30,
        details: popularityScore.details,
      },
    },
    warnings,
    recommendations,
  };
}

/**
 * Calculate GD compliance subscore (40 points max)
 */
function calculateGDComplianceScore(
  recipe: SpoonacularRecipeInfo,
  category: keyof typeof GD_REQUIREMENTS
): { total: number; details: any } {
  const validation = validateRecipeForGD(recipe, category);
  const requirements = GD_REQUIREMENTS[category];
  
  // Get nutrient values
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  const protein = getNutrientValue(nutrients, "protein");
  const fiber = getNutrientValue(nutrients, "fiber");
  const sugar = getNutrientValue(nutrients, "sugar");

  // Carb range compliance (20 points)
  let carbScore = 0;
  if (validation.carbsInRange) {
    carbScore = 20;
  } else if (carbs >= requirements.minCarbs * 0.8 && carbs <= requirements.maxCarbs * 1.2) {
    // Partial credit for being close
    carbScore = 10;
  }

  // Protein adequacy (10 points)
  let proteinScore = 0;
  if (validation.adequateProtein) {
    proteinScore = 10;
    // Bonus for extra protein
    if (protein >= requirements.minProtein * 1.5) {
      proteinScore = 10;
    }
  } else if (protein >= requirements.minProtein * 0.8) {
    proteinScore = 5;
  }

  // Fiber content (10 points)
  let fiberScore = 0;
  if (validation.adequateFiber) {
    fiberScore = 10;
    // Bonus for high fiber
    if (fiber >= requirements.minFiber * 1.5) {
      fiberScore = 10;
    }
  } else if (fiber >= requirements.minFiber * 0.8) {
    fiberScore = 5;
  }

  // Deductions for issues
  if (sugar > carbs * 0.4) {
    carbScore = Math.max(0, carbScore - 5);
  }

  return {
    total: carbScore + proteinScore + fiberScore,
    details: {
      carbRange: carbScore,
      proteinAdequacy: proteinScore,
      fiberContent: fiberScore,
    },
  };
}

/**
 * Calculate practicality subscore (30 points max)
 */
function calculatePracticalityScore(recipe: SpoonacularRecipeInfo): { total: number; details: any } {
  // Cooking time (10 points)
  let timeScore = 10;
  if (recipe.readyInMinutes > 60) {
    timeScore = 2;
  } else if (recipe.readyInMinutes > 45) {
    timeScore = 5;
  } else if (recipe.readyInMinutes > 30) {
    timeScore = 8;
  }

  // Ingredient availability (10 points)
  let availabilityScore = 10;
  const ingredients = recipe.extendedIngredients || [];
  const specialtyIngredients = ingredients.filter((ing) => {
    const name = ing.nameClean?.toLowerCase() || "";
    return (
      name.includes("exotic") ||
      name.includes("specialty") ||
      name.includes("gourmet") ||
      ing.aisle?.toLowerCase().includes("international") ||
      ing.aisle?.toLowerCase().includes("ethnic")
    );
  });

  if (specialtyIngredients.length > 3) {
    availabilityScore = 3;
  } else if (specialtyIngredients.length > 1) {
    availabilityScore = 6;
  } else if (ingredients.length > 15) {
    availabilityScore = 7;
  }

  // Difficulty level (10 points)
  let difficultyScore = 10;
  const steps = recipe.analyzedInstructions?.[0]?.steps || [];
  const hasComplexTechniques = steps.some((step) => {
    const text = step.step.toLowerCase();
    return (
      text.includes("sous vide") ||
      text.includes("flambe") ||
      text.includes("temper") ||
      text.includes("julienne") ||
      text.includes("deglaze")
    );
  });

  if (hasComplexTechniques || steps.length > 15) {
    difficultyScore = 3;
  } else if (steps.length > 10) {
    difficultyScore = 6;
  } else if (steps.length < 3) {
    // Too simple might mean missing instructions
    difficultyScore = 7;
  }

  return {
    total: timeScore + availabilityScore + difficultyScore,
    details: {
      cookingTime: timeScore,
      ingredientAvailability: availabilityScore,
      difficultyLevel: difficultyScore,
    },
  };
}

/**
 * Calculate popularity subscore (30 points max)
 */
function calculatePopularityScore(recipe: SpoonacularRecipeInfo): { total: number; details: any } {
  // Spoonacular rating (15 points)
  let ratingScore = 0;
  const spoonacularScore = recipe.spoonacularScore || 0;
  if (spoonacularScore >= 90) {
    ratingScore = 15;
  } else if (spoonacularScore >= 80) {
    ratingScore = 12;
  } else if (spoonacularScore >= 70) {
    ratingScore = 9;
  } else if (spoonacularScore >= 60) {
    ratingScore = 6;
  } else if (spoonacularScore >= 50) {
    ratingScore = 3;
  }

  // Number of reviews/likes (15 points)
  let reviewScore = 0;
  const aggregateLikes = recipe.aggregateLikes || 0;
  if (aggregateLikes >= 1000) {
    reviewScore = 15;
  } else if (aggregateLikes >= 500) {
    reviewScore = 12;
  } else if (aggregateLikes >= 100) {
    reviewScore = 9;
  } else if (aggregateLikes >= 50) {
    reviewScore = 6;
  } else if (aggregateLikes >= 10) {
    reviewScore = 3;
  }

  return {
    total: ratingScore + reviewScore,
    details: {
      spoonacularRating: ratingScore,
      numberOfReviews: reviewScore,
    },
  };
}

/**
 * Validate a recipe for import
 */
export function validateRecipeForImport(
  recipe: SpoonacularRecipeInfo,
  category: keyof typeof GD_REQUIREMENTS | null = null
): ValidationResult {
  const rejectionReasons: string[] = [];

  // Basic validation - must have required fields
  if (!recipe.title || !recipe.id) {
    rejectionReasons.push("Missing required fields (title or id)");
  }

  if (!recipe.nutrition?.nutrients || recipe.nutrition.nutrients.length === 0) {
    rejectionReasons.push("Missing nutrition information");
  }

  if (!recipe.instructions && (!recipe.analyzedInstructions || recipe.analyzedInstructions.length === 0)) {
    rejectionReasons.push("Missing cooking instructions");
  }

  if (!recipe.extendedIngredients || recipe.extendedIngredients.length === 0) {
    rejectionReasons.push("Missing ingredient list");
  }

  // Determine category if not provided
  let detectedCategory = category;
  if (!detectedCategory) {
    detectedCategory = detectMealCategory(recipe);
  }

  if (!detectedCategory) {
    rejectionReasons.push("Unable to determine meal category");
    return {
      isValid: false,
      qualityScore: createEmptyQualityScore(),
      gdValidation: createEmptyGDValidation(),
      category: null,
      rejectionReasons,
    };
  }

  // GD validation
  const gdValidation = validateRecipeForGD(recipe, detectedCategory);
  
  // Calculate quality score
  const qualityScore = calculateQualityScore(recipe, detectedCategory);

  // Check minimum quality threshold - lowered for initial import
  if (qualityScore.totalScore < 30) {
    rejectionReasons.push(`Quality score too low: ${qualityScore.totalScore}/100`);
  }

  // Check GD compliance
  if (!gdValidation.isValid) {
    rejectionReasons.push("Failed GD compliance validation");
  }

  // Additional content filters
  if (isInappropriateContent(recipe)) {
    rejectionReasons.push("Contains inappropriate content for pregnancy");
  }

  const isValid = rejectionReasons.length === 0;

  return {
    isValid,
    qualityScore,
    gdValidation,
    category: detectedCategory,
    rejectionReasons: isValid ? undefined : rejectionReasons,
  };
}

/**
 * Detect meal category from recipe data
 */
function detectMealCategory(recipe: SpoonacularRecipeInfo): keyof typeof GD_REQUIREMENTS | null {
  const title = recipe.title.toLowerCase();
  const dishTypes = recipe.dishTypes || [];
  const mealTypes = recipe.occasions || [];

  // Check dish types first
  if (dishTypes.includes("breakfast")) return "breakfast";
  if (dishTypes.includes("lunch")) return "lunch";
  if (dishTypes.includes("dinner") || dishTypes.includes("main course")) return "dinner";
  if (dishTypes.includes("snack") || dishTypes.includes("appetizer")) return "snack";

  // Check title keywords
  if (title.includes("breakfast") || title.includes("morning")) return "breakfast";
  if (title.includes("lunch")) return "lunch";
  if (title.includes("dinner") || title.includes("supper")) return "dinner";
  if (title.includes("snack")) return "snack";

  // Check ingredients for meal indicators
  const ingredients = recipe.extendedIngredients?.map((i) => i.nameClean?.toLowerCase() || "") || [];
  const hasBreakfastIngredients = ingredients.some((i) =>
    ["oats", "cereal", "pancake", "waffle", "eggs", "bacon"].some((b) => i.includes(b))
  );
  if (hasBreakfastIngredients) return "breakfast";

  // Check cooking time and servings
  if (recipe.readyInMinutes <= 15 && recipe.servings <= 2) return "snack";
  if (recipe.readyInMinutes >= 30) return "dinner";

  // Default based on carb content
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = getNutrientValue(nutrients, "carbohydrates");
  if (carbs <= 20) return "snack";
  if (carbs <= 30) return "breakfast";
  
  return "lunch"; // Default fallback
}

/**
 * Check if recipe contains inappropriate content for pregnancy
 */
function isInappropriateContent(recipe: SpoonacularRecipeInfo): boolean {
  const title = recipe.title.toLowerCase();
  const ingredients = recipe.extendedIngredients?.map((i) => i.nameClean?.toLowerCase() || "") || [];
  
  // Alcohol
  const alcoholKeywords = ["wine", "beer", "liquor", "vodka", "rum", "whiskey", "cocktail", "martini"];
  if (alcoholKeywords.some((keyword) => title.includes(keyword))) return true;
  if (ingredients.some((ing) => alcoholKeywords.some((keyword) => ing.includes(keyword)))) return true;

  // Raw/undercooked items
  const rawKeywords = ["sushi", "raw fish", "tartare", "ceviche", "carpaccio"];
  if (rawKeywords.some((keyword) => title.includes(keyword))) return true;

  // High mercury fish
  const highMercuryFish = ["swordfish", "shark", "king mackerel", "tilefish"];
  if (ingredients.some((ing) => highMercuryFish.some((fish) => ing.includes(fish)))) return true;

  // Unpasteurized items
  const unpasteurizedKeywords = ["unpasteurized", "raw milk", "soft cheese"];
  if (ingredients.some((ing) => unpasteurizedKeywords.some((keyword) => ing.includes(keyword)))) return true;

  return false;
}

/**
 * Helper function to extract nutrient value
 */
function getNutrientValue(nutrients: any[], nutrientName: string): number {
  const nutrient = nutrients.find((n: any) =>
    n.name.toLowerCase().includes(nutrientName.toLowerCase())
  );
  return nutrient?.amount || 0;
}

/**
 * Create empty quality score for invalid recipes
 */
function createEmptyQualityScore(): QualityScore {
  return {
    totalScore: 0,
    gdComplianceScore: 0,
    practicalityScore: 0,
    popularityScore: 0,
    breakdown: {
      gdCompliance: {
        score: 0,
        maxScore: 40,
        details: {
          carbRange: 0,
          proteinAdequacy: 0,
          fiberContent: 0,
        },
      },
      practicality: {
        score: 0,
        maxScore: 30,
        details: {
          cookingTime: 0,
          ingredientAvailability: 0,
          difficultyLevel: 0,
        },
      },
      popularity: {
        score: 0,
        maxScore: 30,
        details: {
          spoonacularRating: 0,
          numberOfReviews: 0,
        },
      },
    },
    warnings: ["Recipe validation failed"],
    recommendations: [],
  };
}

/**
 * Create empty GD validation for invalid recipes
 */
function createEmptyGDValidation() {
  return {
    isValid: false,
    carbsInRange: false,
    adequateProtein: false,
    adequateFiber: false,
    warnings: ["Recipe validation failed"],
    adjustmentSuggestions: [],
  };
}