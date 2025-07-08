import { NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb } from '@/src/lib/firebase/admin';

export async function POST() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    console.log('Starting complete recipe backup process...');
    
    // Get all recipes from Firestore
    const snapshot = await db.collection('recipes').get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No recipes found to backup'
      });
    }
    
    // Create a backup collection with timestamp
    const backupDate = new Date().toISOString().split('T')[0];
    const backupCollectionName = `recipes_backup_${backupDate}`;
    
    console.log(`Creating backup in collection: ${backupCollectionName}`);
    
    // Copy all recipes to backup collection
    const batch = db.batch();
    let batchCount = 0;
    let totalBacked = 0;
    
    for (const doc of snapshot.docs) {
      const backupRef = db.collection(backupCollectionName).doc(doc.id);
      batch.set(backupRef, {
        ...doc.data(),
        backedUpAt: new Date().toISOString()
      });
      
      batchCount++;
      
      // Firestore batch limit is 500
      if (batchCount === 500) {
        await batch.commit();
        totalBacked += batchCount;
        batchCount = 0;
        console.log(`Backed up ${totalBacked} recipes so far...`);
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      totalBacked += batchCount;
    }
    
    // Create a metadata document
    await db.collection('backups').doc(backupCollectionName).set({
      createdAt: new Date().toISOString(),
      recipeCount: snapshot.size,
      collectionName: backupCollectionName,
      type: 'complete_backup',
      description: 'Full recipe data backup including all fields'
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully backed up ${snapshot.size} recipes`,
      backupCollection: backupCollectionName,
      recipeCount: snapshot.size
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to backup recipes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to list available backups
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Get all backups
    const backupsSnapshot = await db.collection('backups')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const backups = backupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get current recipe count
    const recipeCount = await db.collection('recipes').count().get();
    
    return NextResponse.json({
      currentRecipeCount: recipeCount.data().count,
      backups,
      message: `Found ${backups.length} backups. Current database has ${recipeCount.data().count} recipes.`
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list backups',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}