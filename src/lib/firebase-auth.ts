import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import { auth, isFirebaseInitialized } from './firebase';
import { createUser } from './firebase-helpers';
import { User } from '@/types/firebase';

// Error handling
export const handleAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in or use a different email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/requires-recent-login':
        return 'Please sign in again to complete this action.';
      default:
        return `Authentication error: ${authError.message}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

// Auth functions
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string,
  pregnancyProfile?: Omit<NonNullable<User['pregnancyProfile']>, 'weekOfPregnancy'>,
  gdprConsent?: User['gdprConsent']
): Promise<FirebaseUser> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email,
      displayName: displayName || '',
      subscriptionStatus: 'free',
      settings: {
        targetGlucoseRange: {
          min: 70,
          max: 140,
        },
        mealReminders: true,
        glucoseReminders: true,
        notificationPreferences: {
          email: true,
          push: true,
        },
      },
      ...(pregnancyProfile && { pregnancyProfile }),
      ...(gdprConsent && { gdprConsent }),
    };

    await createUser(user.uid, userData);

    return user;
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const signOutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const changePassword = async (newPassword: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    await updatePassword(user, newPassword);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const changeEmail = async (newEmail: string): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    await updateEmail(user, newEmail);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }
    await updateProfile(user, updates);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void): Unsubscribe => {
  if (!auth) {
    // Return a no-op unsubscribe function if auth is not initialized
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (!auth) {
    return false;
  }
  return auth.currentUser !== null;
};