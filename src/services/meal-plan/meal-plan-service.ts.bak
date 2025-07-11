/**
 * Meal Plan Service
 * Manages meal plan storage, retrieval, and modifications in Firebase
 */

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
  serverTimestamp,
  Timestamp,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  WeeklyMealPlan,
  MealSwapOptions,
  MealCustomization,
  MealPlanRating,
  MealType,
  MealAssignment,
  DailyMealPlan,
} from "@/src/types/meal-plan";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { mealPlanAlgorithm } from "./meal-plan-algorithm";
import { userPreferenceService } from "./user-preference-service";

export class MealPlanService {
  private static instance: MealPlanService;
  private collectionName = "mealPlans";
  private ratingsCollection = "mealPlanRatings";

  private constructor() {}

  static getInstance(): MealPlanService {
    if (!MealPlanService.instance) {
      MealPlanService.instance = new MealPlanService();
    }
    return MealPlanService.instance;
  }

  /**
   * Save a meal plan to Firebase
   */
  async saveMealPlan(mealPlan: WeeklyMealPlan): Promise<string> {
    try {
      // Generate ID if not provided
      const planId = mealPlan.id || doc(collection(db, this.collectionName)).id;

      // Prepare data for Firestore (remove recipe objects, keep only IDs)
      const firestoreData = {
        ...mealPlan,
        id: planId,
        days: mealPlan.days.map((day) => ({
          ...day,
          date: Timestamp.fromDate(day.date),
          meals: day.meals.map((meal) => ({
            ...meal,
            recipe: undefined, // Remove recipe object, keep only recipeId
          })),
        })),
        weekStartDate: Timestamp.fromDate(mealPlan.weekStartDate),
        generatedAt: Timestamp.fromDate(mealPlan.generatedAt),
        lastModified: serverTimestamp(),
      };

      await setDoc(doc(db, this.collectionName, planId), firestoreData);
      return planId;
    } catch (error) {
      console.error("Error saving meal plan:", error);
      throw error;
    }
  }

