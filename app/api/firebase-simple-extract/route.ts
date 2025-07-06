import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const rawKey = process.env.FIREBASE_ADMIN_KEY;
    
    if (!rawKey) {
      return NextResponse.json({ error: 'FIREBASE_ADMIN_KEY not found' });
    }

    // Super simple extraction - just find the values we need
    // Project ID
    const projectIdMatch = rawKey.match(/"project_id"\s*:\s*"([^"]+)"/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;
    
    // Client Email
    const clientEmailMatch = rawKey.match(/"client_email"\s*:\s*"([^"]+)"/);
    const clientEmail = clientEmailMatch ? clientEmailMatch[1] : null;
    
    // Private Key - extract everything between BEGIN and END
    const privateKeyStart = rawKey.indexOf('-----BEGIN PRIVATE KEY-----');
    const privateKeyEnd = rawKey.indexOf('-----END PRIVATE KEY-----');
    
    let privateKey = null;
    if (privateKeyStart !== -1 && privateKeyEnd !== -1) {
      // Extract from BEGIN to END + the END tag length
      privateKey = rawKey.substring(privateKeyStart, privateKeyEnd + 25);
    }
    
    // Debug info
    console.log('Extraction results:', {
      projectId,
      clientEmail,
      privateKeyFound: !!privateKey,
      privateKeyLength: privateKey?.length,
      privateKeyStart: privateKey?.substring(0, 50),
      privateKeyEnd: privateKey?.substring(privateKey.length - 50)
    });
    
    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: 'Could not extract required fields',
        debug: {
          projectId: projectId || 'NOT FOUND',
          clientEmail: clientEmail || 'NOT FOUND',
          privateKey: privateKey ? 'FOUND' : 'NOT FOUND',
          rawKeyLength: rawKey.length,
          sample: rawKey.substring(0, 200)
        }
      });
    }
    
    // Initialize Firebase Admin
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId: projectId,
      });
    }
    
    // Test Firestore connection
    const db = getFirestore();
    const testDoc = await db.collection('test').doc('connection').get();
    
    return NextResponse.json({
      success: true,
      firebaseAdmin: '✅ Initialized',
      firestore: '✅ Connected',
      projectId: projectId,
      extracted: {
        projectId,
        clientEmail,
        privateKeyLength: privateKey.length
      },
      testDocExists: testDoc.exists,
    });
    
  } catch (error) {
    console.error('Firebase simple extract error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}