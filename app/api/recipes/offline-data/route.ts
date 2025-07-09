import { NextRequest, NextResponse } from "next/server";
import { OfflineUpdaterVercel } from "@/src/services/offline-updater-vercel";
import { initializeFirebaseAdmin } from "@/src/lib/firebase/admin";

/**
 * GET endpoint to retrieve the offline recipe data
 * This can be used to download the production-recipes.json file
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Get the offline recipe data
    const result = await OfflineUpdaterVercel.getOfflineRecipeData();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Failed to generate offline data", details: result.errors },
        { status: 500 }
      );
    }

    // Return the recipe export data as JSON
    return NextResponse.json(result.data.export);
  } catch (error) {
    console.error("Error serving offline data:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve offline data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to update the offline recipe data in Firebase
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Get the offline recipe data
    const result = await OfflineUpdaterVercel.getOfflineRecipeData();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: "Failed to generate offline data", details: result.errors },
        { status: 500 }
      );
    }

    // Store in Firebase
    await OfflineUpdaterVercel.storeOfflineDataInFirebase(result.data.export);

    return NextResponse.json({
      success: true,
      message: "Offline data updated successfully",
      recipesUpdated: result.recipesUpdated,
      timestamp: result.timestamp,
      metadata: result.data.metadata,
    });
  } catch (error) {
    console.error("Error updating offline data:", error);
    return NextResponse.json(
      {
        error: "Failed to update offline data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}