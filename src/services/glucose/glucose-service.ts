/**
 * Glucose tracking service for Firebase operations
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
  startAfter,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  writeBatch,
  Query,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  GlucoseReading,
  GlucoseStatistics,
  MealAssociation,
  GlucoseUnit,
  isInRange,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  GlucosePattern,
} from "@/src/types/glucose";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

const COLLECTION_NAME = "glucoseReadings";

export class GlucoseService {
  /**
   * Create a new glucose reading
   */
  static async createReading(
    reading: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      console.log("[GlucoseService] Creating reading with data:", reading);
      
      // Validate required fields
      if (!reading.userId) {
        throw new Error("userId is required to create a glucose reading");
      }
      
      if (!reading.timestamp) {
        throw new Error("timestamp is required to create a glucose reading");
      }
      
      const docData = {
        ...reading,
        timestamp: Timestamp.fromDate(reading.timestamp),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      console.log("[GlucoseService] Sending to Firebase:", docData);
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
      
      console.log("[GlucoseService] Successfully created reading with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[GlucoseService] Error creating glucose reading:", error);
      throw error;
    }
  }

  /**
   * Update an existing glucose reading
   */
  static async updateReading(
    id: string,
    updates: Partial<GlucoseReading>,
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      if (updates.timestamp) {
        updateData.timestamp = Timestamp.fromDate(updates.timestamp);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating glucose reading:", error);
      throw error;
    }
  }

  /**
   * Delete a glucose reading
   */
  static async deleteReading(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting glucose reading:", error);
      throw error;
    }
  }

  /**
   * Get a single glucose reading
   */
  static async getReading(id: string): Promise<GlucoseReading | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.formatReading(docSnap);
      }
      return null;
    } catch (error) {
      console.error("Error getting glucose reading:", error);
      throw error;
    }
  }

  /**
   * Get readings for a date range
   */
  static async getReadingsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limitCount?: number,
  ): Promise<GlucoseReading[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate)),
        orderBy("timestamp", "desc"),
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => this.formatReading(doc));
    } catch (error) {
      console.error("Error getting readings by date range:", error);
      throw error;
    }
  }

  /**
   * Get today's readings
   */
  static async getTodayReadings(userId: string): Promise<GlucoseReading[]> {
    const today = new Date();
    return this.getReadingsByDateRange(
      userId,
      startOfDay(today),
      endOfDay(today),
    );
  }

  /**
   * Get readings for the past week
   */
  static async getWeekReadings(userId: string): Promise<GlucoseReading[]> {
    const today = new Date();
    const weekAgo = subDays(today, 7);
    return this.getReadingsByDateRange(
      userId,
      startOfDay(weekAgo),
      endOfDay(today),
    );
  }

  /**
   * Subscribe to real-time updates for user's readings
   */
  static subscribeToReadings(
    userId: string,
    callback: (readings: GlucoseReading[]) => void,
    startDate?: Date,
    endDate?: Date,
  ): Unsubscribe {
    let q: Query<DocumentData> = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
    );

    if (startDate) {
      q = query(q, where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      q = query(q, where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const readings = snapshot.docs.map((doc) => this.formatReading(doc));
      callback(readings);
    });
  }

  /**
   * Bulk import readings (e.g., from CSV)
   */
  static async bulkImportReadings(
    readings: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = Timestamp.now();

      readings.forEach((reading) => {
        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, {
          ...reading,
          timestamp: Timestamp.fromDate(reading.timestamp),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error bulk importing readings:", error);
      throw error;
    }
  }

  /**
   * Calculate statistics for a date range
   */
  static async calculateStatistics(
    userId: string,
    startDate: Date,
    endDate: Date,
    unit: GlucoseUnit = "mg/dL",
  ): Promise<GlucoseStatistics> {
    try {
      const readings = await this.getReadingsByDateRange(
        userId,
        startDate,
        endDate,
      );

      if (readings.length === 0) {
        return {
          average: 0,
          standardDeviation: 0,
          timeInRange: 0,
          readingsCount: 0,
          highReadings: 0,
          lowReadings: 0,
          byMealType: {},
        };
      }

      const targets =
        unit === "mg/dL"
          ? DEFAULT_GLUCOSE_TARGETS_MGDL
          : DEFAULT_GLUCOSE_TARGETS_MMOL;

      // Calculate overall statistics
      const values = readings.map((r) => r.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;

      // Standard deviation
      const squaredDiffs = values.map((val) => Math.pow(val - average, 2));
      const avgSquaredDiff =
        squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const standardDeviation = Math.sqrt(avgSquaredDiff);

      // Time in range
      const inRangeCount = readings.filter((r) => isInRange(r, targets)).length;
      const timeInRange = (inRangeCount / readings.length) * 100;

      // High/low counts
      const highReadings = readings.filter(
        (r) => !isInRange(r, targets) && r.value > 140,
      ).length; // Using general high threshold
      const lowReadings = readings.filter((r) => r.value < 70).length; // Using general low threshold

      // By meal type statistics
      const byMealType: GlucoseStatistics["byMealType"] = {};

      const mealGroups = readings.reduce(
        (acc, reading) => {
          if (reading.mealAssociation) {
            if (!acc[reading.mealAssociation]) {
              acc[reading.mealAssociation] = [];
            }
            acc[reading.mealAssociation].push(reading);
          }
          return acc;
        },
        {} as Record<MealAssociation, GlucoseReading[]>,
      );

      Object.entries(mealGroups).forEach(([meal, mealReadings]) => {
        const mealValues = mealReadings.map((r) => r.value);
        const mealAverage =
          mealValues.reduce((sum, val) => sum + val, 0) / mealValues.length;
        const mealInRange = mealReadings.filter((r) =>
          isInRange(r, targets),
        ).length;

        byMealType[meal as MealAssociation] = {
          average: mealAverage,
          count: mealReadings.length,
          inRangePercentage: (mealInRange / mealReadings.length) * 100,
        };
      });

      return {
        average,
        standardDeviation,
        timeInRange,
        readingsCount: readings.length,
        highReadings,
        lowReadings,
        byMealType,
      };
    } catch (error) {
      console.error("Error calculating statistics:", error);
      throw error;
    }
  }

  /**
   * Identify patterns in glucose readings
   */
  static async identifyPatterns(
    userId: string,
    days: number = 14,
  ): Promise<GlucosePattern[]> {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      const readings = await this.getReadingsByDateRange(
        userId,
        startDate,
        endDate,
      );

      const patterns: GlucosePattern[] = [];

      // Group by meal association
      const mealGroups = readings.reduce(
        (acc, reading) => {
          if (reading.mealAssociation) {
            if (!acc[reading.mealAssociation]) {
              acc[reading.mealAssociation] = [];
            }
            acc[reading.mealAssociation].push(reading);
          }
          return acc;
        },
        {} as Record<MealAssociation, GlucoseReading[]>,
      );

      // Analyze each meal group for patterns
      Object.entries(mealGroups).forEach(([meal, mealReadings]) => {
        if (mealReadings.length < 3) return; // Need at least 3 readings to identify a pattern

        const targets = DEFAULT_GLUCOSE_TARGETS_MGDL; // Using mg/dL for analysis
        const highReadings = mealReadings.filter(
          (r) => !isInRange(r, targets) && r.value > 140,
        );
        const lowReadings = mealReadings.filter((r) => r.value < 70);

        // High pattern
        if (highReadings.length >= mealReadings.length * 0.5) {
          // 50% or more high
          patterns.push({
            type: "high",
            mealAssociation: meal as MealAssociation,
            frequency: highReadings.length,
            severity:
              highReadings.length >= mealReadings.length * 0.75
                ? "severe"
                : "moderate",
            recommendation: `Consider reducing carbohydrate intake at ${meal} or increasing activity after this meal.`,
          });
        }

        // Low pattern
        if (lowReadings.length >= 2) {
          // 2 or more lows
          patterns.push({
            type: "low",
            mealAssociation: meal as MealAssociation,
            frequency: lowReadings.length,
            severity: lowReadings.length >= 3 ? "severe" : "mild",
            recommendation: `Review insulin dosing or increase carbohydrate intake at ${meal}.`,
          });
        }

        // Variable pattern (high standard deviation)
        const values = mealReadings.map((r) => r.value);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
            values.length,
        );

        if (stdDev > 30) {
          // High variability
          patterns.push({
            type: "variable",
            mealAssociation: meal as MealAssociation,
            frequency: mealReadings.length,
            severity: stdDev > 50 ? "severe" : "moderate",
            recommendation: `Blood glucose is highly variable at ${meal}. Consider more consistent meal timing and content.`,
          });
        }
      });

      return patterns;
    } catch (error) {
      console.error("Error identifying patterns:", error);
      throw error;
    }
  }

  /**
   * Format Firestore document to GlucoseReading
   */
  private static formatReading(doc: DocumentSnapshot): GlucoseReading {
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as GlucoseReading;
  }
}
