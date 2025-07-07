import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    const { id } = params;
    
    // Get the specific recipe from Firestore
    const doc = await db.collection('recipes').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Recipe not found'
      }, { status: 404 });
    }
    
    const data = doc.data();
    const recipe = {
      id: doc.id,
      ...data,
      // Ensure required fields exist
      sourceUrl: data?.sourceUrl || `https://spoonacular.com/recipes/${doc.id.replace('spoonacular-', '')}`
    };
    
    return NextResponse.json({
      success: true,
      recipe
    });
    
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recipe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}