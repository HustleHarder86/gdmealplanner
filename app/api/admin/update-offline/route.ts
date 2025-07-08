import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase/admin';
import { OfflineUpdater } from '@/src/services/offline-updater';

// Admin emails allowed to update offline files
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [
  'amy__ali@hotmail.com',
  'admin@gdmealplanner.com'
];

export async function POST(request: NextRequest) {
  try {
    // Check authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify the Firebase ID token
      const decodedToken = await adminAuth().verifyIdToken(token);
      const userEmail = decodedToken.email;

      // Check if user is admin
      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        console.warn(`Unauthorized access attempt by: ${userEmail}`);
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      console.log(`Admin update initiated by: ${userEmail}`);
    } catch (authError) {
      console.error('Auth verification failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Check for update type in request body
    const body = await request.json();
    const { incremental, since } = body;

    let result;
    
    if (incremental && since) {
      // Perform incremental update
      const sinceDate = new Date(since);
      console.log(`Performing incremental update since: ${sinceDate.toISOString()}`);
      result = await OfflineUpdater.createIncrementalUpdate(sinceDate);
    } else {
      // Perform full update
      console.log('Performing full offline recipe update...');
      result = await OfflineUpdater.updateOfflineRecipes();
      
      // Clean up old backups after successful update
      if (result.success) {
        await OfflineUpdater.cleanupOldBackups(7); // Keep 7 days of backups
      }
    }

    // Log the result
    console.log('Update result:', {
      success: result.success,
      recipesUpdated: result.recipesUpdated,
      filesCreated: result.filesCreated.length,
      errors: result.errors
    });

    // Return the result
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });

  } catch (error) {
    console.error('Error in update-offline API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check update status and validate files
export async function GET(request: NextRequest) {
  try {
    // Check authorization (same as POST)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await adminAuth().verifyIdToken(token);
      const userEmail = decodedToken.email;

      if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Validate offline files
    const validation = await OfflineUpdater.validateOfflineFiles();

    // Get metadata if available
    let metadata = null;
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const metadataPath = path.join(process.cwd(), 'public', 'data', 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    } catch {
      // Metadata might not exist yet
    }

    return NextResponse.json({
      validation,
      metadata,
      status: validation.valid ? 'healthy' : 'needs_update'
    });

  } catch (error) {
    console.error('Error checking update status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}