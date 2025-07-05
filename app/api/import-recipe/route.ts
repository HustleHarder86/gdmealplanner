import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

/**
 * Recipe Import API Endpoint
 * Handles recipe data from the browser bookmarklet
 */

interface ImportedRecipe {
  title: string;
  description: string;
  url: string;
  source: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Array<{
    text: string;
    parsed: {
      amount: string;
      unit: string;
      item: string;
    };
  }>;
  instructions: string[];
  nutrition: {
    calories: number;
    carbs: number;
    protein: number;
    fiber: number;
    fat: number;
    sugar: number;
  };
  category: string;
  verified: boolean;
  imported_at: string;
}

interface ImportRequest {
  recipe: ImportedRecipe;
  source_url: string;
  imported_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ImportRequest = await request.json();

    // Validate required fields
    if (!data.recipe || !data.recipe.title || !data.recipe.url) {
      return NextResponse.json(
        { error: "Missing required recipe data" },
        { status: 400 },
      );
    }

    const recipe = data.recipe;

    // Validate GD nutrition requirements
    const validation = validateGDNutrition(recipe.nutrition);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Recipe doesn't meet GD requirements: ${validation.reason}` },
        { status: 400 },
      );
    }

    // Generate unique ID for the recipe
    const recipeId = generateRecipeId(recipe.title);

    // Format recipe for storage
    const formattedRecipe = {
      id: recipeId,
      title: recipe.title,
      description: recipe.description,
      url: recipe.url,
      source: recipe.source,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      totalTime: recipe.totalTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map((ing) => ({
        amount: ing.parsed.amount || "",
        unit: ing.parsed.unit || "",
        item: ing.parsed.item || ing.text,
        originalText: ing.text,
      })),
      instructions: recipe.instructions,
      nutrition: {
        calories: recipe.nutrition.calories,
        carbohydrates: recipe.nutrition.carbs,
        protein: recipe.nutrition.protein,
        fiber: recipe.nutrition.fiber,
        fat: recipe.nutrition.fat,
        sugar: recipe.nutrition.sugar || 0,
      },
      category: recipe.category,
      tags: generateTags(recipe),
      difficulty: determineDifficulty(recipe),
      verified: true,
      imported_from_bookmarklet: true,
      imported_at: data.imported_at,
      image: `/api/placeholder/${recipeId}`, // Placeholder image
    };

    // Save to appropriate category file
    await saveRecipeToFile(formattedRecipe, recipe.category);

    // Log the import
    await logImport(formattedRecipe, data.source_url);

    return NextResponse.json({
      success: true,
      message: "Recipe imported successfully",
      recipe: {
        id: recipeId,
        title: recipe.title,
        category: recipe.category,
        nutrition: recipe.nutrition,
      },
    });
  } catch (error) {
    console.error("Recipe import error:", error);
    return NextResponse.json(
      { error: "Failed to import recipe" },
      { status: 500 },
    );
  }
}

function validateGDNutrition(nutrition: any) {
  const carbs = nutrition.carbs || 0;
  const protein = nutrition.protein || 0;
  const fiber = nutrition.fiber || 0;

  if (carbs === 0) return { valid: false, reason: "No carbohydrate data" };
  if (carbs < 10 || carbs > 50)
    return {
      valid: false,
      reason: `Carbs out of range: ${carbs}g (need 10-50g)`,
    };
  if (protein < 5)
    return { valid: false, reason: `Low protein: ${protein}g (need 5g+)` };
  if (fiber < 2)
    return { valid: false, reason: `Low fiber: ${fiber}g (need 2g+)` };

  return { valid: true, reason: "Meets GD requirements" };
}

function generateRecipeId(title: string): string {
  const timestamp = Date.now();
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${timestamp}`;
}

function generateTags(recipe: ImportedRecipe): string[] {
  const tags: string[] = ["imported", "gd-friendly"];

  if (recipe.totalTime <= 20) tags.push("quick");
  if (recipe.totalTime <= 30) tags.push("30-minutes-or-less");
  if (recipe.nutrition.protein >= 20) tags.push("high-protein");
  if (recipe.nutrition.fiber >= 5) tags.push("high-fiber");
  if (recipe.ingredients.length <= 5) tags.push("simple");

  return tags;
}

function determineDifficulty(recipe: ImportedRecipe): string {
  let score = 0;

  if (recipe.ingredients.length > 10) score += 1;
  if (recipe.instructions.length > 8) score += 1;
  if (recipe.totalTime > 45) score += 1;
  if (
    recipe.instructions.some(
      (inst) =>
        inst.toLowerCase().includes("marinate") ||
        inst.toLowerCase().includes("rest") ||
        inst.toLowerCase().includes("chill"),
    )
  )
    score += 1;

  if (score === 0) return "easy";
  if (score <= 2) return "medium";
  return "hard";
}

async function saveRecipeToFile(recipe: any, category: string) {
  try {
    const dataDir = join(process.cwd(), "data", "recipes");
    const categoryFile = join(dataDir, `${category}.json`);

    // Read existing recipes
    let existingRecipes = [];
    try {
      const fs = require("fs");
      const content = fs.readFileSync(categoryFile, "utf8");
      existingRecipes = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is empty, start with empty array
      existingRecipes = [];
    }

    // Add new recipe
    existingRecipes.push(recipe);

    // Write back to file
    await writeFile(categoryFile, JSON.stringify(existingRecipes, null, 2));

    console.log(`Recipe saved to ${categoryFile}`);
  } catch (error) {
    console.error("Error saving recipe to file:", error);
    throw error;
  }
}

async function logImport(recipe: any, sourceUrl: string) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      recipeId: recipe.id,
      title: recipe.title,
      category: recipe.category,
      sourceUrl: sourceUrl,
      nutrition: recipe.nutrition,
    };

    const logDir = join(process.cwd(), "logs");
    const logFile = join(logDir, "recipe-imports.log");

    // Ensure logs directory exists
    const fs = require("fs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logLine = JSON.stringify(logEntry) + "\n";
    await writeFile(logFile, logLine, { flag: "a" });
  } catch (error) {
    console.error("Error logging import:", error);
    // Don't throw - logging failure shouldn't prevent import
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
