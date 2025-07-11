"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { GlucoseReading, GlucoseStatistics } from "@/src/types/glucose";
import { GlucoseService } from "@/src/services/glucose/glucose-service";
import MonthlyCalendar from "@/src/components/glucose/MonthlyCalendar";
import WeeklyTrendChart from "@/src/components/glucose/WeeklyTrendChart";

export default function GlucoseHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthReadings, setMonthReadings] = useState<GlucoseReading[]>([]);
  const [monthStats, setMonthStats] = useState<GlucoseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");

  // Use actual user ID from auth context
  const userId = user?.uid || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const loadMonthData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      const start = startOfMonth(selectedMonth);
      const end = endOfMonth(selectedMonth);

      // Load month's readings
      const readings = await GlucoseService.getReadingsByDateRange(
        userId!,
        start,
        end,
      );
      setMonthReadings(readings);

      // Calculate month statistics
      const stats = await GlucoseService.calculateStatistics(
        userId!,
        start,
        end,
        selectedUnit,
      );
      setMonthStats(stats);
    } catch (error) {
      console.error("Error loading month data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, userId, selectedUnit]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  const handleMonthChange = (increment: number) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setSelectedMonth(newMonth);
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">
            {authLoading ? "Checking authentication..." : "Loading history..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/tracking/glucose")}
            className="text-neutral-600 hover:text-neutral-800"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-3xl font-bold">Glucose History</h1>
            <p className="text-neutral-600 mt-1">
              Review your blood glucose patterns over time
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelectedUnit(selectedUnit === "mg/dL" ? "mmol/L" : "mg/dL")
            }
            className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors"
          >
            {selectedUnit}
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">
            {format(selectedMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={selectedMonth >= new Date()}
          >
            →
          </button>
        </div>

        {/* Monthly Calendar View */}
        <MonthlyCalendar
          month={selectedMonth}
          readings={monthReadings}
          unit={selectedUnit}
        />
      </div>

      {/* Monthly Statistics */}
      {monthStats && monthStats.readingsCount > 0 && (
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {monthStats.readingsCount}
              </div>
              <div className="text-sm text-neutral-600">Total Readings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {selectedUnit === "mg/dL"
                  ? Math.round(monthStats.average)
                  : monthStats.average.toFixed(1)}{" "}
                {selectedUnit}
              </div>
              <div className="text-sm text-neutral-600">Average</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  monthStats.timeInRange >= 70
                    ? "text-green-600"
                    : monthStats.timeInRange >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {monthStats.timeInRange.toFixed(0)}%
              </div>
              <div className="text-sm text-neutral-600">Time in Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {(
                  monthStats.readingsCount /
                  eachDayOfInterval({
                    start: startOfMonth(selectedMonth),
                    end: endOfMonth(selectedMonth),
                  }).length
                ).toFixed(1)}
              </div>
              <div className="text-sm text-neutral-600">Readings/Day</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Trend for Current Month */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Weekly Trends</h3>
        <WeeklyTrendChart readings={monthReadings} unit={selectedUnit} />
      </div>
    </div>
  );
}
