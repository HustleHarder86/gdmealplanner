/**
 * Nutrition tracking service for Firebase operations
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
  writeBatch,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  NutritionEntry,
  DailyNutritionSummary,
  CommonFood,
  WaterIntake,
  MealTiming,
  NutritionInsights,
  NutritionInfo,
  calculateNutritionTotals,
  DEFAULT_GD_NUTRITION_GOALS,
  MealType,
  FoodItem,
} from "@/src/types/nutrition";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

const NUTRITION_ENTRIES_COLLECTION = "nutritionEntries";
const COMMON_FOODS_COLLECTION = "commonFoods";
const WATER_INTAKE_COLLECTION = "waterIntake";
const MEAL_TIMING_COLLECTION = "mealTiming";

export class NutritionService {
  /**
   * Create a new nutrition entry
   */
  static async createEntry(
    entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, NUTRITION_ENTRIES_COLLECTION), {
        ...entry,
        timestamp: Timestamp.fromDate(entry.timestamp),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating nutrition entry:", error);
      throw error;
    }
  }

  /**
   * Update an existing nutrition entry
   */
  static async updateEntry(
    id: string,
    updates: Partial<NutritionEntry>
  ): Promise<void> {
    try {
      const docRef = doc(db, NUTRITION_ENTRIES_COLLECTION, id);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.timestamp) {
        updateData.timestamp = Timestamp.fromDate(updates.timestamp);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating nutrition entry:", error);
      throw error;
    }
  }

  /**
   * Delete a nutrition entry
   */
  static async deleteEntry(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NUTRITION_ENTRIES_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting nutrition entry:", error);
      throw error;
    }
  }

  /**
   * Get entries for a specific date
   */
  static async getEntriesByDate(
    userId: string,
    date: Date
  ): Promise<NutritionEntry[]> {
    try {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const q = query(
        collection(db, NUTRITION_ENTRIES_COLLECTION),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(dayStart)),
        where("timestamp", "<=", Timestamp.fromDate(dayEnd)),
        orderBy("timestamp", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.formatEntry(doc));
    } catch (error) {
      console.error("Error getting entries by date:", error);
      throw error;
    }
  }

  /**
   * Get entries for a date range
   */
  static async getEntriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<NutritionEntry[]> {
    try {
      const q = query(
        collection(db, NUTRITION_ENTRIES_COLLECTION),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate)),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.formatEntry(doc));
    } catch (error) {
      console.error("Error getting entries by date range:", error);
      throw error;
    }
  }

  /**
   * Get daily nutrition summary
   */
  static async getDailySummary(
    userId: string,
    date: Date
  ): Promise<DailyNutritionSummary> {
    try {
      const entries = await this.getEntriesByDate(userId, date);
      const totalNutrition = this.calculateDayTotals(entries);
      const goalAdherence = this.calculateGoalAdherence(totalNutrition);
      const waterIntake = await this.getWaterIntake(userId, date);
      
      // Check if any entry has prenatal vitamin noted
      const prenatalVitamin = entries.some(entry => 
        entry.notes?.toLowerCase().includes("prenatal") || 
        entry.notes?.toLowerCase().includes("vitamin")
      );

      return {
        date,
        userId,
        entries,
        totalNutrition,
        goalAdherence,
        waterIntake: waterIntake?.glasses || 0,
        prenatalVitamin,
      };
    } catch (error) {
      console.error("Error getting daily summary:", error);
      throw error;
    }
  }

  /**
   * Calculate total nutrition for the day
   */
  private static calculateDayTotals(entries: NutritionEntry[]): NutritionInfo {
    const allFoods = entries.flatMap(entry => entry.foods);
    return calculateNutritionTotals(allFoods);
  }

  /**
   * Calculate goal adherence percentages
   */
  private static calculateGoalAdherence(nutrition: NutritionInfo) {
    const goals = DEFAULT_GD_NUTRITION_GOALS;
    
    const calculatePercentage = (value: number, min: number, max: number) => {
      if (value < min) return (value / min) * 100;
      if (value > max) return 100 - ((value - max) / max) * 100;
      return 100;
    };

    return {
      calories: calculatePercentage(
        nutrition.calories,
        goals.calories.min,
        goals.calories.max
      ),
      carbs: calculatePercentage(
        nutrition.carbohydrates,
        goals.carbohydrates.min,
        goals.carbohydrates.max
      ),
      protein: calculatePercentage(
        nutrition.protein,
        goals.protein.min,
        goals.protein.max
      ),
      fat: calculatePercentage(
        nutrition.fat,
        goals.fat.min,
        goals.fat.max
      ),
      fiber: nutrition.fiber >= goals.fiber.min ? 100 : 
        (nutrition.fiber / goals.fiber.min) * 100,
    };
  }

  /**
   * Log water intake
   */
  static async logWater(
    userId: string,
    date: Date,
    glasses: number
  ): Promise<void> {
    try {
      const dayStart = startOfDay(date);
      
      // Check if entry exists for today
      const q = query(
        collection(db, WATER_INTAKE_COLLECTION),
        where("userId", "==", userId),
        where("date", "==", Timestamp.fromDate(dayStart))
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Update existing entry
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, WATER_INTAKE_COLLECTION, docId), {
          glasses,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new entry
        await addDoc(collection(db, WATER_INTAKE_COLLECTION), {
          userId,
          date: Timestamp.fromDate(dayStart),
          glasses,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error logging water intake:", error);
      throw error;
    }
  }

  /**
   * Get water intake for a date
   */
  static async getWaterIntake(
    userId: string,
    date: Date
  ): Promise<WaterIntake | null> {
    try {
      const dayStart = startOfDay(date);
      
      const q = query(
        collection(db, WATER_INTAKE_COLLECTION),
        where("userId", "==", userId),
        where("date", "==", Timestamp.fromDate(dayStart))
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        userId: data.userId,
        date: data.date.toDate(),
        glasses: data.glasses,
        notes: data.notes,
      };
    } catch (error) {
      console.error("Error getting water intake:", error);
      throw error;
    }
  }

  /**
   * Log meal timing
   */
  static async logMealTime(
    userId: string,
    date: Date,
    mealType: MealType,
    time: Date
  ): Promise<void> {
    try {
      const dayStart = startOfDay(date);
      
      // Check if entry exists for today
      const q = query(
        collection(db, MEAL_TIMING_COLLECTION),
        where("userId", "==", userId),
        where("date", "==", Timestamp.fromDate(dayStart))
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Update existing entry
        const docId = snapshot.docs[0].id;
        const currentData = snapshot.docs[0].data();
        await updateDoc(doc(db, MEAL_TIMING_COLLECTION, docId), {
          mealTimes: {
            ...currentData.mealTimes,
            [mealType]: Timestamp.fromDate(time),
          },
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new entry
        await addDoc(collection(db, MEAL_TIMING_COLLECTION), {
          userId,
          date: Timestamp.fromDate(dayStart),
          mealTimes: {
            [mealType]: Timestamp.fromDate(time),
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error logging meal time:", error);
      throw error;
    }
  }

  /**
   * Get common foods (system and user-specific)
   */
  static async getCommonFoods(
    userId?: string,
    category?: string
  ): Promise<CommonFood[]> {
    try {
      let q = query(collection(db, COMMON_FOODS_COLLECTION));
      
      if (category) {
        q = query(q, where("category", "==", category));
      }
      
      if (userId) {
        // Get both system foods and user's custom foods
        q = query(
          q,
          where("userId", "in", [null, userId])
        );
      } else {
        // Get only system foods
        q = query(q, where("userId", "==", null));
      }
      
      q = query(q, orderBy("usageCount", "desc"), limit(50));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CommonFood));
    } catch (error) {
      console.error("Error getting common foods:", error);
      throw error;
    }
  }

  /**
   * Add custom food
   */
  static async addCustomFood(
    food: Omit<CommonFood, "id" | "usageCount">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COMMON_FOODS_COLLECTION), {
        ...food,
        usageCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding custom food:", error);
      throw error;
    }
  }

  /**
   * Search foods by name
   */
  static async searchFoods(
    searchTerm: string,
    userId?: string
  ): Promise<CommonFood[]> {
    try {
      // For now, get all foods and filter client-side
      // In production, you'd want to use a proper search solution
      const foods = await this.getCommonFoods(userId);
      const lowerSearch = searchTerm.toLowerCase();
      
      return foods.filter(food => 
        food.name.toLowerCase().includes(lowerSearch) ||
        food.brand?.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error("Error searching foods:", error);
      throw error;
    }
  }

  /**
   * Calculate weekly insights
   */
  static async getWeeklyInsights(
    userId: string,
    endDate: Date = new Date()
  ): Promise<NutritionInsights> {
    try {
      const startDate = subDays(endDate, 7);
      const entries = await this.getEntriesByDateRange(userId, startDate, endDate);
      
      // Group entries by day
      const entriesByDay = new Map<string, NutritionEntry[]>();
      entries.forEach(entry => {
        const dateKey = format(entry.timestamp, 'yyyy-MM-dd');
        if (!entriesByDay.has(dateKey)) {
          entriesByDay.set(dateKey, []);
        }
        entriesByDay.get(dateKey)!.push(entry);
      });
      
      // Calculate daily totals and carb distribution
      let totalDays = 0;
      let totalNutrition: NutritionInfo = {
        calories: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        protein: 0,
        fat: 0,
        saturatedFat: 0,
      };
      
      let mealsWithinTarget = 0;
      let mealsAboveTarget = 0;
      let mealsBelowTarget = 0;
      
      entriesByDay.forEach((dayEntries) => {
        totalDays++;
        const dayTotal = this.calculateDayTotals(dayEntries);
        
        // Add to totals
        Object.keys(totalNutrition).forEach(key => {
          totalNutrition[key as keyof NutritionInfo] += dayTotal[key as keyof NutritionInfo] || 0;
        });
        
        // Check carb targets for each meal
        dayEntries.forEach(entry => {
          const mealCarbs = entry.totalNutrition.carbohydrates;
          const targets = DEFAULT_GD_NUTRITION_GOALS.carbohydrates.distribution[entry.mealType];
          
          if (mealCarbs >= targets.min && mealCarbs <= targets.max) {
            mealsWithinTarget++;
          } else if (mealCarbs > targets.max) {
            mealsAboveTarget++;
          } else {
            mealsBelowTarget++;
          }
        });
      });
      
      const totalMeals = mealsWithinTarget + mealsAboveTarget + mealsBelowTarget;
      
      // Calculate averages
      const averageDailyNutrition: NutritionInfo = {
        calories: Math.round(totalNutrition.calories / totalDays),
        carbohydrates: Math.round(totalNutrition.carbohydrates / totalDays),
        fiber: Math.round(totalNutrition.fiber / totalDays),
        sugar: Math.round(totalNutrition.sugar / totalDays),
        protein: Math.round(totalNutrition.protein / totalDays),
        fat: Math.round(totalNutrition.fat / totalDays),
        saturatedFat: Math.round(totalNutrition.saturatedFat / totalDays),
      };
      
      // Generate insights
      const patterns: string[] = [];
      const recommendations: string[] = [];
      
      if (averageDailyNutrition.carbohydrates < DEFAULT_GD_NUTRITION_GOALS.carbohydrates.min) {
        patterns.push("Carbohydrate intake below target");
        recommendations.push("Consider adding more whole grains or fruits to reach 175g daily carbs");
      }
      
      if (averageDailyNutrition.fiber < DEFAULT_GD_NUTRITION_GOALS.fiber.min) {
        patterns.push("Low fiber intake");
        recommendations.push("Add more vegetables, fruits, and whole grains for fiber");
      }
      
      if (mealsAboveTarget / totalMeals > 0.3) {
        patterns.push("Frequent high-carb meals");
        recommendations.push("Monitor portion sizes and consider splitting larger meals");
      }
      
      return {
        period: "week",
        startDate,
        endDate,
        averageDailyNutrition,
        carbDistribution: {
          withinTarget: (mealsWithinTarget / totalMeals) * 100,
          aboveTarget: (mealsAboveTarget / totalMeals) * 100,
          belowTarget: (mealsBelowTarget / totalMeals) * 100,
        },
        topPatterns: patterns,
        recommendations,
        streaks: {
          currentStreak: this.calculateCurrentStreak(entriesByDay),
          longestStreak: this.calculateLongestStreak(entriesByDay),
        },
      };
    } catch (error) {
      console.error("Error calculating weekly insights:", error);
      throw error;
    }
  }

  /**
   * Calculate current logging streak
   */
  private static calculateCurrentStreak(
    entriesByDay: Map<string, NutritionEntry[]>
  ): number {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(today, i), 'yyyy-MM-dd');
      if (entriesByDay.has(date) && entriesByDay.get(date)!.length >= 3) {
        streak++;
      } else if (i > 0) { // Don't break on today if no entries yet
        break;
      }
    }
    
    return streak;
  }

  /**
   * Calculate longest logging streak
   */
  private static calculateLongestStreak(
    entriesByDay: Map<string, NutritionEntry[]>
  ): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    const sortedDates = Array.from(entriesByDay.keys()).sort();
    
    sortedDates.forEach((date, index) => {
      if (entriesByDay.get(date)!.length >= 3) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  }

  /**
   * Format Firestore document to NutritionEntry
   */
  private static formatEntry(doc: DocumentSnapshot): NutritionEntry {
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as NutritionEntry;
  }

  /**
   * Quick add common snacks
   */
  static async quickAddSnack(
    userId: string,
    snackName: string,
    mealType: MealType
  ): Promise<string> {
    // Predefined healthy GD snacks
    const commonSnacks: Record<string, FoodItem> = {
      "Apple with Peanut Butter": {
        name: "Apple with Peanut Butter",
        quantity: 1,
        unit: "serving",
        nutrition: {
          calories: 200,
          carbohydrates: 20,
          fiber: 4,
          sugar: 12,
          protein: 7,
          fat: 12,
          saturatedFat: 2,
        },
      },
      "Greek Yogurt with Berries": {
        name: "Greek Yogurt with Berries",
        quantity: 1,
        unit: "serving",
        nutrition: {
          calories: 150,
          carbohydrates: 18,
          fiber: 2,
          sugar: 12,
          protein: 15,
          fat: 2,
          saturatedFat: 1,
        },
      },
      "Cheese and Crackers": {
        name: "Cheese and Crackers",
        quantity: 1,
        unit: "serving",
        nutrition: {
          calories: 180,
          carbohydrates: 15,
          fiber: 1,
          sugar: 1,
          protein: 8,
          fat: 10,
          saturatedFat: 6,
        },
      },
      "Hummus with Veggies": {
        name: "Hummus with Veggies",
        quantity: 1,
        unit: "serving",
        nutrition: {
          calories: 120,
          carbohydrates: 16,
          fiber: 4,
          sugar: 3,
          protein: 5,
          fat: 5,
          saturatedFat: 1,
        },
      },
    };

    const snack = commonSnacks[snackName];
    if (!snack) {
      throw new Error("Snack not found");
    }

    const entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt"> = {
      userId,
      timestamp: new Date(),
      mealType,
      foods: [snack],
      totalNutrition: snack.nutrition,
      notes: "Quick add snack",
    };

    return this.createEntry(entry);
  }
}