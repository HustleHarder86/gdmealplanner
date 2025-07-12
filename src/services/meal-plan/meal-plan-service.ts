/**
 * Meal plan service for Firebase operations
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { MealPlan } from "@/src/types/meal-plan";
import { startOfWeek, endOfWeek, parseISO } from "date-fns";

const COLLECTION_NAME = "mealPlans";

export class MealPlanService {
  /**
   * Create a new meal plan
   */
  static async createMealPlan(
    mealPlan: Omit<MealPlan, "id">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...mealPlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating meal plan:", error);
      throw error;
    }
  }

  /**
   * Get active meal plan for current week
   */
  static async getActiveMealPlan(userId: string): Promise<any | null> {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday

      // Query meal plans for this week
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;

      // Find a meal plan that contains the current week
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const planStart = parseISO(data.weekStartDate);
        
        // Check if current date falls within this meal plan's week
        if (planStart <= today && today < new Date(planStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          // Transform to the format expected by nutrition tracking
          return {
            id: doc.id,
            userId: data.userId,
            meals: data.days.reduce((acc: any, day: any, index: number) => {
              acc[index] = {
                breakfast: day.meals.breakfast.recipeId ? {
                  id: day.meals.breakfast.recipeId,
                  title: day.meals.breakfast.recipeName,
                  ...day.meals.breakfast.nutrition
                } : null,
                lunch: day.meals.lunch.recipeId ? {
                  id: day.meals.lunch.recipeId,
                  title: day.meals.lunch.recipeName,
                  ...day.meals.lunch.nutrition
                } : null,
                dinner: day.meals.dinner.recipeId ? {
                  id: day.meals.dinner.recipeId,
                  title: day.meals.dinner.recipeName,
                  ...day.meals.dinner.nutrition
                } : null,
                "morning-snack": day.meals.morningSnack?.recipeId ? {
                  id: day.meals.morningSnack.recipeId,
                  title: day.meals.morningSnack.recipeName,
                  ...day.meals.morningSnack.nutrition
                } : null,
                "afternoon-snack": day.meals.afternoonSnack?.recipeId ? {
                  id: day.meals.afternoonSnack.recipeId,
                  title: day.meals.afternoonSnack.recipeName,
                  ...day.meals.afternoonSnack.nutrition
                } : null,
                "bedtime-snack": day.meals.eveningSnack?.recipeId ? {
                  id: day.meals.eveningSnack.recipeId,
                  title: day.meals.eveningSnack.recipeName,
                  ...day.meals.eveningSnack.nutrition
                } : null,
              };
              return acc;
            }, {}),
            ...data
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting active meal plan:", error);
      return null; // Return null instead of throwing to handle gracefully
    }
  }

  /**
   * Update a meal plan
   */
  static async updateMealPlan(
    id: string,
    updates: Partial<MealPlan>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating meal plan:", error);
      throw error;
    }
  }

  /**
   * Get meal plans for a user
   */
  static async getUserMealPlans(
    userId: string,
    limitCount: number = 10
  ): Promise<MealPlan[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MealPlan));
    } catch (error) {
      console.error("Error getting user meal plans:", error);
      throw error;
    }
  }

  /**
   * Delete a meal plan
   */
  static async deleteMealPlan(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      throw error;
    }
  }
}