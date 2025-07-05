import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const initializeAdmin = () => {
  if (getApps().length === 0) {
    // Check for service account credentials
    const serviceAccountKey = process.env.FIREBASE_ADMIN_KEY;
    
    if (serviceAccountKey) {
      // Initialize with service account (production)
      try {
        // Parse the service account JSON from environment variable
        const serviceAccount = JSON.parse(serviceAccountKey);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.projectId,
        });
        console.log('Firebase Admin initialized with service account');
      } catch (error) {
        console.error('Failed to parse Firebase service account:', error);
        throw new Error('Firebase Admin initialization failed - invalid service account JSON');
      }
    } else {
      // Try to construct service account from individual environment variables
      const projectId = process.env.project_id;
      const privateKey = process.env.private_key;
      const clientEmail = process.env.client_email;
      const privateKeyId = process.env.private_key_id;
      const clientId = process.env.client_id;
      
      if (projectId && privateKey && clientEmail) {
        try {
          // Replace escaped newlines in private key
          const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
          
          // Build the full service account object
          const serviceAccount = {
            type: "service_account",
            project_id: projectId,
            private_key_id: privateKeyId || "not-provided",
            private_key: formattedPrivateKey,
            client_email: clientEmail,
            client_id: clientId || "not-provided",
            auth_uri: process.env.auth_uri || "https://accounts.google.com/o/oauth2/auth",
            token_uri: process.env.token_uri || "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url || "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.client_x509_cert_url || `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
          };
          
          initializeApp({
            credential: cert(serviceAccount),
            projectId: projectId,
          });
          console.log('Firebase Admin initialized with individual credentials');
        } catch (error) {
          console.error('Failed to initialize with individual credentials:', error);
          throw new Error('Firebase Admin initialization failed');
        }
      } else {
        throw new Error('Firebase Admin credentials not configured. Please provide either FIREBASE_ADMIN_KEY or individual credentials (project_id, private_key, client_email)');
      }
    }
  }
};

// Export the initialize function
export const initializeFirebaseAdmin = initializeAdmin;

// Lazy initialization of admin services
let _adminDb: ReturnType<typeof getFirestore> | null = null;
let _adminAuth: ReturnType<typeof getAuth> | null = null;

export const adminDb = () => {
  if (!_adminDb) {
    initializeAdmin();
    _adminDb = getFirestore();
  }
  return _adminDb;
};

export const adminAuth = () => {
  if (!_adminAuth) {
    initializeAdmin();
    _adminAuth = getAuth();
  }
  return _adminAuth;
};

// Helper function to verify admin is initialized
export const verifyAdminInitialized = () => {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return true;
};