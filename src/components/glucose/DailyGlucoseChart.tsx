"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";
import {
  GlucoseReading,
  GlucoseUnit,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  convertGlucoseUnit,
  MEAL_ASSOCIATION_LABELS,
} from "@/src/types/glucose";

interface DailyGlucoseChartProps {
  readings: GlucoseReading[];
  unit: GlucoseUnit;
}

export default function DailyGlucoseChart({
  readings,
  unit,
}: DailyGlucoseChartProps) {
  if (readings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-neutral-50 rounded-lg">
        <p className="text-neutral-500">No readings for this day</p>
      </div>
    );
  }
  const targets =
    unit === "mg/dL"
      ? DEFAULT_GLUCOSE_TARGETS_MGDL
      : DEFAULT_GLUCOSE_TARGETS_MMOL;

  const chartData = useMemo(() => {
    // Sort readings by timestamp
    const sortedReadings = [...readings].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    return sortedReadings.map((reading) => {
      // Convert value if needed
      const value =
        reading.unit === unit
          ? reading.value
          : convertGlucoseUnit(reading.value, reading.unit, unit);

      // Determine which target to use based on meal association
      let targetMax = targets.postMeal2hr.max; // Default
      if (reading.mealAssociation === "fasting") {
        targetMax = targets.fasting.max;
      } else if (reading.mealAssociation?.includes("1hr")) {
        targetMax = targets.postMeal1hr.max;
      } else if (reading.mealAssociation?.includes("2hr")) {
        targetMax = targets.postMeal2hr.max;
      }

      // Determine color based on value and target
      let color = "#10b981"; // Green - in range
      if (value > targetMax) {
        if (value > targetMax * 1.1) {
          color = "#ef4444"; // Red - significantly high
        } else {
          color = "#f59e0b"; // Amber - slightly high
        }
      }

      return {
        time: format(reading.timestamp, "HH:mm"),
        timestamp: reading.timestamp.getTime(),
        value:
          unit === "mg/dL" ? Math.round(value) : parseFloat(value.toFixed(1)),
        mealAssociation: reading.mealAssociation,
        notes: reading.notes,
        color,
        targetMax,
      };
    });
  }, [readings, unit, targets]);

  const yAxisDomain = useMemo(() => {
    if (unit === "mg/dL") {
      return [40, 200];
    } else {
      return [2.2, 11.1];
    }
  }, [unit]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.time}</p>
          <p className="text-primary-600 font-bold">
            {data.value} {unit}
          </p>
          {data.mealAssociation && (
            <p className="text-sm text-neutral-600">
              {
                MEAL_ASSOCIATION_LABELS[
                  data.mealAssociation as keyof typeof MEAL_ASSOCIATION_LABELS
                ]
              }
            </p>
          )}
          {data.notes && (
            <p className="text-sm text-neutral-500 italic mt-1">{data.notes}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const getTargetLine = (type: "fasting" | "1hr" | "2hr") => {
    switch (type) {
      case "fasting":
        return targets.fasting.max;
      case "1hr":
        return targets.postMeal1hr.max;
      case "2hr":
        return targets.postMeal2hr.max;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap gap-2 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>In Range</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span>Slightly High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>High</span>
        </div>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            {/* X-Axis */}
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 12 }} />

            {/* Y-Axis */}
            <YAxis
              domain={yAxisDomain}
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{
                value: unit,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#6b7280" },
              }}
            />

            {/* Reference areas for target ranges */}
            <ReferenceArea
              y1={0}
              y2={getTargetLine("fasting")}
              fill="#10b981"
              fillOpacity={0.1}
            />

            {/* Reference lines for different targets */}
            <ReferenceLine
              y={getTargetLine("fasting")}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{
                value: "Fasting Target",
                position: "right",
                fontSize: 10,
              }}
            />
            <ReferenceLine
              y={getTargetLine("2hr")}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{ value: "2hr Target", position: "right", fontSize: 10 }}
            />
            <ReferenceLine
              y={getTargetLine("1hr")}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{ value: "1hr Target", position: "right", fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Main glucose line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={payload.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
