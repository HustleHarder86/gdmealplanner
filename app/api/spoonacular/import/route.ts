import { NextRequest, NextResponse } from 'next/server';
import { SpoonacularClient } from '../../../../src/services/spoonacular/client';
import { RecipeImportService } from '../../../../src/services/spoonacular/recipe-import';
import { transformSpoonacularToRecipe } from '../../../../src/services/spoonacular/transformers';
import { validateRecipeForGD } from '../../../../src/services/spoonacular/validators';
import { db } from '../../../../src/lib/firebase/admin';
import { Recipe } from '../../../../src/types/recipe';

interface ImportRequest {
  recipeIds?: number[];
  searchParams?: {
    category: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    count: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.SPOONACULAR_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Spoonacular API key not configured'
      }, { status: 500 });
    }

    const body: ImportRequest = await request.json();
    const client = new SpoonacularClient(process.env.SPOONACULAR_API_KEY);
    const importService = new RecipeImportService(client);
    
    let recipesToImport: Recipe[] = [];
    let importResults: any[] = [];

    // Import specific recipe IDs
    if (body.recipeIds && body.recipeIds.length > 0) {
      console.log(`Importing ${body.recipeIds.length} specific recipes...`);
      
      for (const recipeId of body.recipeIds) {
        try {
          const spoonacularRecipe = await client.getRecipeInfo(recipeId, true);
          const recipe = transformSpoonacularToRecipe(spoonacularRecipe);
          
          // Determine meal type based on calories/title
          const mealType = determineMealType(recipe);
          const gdValidation = validateRecipeForGD(spoonacularRecipe, mealType);
          
          // Store in Firebase
          await storeRecipe(recipe, gdValidation);
          
          importResults.push({
            id: recipe.id,
            title: recipe.title,
            category: recipe.category,
            gdValid: gdValidation.isValid,
            imported: true,
            error: null
          });
          
        } catch (error) {
          importResults.push({
            id: recipeId,
            imported: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Search and import by category
    if (body.searchParams) {
      console.log(`Searching for ${body.searchParams.count} ${body.searchParams.category} recipes...`);
      
      const searchResults = await importService.importRecipesForCategory(
        body.searchParams.category,
        body.searchParams.count
      );
      
      for (const result of searchResults) {
        importResults.push(result);
      }
    }

    // Summary statistics
    const summary = {
      totalAttempted: importResults.length,
      successfulImports: importResults.filter(r => r.imported).length,
      failedImports: importResults.filter(r => !r.imported).length,
      gdCompliant: importResults.filter(r => r.gdValid).length
    };

    return NextResponse.json({
      success: true,
      summary,
      results: importResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recipe import error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 });
  }
}

// Helper function to store recipe in Firebase
async function storeRecipe(recipe: Recipe, gdValidation: any) {
  const recipeRef = db.collection('recipes_library').doc(recipe.id);
  
  await recipeRef.set({
    ...recipe,
    gdValidation: {
      isValid: gdValidation.isValid,
      score: gdValidation.score,
      details: gdValidation.details,
      warnings: gdValidation.warnings
    },
    importedFrom: 'spoonacular',
    importedAt: new Date().toISOString(),
    verified: false,
    popularity: 0,
    userRatings: [],
    timesViewed: 0,
    timesAddedToPlan: 0
  });
}

// Helper function to determine meal type
function determineMealType(recipe: Recipe): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const title = recipe.title.toLowerCase();
  const calories = recipe.nutrition.calories;
  
  // Title-based detection
  if (title.includes('breakfast') || title.includes('pancake') || 
      title.includes('oatmeal') || title.includes('smoothie')) {
    return 'breakfast';
  }
  
  if (title.includes('snack') || calories < 200) {
    return 'snack';
  }
  
  if (title.includes('lunch') || title.includes('sandwich') || 
      title.includes('salad') || title.includes('wrap')) {
    return 'lunch';
  }
  
  // Default to dinner for main dishes
  return 'dinner';
}