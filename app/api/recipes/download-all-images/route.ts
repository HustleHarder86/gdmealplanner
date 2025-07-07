import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    console.log('Starting batch image download process...');
    
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    const allResults: any[] = [];
    
    // Process in batches to avoid timeout
    const batchSize = 10;
    const maxBatches = 25; // Process up to 250 images in one run
    
    for (let i = 0; i < maxBatches; i++) {
      console.log(`Processing batch ${i + 1}...`);
      
      // Call the download-images endpoint
      const response = await fetch(`${baseUrl}/api/recipes/download-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          batchSize,
          skipExisting: true 
        })
      });
      
      if (!response.ok) {
        console.error(`Batch ${i + 1} failed:`, response.status);
        break;
      }
      
      const result = await response.json();
      
      if (result.processed === 0) {
        console.log('No more recipes to process');
        break;
      }
      
      totalProcessed += result.processed;
      totalSuccessful += result.successful;
      totalFailed += result.failed;
      allResults.push(...(result.results || []));
      
      console.log(`Batch ${i + 1} complete: ${result.successful}/${result.processed} successful`);
      
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Get final status
    const statusResponse = await fetch(`${baseUrl}/api/recipes/download-images`);
    const status = await statusResponse.json();
    
    return NextResponse.json({
      success: true,
      message: `Batch download complete. Processed ${totalProcessed} recipes.`,
      summary: {
        totalProcessed,
        totalSuccessful,
        totalFailed,
        ...status.status
      },
      sampleResults: allResults.slice(0, 10)
    });
    
  } catch (error) {
    console.error('Batch download error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to complete batch download',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check if batch download is needed
export async function GET() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    // Get current status
    const response = await fetch(`${baseUrl}/api/recipes/download-images`);
    const data = await response.json();
    
    return NextResponse.json({
      ...data,
      endpoint: '/api/recipes/download-all-images',
      method: 'POST',
      description: 'Downloads all recipe images in batches',
      recommendedAction: data.status?.withoutLocalImages > 0 
        ? `Run POST to download ${data.status.withoutLocalImages} remaining images`
        : 'All images have been downloaded'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}