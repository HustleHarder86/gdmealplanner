import { NextResponse } from "next/server";

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!SPOONACULAR_API_KEY) {
    return NextResponse.json({ error: "Spoonacular API key not configured" });
  }

  try {
    // Simple search for "eggs"
    const simpleUrl = new URL(BASE_URL);
    simpleUrl.searchParams.append("apiKey", SPOONACULAR_API_KEY);
    simpleUrl.searchParams.append("query", "eggs");
    simpleUrl.searchParams.append("number", "5");
    simpleUrl.searchParams.append("addRecipeNutrition", "true");

    const simpleResponse = await fetch(simpleUrl.toString());
    const simpleData = await simpleResponse.json();

    // Complex search like the import strategy
    const complexUrl = new URL(BASE_URL);
    complexUrl.searchParams.append("apiKey", SPOONACULAR_API_KEY);
    complexUrl.searchParams.append(
      "query",
      "breakfast eggs omelet frittata scrambled",
    );
    complexUrl.searchParams.append("maxCarbs", "25");
    complexUrl.searchParams.append("minProtein", "10");
    complexUrl.searchParams.append("minFiber", "3");
    complexUrl.searchParams.append("maxReadyTime", "20");
    complexUrl.searchParams.append("type", "breakfast");
    complexUrl.searchParams.append("number", "5");
    complexUrl.searchParams.append("addRecipeNutrition", "true");

    const complexResponse = await fetch(complexUrl.toString());
    const complexData = await complexResponse.json();

    // Even more restrictive search
    const restrictiveUrl = new URL(BASE_URL);
    restrictiveUrl.searchParams.append("apiKey", SPOONACULAR_API_KEY);
    restrictiveUrl.searchParams.append("query", "breakfast");
    restrictiveUrl.searchParams.append("maxCarbs", "25");
    restrictiveUrl.searchParams.append("minProtein", "10");
    restrictiveUrl.searchParams.append("minFiber", "3");
    restrictiveUrl.searchParams.append("type", "breakfast");
    restrictiveUrl.searchParams.append("number", "5");
    restrictiveUrl.searchParams.append("addRecipeNutrition", "true");

    const restrictiveResponse = await fetch(restrictiveUrl.toString());
    const restrictiveData = await restrictiveResponse.json();

    return NextResponse.json({
      simpleSearch: {
        query: "eggs",
        totalResults: simpleData.totalResults,
        results: simpleData.results?.length || 0,
        sample: simpleData.results?.slice(0, 2),
      },
      complexSearch: {
        query: "breakfast eggs omelet frittata scrambled",
        totalResults: complexData.totalResults,
        results: complexData.results?.length || 0,
        sample: complexData.results?.slice(0, 2),
      },
      restrictiveSearch: {
        query: "breakfast with nutrition filters",
        totalResults: restrictiveData.totalResults,
        results: restrictiveData.results?.length || 0,
        sample: restrictiveData.results?.slice(0, 2),
      },
      debug: {
        apiKeyLength: SPOONACULAR_API_KEY.length,
        simpleStatus: simpleResponse.status,
        complexStatus: complexResponse.status,
        restrictiveStatus: restrictiveResponse.status,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to search recipes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
