import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MealPlan, Recipe, User } from '@/types/firebase';
import { WeeklyMealPlan, DailyMealPlan, MealPlanPreferences } from './types';
import { MealPlanningAlgorithm } from './algorithm';

export class MealPlanService {
  private static COLLECTION_NAME = 'mealPlans';
  private static PREFERENCES_COLLECTION = 'mealPlanPreferences';

  /**
   * Generate a new meal plan
   */
  static async generateMealPlan(
    user: User,
    preferences: MealPlanPreferences,
    startDate: Date,
    availableRecipes: Recipe[]
  ): Promise<WeeklyMealPlan> {
    const algorithm = new MealPlanningAlgorithm({
      user,
      preferences,
      startDate,
      daysToGenerate: 7,
      availableRecipes,
      previousMealPlans: await this.getRecentMealPlans(user.id!, 4) // Get last 4 weeks for variety
    });

    return algorithm.generateWeeklyMealPlan();
  }

  /**
   * Save meal plan to Firestore
   */
  static async saveMealPlan(mealPlan: WeeklyMealPlan): Promise<string> {
    const mealPlanData: MealPlan = {
      userId: mealPlan.userId,
      weekStartDate: Timestamp.fromDate(mealPlan.startDate),
      weekEndDate: Timestamp.fromDate(mealPlan.endDate),
      meals: this.convertDailyPlansToFirestore(mealPlan.days),
      shoppingList: mealPlan.shoppingList.map(item => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        checked: item.checked || false,
        category: item.category
      })),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(docRef, mealPlanData);
    
