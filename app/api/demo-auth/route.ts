import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Lazy initialization of Firebase Admin
let adminAuth: ReturnType<typeof getAuth> | null = null;

function getAdminAuth() {
  if (!adminAuth) {
    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      // Check if credentials are available
      if (!process.env.FIREBASE_ADMIN_KEY) {
        throw new Error('Firebase Admin credentials not configured');
      }
      
      try {
        const firebaseAdminKey = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
        initializeApp({
          credential: cert(firebaseAdminKey),
          projectId: firebaseAdminKey.project_id,
        });
      } catch (error) {
        console.error('Failed to parse Firebase Admin key:', error);
        throw new Error('Invalid Firebase Admin credentials');
      }
    }
    adminAuth = getAuth();
  }
  return adminAuth;
}

export async function POST(request: NextRequest) {
  try {
    // Create custom token for demo user
    const auth = getAdminAuth();
    const customToken = await auth.createCustomToken('demo-user-123', {
      email: 'sarah.demo@pregnancyplateplanner.com',
      displayName: 'Sarah Demo',
      isDemoUser: true,
    });

    return NextResponse.json({ 
      success: true, 
      customToken,
      message: 'Demo custom token generated successfully'
    });
  } catch (error) {
    console.error('Error creating demo custom token:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to generate demo custom token'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo auth API endpoint - use POST to get custom token',
    demoUser: {
      uid: 'demo-user-123',
      email: 'sarah.demo@pregnancyplateplanner.com',
      displayName: 'Sarah Demo'
    }
  });
}