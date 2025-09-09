"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  GlucoseReading,
  GlucoseUnit,
  MealAssociation,
  MEAL_ASSOCIATION_LABELS,
  QUICK_ENTRY_TIMES,
  convertGlucoseUnit,
  getTargetRange,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
} from "@/src/types/glucose";

interface GlucoseEntryFormProps {
  userId: string;
  defaultUnit?: GlucoseUnit;
  onSubmit: (
    reading: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
  initialData?: Partial<GlucoseReading>;
}

export default function GlucoseEntryForm({
  userId,
  defaultUnit = "mg/dL",
  onSubmit,
  onCancel,
  initialData,
}: GlucoseEntryFormProps) {
  const [value, setValue] = useState(initialData?.value?.toString() || "");
  const [unit, setUnit] = useState<GlucoseUnit>(
    initialData?.unit || defaultUnit,
  );
  const [date, setDate] = useState(
    initialData?.timestamp
      ? format(initialData.timestamp, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [time, setTime] = useState(
    initialData?.timestamp
      ? format(initialData.timestamp, "HH:mm")
      : format(new Date(), "HH:mm"),
  );
  const [mealAssociation, setMealAssociation] = useState<MealAssociation | "">(
    initialData?.mealAssociation || "",
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTargetInfo, setShowTargetInfo] = useState(false);

  const handleUnitToggle = () => {
    if (value) {
      const currentValue = parseFloat(value);
      const newUnit = unit === "mg/dL" ? "mmol/L" : "mg/dL";
      const convertedValue = convertGlucoseUnit(currentValue, unit, newUnit);
      setValue(convertedValue.toString());
      setUnit(newUnit);
    } else {
      setUnit(unit === "mg/dL" ? "mmol/L" : "mg/dL");
    }
  };

  const handleQuickEntry = (quickMeal: MealAssociation) => {
    setMealAssociation(quickMeal);
    // Set time to now
    setTime(format(new Date(), "HH:mm"));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!value || isNaN(parseFloat(value))) {
      newErrors.value = "Please enter a valid glucose value";
    } else {
      const numValue = parseFloat(value);
      if (unit === "mg/dL" && (numValue < 20 || numValue > 600)) {
        newErrors.value = "Value must be between 20 and 600 mg/dL";
      } else if (unit === "mmol/L" && (numValue < 1.1 || numValue > 33.3)) {
        newErrors.value = "Value must be between 1.1 and 33.3 mmol/L";
      }
    }

    if (!date) {
      newErrors.date = "Please select a date";
    }

    if (!time) {
      newErrors.time = "Please select a time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const timestamp = new Date(`${date}T${time}`);

    const readingData: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt"> = {
      userId,
      value: parseFloat(value),
      unit,
      timestamp,
    };
    
    // Only add optional fields if they have values
    if (mealAssociation) {
      readingData.mealAssociation = mealAssociation;
    }
    
    if (notes.trim()) {
      readingData.notes = notes.trim();
    }
    
    onSubmit(readingData);
  };

  // Get target range for current meal association
  const getTargetInfo = () => {
    if (!mealAssociation) return null;

    const targets =
      unit === "mmol/L"
        ? DEFAULT_GLUCOSE_TARGETS_MMOL
        : DEFAULT_GLUCOSE_TARGETS_MGDL;
    const targetRange = getTargetRange(mealAssociation, targets, unit);

    if (!targetRange) return null;

    return {
      range: targetRange,
      display:
        unit === "mmol/L"
          ? `Target: <${targetRange.max} mmol/L`
          : `Target: <${targetRange.max} mg/dL`,
    };
  };

  // Get visual indicator for glucose value
  const getValueIndicator = () => {
    if (!value || !mealAssociation) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    const targets =
      unit === "mmol/L"
        ? DEFAULT_GLUCOSE_TARGETS_MMOL
        : DEFAULT_GLUCOSE_TARGETS_MGDL;
    const targetRange = getTargetRange(mealAssociation, targets, unit);

    if (!targetRange) return null;

    if (numValue <= targetRange.max) {
      return {
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        message: "In target range",
      };
    } else if (numValue <= targetRange.max * 1.1) {
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        message: "Slightly above target",
      };
    } else {
      return {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        message: "Above target range",
      };
    }
  };

  const targetInfo = getTargetInfo();
  const valueIndicator = getValueIndicator();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Glucose Value Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Blood Glucose Level
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step={unit === "mg/dL" ? "1" : "0.1"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.value ? "border-red-500" : "border-neutral-300"
            }`}
            placeholder={unit === "mg/dL" ? "100" : "5.5"}
          />
          <button
            type="button"
            onClick={handleUnitToggle}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
          >
            {unit}
          </button>
        </div>
        {errors.value && (
          <p className="mt-1 text-sm text-red-600">{errors.value}</p>
        )}

        {/* Target Range Info */}
        {targetInfo && mealAssociation && (
          <div
            className={`mt-2 p-3 rounded-lg border ${
              valueIndicator
                ? `${valueIndicator.bg} ${valueIndicator.border}`
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  valueIndicator ? valueIndicator.color : "text-blue-700"
                }`}
              >
                {targetInfo.display}
              </span>
              {valueIndicator && (
                <span className={`text-sm ${valueIndicator.color}`}>
                  {valueIndicator.message}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={format(new Date(), "yyyy-MM-dd")}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.date ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
              errors.time ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.time && (
            <p className="mt-1 text-sm text-red-600">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Quick Entry Buttons */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Quick Entry
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_ENTRY_TIMES.map((quick) => (
            <button
              key={quick.mealAssociation}
              type="button"
              onClick={() => handleQuickEntry(quick.mealAssociation)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                mealAssociation === quick.mealAssociation
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200"
              }`}
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Association */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          When was this reading taken?
        </label>
        <select
          value={mealAssociation}
          onChange={(e) =>
            setMealAssociation(e.target.value as MealAssociation | "")
          }
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select timing (optional)</option>
          {Object.entries(MEAL_ASSOCIATION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Any additional context (e.g., feeling unwell, unusual activity, different meal)"
        />
      </div>

      {/* Target Ranges Reference */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <button
          type="button"
          onClick={() => setShowTargetInfo(!showTargetInfo)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-neutral-700">
            Gestational Diabetes Target Ranges
          </span>
          <svg
            className={`w-5 h-5 text-neutral-500 transform transition-transform ${
              showTargetInfo ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showTargetInfo && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-neutral-600">mg/dL</p>
                <p>Fasting: &lt;95</p>
                <p>1hr post-meal: &lt;140</p>
                <p>2hr post-meal: &lt;120</p>
              </div>
              <div>
                <p className="font-medium text-neutral-600">mmol/L</p>
                <p>Fasting: &lt;5.3</p>
                <p>1hr post-meal: &lt;7.8</p>
                <p>2hr post-meal: &lt;6.7</p>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Based on Halton Healthcare guidelines for gestational diabetes
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
        >
          Save Reading
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-neutral-200 text-neutral-700 font-medium rounded-lg hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