  /**
   * Load a meal plan from Firebase
   */
  async getMealPlan(planId: string): Promise<WeeklyMealPlan | null> {
    try {
      const docRef = doc(db, this.collectionName, planId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Convert Firestore data back to proper types
      const mealPlan: WeeklyMealPlan = {
        ...data,
        id: docSnap.id,
        weekStartDate: data.weekStartDate.toDate(),
        generatedAt: data.generatedAt.toDate(),
        lastModified: data.lastModified?.toDate(),
        days: await Promise.all(
          data.days.map(async (day: any) => ({
            ...day,
            date: day.date.toDate(),
            meals: await Promise.all(
              day.meals.map(async (meal: any) => {
                // Populate recipe data
                const recipe = LocalRecipeService.getRecipeById(meal.recipeId);
                return {
                  ...meal,
                  recipe,
                };
              }),
            ),
          })),
        ),
      } as WeeklyMealPlan;

      return mealPlan;
    } catch (error) {
      console.error("Error loading meal plan:", error);
      throw error;
    }
  }

  /**
   * Get user's meal plans
   */
  async getUserMealPlans(
    userId: string,
    status?: "draft" | "active" | "completed" | "archived",
    limitCount: number = 10,
  ): Promise<WeeklyMealPlan[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where("userId", "==", userId),
        orderBy("weekStartDate", "desc"),
        limit(limitCount),
      );

      if (status) {
        q = query(
          collection(db, this.collectionName),
          where("userId", "==", userId),
          where("status", "==", status),
          orderBy("weekStartDate", "desc"),
          limit(limitCount),
        );
      }

      const querySnapshot = await getDocs(q);
      const plans: WeeklyMealPlan[] = [];

      for (const doc of querySnapshot.docs) {
        const plan = await this.getMealPlan(doc.id);
        if (plan) {
          plans.push(plan);
        }
      }

      return plans;
    } catch (error) {
      console.error("Error fetching user meal plans:", error);
      throw error;
    }
  }

  /**
   * Get the active meal plan for a specific date
   */
  async getActiveMealPlanForDate(
    userId: string,
    date: Date,
  ): Promise<WeeklyMealPlan | null> {
    try {
      // Find plans that include this date
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

      const q = query(
        collection(db, this.collectionName),
        where("userId", "==", userId),
        where("status", "==", "active"),
        where("weekStartDate", ">=", Timestamp.fromDate(weekStart)),
        where("weekStartDate", "<=", Timestamp.fromDate(weekEnd)),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      return await this.getMealPlan(querySnapshot.docs[0].id);
    } catch (error) {
      console.error("Error fetching active meal plan:", error);
      throw error;
    }
  }

  /**
   * Update meal plan status
   */
  async updateMealPlanStatus(
    planId: string,
    status: "draft" | "active" | "completed" | "archived",
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, planId), {
        status,
        lastModified: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating meal plan status:", error);
      throw error;
    }
  }

  /**
   * Swap a meal in the plan
   */
  async swapMeal(options: MealSwapOptions): Promise<WeeklyMealPlan | null> {
    try {
      const plan = await this.getMealPlan(options.planId);
      if (!plan) {
        throw new Error("Meal plan not found");
      }

      const day = plan.days[options.dayIndex];
      if (!day) {
        throw new Error("Invalid day index");
      }

      const mealIndex = day.meals.findIndex(
        (m) => m.mealType === options.mealType,
      );
      if (mealIndex === -1) {
        throw new Error("Meal type not found");
      }

      const currentMeal = day.meals[mealIndex];
      const preferences = await userPreferenceService.getUserPreferences(
        plan.userId,
      );

      // Get alternative recipes
      let candidates = LocalRecipeService.getRecipesByCategory(
        currentMeal.recipe?.category || "dinner",
      );

      // Apply constraints
      if (options.maintainNutrition && currentMeal.recipe) {
        const targetCarbs = currentMeal.recipe.nutrition.carbohydrates;
        candidates = candidates.filter(
          (r) => Math.abs(r.nutrition.carbohydrates - targetCarbs) <= 5,
        );
      }

      if (options.maintainComplexity && currentMeal.recipe) {
        const targetTime = currentMeal.recipe.totalTime;
        candidates = candidates.filter(
          (r) => Math.abs(r.totalTime - targetTime) <= 15,
        );
      }

      if (options.excludeCurrentRecipe) {
        candidates = candidates.filter((r) => r.id !== currentMeal.recipeId);
      }

      // Filter by preferences
      if (preferences) {
        candidates = candidates.filter(
          (recipe) =>
            userPreferenceService.recipeMatchesDietaryRestrictions(
              recipe,
              preferences.dietaryRestrictions,
            ) &&
            !userPreferenceService.recipeContainsAllergens(
              recipe,
              preferences.allergens,
            ),
        );
      }

      // Select best alternative
      const newRecipe =
        candidates[Math.floor(Math.random() * candidates.length)];
      if (!newRecipe) {
        throw new Error("No suitable alternative recipes found");
      }

      // Update the meal
      day.meals[mealIndex] = {
        ...currentMeal,
        recipeId: newRecipe.id,
        recipe: newRecipe,
      };

      // Add customization record
      const customization: MealCustomization = {
        dayIndex: options.dayIndex,
        mealType: options.mealType,
        originalRecipeId: currentMeal.recipeId,
        newRecipeId: newRecipe.id,
        reason: "User swap",
        customizedAt: new Date(),
      };

      plan.customizations.push(customization);

      // Recalculate daily nutrition
      day.nutrition = this.calculateDailyNutrition(day.meals);

      // Save updated plan
      await this.saveMealPlan(plan);

      return plan;
    } catch (error) {
      console.error("Error swapping meal:", error);
      throw error;
    }
  }

  /**
   * Copy a meal plan to a new week
   */
  async copyMealPlan(
    sourcePlanId: string,
    newStartDate: Date,
  ): Promise<WeeklyMealPlan | null> {
    try {
      const sourcePlan = await this.getMealPlan(sourcePlanId);
      if (!sourcePlan) {
        throw new Error("Source meal plan not found");
      }

      // Create new plan with updated dates
      const newPlan: WeeklyMealPlan = {
        ...sourcePlan,
        id: undefined, // Generate new ID
        weekStartDate: newStartDate,
        generatedAt: new Date(),
        status: "draft",
        customizations: [],
        days: sourcePlan.days.map((day, index) => ({
          ...day,
          date: new Date(newStartDate.getTime() + index * 24 * 60 * 60 * 1000),
          completed: false,
          rating: undefined,
          notes: undefined,
        })),
      };

      const newPlanId = await this.saveMealPlan(newPlan);
      return await this.getMealPlan(newPlanId);
    } catch (error) {
      console.error("Error copying meal plan:", error);
      throw error;
    }
  }

  /**
   * Regenerate a specific day in the meal plan
   */
  async regenerateDay(
    planId: string,
    dayIndex: number,
  ): Promise<WeeklyMealPlan | null> {
    try {
      const plan = await this.getMealPlan(planId);
      if (!plan) {
        throw new Error("Meal plan not found");
      }

      const preferences = await userPreferenceService.getUserPreferences(
        plan.userId,
      );
      if (!preferences) {
        throw new Error("User preferences not found");
      }

      // Use the algorithm to generate a new week and extract the specific day
      const tempPlan = await mealPlanAlgorithm.generateWeeklyPlan(
        plan.userId,
        {
          startDate: plan.weekStartDate,
          userPreferencesId: preferences.id || "",
        }
      );
      
      const newDayPlan = tempPlan.days[dayIndex];

      // Update the plan
      plan.days[dayIndex] = newDayPlan;

      // Recalculate weekly summary
      plan.summary = this.calculateWeeklySummary(plan.days);

      // Save updated plan
      await this.saveMealPlan(plan);

      return plan;
    } catch (error) {
      console.error("Error regenerating day:", error);
      throw error;
    }
  }

  /**
   * Delete a meal plan
   */
  async deleteMealPlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, planId));
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      throw error;
    }
  }

  /**
   * Rate a meal plan
   */
  async rateMealPlan(rating: MealPlanRating): Promise<void> {
    try {
      const ratingId = `${rating.planId}_${rating.userId}`;
      await setDoc(doc(db, this.ratingsCollection, ratingId), {
        ...rating,
        createdAt: serverTimestamp(),
      });

      // Update meal plan with rating info
      const plan = await this.getMealPlan(rating.planId);
      if (plan) {
        // You could aggregate ratings here if needed
        await updateDoc(doc(db, this.collectionName, rating.planId), {
          lastRated: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error rating meal plan:", error);
      throw error;
    }
  }

  /**
   * Get meal plan ratings
   */
  async getMealPlanRatings(planId: string): Promise<MealPlanRating[]> {
    try {
      const q = query(
        collection(db, this.ratingsCollection),
        where("planId", "==", planId),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }) as MealPlanRating,
      );
    } catch (error) {
      console.error("Error fetching meal plan ratings:", error);
      throw error;
    }
  }

  // Helper methods

  private calculateDailyNutrition(meals: MealAssignment[]): DailyMealPlan["nutrition"] {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const carbDistribution: Record<MealType, number> = {
      breakfast: 0,
      morningSnack: 0,
      lunch: 0,
      afternoonSnack: 0,
      dinner: 0,
      eveningSnack: 0,
    };

    for (const meal of meals) {
      if (meal.recipe) {
        const nutrition = meal.recipe.nutrition;
        const servings = meal.servings || 1;

        totalCalories += nutrition.calories * servings;
        totalCarbs += nutrition.carbohydrates * servings;
        totalProtein += nutrition.protein * servings;
        totalFat += nutrition.fat * servings;
        totalFiber += nutrition.fiber * servings;

        carbDistribution[meal.mealType] = nutrition.carbohydrates * servings;
      }
    }

    return {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      totalFiber,
      carbDistribution,
    };
  }

  private calculateWeeklySummary(days: any[]): any {
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalPrepTime = 0;
    const uniqueRecipes = new Set<string>();

    for (const day of days) {
      totalCalories += day.nutrition.totalCalories;
      totalCarbs += day.nutrition.totalCarbs;
      totalProtein += day.nutrition.totalProtein;
      totalFat += day.nutrition.totalFat;
      totalFiber += day.nutrition.totalFiber;

      for (const meal of day.meals) {
        if (meal.recipe) {
          uniqueRecipes.add(meal.recipeId);
          totalPrepTime += meal.recipe.totalTime;
        }
      }
    }

    const dayCount = days.length || 1;

    return {
      avgDailyCalories: Math.round(totalCalories / dayCount),
      avgDailyCarbs: Math.round(totalCarbs / dayCount),
      avgDailyProtein: Math.round(totalProtein / dayCount),
      avgDailyFat: Math.round(totalFat / dayCount),
      avgDailyFiber: Math.round(totalFiber / dayCount),
      totalUniqueRecipes: uniqueRecipes.size,
      totalPrepTime,
    };
  }
}

// Export singleton instance
export const mealPlanService = MealPlanService.getInstance();
