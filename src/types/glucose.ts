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

// Personalized glucose targets for individual users
export interface PersonalizedGlucoseTargets {
  id?: string;
  userId: string;
  unit: GlucoseUnit; // User's preferred unit
  targets: {
    // Specific targets for each meal association
    fasting?: GlucoseTargetRange;
    preBreakfast?: GlucoseTargetRange;
    postBreakfast1hr?: GlucoseTargetRange;
    postBreakfast2hr?: GlucoseTargetRange;
    preLunch?: GlucoseTargetRange;
    postLunch1hr?: GlucoseTargetRange;
    postLunch2hr?: GlucoseTargetRange;
    preDinner?: GlucoseTargetRange;
    postDinner1hr?: GlucoseTargetRange;
    postDinner2hr?: GlucoseTargetRange;
    preSnack?: GlucoseTargetRange;
    postSnack?: GlucoseTargetRange;
    bedtime?: GlucoseTargetRange;
    night?: GlucoseTargetRange;
  };
  notes?: string; // Doctor's notes or instructions
  setBy?: string; // Healthcare provider who set these targets
  createdAt?: Date;
  updatedAt?: Date;
}

// Meal category groupings for bulk target setting
export type MealCategory = 
  | "fasting" 
  | "pre-meal" 
  | "post-meal-1hr" 
  | "post-meal-2hr" 
  | "snacks" 
  | "bedtime";

export interface MealCategoryTargets {
  category: MealCategory;
  target: GlucoseTargetRange;
  description: string;
  affectedMealTypes: MealAssociation[];
}

// Mapping of meal associations to categories for bulk updates
export const MEAL_CATEGORY_MAPPING: Record<MealCategory, MealAssociation[]> = {
  fasting: ["fasting"],
  "pre-meal": ["pre-breakfast", "pre-lunch", "pre-dinner"],
  "post-meal-1hr": ["post-breakfast-1hr", "post-lunch-1hr", "post-dinner-1hr"],
  "post-meal-2hr": ["post-breakfast-2hr", "post-lunch-2hr", "post-dinner-2hr"],
  snacks: ["pre-snack", "post-snack"],
  bedtime: ["bedtime", "night"]
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
  } else if (mealAssociation.includes("pre-") || mealAssociation.includes("post-") || mealAssociation === "bedtime" || mealAssociation === "night") {
    // For snacks, bedtime, night, and other meal associations, default to 2hr post-meal target
    return currentTargets.postMeal2hr;
  }

  return null;
};

// Helper to get personalized target range for specific meal association
export const getPersonalizedTargetRange = (
  mealAssociation: MealAssociation,
  personalizedTargets?: PersonalizedGlucoseTargets,
  fallbackUnit: GlucoseUnit = "mg/dL"
): GlucoseTargetRange | null => {
  if (!personalizedTargets) {
    // Fall back to default targets
    const defaultTargets = fallbackUnit === "mmol/L" 
      ? DEFAULT_GLUCOSE_TARGETS_MMOL 
      : DEFAULT_GLUCOSE_TARGETS_MGDL;
    return getTargetRange(mealAssociation, defaultTargets, fallbackUnit);
  }

  // Map meal association to personalized target field
  const targetFieldMap: Record<MealAssociation, keyof PersonalizedGlucoseTargets['targets']> = {
    'fasting': 'fasting',
    'pre-breakfast': 'preBreakfast',
    'post-breakfast-1hr': 'postBreakfast1hr',
    'post-breakfast-2hr': 'postBreakfast2hr',
    'pre-lunch': 'preLunch',
    'post-lunch-1hr': 'postLunch1hr',
    'post-lunch-2hr': 'postLunch2hr',
    'pre-dinner': 'preDinner',
    'post-dinner-1hr': 'postDinner1hr',
    'post-dinner-2hr': 'postDinner2hr',
    'pre-snack': 'preSnack',
    'post-snack': 'postSnack',
    'bedtime': 'bedtime',
    'night': 'night'
  };

  const targetField = targetFieldMap[mealAssociation];
  const personalizedTarget = personalizedTargets.targets[targetField];

  if (personalizedTarget) {
    return personalizedTarget;
  }

  // Fall back to default if no personalized target set
  const defaultTargets = personalizedTargets.unit === "mmol/L" 
    ? DEFAULT_GLUCOSE_TARGETS_MMOL 
    : DEFAULT_GLUCOSE_TARGETS_MGDL;
  return getTargetRange(mealAssociation, defaultTargets, personalizedTargets.unit);
};

