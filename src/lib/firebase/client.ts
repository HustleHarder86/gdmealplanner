import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.appId,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Log config status (remove in production)
if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.error('Firebase client configuration is missing. Check NEXT_PUBLIC_* environment variables.');
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;