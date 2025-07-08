import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function POST() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    console.log('Preparing recipes for offline use...');
    
    // Get all recipes with local images
    const snapshot = await db.collection('recipes')
      .where('localImageUrl', '!=', null)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No recipes with local images found. Please download images first.'
      });
    }
    
    const recipes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    // Create a complete offline dataset
    const offlineData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recipeCount: recipes.length,
      recipes: recipes,
      categories: {
        breakfast: recipes.filter(r => r.category === 'breakfast'),
        lunch: recipes.filter(r => r.category === 'lunch'),
        dinner: recipes.filter(r => r.category === 'dinner'),
        snack: recipes.filter(r => r.category === 'snack')
      },
      metadata: {
        totalWithImages: recipes.filter(r => r.localImageUrl).length,
        averageCarbs: Math.round(
          recipes.reduce((sum, r) => sum + r.nutrition.carbohydrates, 0) / recipes.length
        ),
        quickRecipes: recipes.filter(r => r.totalTime <= 30).length,
        bedtimeSnacks: recipes.filter(r => 
          r.category === 'snack' &&
          r.nutrition.carbohydrates >= 14 &&
          r.nutrition.carbohydrates <= 16 &&
          r.nutrition.protein >= 5
        ).length
      }
    };
    
    // Save to a special collection for offline data
    const offlineRef = db.collection('offline_data').doc('recipes_v1');
    await offlineRef.set({
      ...offlineData,
      lastUpdated: new Date().toISOString()
    });
    
    // Also create category-specific documents for faster loading
    for (const [category, categoryRecipes] of Object.entries(offlineData.categories)) {
      await db.collection('offline_data').doc(`recipes_${category}`).set({
        category,
        recipes: categoryRecipes,
        count: categoryRecipes.length,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully prepared offline data',
      summary: {
        totalRecipes: recipes.length,
        withImages: offlineData.metadata.totalWithImages,
        byCategory: Object.entries(offlineData.categories).reduce((acc, [cat, recipes]) => {
          acc[cat] = recipes.length;
          return acc;
        }, {} as Record<string, number>)
      }
    });
    
  } catch (error) {
    console.error('Offline preparation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to prepare offline data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check offline readiness
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Check if offline data exists
    const offlineDoc = await db.collection('offline_data').doc('recipes_v1').get();
    
    if (!offlineDoc.exists) {
      return NextResponse.json({
        ready: false,
        message: 'No offline data prepared yet. Run POST to prepare.'
      });
    }
    
    const data = offlineDoc.data();
    
    return NextResponse.json({
      ready: true,
      lastUpdated: data?.lastUpdated,
      recipeCount: data?.recipeCount,
      metadata: data?.metadata,
      message: 'Offline data is ready'
    });
    
  } catch (error) {
    return NextResponse.json({
      ready: false,
      error: 'Failed to check offline status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}