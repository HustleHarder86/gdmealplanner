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
  convertGlucoseUnit,
  PersonalizedGlucoseTargets,
  getPersonalizedTargetRange,
  convertToStandardTargets,
  MealCategory,
  GlucoseTargetRange,
} from "@/src/types/glucose";
import { GlucoseTargetsService } from "./glucose-targets-service";
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
      
      // Build document data, excluding undefined fields
      const docData: any = {
        userId: reading.userId,
        value: reading.value,
        unit: reading.unit,
        timestamp: Timestamp.fromDate(reading.timestamp),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Only add optional fields if they have values
      if (reading.mealAssociation !== undefined) {
        docData.mealAssociation = reading.mealAssociation;
      }
      
      if (reading.notes !== undefined && reading.notes !== '') {
        docData.notes = reading.notes;
      }
      
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
        updatedAt: Timestamp.now(),
      };

      // Only add defined fields to update
      if (updates.value !== undefined) updateData.value = updates.value;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.userId !== undefined) updateData.userId = updates.userId;
      
      if (updates.timestamp) {
        updateData.timestamp = Timestamp.fromDate(updates.timestamp);
      }
      
      if (updates.mealAssociation !== undefined) {
        updateData.mealAssociation = updates.mealAssociation;
      }
      
      if (updates.notes !== undefined && updates.notes !== '') {
        updateData.notes = updates.notes;
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
   * Calculate statistics for a date range with optional personalized targets
   */
  static async calculateStatistics(
    userId: string,
    startDate: Date,
    endDate: Date,
    unit: GlucoseUnit = "mg/dL",
    usePersonalizedTargets: boolean = true,
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

      // Get personalized targets if requested, otherwise use defaults
      let targets;
      let personalizedTargets: PersonalizedGlucoseTargets | null = null;
      
      if (usePersonalizedTargets) {
        personalizedTargets = await GlucoseTargetsService.getPersonalizedTargets(userId);
        
        if (personalizedTargets) {
          // Convert personalized targets to target unit if needed
          if (personalizedTargets.unit !== unit) {
            personalizedTargets = GlucoseTargetsService.convertTargetsUnit(personalizedTargets, unit);
          }
          targets = convertToStandardTargets(personalizedTargets);
        } else {
          targets = unit === "mg/dL" ? DEFAULT_GLUCOSE_TARGETS_MGDL : DEFAULT_GLUCOSE_TARGETS_MMOL;
        }
      } else {
        targets = unit === "mg/dL" ? DEFAULT_GLUCOSE_TARGETS_MGDL : DEFAULT_GLUCOSE_TARGETS_MMOL;
      }

      // FIXED: Normalize all readings to the target unit before calculations
      const normalizedReadings = readings.map(reading => ({
        ...reading,
        value: reading.unit === unit 
          ? reading.value 
          : convertGlucoseUnit(reading.value, reading.unit, unit),
        unit: unit
      }));

      // Calculate overall statistics using normalized values
      const values = normalizedReadings.map((r) => r.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;

      // Standard deviation
      const squaredDiffs = values.map((val) => Math.pow(val - average, 2));
      const avgSquaredDiff =
        squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const standardDeviation = Math.sqrt(avgSquaredDiff);

      // Time in range using normalized readings with personalized targets
      const inRangeCount = normalizedReadings.filter((r) => {
        if (personalizedTargets) {
          // Use specific personalized target for this meal association
          const specificTarget = getPersonalizedTargetRange(r.mealAssociation!, personalizedTargets, unit);
          if (specificTarget) {
            const value = r.unit === specificTarget.unit 
              ? r.value 
              : convertGlucoseUnit(r.value, r.unit, specificTarget.unit);
            return value >= specificTarget.min && value <= specificTarget.max;
          }
        }
        // Fall back to standard isInRange logic
        return isInRange(r, targets);
      }).length;
      const timeInRange = (inRangeCount / normalizedReadings.length) * 100;

      // FIXED: High/low counts using unit-appropriate thresholds
      const highThreshold = unit === "mg/dL" ? 140 : 7.8; // 140 mg/dL = ~7.8 mmol/L
      const lowThreshold = unit === "mg/dL" ? 70 : 3.9;   // 70 mg/dL = ~3.9 mmol/L
      
      const highReadings = normalizedReadings.filter(
        (r) => !isInRange(r, targets) && r.value > highThreshold,
      ).length;
      const lowReadings = normalizedReadings.filter((r) => r.value < lowThreshold).length;

      // FIXED: By meal type statistics using normalized readings
      const byMealType: GlucoseStatistics["byMealType"] = {};

      const mealGroups = normalizedReadings.reduce(
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
        const mealInRange = mealReadings.filter((r) => {
          if (personalizedTargets) {
            const specificTarget = getPersonalizedTargetRange(r.mealAssociation!, personalizedTargets, unit);
            if (specificTarget) {
              const value = r.unit === specificTarget.unit 
                ? r.value 
                : convertGlucoseUnit(r.value, r.unit, specificTarget.unit);
              return value >= specificTarget.min && value <= specificTarget.max;
            }
          }
          return isInRange(r, targets);
        }).length;

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

      // FIXED: Analyze each meal group for patterns with unit normalization
      Object.entries(mealGroups).forEach(([meal, mealReadings]) => {
        if (mealReadings.length < 3) return; // Need at least 3 readings to identify a pattern

        const targets = DEFAULT_GLUCOSE_TARGETS_MGDL; // Using mg/dL for analysis
        
        // Normalize readings to mg/dL for pattern analysis
        const normalizedMealReadings = mealReadings.map(reading => ({
          ...reading,
          value: reading.unit === "mg/dL" 
            ? reading.value 
            : convertGlucoseUnit(reading.value, reading.unit, "mg/dL"),
          unit: "mg/dL" as GlucoseUnit
        }));
        
        const highReadings = normalizedMealReadings.filter(
          (r) => !isInRange(r, targets) && r.value > 140,
        );
        const lowReadings = normalizedMealReadings.filter((r) => r.value < 70);

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

        // FIXED: Variable pattern using normalized values
        const values = normalizedMealReadings.map((r) => r.value);
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
   * Get personalized glucose targets for a user
   */
  static async getPersonalizedTargets(
    userId: string
  ): Promise<PersonalizedGlucoseTargets | null> {
    return GlucoseTargetsService.getPersonalizedTargets(userId);
  }

  /**
   * Save personalized glucose targets for a user
   */
  static async savePersonalizedTargets(
    targets: Omit<PersonalizedGlucoseTargets, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    return GlucoseTargetsService.savePersonalizedTargets(targets);
  }

  /**
   * Apply bulk category target (e.g., set all lunch targets to same value)
   */
  static async applyBulkCategoryTarget(
    userId: string,
    category: MealCategory,
    target: GlucoseTargetRange
  ): Promise<void> {
    return GlucoseTargetsService.applyBulkCategoryTarget(userId, category, target);
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
