import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";
import { RecipeImporter } from "@/src/services/spoonacular/recipe-importer";
import { OfflineUpdaterVercel } from "@/src/services/offline-updater-vercel";

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // In development, skip auth check
    // In production, you should verify the user is an admin
    const isDevelopment = process.env.NODE_ENV === "development";

    // Get recipe IDs from request body
    const { recipeIds } = await request.json();

    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json(
        { error: "Recipe IDs array is required" },
        { status: 400 },
      );
    }

    // Check for API key
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Spoonacular API key not configured" },
        { status: 500 },
      );
    }

    // Create importer instance
    const importer = new RecipeImporter(apiKey);

    // Import recipes
    const importResults = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process recipes in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < recipeIds.length; i += batchSize) {
      const batch = recipeIds.slice(i, i + batchSize);

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (recipeId) => {
          try {
            // Check if recipe already exists
            const existingDoc = await adminDb()
              .collection("recipes")
              .where("spoonacularId", "==", recipeId.toString())
              .get();

            if (!existingDoc.empty) {
              importResults.skipped++;
              return { id: recipeId, status: "skipped" };
            }

            // Import recipe
            const result = await importer.importRecipe(recipeId.toString());

            if (result.success) {
              importResults.imported++;
              return { id: recipeId, status: "imported" };
            } else {
              importResults.failed++;
              importResults.errors.push(`Recipe ${recipeId}: ${result.error}`);
              return { id: recipeId, status: "failed", error: result.error };
            }
          } catch (error) {
            importResults.failed++;
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            importResults.errors.push(`Recipe ${recipeId}: ${errorMsg}`);
            return { id: recipeId, status: "failed", error: errorMsg };
          }
        }),
      );

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipeIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Record import history
    await adminDb().collection("importHistory").add({
      timestamp: new Date(),
      recipesImported: importResults.imported,
      recipesSkipped: importResults.skipped,
      recipesFailed: importResults.failed,
      totalProcessed: recipeIds.length,
      errors: importResults.errors,
      importType: "manual-bulk",
      performedBy: "admin",
    });

    // Update offline data in Firebase if any recipes were imported
    if (importResults.imported > 0) {
      try {
        // Get the updated recipe data
        const offlineResult = await OfflineUpdaterVercel.getOfflineRecipeData();
        
        if (offlineResult.success && offlineResult.data) {
          // Store in Firebase for later retrieval
          await OfflineUpdaterVercel.storeOfflineDataInFirebase(offlineResult.data.export);
          console.log("Offline data updated in Firebase successfully");
        }
      } catch (error) {
        console.error("Failed to update offline data:", error);
        // Don't fail the import if offline update fails
      }
    }

    return NextResponse.json({
      success: true,
      imported: importResults.imported,
      skipped: importResults.skipped,
      failed: importResults.failed,
      errors: importResults.errors.slice(0, 10), // Limit error messages
      message: `Successfully imported ${importResults.imported} recipes`,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      {
        error: "Import failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
