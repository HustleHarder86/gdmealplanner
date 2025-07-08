import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 },
      );
    }

    // Test with a simple API call to get a random recipe
    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?apiKey=${apiKey}&number=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Spoonacular API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Spoonacular API is working",
      recipesFound: data.recipes?.length || 0,
    });
  } catch (error) {
    console.error("Spoonacular test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
