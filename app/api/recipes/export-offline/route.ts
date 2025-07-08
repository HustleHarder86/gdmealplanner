import { NextRequest, NextResponse } from "next/server";
import recipesData from "@/data/production-recipes.json";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";
  const category = searchParams.get("category") || "all";

  let recipes = recipesData.recipes;

  // Filter by category if requested
  if (category !== "all") {
    recipes = recipes.filter((r: any) => r.category === category);
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    recipeCount: recipes.length,
    category: category,
    format: format,
    recipes: recipes,
  };

  if (format === "json") {
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="recipes_${category}_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }

  // Calculate category breakdown
  const categoryBreakdown = recipes.reduce(
    (acc: Record<string, number>, recipe: any) => {
      acc[recipe.category] = (acc[recipe.category] || 0) + 1;
      return acc;
    },
    {},
  );

  return NextResponse.json({
    success: true,
    message: `Export ready for ${recipes.length} recipes`,
    summary: {
      total: recipes.length,
      byCategory: categoryBreakdown,
    },
  });
}