    return docRef.id;
  }

  /**
   * Load meal plan from Firestore
   */
  static async loadMealPlan(mealPlanId: string, recipes: Recipe[]): Promise<WeeklyMealPlan | null> {
    const docRef = doc(db, this.COLLECTION_NAME, mealPlanId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as MealPlan;
    const recipeMap = new Map(recipes.map(r => [r.id, r]));

    return {
      startDate: data.weekStartDate.toDate(),
      endDate: data.weekEndDate.toDate(),
      days: this.convertFirestoreToDailyPlans(data.meals, recipeMap),
      shoppingList: data.shoppingList || [],
      userId: data.userId
    };
  }

  /**
   * Get recent meal plans for variety tracking
   */
  static async getRecentMealPlans(userId: string, weeks: number): Promise<WeeklyMealPlan[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('weekStartDate', 'desc'),
      limit(weeks)
    );

    const querySnapshot = await getDocs(q);
    const mealPlans: WeeklyMealPlan[] = [];

    // Note: In a real implementation, you'd need to fetch recipes too
    // For now, returning empty recipe references
    querySnapshot.forEach((doc) => {
      const data = doc.data() as MealPlan;
      mealPlans.push({
        startDate: data.weekStartDate.toDate(),
        endDate: data.weekEndDate.toDate(),
        days: this.convertFirestoreToDailyPlans(data.meals, new Map()),
        shoppingList: data.shoppingList || [],
        userId: data.userId
      });
    });

    return mealPlans;
  }

  /**
   * Save user meal plan preferences
   */
  static async savePreferences(userId: string, preferences: MealPlanPreferences): Promise<void> {
    const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
    await setDoc(docRef, {
      ...preferences,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Load user meal plan preferences
   */
  static async loadPreferences(userId: string): Promise<MealPlanPreferences | null> {
    const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      dietaryRestrictions: data.dietaryRestrictions || [],
      allergens: data.allergens || [],
      dislikedIngredients: data.dislikedIngredients || [],
      favoriteRecipeIds: data.favoriteRecipeIds || [],
      mealsPerDay: data.mealsPerDay || 6,
      breakfastTime: data.breakfastTime,
      lunchTime: data.lunchTime,
      dinnerTime: data.dinnerTime,
      prepTimePreference: data.prepTimePreference || 'moderate',
      varietyLevel: data.varietyLevel || 'medium',
      mealPrepMode: data.mealPrepMode || false
    };
  }

  /**
   * Get meal plans for a date range
   */
  static async getMealPlansForDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MealPlan[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('userId', '==', userId),
      where('weekStartDate', '>=', Timestamp.fromDate(startDate)),
      where('weekStartDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('weekStartDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const mealPlans: MealPlan[] = [];

    querySnapshot.forEach((doc) => {
      mealPlans.push({
        id: doc.id,
        ...doc.data() as MealPlan
      });
    });

    return mealPlans;
  }

  /**
   * Delete a meal plan
   */
  static async deleteMealPlan(mealPlanId: string): Promise<void> {
    await deleteDoc(doc(db, this.COLLECTION_NAME, mealPlanId));
  }

  /**
   * Get favorite recipes from user's meal history
   */
  static async getFavoriteRecipes(userId: string, limit: number = 10): Promise<Array<{recipeId: string, count: number}>> {
    const recentPlans = await this.getRecentMealPlans(userId, 8); // Last 8 weeks
    const recipeCount = new Map<string, number>();

    recentPlans.forEach(plan => {
      plan.days.forEach(day => {
        const meals = [
          day.breakfast,
          day.morningSnack,
          day.lunch,
          day.afternoonSnack,
          day.dinner,
          day.eveningSnack
        ].filter(meal => meal !== null);

        meals.forEach(meal => {
          if (meal?.id) {
            const count = recipeCount.get(meal.id) || 0;
            recipeCount.set(meal.id, count + 1);
          }
        });
      });
    });

    // Sort by count and return top recipes
    const sorted = Array.from(recipeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([recipeId, count]) => ({ recipeId, count }));

    return sorted;
  }

  /**
   * Helper methods for data conversion
   */
  private static convertDailyPlansToFirestore(days: DailyMealPlan[]): MealPlan['meals'] {
    const meals: MealPlan['meals'] = {};

    days.forEach(day => {
      const dateKey = this.formatDateKey(day.date);
      const dayMeals = [];

      if (day.breakfast) {
        dayMeals.push({
          recipeId: day.breakfast.id || '',
          recipeName: day.breakfast.title,
          mealType: 'breakfast' as const,
          servings: 1
        });
      }

      if (day.morningSnack) {
        dayMeals.push({
          recipeId: day.morningSnack.id || '',
          recipeName: day.morningSnack.title,
          mealType: 'snack' as const,
          servings: 1,
          notes: 'Morning snack'
        });
      }

      if (day.lunch) {
        dayMeals.push({
          recipeId: day.lunch.id || '',
          recipeName: day.lunch.title,
          mealType: 'lunch' as const,
          servings: 1
        });
      }

      if (day.afternoonSnack) {
        dayMeals.push({
          recipeId: day.afternoonSnack.id || '',
          recipeName: day.afternoonSnack.title,
          mealType: 'snack' as const,
          servings: 1,
          notes: 'Afternoon snack'
        });
      }

      if (day.dinner) {
        dayMeals.push({
          recipeId: day.dinner.id || '',
          recipeName: day.dinner.title,
          mealType: 'dinner' as const,
          servings: 1
        });
      }

      if (day.eveningSnack) {
        dayMeals.push({
          recipeId: day.eveningSnack.id || '',
          recipeName: day.eveningSnack.title,
          mealType: 'snack' as const,
          servings: 1,
          notes: 'Evening snack'
        });
      }

      meals[dateKey] = {
        date: dateKey,
        meals: dayMeals,
        totalNutrition: day.totalNutrition
      };
    });

    return meals;
  }

  private static convertFirestoreToDailyPlans(
    meals: MealPlan['meals'],
    recipeMap: Map<string | undefined, Recipe>
  ): DailyMealPlan[] {
    const days: DailyMealPlan[] = [];
    const sortedDates = Object.keys(meals).sort();

    sortedDates.forEach(dateKey => {
      const dayData = meals[dateKey];
      const dailyPlan: DailyMealPlan = {
        date: new Date(dateKey),
        breakfast: null,
        morningSnack: null,
        lunch: null,
        afternoonSnack: null,
        dinner: null,
        eveningSnack: null,
        totalNutrition: dayData.totalNutrition || this.createEmptyNutrition(),
        nutritionTargets: {
          dailyCarbs: 175,
          dailyProtein: 110,
          dailyFiber: 28,
          dailyCalories: 2200
        }
      };

      dayData.meals.forEach(meal => {
        const recipe = recipeMap.get(meal.recipeId);
        if (recipe) {
          if (meal.mealType === 'breakfast') {
            dailyPlan.breakfast = recipe;
          } else if (meal.mealType === 'lunch') {
            dailyPlan.lunch = recipe;
          } else if (meal.mealType === 'dinner') {
            dailyPlan.dinner = recipe;
          } else if (meal.mealType === 'snack') {
            if (meal.notes?.includes('Morning')) {
              dailyPlan.morningSnack = recipe;
            } else if (meal.notes?.includes('Afternoon')) {
              dailyPlan.afternoonSnack = recipe;
            } else if (meal.notes?.includes('Evening')) {
              dailyPlan.eveningSnack = recipe;
            }
          }
        }
      });

      days.push(dailyPlan);
    });

    return days;
  }

  private static formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private static createEmptyNutrition() {
    return {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      saturatedFat: 0,
      transFat: 0
    };
  }
}