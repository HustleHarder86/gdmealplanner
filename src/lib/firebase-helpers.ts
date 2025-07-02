import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  FirestoreError,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseInitialized } from './firebase';
import { User, Recipe, MealPlan, GlucoseReading, NutritionLog } from '@/types/firebase';

// Generic error handler
export const handleFirestoreError = (error: unknown): string => {
  if (error instanceof FirestoreError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'not-found':
        return 'The requested document was not found.';
      case 'already-exists':
        return 'This document already exists.';
      case 'failed-precondition':
        return 'Operation failed due to a precondition.';
      case 'aborted':
        return 'Operation was aborted. Please try again.';
      case 'unavailable':
        return 'Service is currently unavailable. Please try again later.';
      default:
        return `Database error: ${error.message}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

// Collection references
export const collections = {
  users: 'users',
  recipes: 'recipes',
  mealPlans: 'mealPlans',
  glucoseReadings: 'glucoseReadings',
  nutritionLogs: 'nutritionLogs',
} as const;

// Helper to convert Firestore document to typed object
export const convertDoc = <T>(doc: DocumentData): T => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
  } as T;
};

// User helpers
export const createUser = async (userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    await setDoc(doc(db, collections.users, userId), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const userDoc = await getDoc(doc(db, collections.users, userId));
    if (!userDoc.exists()) {
      return null;
    }
    return convertDoc<User>(userDoc);
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    await updateDoc(doc(db, collections.users, userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

// Recipe helpers
export const createRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const recipeRef = doc(collection(db, collections.recipes));
    await setDoc(recipeRef, {
      ...recipeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return recipeRef.id;
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getRecipe = async (recipeId: string): Promise<Recipe | null> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const recipeDoc = await getDoc(doc(db, collections.recipes, recipeId));
    if (!recipeDoc.exists()) {
      return null;
    }
    return convertDoc<Recipe>(recipeDoc);
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getUserRecipes = async (userId: string, limitCount = 20): Promise<Recipe[]> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const q = query(
      collection(db, collections.recipes),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Recipe>(doc));
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getPublicRecipes = async (filters?: {
  tags?: string[];
  limitCount?: number;
}): Promise<Recipe[]> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const constraints: QueryConstraint[] = [
      where('isPublic', '==', true),
      orderBy('averageRating', 'desc'),
    ];

    if (filters?.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags));
    }

    if (filters?.limitCount) {
      constraints.push(limit(filters.limitCount));
    }

    const q = query(collection(db, collections.recipes), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<Recipe>(doc));
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

// Meal Plan helpers
export const createMealPlan = async (mealPlanData: Omit<MealPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const mealPlanRef = doc(collection(db, collections.mealPlans));
    await setDoc(mealPlanRef, {
      ...mealPlanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return mealPlanRef.id;
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getUserMealPlans = async (userId: string, limitCount = 10): Promise<MealPlan[]> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const q = query(
      collection(db, collections.mealPlans),
      where('userId', '==', userId),
      orderBy('weekStartDate', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<MealPlan>(doc));
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

// Glucose Reading helpers
export const createGlucoseReading = async (readingData: Omit<GlucoseReading, 'id' | 'createdAt'>): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const readingRef = doc(collection(db, collections.glucoseReadings));
    await setDoc(readingRef, {
      ...readingData,
      createdAt: serverTimestamp(),
    });
    return readingRef.id;
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getUserGlucoseReadings = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<GlucoseReading[]> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    ];

    if (startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(collection(db, collections.glucoseReadings), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<GlucoseReading>(doc));
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

// Nutrition Log helpers
export const createOrUpdateNutritionLog = async (
  logData: Omit<NutritionLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const logId = `${logData.userId}_${logData.date}`;
    const existingDoc = await getDoc(doc(db, collections.nutritionLogs, logId));

    if (existingDoc.exists()) {
      await updateDoc(doc(db, collections.nutritionLogs, logId), {
        ...logData,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, collections.nutritionLogs, logId), {
        ...logData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return logId;
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};

export const getUserNutritionLogs = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<NutritionLog[]> => {
  if (!db) {
    throw new Error('Firebase is not initialized. Please check your configuration.');
  }
  try {
    const q = query(
      collection(db, collections.nutritionLogs),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<NutritionLog>(doc));
  } catch (error) {
    throw new Error(handleFirestoreError(error));
  }
};