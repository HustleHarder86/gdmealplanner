import { NextRequest, NextResponse } from "next/server";
import { SpoonacularClient } from "@/src/services/spoonacular/client";
import { initializeFirebaseAdmin } from "@/src/lib/firebase/admin";
import { RecipeModel } from "@/src/lib/firebase/models/recipe";
import { transformSpoonacularRecipe } from "@/src/services/spoonacular/transformers";
import { validateRecipeForImport } from "@/src/services/spoonacular/automated-import/quality-validator";
import { RecipeCategorizer } from "@/src/services/spoonacular/automated-import/categorizer";
import { Recipe } from "@/src/types/recipe";

// Simple query mapping based on MCP_RECIPE_LIBRARY_BUILD.md
const SIMPLE_QUERIES = {
  breakfast: [
    "eggs",
    "oatmeal",
    "overnight oats",
    "greek yogurt",
    "smoothie",
    "pancakes",
    "quinoa breakfast",
    "chia pudding",
    "avocado toast",
    "cottage cheese"
  ],
  lunch: [
    "chicken salad",
    "tuna salad",
    "turkey sandwich",
    "veggie wrap",
    "lentil soup",
    "minestrone",
    "chicken soup",
    "grain bowl",
    "mediterranean bowl",
    "bean salad"
  ],
  dinner: [
    "grilled chicken",
    "baked salmon",
    "turkey meatballs",
    "tofu stir fry",
    "beef stew",
    "vegetable curry",
    "shrimp dinner",
    "pork tenderloin",
    "bean chili",
    "cauliflower"
  ],
  snack: [
    "hummus",
    "greek yogurt snack",
    "cheese crackers",
    "apple peanut butter",
    "mixed nuts",
    "veggie sticks",
    "hard boiled eggs",
    "protein balls",
    "cottage cheese snack",
    "berries"
  ]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      category = "breakfast", 
      queryIndex = 0,
      count = 5,
    } = body;

    // Validate category
    if (!SIMPLE_QUERIES[category as keyof typeof SIMPLE_QUERIES]) {
      return NextResponse.json(
        { error: "Invalid category. Use: breakfast, lunch, dinner, or snack" },
        { status: 400 }
      );
    }

    // Get queries for category
    const categoryQueries = SIMPLE_QUERIES[category as keyof typeof SIMPLE_QUERIES];
    
    // Validate query index
    if (queryIndex >= categoryQueries.length) {
      return NextResponse.json(
        { error: `Invalid query index. Maximum for ${category} is ${categoryQueries.length - 1}` },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Create client and categorizer
    const client = new SpoonacularClient(apiKey);
    const categorizer = new RecipeCategorizer();

    // Get the simple query
    const query = categoryQueries[queryIndex];
    console.log(`Importing ${category} recipes with query: "${query}"`);

    // Set up search parameters with relaxed constraints
    const searchParams = {
      query: query,
      number: count,
      addRecipeNutrition: true,
      addRecipeInformation: true,
      sort: "popularity",
      type: category === "snack" ? "snack,appetizer" : category === "breakfast" ? "breakfast" : "main course",
      maxCarbs: category === "breakfast" ? 50 : category === "snack" ? 30 : 60,
    };

    // Search for recipes
    const searchResponse = await client.searchRecipes(searchParams);
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No recipes found for query: "${query}"`,
        import: {
          query,
          category,
          imported: 0,
          processed: 0,
          rejected: 0,
        }
      });
    }

    // Process recipes
    const importedRecipes: Recipe[] = [];
    const rejectedRecipes: any[] = [];
    
    for (const searchResult of searchResponse.results) {
      try {
        // Get full recipe details
        const fullRecipe = await client.getRecipeInfo(searchResult.id);
        
        // Validate recipe
        const validation = validateRecipeForImport(fullRecipe);
        
        // Use relaxed validation - only reject if validation score is very low
        if (validation.qualityScore.totalScore < 30) {
          rejectedRecipes.push({
            id: fullRecipe.id,
            title: fullRecipe.title,
            reason: validation.rejectionReasons?.join(", ") || "Low quality score",
            score: validation.qualityScore.totalScore
          });
          continue;
        }

        // Categorize recipe
        const categorization = categorizer.categorize(fullRecipe);
        
        // Transform to our format
        const recipe = transformSpoonacularRecipe(
          fullRecipe,
          categorization.primaryCategory as Recipe['category']
        );

        // Enrich with metadata
        const enrichedRecipe: Recipe = {
          ...recipe,
          category: categorization.primaryCategory as Recipe['category'],
          tags: categorization.tags,
          gdValidation: {
            isValid: validation.isValid,
            score: validation.qualityScore.totalScore,
            details: validation.qualityScore,
            warnings: validation.rejectionReasons || []
          },
          importedFrom: 'spoonacular',
          importedAt: new Date().toISOString(),
          verified: false,
          popularity: 0,
          userRatings: [],
          timesViewed: 0,
          timesAddedToPlan: 0
        };

        importedRecipes.push(enrichedRecipe);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing recipe ${searchResult.id}:`, error);
        rejectedRecipes.push({
          id: searchResult.id,
          title: searchResult.title,
          reason: error instanceof Error ? error.message : "Processing error"
        });
      }
    }

    // Save imported recipes to Firebase
    if (importedRecipes.length > 0) {
      await RecipeModel.batchSave(importedRecipes);
    }

    // Get updated library stats
    const allRecipes = await RecipeModel.getAll();
    const breakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    };
    
    allRecipes.forEach(recipe => {
      if (recipe.category && breakdown[recipe.category] !== undefined) {
        breakdown[recipe.category]++;
      }
    });

    return NextResponse.json({
      success: true,
      import: {
        query,
        category,
        imported: importedRecipes.length,
        processed: searchResponse.results.length,
        rejected: rejectedRecipes.length,
        rejectedDetails: rejectedRecipes
      },
      library: {
        total: allRecipes.length,
        breakdown
      }
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { 
        error: "Import failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show available queries
export async function GET() {
  return NextResponse.json({
    availableQueries: SIMPLE_QUERIES,
    usage: {
      endpoint: "/api/recipes/import-simple",
      method: "POST",
      body: {
        category: "breakfast|lunch|dinner|snack",
        queryIndex: "index of query to use (0-9 depending on category)",
        count: "number of recipes to import (default: 5)"
      },
      example: {
        category: "breakfast",
        queryIndex: 0,
        count: 5
      }
    }
  });
}