import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const rawKey = process.env.FIREBASE_ADMIN_KEY;
    
    if (!rawKey) {
      return NextResponse.json({ error: 'FIREBASE_ADMIN_KEY not found' });
    }

    // Manual parsing approach - extract values using regex
    const extractValue = (key: string, pattern: RegExp): string | null => {
      const match = rawKey.match(pattern);
      return match ? match[1] : null;
    };
    
    // Extract each field manually
    const type = extractValue(rawKey, /"type":\s*"([^"]+)"/);
    const projectId = extractValue(rawKey, /"project_id":\s*"([^"]+)"/);
    const privateKeyId = extractValue(rawKey, /"private_key_id":\s*"([^"]+)"/);
    const clientEmail = extractValue(rawKey, /"client_email":\s*"([^"]+)"/);
    const clientId = extractValue(rawKey, /"client_id":\s*"([^"]+)"/);
    
    // Extract private key - this is the tricky part
    const privateKeyMatch = rawKey.match(/"private_key":\s*"(-----BEGIN[^"]+-----\\n)"/);
    let privateKey = privateKeyMatch ? privateKeyMatch[1] : null;
    
    if (!privateKey) {
      return NextResponse.json({ 
        error: 'Could not extract private key',
        rawKeyLength: rawKey.length,
        sample: rawKey.substring(0, 200)
      });
    }
    
    // Convert escaped newlines to real newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    if (!projectId || !privateKey || !clientEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        found: { projectId: !!projectId, privateKey: !!privateKey, clientEmail: !!clientEmail }
      });
    }
    
    // Build service account object
    const serviceAccount = {
      type: type || 'service_account',
      project_id: projectId,
      private_key_id: privateKeyId || '',
      private_key: privateKey,
      client_email: clientEmail,
      client_id: clientId || '',
    };
    
    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
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
      testDocExists: testDoc.exists,
      extracted: {
        projectId,
        clientEmail,
        privateKeyLength: privateKey.length,
        privateKeyStart: privateKey.substring(0, 50),
      }
    });
    
  } catch (error) {
    console.error('Firebase manual parse error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}