// Helper to convert personalized targets to standard GlucoseTargets format
// Validation for glucose target ranges
export interface TargetValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export const validateGlucoseTarget = (
  value: number,
  unit: GlucoseUnit,
  mealAssociation: MealAssociation
): TargetValidationResult => {
  const result: TargetValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Convert to mg/dL for standardized validation
  const mgdlValue = unit === "mmol/L" ? value * 18.018 : value;

  // Define safe ranges (mg/dL)
  const SAFE_RANGES = {
    fasting: { min: 60, max: 110, warning: { min: 70, max: 100 } },
    postMeal1hr: { min: 80, max: 180, warning: { min: 100, max: 160 } },
    postMeal2hr: { min: 70, max: 150, warning: { min: 90, max: 130 } },
    general: { min: 60, max: 200, warning: { min: 70, max: 180 } }
  };

  let range;
  if (mealAssociation === "fasting") {
    range = SAFE_RANGES.fasting;
  } else if (mealAssociation.includes("1hr")) {
    range = SAFE_RANGES.postMeal1hr;
  } else if (mealAssociation.includes("2hr")) {
    range = SAFE_RANGES.postMeal2hr;
  } else {
    range = SAFE_RANGES.general;
  }

  // Check for dangerous values
  if (mgdlValue < range.min) {
    result.isValid = false;
    result.errors.push(`Target too low (${value} ${unit}). Minimum safe value is ${unit === "mmol/L" ? (range.min / 18.018).toFixed(1) : range.min} ${unit}.`);
  } else if (mgdlValue > range.max) {
    result.isValid = false;
    result.errors.push(`Target too high (${value} ${unit}). Maximum safe value is ${unit === "mmol/L" ? (range.max / 18.018).toFixed(1) : range.max} ${unit}.`);
  }

  // Check for values outside recommended ranges but still safe
  if (result.isValid) {
    if (mgdlValue < range.warning.min) {
      result.warnings.push(`Target is stricter than typical medical guidelines (${value} ${unit}). Ensure this is recommended by your healthcare provider.`);
    } else if (mgdlValue > range.warning.max) {
      result.warnings.push(`Target is more lenient than typical guidelines (${value} ${unit}). Consider consulting your healthcare provider.`);
    }
  }

  return result;
};

export const validateAllPersonalizedTargets = (
  targets: PersonalizedGlucoseTargets
): TargetValidationResult => {
  const result: TargetValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Validate each set target
  Object.entries(targets.targets).forEach(([key, targetRange]) => {
    if (targetRange) {
      const mealAssociation = key as keyof PersonalizedGlucoseTargets['targets'];
      
      // Map back to MealAssociation string
      const mealAssociationMap: Record<string, MealAssociation> = {
        'fasting': 'fasting',
        'preBreakfast': 'pre-breakfast',
        'postBreakfast1hr': 'post-breakfast-1hr',
        'postBreakfast2hr': 'post-breakfast-2hr',
        'preLunch': 'pre-lunch',
        'postLunch1hr': 'post-lunch-1hr',
        'postLunch2hr': 'post-lunch-2hr',
        'preDinner': 'pre-dinner',
        'postDinner1hr': 'post-dinner-1hr',
        'postDinner2hr': 'post-dinner-2hr',
        'preSnack': 'pre-snack',
        'postSnack': 'post-snack',
        'bedtime': 'bedtime',
        'night': 'night'
      };

      const mealType = mealAssociationMap[mealAssociation] || 'fasting';
      const validation = validateGlucoseTarget(targetRange.max, targets.unit, mealType);
      
      if (!validation.isValid) {
        result.isValid = false;
        result.errors.push(...validation.errors.map(err => `${key}: ${err}`));
      }
      result.warnings.push(...validation.warnings.map(warn => `${key}: ${warn}`));
    }
  });

  return result;
};

export const convertToStandardTargets = (
  personalizedTargets: PersonalizedGlucoseTargets
): GlucoseTargets => {
  const unit = personalizedTargets.unit;
  const defaultTargets = unit === "mmol/L" 
    ? DEFAULT_GLUCOSE_TARGETS_MMOL 
    : DEFAULT_GLUCOSE_TARGETS_MGDL;

  return {
    fasting: personalizedTargets.targets.fasting || defaultTargets.fasting,
    postMeal1hr: personalizedTargets.targets.postBreakfast1hr || 
                 personalizedTargets.targets.postLunch1hr || 
                 personalizedTargets.targets.postDinner1hr || 
                 defaultTargets.postMeal1hr,
    postMeal2hr: personalizedTargets.targets.postBreakfast2hr || 
                 personalizedTargets.targets.postLunch2hr || 
                 personalizedTargets.targets.postDinner2hr || 
                 defaultTargets.postMeal2hr,
  };
};

// Helper to apply bulk category target to multiple meal types
export const applyBulkCategoryTarget = (
  currentTargets: PersonalizedGlucoseTargets,
  category: MealCategory,
  target: GlucoseTargetRange
): PersonalizedGlucoseTargets => {
  const updatedTargets = { ...currentTargets };
  const affectedMealTypes = MEAL_CATEGORY_MAPPING[category];

  // Map meal associations to target fields
  const fieldMapping: Record<MealAssociation, keyof PersonalizedGlucoseTargets['targets']> = {
    'fasting': 'fasting',
    'pre-breakfast': 'preBreakfast',
    'post-breakfast-1hr': 'postBreakfast1hr',
    'post-breakfast-2hr': 'postBreakfast2hr',
    'pre-lunch': 'preLunch',
    'post-lunch-1hr': 'postLunch1hr',
    'post-lunch-2hr': 'postLunch2hr',
    'pre-dinner': 'preDinner',
    'post-dinner-1hr': 'postDinner1hr',
    'post-dinner-2hr': 'postDinner2hr',
    'pre-snack': 'preSnack',
    'post-snack': 'postSnack',
    'bedtime': 'bedtime',
    'night': 'night'
  };

  affectedMealTypes.forEach(mealType => {
    const field = fieldMapping[mealType];
    if (field) {
      updatedTargets.targets[field] = { ...target };
    }
  });

  return updatedTargets;
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
