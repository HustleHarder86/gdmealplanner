"use client";

import { format } from "date-fns";
import {
  GlucoseReading,
  GlucoseUnit,
  getTargetRange,
  isInRange,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  MEAL_ASSOCIATION_LABELS,
} from "@/src/types/glucose";

interface RecentReadingsProps {
  readings: GlucoseReading[];
  unit: GlucoseUnit;
  onDelete: (id: string) => void;
  onEdit: (reading: GlucoseReading) => void;
  onQuickAdd?: (value: number) => void; // For quick re-entry of similar values
}

export default function RecentReadings({
  readings,
  unit,
  onDelete,
  onEdit,
  onQuickAdd,
}: RecentReadingsProps) {
  const formatValue = (value: number, readingUnit: GlucoseUnit) => {
    if (readingUnit === unit) {
      return unit === "mg/dL" ? Math.round(value) : value.toFixed(1);
    }
    // Convert if units don't match
    const convertedValue =
      readingUnit === "mg/dL" ? value / 18.018 : value * 18.018;
    return unit === "mg/dL"
      ? Math.round(convertedValue)
      : convertedValue.toFixed(1);
  };

  const getReadingColor = (reading: GlucoseReading) => {
    const targets =
      unit === "mg/dL"
        ? DEFAULT_GLUCOSE_TARGETS_MGDL
        : DEFAULT_GLUCOSE_TARGETS_MMOL;

    if (!isInRange(reading, targets)) {
      const targetRange = getTargetRange(
        reading.mealAssociation,
        targets,
        unit,
      );
      if (targetRange && reading.value > targetRange.max) {
        if (reading.value > targetRange.max * 1.1) {
          return "text-red-600";
        }
        return "text-amber-600";
      }
      return "text-orange-600";
    }
    return "text-green-600";
  };

  const getReadingBgColor = (reading: GlucoseReading) => {
    const color = getReadingColor(reading);
    if (color === "text-green-600") return "bg-green-50 border-green-200";
    if (color === "text-amber-600") return "bg-amber-50 border-amber-200";
    if (color === "text-red-600") return "bg-red-50 border-red-200";
    return "bg-orange-50 border-orange-200";
  };

  const getReadingIcon = (reading: GlucoseReading) => {
    const targets =
      unit === "mg/dL"
        ? DEFAULT_GLUCOSE_TARGETS_MGDL
        : DEFAULT_GLUCOSE_TARGETS_MMOL;

    if (!isInRange(reading, targets)) {
      const targetRange = getTargetRange(
        reading.mealAssociation,
        targets,
        unit,
      );
      if (targetRange && reading.value > targetRange.max) {
        return "↑";
      }
      return "↓";
    }
    return "✓";
  };

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-lg">
        <svg
          className="w-16 h-16 text-neutral-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-10V4a3 3 0 00-3-3h0a3 3 0 00-3 3v3m0 0h6m-6 0H6m13 7.5V15a2.25 2.25 0 01-2.25 2.25H15m0 0v1.5m0-1.5H9m6 0a2.25 2.25 0 01-2.25-2.25V15"
          />
        </svg>
        <p className="text-neutral-500">No readings recorded yet</p>
        <p className="text-sm text-neutral-400 mt-1">
          Add your first glucose reading to start tracking
        </p>
      </div>
    );
  }

  const sortedReadings = [...readings].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );

  return (
    <div className="space-y-2">
      {sortedReadings.map((reading) => (
        <div
          key={reading.id}
          className={`p-4 rounded-lg border transition-all ${getReadingBgColor(reading)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`text-2xl font-bold ${getReadingColor(reading)}`}
                >
                  {formatValue(reading.value, reading.unit)} {unit}
                </span>
                <span className={`text-lg ${getReadingColor(reading)}`}>
                  {getReadingIcon(reading)}
                </span>
              </div>
              <div className="text-sm text-neutral-700">
                <span className="font-medium">
                  {format(reading.timestamp, "h:mm a")}
                </span>
                {reading.mealAssociation && (
                  <span className="ml-2">
                    • {MEAL_ASSOCIATION_LABELS[reading.mealAssociation]}
                  </span>
                )}
              </div>
              {reading.notes && (
                <div className="text-sm text-neutral-600 italic mt-1">
                  {reading.notes}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-1 ml-4">
              {onQuickAdd && (
                <button
                  onClick={() => onQuickAdd(reading.value)}
                  className="px-3 py-1.5 text-sm bg-white hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-300"
                  title="Use this value for quick entry"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onEdit(reading)}
                className="px-3 py-1.5 text-sm bg-white hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(reading.id!)}
                className="px-3 py-1.5 text-sm bg-white hover:bg-red-50 rounded-lg transition-colors border border-neutral-300 text-red-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
