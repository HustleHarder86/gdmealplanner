import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we have valid Firebase config
const hasValidConfig = firebaseConfig.apiKey !== 'demo-api-key' && 
                      firebaseConfig.authDomain !== 'demo.firebaseapp.com' && 
                      firebaseConfig.projectId !== 'demo-project';

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;
let analytics: Analytics | null = null;

// Only initialize if we have valid config or in production
if (hasValidConfig || process.env.NODE_ENV === 'production') {
  try {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);

    // Initialize Analytics only in browser and production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && hasValidConfig) {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      });
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Don't throw in development/build time, just log
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Failed to initialize Firebase. Please check your configuration.');
    }
  }
} else {
  console.warn('Firebase not initialized: Invalid or missing configuration. The app will not work properly without Firebase configuration.');
}

// Enable emulators in development
let emulatorsConnected = false;
if (process.env.NODE_ENV === 'development' && 
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' && 
    !emulatorsConnected && 
    app && auth && db && storage && functions) {
  try {
    const { connectAuthEmulator } = require('firebase/auth');
    const { connectFirestoreEmulator } = require('firebase/firestore');
    const { connectStorageEmulator } = require('firebase/storage');
    const { connectFunctionsEmulator } = require('firebase/functions');

    // Connect to emulators
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    } catch (e) {
      // Already connected
    }
    
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch (e) {
      // Already connected
    }
    
    try {
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (e) {
      // Already connected
    }
    
    try {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (e) {
      // Already connected
    }

    emulatorsConnected = true;
    console.log('Firebase emulators connected');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulators:', error);
  }
}

// Export null-safe versions
export { app, auth, db, storage, functions, analytics };

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = () => {
  return app !== null && auth !== null && db !== null;
};