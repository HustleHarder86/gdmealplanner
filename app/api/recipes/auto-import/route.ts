import { NextRequest, NextResponse } from 'next/server';

// Simple queries that work well with Spoonacular
const IMPORT_QUERIES = {
  breakfast: ['eggs', 'oatmeal', 'yogurt', 'smoothie', 'pancakes', 'toast', 'cereal', 'granola', 'muffin', 'fruit'],
  lunch: ['salad', 'sandwich', 'soup', 'wrap', 'bowl', 'chicken', 'turkey', 'tuna', 'vegetables', 'quinoa'],
  dinner: ['chicken', 'fish', 'beef', 'pasta', 'rice', 'vegetables', 'stir fry', 'casserole', 'curry', 'salmon'],
  snack: ['nuts', 'cheese', 'crackers', 'hummus', 'fruit', 'yogurt', 'vegetables', 'protein', 'berries', 'apple']
};

export async function POST(request: NextRequest) {
  try {
    // Check if imports are paused
    const baseUrl = request.url.split('/api')[0];
    try {
      const pauseResponse = await fetch(`${baseUrl}/api/recipes/pause-import`);
      const pauseData = await pauseResponse.json();
      if (pauseData.paused) {
        return NextResponse.json({
          success: false,
          message: 'Recipe imports are currently paused. Use DELETE /api/recipes/pause-import to resume.',
          paused: true
        });
      }
    } catch (error) {
      // If pause endpoint doesn't exist, continue
    }

    const body = await request.json();
    const { 
      targetTotal = 400,
      batchSize = 10,
      maxConcurrent = 3,
      requestDelay = 500 // 500ms = 2 requests/second
    } = body;

    console.log(`Starting auto-import to reach ${targetTotal} recipes`);
    
    // Get current count
    const countResponse = await fetch(`${baseUrl}/api/recipes/count`);
    const { count: currentCount } = await countResponse.json();
    
    console.log(`Current count: ${currentCount}, target: ${targetTotal}`);
    
    if (currentCount >= targetTotal) {
      return NextResponse.json({
        success: true,
        message: `Already have ${currentCount} recipes (target: ${targetTotal})`,
        totalImported: 0
      });
    }

    const recipesNeeded = targetTotal - currentCount;
    const recipesPerCategory = Math.ceil(recipesNeeded / 4);
    
    console.log(`Need ${recipesNeeded} more recipes, ${recipesPerCategory} per category`);

    // Track imports
    let totalImported = 0;
    const importResults: any[] = [];
    
    // Import function with rate limiting
    const importBatch = async (category: string, queryIndex: number, count: number) => {
      try {
        const response = await fetch(`${baseUrl}/api/recipes/import-simple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, queryIndex, count })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`Imported ${result.import.imported} ${category} recipes (query: ${result.import.query})`);
        
        return result;
      } catch (error) {
        console.error(`Failed to import ${category} query ${queryIndex}:`, error);
        return { import: { imported: 0, query: 'failed' } };
      }
    };

    // Rate-limited import queue
    const importQueue: Array<() => Promise<any>> = [];
    
    // Build import queue for each category
    for (const category of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const queries = IMPORT_QUERIES[category as keyof typeof IMPORT_QUERIES];
      const recipesForCategory = Math.min(recipesPerCategory, queries.length * batchSize);
      
      for (let i = 0; i < queries.length && totalImported < recipesNeeded; i++) {
        importQueue.push(() => importBatch(category, i, batchSize));
      }
    }

    console.log(`Created ${importQueue.length} import tasks`);

    // Process queue with concurrency and rate limiting
    const processQueue = async () => {
      const results = [];
      const running: Promise<any>[] = [];
      
      for (let i = 0; i < importQueue.length; i++) {
        // Wait for previous request if needed (rate limiting)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
        
        // Start the request
        const promise = importQueue[i]().then(result => {
          totalImported += result.import.imported;
          return result;
        });
        
        running.push(promise);
        
        // Limit concurrent requests
        if (running.length >= maxConcurrent || i === importQueue.length - 1) {
          const batchResults = await Promise.all(running);
          results.push(...batchResults);
          running.length = 0; // Clear the array
          
          console.log(`Processed batch, total imported so far: ${totalImported}`);
          
          // Stop if we've reached our target
          if (totalImported >= recipesNeeded) {
            console.log(`Reached target! Stopping import.`);
            break;
          }
        }
      }
      
      return results;
    };

    // Execute the import
    const allResults = await processQueue();
    
    // Get final count
    const finalCountResponse = await fetch(`${baseUrl}/api/recipes/count`);
    const { count: finalCount } = await finalCountResponse.json();

    return NextResponse.json({
      success: true,
      summary: {
        initialCount: currentCount,
        finalCount: finalCount,
        totalImported: totalImported,
        targetReached: finalCount >= targetTotal,
        batchesProcessed: allResults.length
      },
      details: allResults.map(r => ({
        query: r.import.query,
        imported: r.import.imported
      }))
    });

  } catch (error) {
    console.error('Auto-import error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check auto-import status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/recipes/auto-import',
    method: 'POST',
    description: 'Automatically import recipes to reach target count',
    parameters: {
      targetTotal: 'Target number of recipes (default: 400)',
      batchSize: 'Recipes per query (default: 10)',
      maxConcurrent: 'Max concurrent requests (default: 3)',
      requestDelay: 'Delay between requests in ms (default: 500 = 2 req/sec)'
    },
    example: {
      targetTotal: 400,
      batchSize: 15,
      maxConcurrent: 3,
      requestDelay: 500
    }
  });
}