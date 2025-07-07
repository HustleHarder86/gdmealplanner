import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function POST() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    console.log('Starting cleanup of AI-generated recipes...');
    
    // Get all recipe IDs
    const recipesSnapshot = await db.collection('recipes').get();
    const allRecipeIds = recipesSnapshot.docs.map(doc => doc.id);
    
    console.log(`Found ${allRecipeIds.length} total recipes in database`);
    
    // Identify Spoonacular recipes (start with 'spoonacular-')
    const spoonacularRecipeIds = allRecipeIds.filter(id => id.startsWith('spoonacular-'));
    
    // Identify AI-generated recipes (don't start with 'spoonacular-')
    const aiGeneratedRecipeIds = allRecipeIds.filter(id => !id.startsWith('spoonacular-'));
    
    console.log(`Found ${spoonacularRecipeIds.length} Spoonacular recipes`);
    console.log(`Found ${aiGeneratedRecipeIds.length} AI-generated recipes to delete`);
    
    if (aiGeneratedRecipeIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No AI-generated recipes found to delete',
        summary: {
          totalRecipes: allRecipeIds.length,
          spoonacularRecipes: spoonacularRecipeIds.length,
          aiGeneratedRecipes: 0,
          deleted: 0
        }
      });
    }
    
    // Delete AI-generated recipes in batches (Firestore batch limit is 500)
    const batchSize = 500;
    let totalDeleted = 0;
    
    for (let i = 0; i < aiGeneratedRecipeIds.length; i += batchSize) {
      const batch = db.batch();
      const batchIds = aiGeneratedRecipeIds.slice(i, i + batchSize);
      
      batchIds.forEach(id => {
        const docRef = db.collection('recipes').doc(id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      totalDeleted += batchIds.length;
      
      console.log(`Deleted batch of ${batchIds.length} recipes (${totalDeleted}/${aiGeneratedRecipeIds.length} total)`);
    }
    
    // Verify cleanup
    const finalSnapshot = await db.collection('recipes').get();
    const finalCount = finalSnapshot.docs.length;
    const finalSpoonacularCount = finalSnapshot.docs.filter(doc => doc.id.startsWith('spoonacular-')).length;
    
    console.log(`Cleanup complete. Final count: ${finalCount} recipes (${finalSpoonacularCount} Spoonacular)`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${totalDeleted} AI-generated recipes`,
      summary: {
        initialTotal: allRecipeIds.length,
        finalTotal: finalCount,
        spoonacularRecipes: finalSpoonacularCount,
        aiGeneratedRecipes: aiGeneratedRecipeIds.length,
        deleted: totalDeleted
      }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup AI-generated recipes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to preview what would be deleted
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Get all recipe IDs
    const recipesSnapshot = await db.collection('recipes').get();
    const allRecipeIds = recipesSnapshot.docs.map(doc => doc.id);
    
    // Identify Spoonacular vs AI-generated recipes
    const spoonacularRecipeIds = allRecipeIds.filter(id => id.startsWith('spoonacular-'));
    const aiGeneratedRecipeIds = allRecipeIds.filter(id => !id.startsWith('spoonacular-'));
    
    return NextResponse.json({
      preview: {
        totalRecipes: allRecipeIds.length,
        spoonacularRecipes: spoonacularRecipeIds.length,
        aiGeneratedRecipes: aiGeneratedRecipeIds.length,
        willKeep: spoonacularRecipeIds.length,
        willDelete: aiGeneratedRecipeIds.length
      },
      spoonacularSample: spoonacularRecipeIds.slice(0, 5),
      aiGeneratedSample: aiGeneratedRecipeIds.slice(0, 5)
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to preview cleanup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}