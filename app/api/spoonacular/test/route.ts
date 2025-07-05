import { NextRequest, NextResponse } from 'next/server';
import { SpoonacularClient } from '../../../../src/services/spoonacular/client';
import { validateRecipeForGD } from '../../../../src/services/spoonacular/validators';

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.SPOONACULAR_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'SPOONACULAR_API_KEY not configured in environment variables'
      }, { status: 500 });
    }

    // Initialize client
    const client = new SpoonacularClient(process.env.SPOONACULAR_API_KEY);
    
    // Test 1: Search for GD-friendly recipes
    console.log('Searching for GD-friendly recipes...');
    const searchResults = await client.searchRecipes({
      minCarbs: 15,
      maxCarbs: 40,
      minProtein: 8,
      minFiber: 3,
      number: 3,
      addRecipeInformation: true,
      addRecipeNutrition: true
    });

    // Test 2: Get detailed information for first recipe
    let recipeDetails = null;
    let gdValidation = null;
    
    if (searchResults.results && searchResults.results.length > 0) {
      const firstRecipeId = searchResults.results[0].id;
      console.log(`Getting details for recipe ${firstRecipeId}...`);
      
      recipeDetails = await client.getRecipeInformation(firstRecipeId, {
        includeNutrition: true
      });
      
      // Validate for GD
      gdValidation = validateRecipeForGD(recipeDetails);
    }

    // Return test results
    return NextResponse.json({
      success: true,
      tests: {
        apiKeyConfigured: true,
        recipeSearch: {
          success: searchResults.results.length > 0,
          resultsFound: searchResults.results.length,
          firstThreeRecipes: searchResults.results.slice(0, 3).map(r => ({
            id: r.id,
            title: r.title,
            readyInMinutes: r.readyInMinutes,
            servings: r.servings
          }))
        },
        recipeDetails: recipeDetails ? {
          success: true,
          recipe: {
            id: recipeDetails.id,
            title: recipeDetails.title,
            nutrition: recipeDetails.nutrition?.nutrients?.slice(0, 5).map(n => ({
              name: n.name,
              amount: n.amount,
              unit: n.unit
            }))
          }
        } : { success: false, message: 'No recipes found to test' },
        gdValidation: gdValidation || { success: false, message: 'No recipe to validate' }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Spoonacular API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}