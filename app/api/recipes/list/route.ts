import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Get all recipes from Firestore
    const snapshot = await db.collection('recipes').get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        recipes: [],
        count: 0,
        message: 'No recipes found'
      });
    }
    
    // Convert Firestore documents to recipe objects
    const recipes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure required fields exist  
        sourceUrl: data.sourceUrl || `https://spoonacular.com/recipes/${doc.id.replace('spoonacular-', '')}`
      };
    });
    
    // Filter to only include Spoonacular recipes (exclude any potential AI-generated ones)
    const spoonacularRecipes = recipes.filter(recipe => 
      recipe.id.startsWith('spoonacular-')
    );
    
    return NextResponse.json({
      success: true,
      recipes: spoonacularRecipes,
      count: spoonacularRecipes.length,
      totalInDatabase: recipes.length
    });
    
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recipes',
      details: error instanceof Error ? error.message : 'Unknown error',
      recipes: [],
      count: 0
    }, { status: 500 });
  }
}