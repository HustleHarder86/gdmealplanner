"use client";

import {
  GlucoseStatistics,
  GlucoseUnit,
  MEAL_ASSOCIATION_LABELS,
} from "@/src/types/glucose";

interface GlucoseStatsProps {
  stats: GlucoseStatistics;
  unit: GlucoseUnit;
  onUnitChange: (unit: GlucoseUnit) => void;
}

export default function GlucoseStats({
  stats,
  unit,
  onUnitChange,
}: GlucoseStatsProps) {
  const formatValue = (value: number) => {
    return unit === "mg/dL" ? Math.round(value) : value.toFixed(1);
  };

  const getTimeInRangeColor = (percentage: number) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getTimeInRangeBgColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-100";
    if (percentage >= 50) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getMealLabel = (meal: string) => {
    return (
      MEAL_ASSOCIATION_LABELS[meal as keyof typeof MEAL_ASSOCIATION_LABELS] ||
      meal.replace(/-/g, " ")
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Weekly Statistics</h2>
        <button
          onClick={() => onUnitChange(unit === "mg/dL" ? "mmol/L" : "mg/dL")}
          className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors"
        >
          Switch to {unit === "mg/dL" ? "mmol/L" : "mg/dL"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Average Glucose */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {formatValue(stats.average)}
          </div>
          <div className="text-sm text-neutral-600 mt-1">Average {unit}</div>
        </div>

        {/* Time in Range */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div
              className={`absolute inset-0 ${getTimeInRangeBgColor(stats.timeInRange)} rounded-full opacity-20`}
            ></div>
            <div
              className={`text-3xl font-bold ${getTimeInRangeColor(stats.timeInRange)} relative z-10`}
            >
              {stats.timeInRange.toFixed(0)}%
            </div>
          </div>
          <div className="text-sm text-neutral-600 mt-1">Time in Range</div>
          <div className="text-xs text-neutral-500">Target: ≥70%</div>
        </div>

        {/* Total Readings */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.readingsCount}
          </div>
          <div className="text-sm text-neutral-600 mt-1">Readings</div>
        </div>

        {/* Standard Deviation */}
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {formatValue(stats.standardDeviation)}
          </div>
          <div className="text-sm text-neutral-600 mt-1">Std Dev</div>
        </div>
      </div>

      {/* High/Low Summary */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.highReadings}
            </div>
            <div className="text-sm text-red-700">High</div>
            <div className="text-xs text-red-600 mt-1">
              {stats.readingsCount > 0
                ? `${((stats.highReadings / stats.readingsCount) * 100).toFixed(0)}%`
                : "0%"}
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.readingsCount - stats.highReadings - stats.lowReadings}
            </div>
            <div className="text-sm text-green-700">In Range</div>
            <div className="text-xs text-green-600 mt-1">
              {stats.timeInRange.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowReadings}
            </div>
            <div className="text-sm text-orange-700">Low</div>
            <div className="text-xs text-orange-600 mt-1">
              {stats.readingsCount > 0
                ? `${((stats.lowReadings / stats.readingsCount) * 100).toFixed(0)}%`
                : "0%"}
            </div>
          </div>
        </div>
      </div>

      {/* By Meal Type Summary */}
      {Object.keys(stats.byMealType).length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">
            By Meal Type
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byMealType).map(([meal, data]) => (
              <div
                key={meal}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex-1">
                  <span className="text-neutral-700 font-medium">
                    {getMealLabel(meal)}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">
                    ({data.count} readings)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-neutral-900">
                    {formatValue(data.average)} {unit}
                  </span>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${getTimeInRangeColor(data.inRangePercentage).replace("text-", "bg-")}`}
                    ></div>
                    <span
                      className={`text-sm ${getTimeInRangeColor(data.inRangePercentage)}`}
                    >
                      {data.inRangePercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
