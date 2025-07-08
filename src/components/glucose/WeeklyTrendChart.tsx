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
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import {
  GlucoseReading,
  GlucoseUnit,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  convertGlucoseUnit,
  MealAssociation,
} from "@/src/types/glucose";

interface WeeklyTrendChartProps {
  readings: GlucoseReading[];
  unit: GlucoseUnit;
}

export default function WeeklyTrendChart({
  readings,
  unit,
}: WeeklyTrendChartProps) {
  const targets =
    unit === "mg/dL"
      ? DEFAULT_GLUCOSE_TARGETS_MGDL
      : DEFAULT_GLUCOSE_TARGETS_MMOL;

  const chartData = useMemo(() => {
    // Group readings by week
    const weekGroups = new Map<string, GlucoseReading[]>();

    readings.forEach((reading) => {
      const weekStart = startOfWeek(reading.timestamp);
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }

      weekGroups.get(weekKey)!.push(reading);
    });

    // Calculate weekly averages by meal type
    const weeklyData: any[] = [];

    weekGroups.forEach((weekReadings, weekKey) => {
      const weekStart = new Date(weekKey);

      // Calculate averages for different meal types
      const fastingReadings = weekReadings.filter(
        (r) => r.mealAssociation === "fasting",
      );
      const postMealReadings = weekReadings.filter(
        (r) =>
          r.mealAssociation?.includes("post") &&
          r.mealAssociation?.includes("2hr"),
      );

      const dataPoint: any = {
        week: format(weekStart, "MMM d"),
        allReadings: calculateAverage(weekReadings, unit),
        readingCount: weekReadings.length,
      };

      if (fastingReadings.length > 0) {
        dataPoint.fasting = calculateAverage(fastingReadings, unit);
      }

      if (postMealReadings.length > 0) {
        dataPoint.postMeal = calculateAverage(postMealReadings, unit);
      }

      weeklyData.push(dataPoint);
    });

    // Sort by week
    return weeklyData.sort(
      (a, b) => new Date(a.week).getTime() - new Date(b.week).getTime(),
    );
  }, [readings, unit]);

  const calculateAverage = (
    readings: GlucoseReading[],
    targetUnit: GlucoseUnit,
  ) => {
    const values = readings.map((r) => {
      if (r.unit === targetUnit) return r.value;
      return convertGlucoseUnit(r.value, r.unit, targetUnit);
    });

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return targetUnit === "mg/dL"
      ? Math.round(avg)
      : parseFloat(avg.toFixed(1));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">Week of {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {unit}
            </p>
          ))}
          {payload[0]?.payload?.readingCount && (
            <p className="text-xs text-neutral-500 mt-2">
              {payload[0].payload.readingCount} total readings
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const yAxisDomain = useMemo(() => {
    if (unit === "mg/dL") {
      return [60, 180];
    } else {
      return [3.3, 10.0];
    }
  }, [unit]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No data available for trend analysis
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis dataKey="week" stroke="#6b7280" tick={{ fontSize: 12 }} />

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

          {/* Target lines */}
          <ReferenceLine
            y={targets.fasting.max}
            stroke="#6b7280"
            strokeDasharray="5 5"
            label={{ value: "Fasting", position: "right", fontSize: 10 }}
          />
          <ReferenceLine
            y={targets.postMeal2hr.max}
            stroke="#6b7280"
            strokeDasharray="5 5"
            label={{ value: "2hr Post", position: "right", fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />

          {/* Overall average line */}
          <Line
            type="monotone"
            dataKey="allReadings"
            name="Overall Average"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Fasting average line */}
          <Line
            type="monotone"
            dataKey="fasting"
            name="Fasting Average"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />

          {/* Post-meal average line */}
          <Line
            type="monotone"
            dataKey="postMeal"
            name="2hr Post-Meal Average"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
