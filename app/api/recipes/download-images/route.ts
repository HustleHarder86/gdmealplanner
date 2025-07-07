import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseAdmin, adminDb, adminStorage } from '@/src/lib/firebase/admin';

// Helper to download image from URL
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download image: ${url} - Status: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return null;
  }
}

// Helper to upload image to Firebase Storage
async function uploadToStorage(buffer: Buffer, filename: string): Promise<string | null> {
  try {
    const bucket = adminStorage().bucket();
    const file = bucket.file(`recipe-images/${filename}`);
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Return the public URL
    return `https://storage.googleapis.com/${bucket.name}/recipe-images/${filename}`;
  } catch (error) {
    console.error(`Error uploading image ${filename}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      batchSize = 10,
      skipExisting = true 
    } = body;
    
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    console.log('Starting recipe image download process...');
    
    // Get all recipes that need image downloads
    let query = db.collection('recipes')
      .where('__name__', '>=', 'spoonacular-')
      .where('__name__', '<', 'spoonacular-\uf8ff');
    
    if (skipExisting) {
      // Only get recipes that don't have a local image URL yet
      query = query.where('localImageUrl', '==', null);
    }
    
    const snapshot = await query.limit(batchSize).get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No recipes need image downloads',
        processed: 0,
        successful: 0,
        failed: 0
      });
    }
    
    console.log(`Processing ${snapshot.size} recipes...`);
    
    let successful = 0;
    let failed = 0;
    const results: any[] = [];
    
    for (const doc of snapshot.docs) {
      const recipe = doc.data();
      const recipeId = doc.id;
      const imageUrl = recipe.imageUrl;
      
      if (!imageUrl) {
        console.log(`Recipe ${recipeId} has no image URL, skipping...`);
        failed++;
        results.push({
          id: recipeId,
          title: recipe.title,
          status: 'skipped',
          reason: 'No image URL'
        });
        continue;
      }
      
      console.log(`Downloading image for ${recipeId}: ${recipe.title}`);
      
      // Download the image
      const imageBuffer = await downloadImage(imageUrl);
      
      if (!imageBuffer) {
        failed++;
        results.push({
          id: recipeId,
          title: recipe.title,
          status: 'failed',
          reason: 'Download failed',
          originalUrl: imageUrl
        });
        continue;
      }
      
      // Generate filename
      const filename = `${recipeId}.jpg`;
      
      // Upload to Firebase Storage
      const storageUrl = await uploadToStorage(imageBuffer, filename);
      
      if (!storageUrl) {
        failed++;
        results.push({
          id: recipeId,
          title: recipe.title,
          status: 'failed',
          reason: 'Upload failed',
          originalUrl: imageUrl
        });
        continue;
      }
      
      // Update the recipe document with the new image URL
      await doc.ref.update({
        localImageUrl: storageUrl,
        imageDownloadedAt: new Date().toISOString()
      });
      
      successful++;
      results.push({
        id: recipeId,
        title: recipe.title,
        status: 'success',
        originalUrl: imageUrl,
        newUrl: storageUrl
      });
      
      console.log(`Successfully processed image for ${recipeId}`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${snapshot.size} recipes`,
      processed: snapshot.size,
      successful,
      failed,
      results
    });
    
  } catch (error) {
    console.error('Image download error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to download images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check download status
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Count recipes with and without local images
    const allRecipesSnapshot = await db.collection('recipes')
      .where('__name__', '>=', 'spoonacular-')
      .where('__name__', '<', 'spoonacular-\uf8ff')
      .get();
    
    let withLocalImages = 0;
    let withoutLocalImages = 0;
    let noImageUrl = 0;
    
    allRecipesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.localImageUrl) {
        withLocalImages++;
      } else if (data.imageUrl) {
        withoutLocalImages++;
      } else {
        noImageUrl++;
      }
    });
    
    return NextResponse.json({
      status: {
        totalRecipes: allRecipesSnapshot.size,
        withLocalImages,
        withoutLocalImages,
        noImageUrl,
        percentComplete: Math.round((withLocalImages / allRecipesSnapshot.size) * 100)
      },
      message: `${withLocalImages} of ${allRecipesSnapshot.size} recipes have downloaded images (${Math.round((withLocalImages / allRecipesSnapshot.size) * 100)}% complete)`
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get download status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}