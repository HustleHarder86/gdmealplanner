/**
 * Glucose tracking types for gestational diabetes management
 */

// Units for glucose measurement
export type GlucoseUnit = "mg/dL" | "mmol/L";

// Meal associations for glucose readings
export type MealAssociation =
  | "fasting"
  | "pre-breakfast"
  | "post-breakfast-1hr"
  | "post-breakfast-2hr"
  | "pre-lunch"
  | "post-lunch-1hr"
  | "post-lunch-2hr"
  | "pre-dinner"
  | "post-dinner-1hr"
  | "post-dinner-2hr"
  | "pre-snack"
  | "post-snack"
  | "bedtime"
  | "night";

// Main glucose reading interface
export interface GlucoseReading {
  id?: string;
  userId: string;
  value: number;
  unit: GlucoseUnit;
  timestamp: Date;
  mealAssociation?: MealAssociation;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Target ranges based on MEDICAL_GUIDELINES.md
export interface GlucoseTargetRange {
  min: number;
  max: number;
  unit: GlucoseUnit;
}

export interface GlucoseTargets {
  fasting: GlucoseTargetRange;
  postMeal1hr: GlucoseTargetRange;
  postMeal2hr: GlucoseTargetRange;
}

// Default targets from Halton Healthcare guidelines
export const DEFAULT_GLUCOSE_TARGETS_MMOL: GlucoseTargets = {
  fasting: { min: 0, max: 5.3, unit: "mmol/L" },
  postMeal1hr: { min: 0, max: 7.8, unit: "mmol/L" },
  postMeal2hr: { min: 0, max: 6.7, unit: "mmol/L" },
};

export const DEFAULT_GLUCOSE_TARGETS_MGDL: GlucoseTargets = {
  fasting: { min: 0, max: 95, unit: "mg/dL" },
  postMeal1hr: { min: 0, max: 140, unit: "mg/dL" },
  postMeal2hr: { min: 0, max: 120, unit: "mg/dL" },
};

// Statistics types
export interface GlucoseStatistics {
  average: number;
  standardDeviation: number;
  timeInRange: number; // percentage
  readingsCount: number;
  highReadings: number;
  lowReadings: number;
  byMealType: {
    [key in MealAssociation]?: {
      average: number;
      count: number;
      inRangePercentage: number;
    };
  };
}

export interface GlucosePattern {
  type: "high" | "low" | "variable";
  mealAssociation?: MealAssociation;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  frequency: number; // occurrences
  severity: "mild" | "moderate" | "severe";
  recommendation?: string;
}

// Reminder settings
export interface GlucoseReminder {
  id?: string;
  userId: string;
  enabled: boolean;
  time: string; // HH:mm format
  mealAssociation: MealAssociation;
  days: number[]; // 0-6, where 0 is Sunday
  notificationId?: string;
}

// Export formats
export type ExportFormat = "pdf" | "csv" | "json" | "healthkit" | "googlefit";

export interface ExportOptions {
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  includeStats: boolean;
  includeCharts: boolean;
  includeNotes: boolean;
}

// Utility functions for unit conversion
export const convertGlucoseUnit = (
  value: number,
  fromUnit: GlucoseUnit,
  toUnit: GlucoseUnit,
): number => {
  if (fromUnit === toUnit) return value;

  if (fromUnit === "mg/dL" && toUnit === "mmol/L") {
    // mg/dL to mmol/L: divide by 18.018
    return Math.round((value / 18.018) * 10) / 10;
  } else {
    // mmol/L to mg/dL: multiply by 18.018
    return Math.round(value * 18.018);
  }
};

// Helper to determine if reading is in range
export const isInRange = (
  reading: GlucoseReading,
  targets: GlucoseTargets,
): boolean => {
  const targetRange = getTargetRange(
    reading.mealAssociation,
    targets,
    reading.unit,
  );
  if (!targetRange) return true; // No specific target for this meal type

  const value =
    reading.unit === targetRange.unit
      ? reading.value
      : convertGlucoseUnit(reading.value, reading.unit, targetRange.unit);

  return value >= targetRange.min && value <= targetRange.max;
};

// Helper to get appropriate target range
export const getTargetRange = (
  mealAssociation?: MealAssociation,
  targets?: GlucoseTargets,
  unit?: GlucoseUnit,
): GlucoseTargetRange | null => {
  if (!mealAssociation || !targets) return null;

  const defaultTargets =
    unit === "mmol/L"
      ? DEFAULT_GLUCOSE_TARGETS_MMOL
      : DEFAULT_GLUCOSE_TARGETS_MGDL;

  const currentTargets = targets || defaultTargets;

  if (mealAssociation === "fasting") {
    return currentTargets.fasting;
  } else if (mealAssociation.includes("1hr")) {
    return currentTargets.postMeal1hr;
  } else if (mealAssociation.includes("2hr")) {
    return currentTargets.postMeal2hr;
  }

  return null;
};

// Meal association display labels
export const MEAL_ASSOCIATION_LABELS: Record<MealAssociation, string> = {
  fasting: "Fasting/Wake Up",
  "pre-breakfast": "Before Breakfast",
  "post-breakfast-1hr": "1hr After Breakfast",
  "post-breakfast-2hr": "2hr After Breakfast",
  "pre-lunch": "Before Lunch",
  "post-lunch-1hr": "1hr After Lunch",
  "post-lunch-2hr": "2hr After Lunch",
  "pre-dinner": "Before Dinner",
  "post-dinner-1hr": "1hr After Dinner",
  "post-dinner-2hr": "2hr After Dinner",
  "pre-snack": "Before Snack",
  "post-snack": "After Snack",
  bedtime: "Bedtime",
  night: "Middle of Night",
};

// Quick entry time suggestions
export const QUICK_ENTRY_TIMES: {
  label: string;
  mealAssociation: MealAssociation;
}[] = [
  { label: "Fasting", mealAssociation: "fasting" },
  { label: "2hr After Breakfast", mealAssociation: "post-breakfast-2hr" },
  { label: "2hr After Lunch", mealAssociation: "post-lunch-2hr" },
  { label: "2hr After Dinner", mealAssociation: "post-dinner-2hr" },
  { label: "Bedtime", mealAssociation: "bedtime" },
];
