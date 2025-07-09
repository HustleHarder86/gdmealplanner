import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();

    // Get format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json";
    const category = searchParams.get("category") || "all";

    console.log(`Exporting recipes in ${format} format, category: ${category}`);

    // Build query
    let snapshot;
    if (category !== "all") {
      snapshot = await db
        .collection("recipes")
        .where("category", "==", category)
        .get();
    } else {
      snapshot = await db.collection("recipes").get();
    }

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        message: "No recipes found to export",
      });
    }

    // Convert to array and ensure all data is included
    const recipes = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure we have all fields
        title: data.title,
        description: data.description || "",
        category: data.category,
        subcategory: data.subcategory || "",
        tags: data.tags || [],
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalTime: data.totalTime,
        servings: data.servings,
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        nutrition: data.nutrition || {},
        carbChoices: data.carbChoices,
        gdValidation: data.gdValidation || {},
        source: data.source || "Spoonacular",
        sourceUrl: data.sourceUrl || "",
        imageUrl: data.imageUrl || "",
        localImageUrl: data.localImageUrl || "",
        importedFrom: data.importedFrom || "spoonacular",
        importedAt: data.importedAt || "",
        verified: data.verified || false,
        popularity: data.popularity || 0,
        userRatings: data.userRatings || [],
        timesViewed: data.timesViewed || 0,
        timesAddedToPlan: data.timesAddedToPlan || 0,
      };
    });

    // Generate export data
    const exportData = {
      exportDate: new Date().toISOString(),
      recipeCount: recipes.length,
      category: category,
      format: format,
      recipes: recipes,
    };

    if (format === "json") {
      // Return as JSON download
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="recipes_${category}_${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    } else {
      // Return summary for other formats
      return NextResponse.json({
        success: true,
        message: `Export ready for ${recipes.length} recipes`,
        summary: {
          total: recipes.length,
          byCategory: recipes.reduce(
            (acc, r) => {
              acc[r.category] = (acc[r.category] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
