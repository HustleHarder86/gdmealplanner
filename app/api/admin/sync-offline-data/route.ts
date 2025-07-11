import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";
import { Recipe } from "@/src/types/recipe";
import * as fs from 'fs/promises';
import * as path from 'path';

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

    // Sort recipes by category and title for consistency
    recipes.sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return (a.title || '').localeCompare(b.title || '');
    });

    // Calculate recipe breakdown by category
    const categoryBreakdown = recipes.reduce((acc, recipe) => {
      const category = recipe.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create the export object
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recipeCount: recipes.length,
      categoryBreakdown: categoryBreakdown,
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

    // Also update local JSON files for the app
    try {
      // Update data/production-recipes.json
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      const productionPath = path.join(dataDir, 'production-recipes.json');
      await fs.writeFile(productionPath, JSON.stringify(exportData, null, 2));
      console.log(`Updated ${productionPath}`);

      // Update public/data/recipes.json (for static serving)
      const publicDir = path.join(process.cwd(), 'public', 'data');
      await fs.mkdir(publicDir, { recursive: true });

      const publicPath = path.join(publicDir, 'recipes.json');
      await fs.writeFile(publicPath, JSON.stringify(exportData, null, 2));
      console.log(`Updated ${publicPath}`);

      // Create minified version
      const minPath = path.join(publicDir, 'recipes.min.json');
      await fs.writeFile(minPath, JSON.stringify(exportData));
      console.log(`Updated ${minPath}`);

    } catch (fileError) {
      console.error('Error updating local files:', fileError);
      // Don't fail the whole operation if file update fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${recipes.length} recipes to offline storage and local files`,
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