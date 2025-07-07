import { NextResponse } from 'next/server';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes/complexSearch';

export async function GET() {
  if (!SPOONACULAR_API_KEY) {
    return NextResponse.json({ error: 'Spoonacular API key not configured' });
  }

  try {
    // Test the simplified "Classic Breakfast" strategy
    const breakfastUrl = new URL(BASE_URL);
    breakfastUrl.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    breakfastUrl.searchParams.append('query', 'eggs breakfast');
    breakfastUrl.searchParams.append('maxCarbs', '50');
    breakfastUrl.searchParams.append('type', 'breakfast');
    breakfastUrl.searchParams.append('number', '5');
    breakfastUrl.searchParams.append('addRecipeNutrition', 'true');
    
    const breakfastResponse = await fetch(breakfastUrl.toString());
    const breakfastData = await breakfastResponse.json();

    // Test simplified lunch strategy
    const lunchUrl = new URL(BASE_URL);
    lunchUrl.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    lunchUrl.searchParams.append('query', 'salad bowl quinoa');
    lunchUrl.searchParams.append('maxCarbs', '50');
    lunchUrl.searchParams.append('type', 'salad,main course');
    lunchUrl.searchParams.append('number', '5');
    lunchUrl.searchParams.append('addRecipeNutrition', 'true');
    
    const lunchResponse = await fetch(lunchUrl.toString());
    const lunchData = await lunchResponse.json();

    // Test simplified dinner strategy
    const dinnerUrl = new URL(BASE_URL);
    dinnerUrl.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    dinnerUrl.searchParams.append('query', 'chicken fish salmon');
    dinnerUrl.searchParams.append('maxCarbs', '55');
    dinnerUrl.searchParams.append('type', 'main course');
    dinnerUrl.searchParams.append('number', '5');
    dinnerUrl.searchParams.append('addRecipeNutrition', 'true');
    
    const dinnerResponse = await fetch(dinnerUrl.toString());
    const dinnerData = await dinnerResponse.json();

    // Test simplified snack strategy
    const snackUrl = new URL(BASE_URL);
    snackUrl.searchParams.append('apiKey', SPOONACULAR_API_KEY);
    snackUrl.searchParams.append('query', 'cheese nuts yogurt');
    snackUrl.searchParams.append('maxCarbs', '25');
    snackUrl.searchParams.append('type', 'snack,appetizer');
    snackUrl.searchParams.append('number', '5');
    snackUrl.searchParams.append('addRecipeNutrition', 'true');
    
    const snackResponse = await fetch(snackUrl.toString());
    const snackData = await snackResponse.json();

    return NextResponse.json({
      success: true,
      strategies: {
        breakfast: {
          query: 'eggs breakfast',
          totalResults: breakfastData.totalResults,
          recipes: breakfastData.results?.length || 0,
          sample: breakfastData.results?.slice(0, 2).map((r: any) => ({
            title: r.title,
            carbs: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount,
            protein: r.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount,
          })),
        },
        lunch: {
          query: 'salad bowl quinoa',
          totalResults: lunchData.totalResults,
          recipes: lunchData.results?.length || 0,
          sample: lunchData.results?.slice(0, 2).map((r: any) => ({
            title: r.title,
            carbs: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount,
          })),
        },
        dinner: {
          query: 'chicken fish salmon',
          totalResults: dinnerData.totalResults,
          recipes: dinnerData.results?.length || 0,
          sample: dinnerData.results?.slice(0, 2).map((r: any) => ({
            title: r.title,
            carbs: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount,
          })),
        },
        snack: {
          query: 'cheese nuts yogurt',
          totalResults: snackData.totalResults,
          recipes: snackData.results?.length || 0,
          sample: snackData.results?.slice(0, 2).map((r: any) => ({
            title: r.title,
            carbs: r.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount,
          })),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test strategies',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}