import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";
import { Recipe } from "@/src/types/recipe";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // In production, you should verify the user is an admin
    // For now, we'll proceed with the sync

    console.log('Starting offline data sync...');

    // Fetch all recipes from Firebase
    const recipesSnapshot = await adminDb()
      .collection('recipes')
      .orderBy('createdAt', 'desc')
      .get();

    const recipes: Recipe[] = [];
    recipesSnapshot.forEach((doc) => {
      recipes.push({
        id: doc.id,
        ...doc.data(),
      } as Recipe);
    });

    console.log(`Fetched ${recipes.length} recipes from Firebase`);

    // Create the export object
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recipeCount: recipes.length,
      recipes: recipes,
      source: 'Firebase Production Database',
    };

    // Update the offline data in Firebase
    await adminDb()
      .collection('offlineData')
      .doc('recipes')
      .set({
        export: exportData,
        lastUpdated: new Date().toISOString(),
        recipeCount: recipes.length,
      });

    console.log('Offline data updated successfully in Firebase');

    // Calculate recipe breakdown by category
    const categoryBreakdown = recipes.reduce((acc, recipe) => {
      const category = recipe.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${recipes.length} recipes to offline storage`,
      recipeCount: recipes.length,
      breakdown: categoryBreakdown,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync offline data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}