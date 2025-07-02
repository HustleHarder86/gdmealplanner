/**
 * Firebase wrapper that provides mock implementations for development/deployment
 * without Firebase credentials. This allows the app to run in "demo mode".
 */

import { mockAuth, mockDb, mockStorage } from './mock-firebase';
import { auth as realAuth, db as realDb, storage as realStorage, isFirebaseInitialized } from './firebase';

// Check if we should use mock implementations
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === 'true';

// Export the appropriate implementations
export const auth = USE_MOCK ? mockAuth : realAuth;
export const db = USE_MOCK ? mockDb : realDb;
export const storage = USE_MOCK ? mockStorage : realStorage;

// Export helper to check if using mock
export const isUsingMock = () => USE_MOCK;

// Export the initialization check
export { isFirebaseInitialized };

// Log which mode we're using (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log(`Firebase: Using ${USE_MOCK ? 'MOCK' : 'REAL'} implementation`);
}