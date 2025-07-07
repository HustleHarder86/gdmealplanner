import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Get all recipe IDs to check for duplicates
    const recipesSnapshot = await db.collection('recipes').get();
    
    const recipeIds = recipesSnapshot.docs.map(doc => doc.id);
    const spoonacularIds = recipeIds
      .filter(id => id.startsWith('spoonacular-'))
      .map(id => id.replace('spoonacular-', ''));
    
    // Check for duplicates
    const uniqueSpoonacularIds = new Set(spoonacularIds);
    const hasDuplicates = spoonacularIds.length !== uniqueSpoonacularIds.size;
    
    // Find any duplicates
    const duplicates: string[] = [];
    const seen = new Set();
    for (const id of spoonacularIds) {
      if (seen.has(id)) {
        duplicates.push(id);
      } else {
        seen.add(id);
      }
    }
    
    return NextResponse.json({
      totalRecipes: recipeIds.length,
      spoonacularRecipes: spoonacularIds.length,
      uniqueSpoonacularIds: uniqueSpoonacularIds.size,
      hasDuplicates,
      duplicates,
      deduplicationStatus: hasDuplicates ? 'DUPLICATES FOUND' : 'NO DUPLICATES - WORKING CORRECTLY',
      message: hasDuplicates 
        ? 'Duplicates detected - this should not happen with proper deduplication'
        : 'Deduplication is working correctly - no duplicate Spoonacular recipes found'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check deduplication',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}