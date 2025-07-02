// Centralized Firebase configuration with mock fallback

const USE_MOCK_FIREBASE = 
  process.env.NEXT_PUBLIC_USE_MOCK_FIREBASE === 'true' || 
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

export const isUsingMockFirebase = () => USE_MOCK_FIREBASE;

// Re-export the appropriate implementation
export * from USE_MOCK_FIREBASE ? './mock-firebase' : './firebase';

// Helper to display environment status
export const getFirebaseStatus = () => {
  if (USE_MOCK_FIREBASE) {
    return {
      status: 'mock',
      message: 'Using mock Firebase (no credentials required)',
      features: {
        auth: true,
        firestore: true,
        storage: true,
        functions: false
      }
    };
  }
  
  return {
    status: 'production',
    message: 'Using real Firebase',
    features: {
      auth: true,
      firestore: true,
      storage: true,
      functions: true
    }
  };
};