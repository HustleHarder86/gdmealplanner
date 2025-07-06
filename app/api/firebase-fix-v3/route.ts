import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const rawKey = process.env.FIREBASE_ADMIN_KEY;
    
    if (!rawKey) {
      return NextResponse.json({ error: 'FIREBASE_ADMIN_KEY not found' });
    }

    // Since the key has real newlines (which breaks JSON.parse),
    // we need to escape them first
    const escapedKey = rawKey.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    
    // Now parse the properly escaped JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(escapedKey);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Failed to parse service account',
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
        keyLength: rawKey.length,
        hasRealNewlines: rawKey.includes('\n'),
        sample: rawKey.substring(0, 100)
      });
    }
    
    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }
    
    // Test Firestore connection
    const db = getFirestore();
    const testDoc = await db.collection('test').doc('connection').get();
    
    return NextResponse.json({
      success: true,
      firebaseAdmin: '✅ Initialized',
      firestore: '✅ Connected',
      projectId: serviceAccount.project_id,
      testDocExists: testDoc.exists,
    });
    
  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}