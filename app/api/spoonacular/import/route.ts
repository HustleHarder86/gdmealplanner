import { NextRequest, NextResponse } from 'next/server';
import { SpoonacularClient } from '../../../../src/services/spoonacular/client';
import { RecipeImportService } from '../../../../src/services/spoonacular/recipe-import';
import { transformSpoonacularRecipe } from '../../../../src/services/spoonacular/transformers';
import { validateRecipeForGD } from '../../../../src/services/spoonacular/validators';
import { RecipeModel } from '../../../../src/lib/firebase/models/recipe';
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
    const importService = new RecipeImportService(process.env.SPOONACULAR_API_KEY);
    
    let recipesToImport: Recipe[] = [];
    let importResults: any[] = [];

    // Import specific recipe IDs
    if (body.recipeIds && body.recipeIds.length > 0) {
      console.log(`Importing ${body.recipeIds.length} specific recipes...`);
      
      for (const recipeId of body.recipeIds) {
        try {
          const spoonacularRecipe = await client.getRecipeInfo(recipeId, true);
          const recipe = transformSpoonacularRecipe(spoonacularRecipe, 'dinner');
          
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
      
      // Use the automated import scheduler for category imports
      const { RecipeImportScheduler } = await import('../../../../src/services/spoonacular/automated-import/scheduler');
      const scheduler = new RecipeImportScheduler(process.env.SPOONACULAR_API_KEY);
      
      // Create a custom strategy for this manual import
      const strategy = {
        name: `Manual ${body.searchParams.category} import`,
        category: body.searchParams.category,
        targetCount: body.searchParams.count,
        filters: {
          type: body.searchParams.category === 'snacks' ? 'snack' : body.searchParams.category,
          minCarbs: 15,
          maxCarbs: body.searchParams.category === 'snacks' ? 25 : 45,
          minProtein: 5,
          minFiber: 2,
          number: 20,
          addRecipeInformation: true,
          addRecipeNutrition: true
        },
        strategies: []
      };
      
      const report = await scheduler.manualImport(strategy, body.searchParams.count);
      
      // Convert report to import results format
      importResults = report.recipes.map(r => ({
        id: r.spoonacularData.id,
        title: r.spoonacularData.title,
        category: r.categorization.primaryCategory,
        gdValid: r.validation.isValid,
        imported: true,
        error: null
      }));
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
  const enrichedRecipe: Recipe = {
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
  };
  
  await RecipeModel.save(enrichedRecipe);
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