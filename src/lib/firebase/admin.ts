import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const initializeAdmin = () => {
  if (getApps().length === 0) {
    // Check for service account credentials
    const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY;
    
    if (serviceAccountPath) {
      // Initialize with service account (production)
      try {
        // Parse the service account JSON from environment variable
        const serviceAccount = JSON.parse(serviceAccountPath);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      } catch (error) {
        console.error('Failed to load Firebase service account:', error);
        throw new Error('Firebase Admin initialization failed');
      }
    } else if (process.env.projectId) {
      // Initialize with environment variables (for Vercel)
      initializeApp({
        projectId: process.env.projectId,
        // Vercel can use default credentials or you can add more config here
      });
    } else {
      throw new Error('Firebase Admin credentials not configured');
    }
  }
};

// Export the initialize function
export const initializeFirebaseAdmin = initializeAdmin;

// Initialize on module load
initializeAdmin();

// Export admin services
export const adminDb = getFirestore();
export const adminAuth = getAuth();

// Helper function to verify admin is initialized
export const verifyAdminInitialized = () => {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return true;
};