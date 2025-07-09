import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin } from "@/src/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // In development, skip auth check
    // In production, you should verify the user is an admin
    const isDevelopment = process.env.NODE_ENV === "development";

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const maxCarbs = searchParams.get("maxCarbs") || "45";
    const maxReadyTime = searchParams.get("maxReadyTime") || "60";
    const number = searchParams.get("number") || "20";
    const type = searchParams.get("type");
    const diet = searchParams.get("diet");

    // Build Spoonacular API URL
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 },
      );
    }

    const spoonacularParams = new URLSearchParams({
      apiKey,
      query,
      number,
      maxReadyTime,
      includeNutrition: "true",
      instructionsRequired: "true",
      fillIngredients: "true",
      addRecipeInformation: "true",
      maxCarbs,
    });

    if (type && type !== "all") {
      spoonacularParams.append("type", type);
    }

    if (diet && diet !== "none") {
      spoonacularParams.append("diet", diet);
    }

    const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?${spoonacularParams}`;

    // Fetch from Spoonacular
    const response = await fetch(spoonacularUrl);

    if (!response.ok) {
      console.error(
        "Spoonacular API error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: "Failed to fetch recipes from Spoonacular" },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Add GD compliance check to each recipe
    const enrichedResults = data.results.map((recipe: any) => {
      const carbs =
        recipe.nutrition?.nutrients?.find(
          (n: any) => n.name === "Carbohydrates",
        )?.amount || 0;

      return {
        ...recipe,
        gdCompliant: carbs >= 15 && carbs <= 45,
        carbAmount: carbs,
      };
    });

    return NextResponse.json({
      results: enrichedResults,
      totalResults: data.totalResults,
      offset: data.offset,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
