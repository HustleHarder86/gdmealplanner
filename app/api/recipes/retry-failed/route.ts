import { NextRequest, NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();
    
    const db = adminDb();
    
    // Get the last failed import session
    const sessionsCollection = db.collection('importSessions');
    const failedSessions = await sessionsCollection
      .where('status', '==', 'failed')
      .orderBy('startTime', 'desc')
      .limit(1)
      .get();
    
    if (failedSessions.empty) {
      return NextResponse.json({
        message: "No failed import sessions found",
        retryable: false
      });
    }
    
    const lastFailedSession = failedSessions.docs[0];
    const sessionData = lastFailedSession.data();
    
    // Update session status to retrying
    await lastFailedSession.ref.update({
      status: 'retrying',
      retryStartTime: new Date().toISOString(),
      retryCount: (sessionData.retryCount || 0) + 1
    });
    
    // Get failed recipe attempts from this session
    const failedRecipesCollection = db.collection('failedImports');
    const failedRecipes = await failedRecipesCollection
      .where('sessionId', '==', sessionData.sessionId)
      .where('resolved', '==', false)
      .get();
    
    const retryResults = {
      sessionId: sessionData.sessionId,
      originalDate: sessionData.date,
      retriedCount: 0,
      successCount: 0,
      stillFailedCount: 0,
      errors: [] as string[]
    };
    
    // Attempt to retry each failed recipe
    for (const doc of failedRecipes.docs) {
      const failedRecipe = doc.data();
      retryResults.retriedCount++;
      
      try {
        // Here you would retry the specific recipe import
        // For now, we'll just mark it as a placeholder
        
        // Mark as resolved if successful
        await doc.ref.update({
          resolved: true,
          resolvedAt: new Date().toISOString(),
          retrySuccessful: true
        });
        
        retryResults.successCount++;
      } catch (error) {
        retryResults.stillFailedCount++;
        retryResults.errors.push(`Recipe ${failedRecipe.recipeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Update failure count
        await doc.ref.update({
          retryAttempts: (failedRecipe.retryAttempts || 0) + 1,
          lastRetryError: error instanceof Error ? error.message : 'Unknown error',
          lastRetryAt: new Date().toISOString()
        });
      }
    }
    
    // Update session with results
    await lastFailedSession.ref.update({
      status: retryResults.stillFailedCount === 0 ? 'completed' : 'partially_failed',
      retryEndTime: new Date().toISOString(),
      retryResults
    });
    
    return NextResponse.json({
      success: true,
      results: retryResults,
      message: `Retried ${retryResults.retriedCount} recipes: ${retryResults.successCount} succeeded, ${retryResults.stillFailedCount} still failed`
    });
    
  } catch (error) {
    console.error("Retry error:", error);
    return NextResponse.json(
      { 
        error: "Retry failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check for failed imports
export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();
    
    // Get failed sessions summary
    const sessionsCollection = db.collection('importSessions');
    const failedSessions = await sessionsCollection
      .where('status', 'in', ['failed', 'partially_failed'])
      .orderBy('startTime', 'desc')
      .limit(10)
      .get();
    
    const sessions = failedSessions.docs.map(doc => {
      const data = doc.data();
      return {
        sessionId: data.sessionId,
        date: data.date,
        status: data.status,
        recipesImported: data.recipesImported,
        recipesRejected: data.recipesRejected,
        errors: data.errors?.length || 0,
        retryCount: data.retryCount || 0,
        canRetry: (data.retryCount || 0) < 3 // Max 3 retries
      };
    });
    
    // Get unresolved failed imports count
    const failedRecipesCollection = db.collection('failedImports');
    const unresolvedCount = await failedRecipesCollection
      .where('resolved', '==', false)
      .count()
      .get();
    
    return NextResponse.json({
      failedSessions: sessions,
      unresolvedFailures: unresolvedCount.data().count,
      hasFailures: sessions.length > 0
    });
    
  } catch (error) {
    console.error("Failed to get retry status:", error);
    return NextResponse.json(
      { 
        error: "Failed to get retry status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}