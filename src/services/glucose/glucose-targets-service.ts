/**
 * Glucose Targets Service for managing personalized glucose targets
 * 
 * This service handles CRUD operations for user-specific glucose targets,
 * allowing users to override default medical guidelines with their doctor's
 * specific recommendations.
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
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  PersonalizedGlucoseTargets,
  GlucoseTargetRange,
  GlucoseUnit,
  MealCategory,
  applyBulkCategoryTarget,
  convertGlucoseUnit,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  validateAllPersonalizedTargets,
  TargetValidationResult,
} from "@/src/types/glucose";

const COLLECTION_NAME = "glucoseTargets";

export class GlucoseTargetsService {
  /**
   * Create or update personalized glucose targets for a user
   */
  static async savePersonalizedTargets(
    targets: Omit<PersonalizedGlucoseTargets, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      // Validate targets before saving
      const fullTargets: PersonalizedGlucoseTargets = {
        ...targets,
        id: 'temp', // temporary ID for validation
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const validation = validateAllPersonalizedTargets(fullTargets);
      if (!validation.isValid) {
        throw new Error(`Invalid glucose targets: ${validation.errors.join(', ')}`);
      }

      // Check if user already has targets
      const existingTargets = await this.getPersonalizedTargets(targets.userId);
      
      if (existingTargets) {
        // Update existing targets
        await this.updatePersonalizedTargets(existingTargets.id!, targets);
        return existingTargets.id!;
      } else {
        // Create new targets
        const docData = {
          ...targets,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
        return docRef.id;
      }
    } catch (error) {
      console.error("Error saving personalized targets:", error);
      throw error;
    }
  }

  /**
   * Update existing personalized glucose targets
   */
  static async updatePersonalizedTargets(
    id: string,
    updates: Partial<PersonalizedGlucoseTargets>
  ): Promise<void> {
    try {
      // If targets are being updated, validate them
      if (updates.targets) {
        // Get existing targets to merge with updates
        const existing = await this.getPersonalizedTargetsById(id);
        if (existing) {
          const mergedTargets: PersonalizedGlucoseTargets = {
            ...existing,
            ...updates,
          };
          
          const validation = validateAllPersonalizedTargets(mergedTargets);
          if (!validation.isValid) {
            throw new Error(`Invalid glucose targets: ${validation.errors.join(', ')}`);
          }
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating personalized targets:", error);
      throw error;
    }
  }

  /**
   * Get personalized glucose targets for a user
   */
  static async getPersonalizedTargets(
    userId: string
  ): Promise<PersonalizedGlucoseTargets | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.formatTargets(doc);
    } catch (error) {
      console.error("Error getting personalized targets:", error);
      throw error;
    }
  }

  /**
   * Get personalized glucose targets by document ID
   */
  static async getPersonalizedTargetsById(
    id: string
  ): Promise<PersonalizedGlucoseTargets | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.formatTargets(docSnap);
    } catch (error) {
      console.error("Error getting personalized targets by ID:", error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for user's personalized targets
   */
  static subscribeToPersonalizedTargets(
    userId: string,
    callback: (targets: PersonalizedGlucoseTargets | null) => void
  ): Unsubscribe {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const targets = this.formatTargets(snapshot.docs[0]);
        callback(targets);
      }
    });
  }

  /**
   * Delete personalized glucose targets (revert to defaults)
   */
  static async deletePersonalizedTargets(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting personalized targets:", error);
      throw error;
    }
  }

  /**
   * Apply bulk category target (e.g., set all lunch targets to same value)
   */
  static async applyBulkCategoryTarget(
    userId: string,
    category: MealCategory,
    target: GlucoseTargetRange
  ): Promise<void> {
    try {
      // Get current targets or create default structure
      let currentTargets = await this.getPersonalizedTargets(userId);
      
      if (!currentTargets) {
        // Create default personalized targets structure
        currentTargets = {
          userId,
          unit: target.unit,
          targets: {},
          notes: "Personalized targets set by user",
        };
      }

      // Apply bulk update
      const updatedTargets = applyBulkCategoryTarget(
        currentTargets,
        category,
        target
      );

      // Save updated targets
      await this.savePersonalizedTargets(updatedTargets);
    } catch (error) {
      console.error("Error applying bulk category target:", error);
      throw error;
    }
  }

  /**
   * Get default targets for a specific unit
   */
  static getDefaultTargets(unit: GlucoseUnit): PersonalizedGlucoseTargets {
    const defaultTargets = unit === "mmol/L" 
      ? DEFAULT_GLUCOSE_TARGETS_MMOL 
      : DEFAULT_GLUCOSE_TARGETS_MGDL;

    return {
      userId: "",
      unit,
      targets: {
        fasting: defaultTargets.fasting,
        postBreakfast1hr: defaultTargets.postMeal1hr,
        postBreakfast2hr: defaultTargets.postMeal2hr,
        postLunch1hr: defaultTargets.postMeal1hr,
        postLunch2hr: defaultTargets.postMeal2hr,
        postDinner1hr: defaultTargets.postMeal1hr,
        postDinner2hr: defaultTargets.postMeal2hr,
      },
      notes: "Default medical guidelines (Halton Healthcare)",
    };
  }

  /**
   * Convert targets between units
   */
  static convertTargetsUnit(
    targets: PersonalizedGlucoseTargets,
    toUnit: GlucoseUnit
  ): PersonalizedGlucoseTargets {
    if (targets.unit === toUnit) {
      return targets;
    }

    const convertedTargets: PersonalizedGlucoseTargets = {
      ...targets,
      unit: toUnit,
      targets: {},
    };

    // Convert each target range
    Object.entries(targets.targets).forEach(([key, targetRange]) => {
      if (targetRange) {
        const convertedRange: GlucoseTargetRange = {
          min: convertGlucoseUnit(targetRange.min, targets.unit, toUnit),
          max: convertGlucoseUnit(targetRange.max, targets.unit, toUnit),
          unit: toUnit,
        };
        
        (convertedTargets.targets as any)[key] = convertedRange;
      }
    });

    return convertedTargets;
  }

  /**
   * Validate target ranges for medical safety
   */
  static validateTargetRange(
    target: GlucoseTargetRange
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Convert to mg/dL for validation
    const mgdlMax = target.unit === "mg/dL" 
      ? target.max 
      : convertGlucoseUnit(target.max, "mmol/L", "mg/dL");
    
    const mgdlMin = target.unit === "mg/dL"
      ? target.min
      : convertGlucoseUnit(target.min, "mmol/L", "mg/dL");

    // Basic range validation
    if (mgdlMin < 0) {
      errors.push("Minimum glucose value cannot be negative");
    }

    if (mgdlMax <= mgdlMin) {
      errors.push("Maximum must be greater than minimum");
    }

    // Medical safety validation
    if (mgdlMax > 250) {
      errors.push("Maximum target seems dangerously high (>250 mg/dL). Please consult your healthcare provider.");
    }

    if (mgdlMax < 60) {
      errors.push("Maximum target seems dangerously low (<60 mg/dL). Please consult your healthcare provider.");
    }

    // Reasonable ranges for gestational diabetes
    if (mgdlMax > 180) {
      errors.push("Target above 180 mg/dL may not be suitable for gestational diabetes management");
    }

    if (mgdlMin > mgdlMax * 0.8) {
      errors.push("Target range is very narrow. Consider discussing with your healthcare provider.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get common preset targets for quick selection
   */
  static getPresetTargets(unit: GlucoseUnit): Array<{
    name: string;
    category: MealCategory;
    target: GlucoseTargetRange;
    description: string;
  }> {
    const presets = unit === "mmol/L" ? [
      {
        name: "Stricter Fasting",
        category: "fasting" as MealCategory,
        target: { min: 0, max: 5.0, unit: "mmol/L" as GlucoseUnit },
        description: "Tighter fasting control (< 5.0 mmol/L)"
      },
      {
        name: "Standard Post-Meal 1hr",
        category: "post-meal-1hr" as MealCategory,
        target: { min: 0, max: 7.8, unit: "mmol/L" as GlucoseUnit },
        description: "Standard 1-hour post-meal target"
      },
      {
        name: "Stricter Post-Meal 2hr",
        category: "post-meal-2hr" as MealCategory,
        target: { min: 0, max: 6.0, unit: "mmol/L" as GlucoseUnit },
        description: "Tighter 2-hour post-meal control"
      }
    ] : [
      {
        name: "Stricter Fasting",
        category: "fasting" as MealCategory,
        target: { min: 0, max: 90, unit: "mg/dL" as GlucoseUnit },
        description: "Tighter fasting control (< 90 mg/dL)"
      },
      {
        name: "Standard Post-Meal 1hr",
        category: "post-meal-1hr" as MealCategory,
        target: { min: 0, max: 140, unit: "mg/dL" as GlucoseUnit },
        description: "Standard 1-hour post-meal target"
      },
      {
        name: "Stricter Post-Meal 2hr",
        category: "post-meal-2hr" as MealCategory,
        target: { min: 0, max: 110, unit: "mg/dL" as GlucoseUnit },
        description: "Tighter 2-hour post-meal control"
      }
    ];

    return presets;
  }

  /**
   * Format Firestore document to PersonalizedGlucoseTargets
   */
  private static formatTargets(doc: DocumentSnapshot): PersonalizedGlucoseTargets {
    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as PersonalizedGlucoseTargets;
  }
}