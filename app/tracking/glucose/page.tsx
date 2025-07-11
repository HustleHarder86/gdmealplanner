"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/src/contexts/AuthContext";
import { GlucoseReading, GlucoseStatistics } from "@/src/types/glucose";
import { GlucoseService } from "@/src/services/glucose/glucose-service";
import GlucoseEntryForm from "@/src/components/glucose/GlucoseEntryForm";
import DailyGlucoseChart from "@/src/components/glucose/DailyGlucoseChart";
import GlucoseStats from "@/src/components/glucose/GlucoseStats";
import RecentReadings from "@/src/components/glucose/RecentReadings";

export default function GlucoseTrackingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [todayReadings, setTodayReadings] = useState<GlucoseReading[]>([]);
  const [weekStats, setWeekStats] = useState<GlucoseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<"mg/dL" | "mmol/L">("mg/dL");
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(
    null,
  );
  const [quickEntryValue, setQuickEntryValue] = useState<number | null>(null);

  // Use actual user ID from auth context
  const userId = user?.uid || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // Load today's readings
      const readings = await GlucoseService.getTodayReadings(userId!);
      setTodayReadings(readings);

      // Calculate week statistics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const stats = await GlucoseService.calculateStatistics(
        userId!,
        startDate,
        endDate,
        selectedUnit,
      );
      setWeekStats(stats);
    } catch (error) {
      console.error("Error loading glucose data:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNewReading = async (
    reading: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      if (editingReading?.id) {
        // Update existing reading
        await GlucoseService.updateReading(editingReading.id, reading);
      } else {
        // Create new reading
        await GlucoseService.createReading(reading);
      }
      setShowEntryForm(false);
      setEditingReading(null);
      setQuickEntryValue(null);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error saving reading:", error);
    }
  };

  const handleEditReading = (reading: GlucoseReading) => {
    setEditingReading(reading);
    setShowEntryForm(true);
  };

  const handleQuickAdd = (value: number) => {
    setQuickEntryValue(value);
    setShowEntryForm(true);
  };

  const handleDeleteReading = async (id: string) => {
    if (confirm("Are you sure you want to delete this reading?")) {
      try {
        await GlucoseService.deleteReading(id);
        loadData(); // Reload data
      } catch (error) {
        console.error("Error deleting reading:", error);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">
            {authLoading ? "Checking authentication..." : "Loading glucose data..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Glucose Tracking</h1>
          <p className="text-neutral-600 mt-1 text-sm sm:text-base">
            Monitor your blood glucose levels and identify patterns
          </p>
        </div>
        <button
          onClick={() => setShowEntryForm(true)}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-2 justify-center"
        >
          <svg
            className="w-5 h-5"
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
          Add Reading
        </button>
      </div>

      {/* Quick Stats */}
      {weekStats && (
        <div className="mb-8">
          <GlucoseStats
            stats={weekStats}
            unit={selectedUnit}
            onUnitChange={setSelectedUnit}
          />
        </div>
      )}

      {/* Today's Chart */}
      <div className="bg-white rounded-lg p-4 sm:p-6 mb-8 shadow-sm border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">
            Today - {format(new Date(), "MMM d")}
          </h2>
          <div className="text-sm text-neutral-600">
            {todayReadings.length} reading
            {todayReadings.length !== 1 ? "s" : ""}
          </div>
        </div>
        <DailyGlucoseChart readings={todayReadings} unit={selectedUnit} />
      </div>

      {/* Recent Readings List */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-200">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Recent Readings
        </h2>
        <RecentReadings
          readings={todayReadings}
          unit={selectedUnit}
          onDelete={handleDeleteReading}
          onEdit={handleEditReading}
          onQuickAdd={handleQuickAdd}
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-primary-50 rounded-lg p-4 sm:p-6 border border-primary-200">
        <h3 className="text-lg font-semibold mb-4 text-primary-900">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => router.push("/tracking/glucose/history")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">History</span>
          </button>
          <button
            onClick={() => router.push("/tracking/glucose/reports")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v1a3 3 0 003 3h0a3 3 0 003-3v-1m3-10V4a3 3 0 00-3-3h0a3 3 0 00-3 3v3m0 0h6m-6 0H6"
              />
            </svg>
            <span className="text-sm font-medium">Reports</span>
          </button>
          <button
            onClick={() => router.push("/tracking/glucose/reminders")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="text-sm font-medium">Reminders</span>
          </button>
          <button
            onClick={() => router.push("/tracking/glucose/import")}
            className="flex flex-col items-center gap-2 p-4 bg-white hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
          >
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm font-medium">Import</span>
          </button>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingReading ? "Edit" : "Add"} Glucose Reading
                </h2>
                <button
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingReading(null);
                    setQuickEntryValue(null);
                  }}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <GlucoseEntryForm
                userId={userId!}
                defaultUnit={selectedUnit}
                onSubmit={handleNewReading}
                onCancel={() => {
                  setShowEntryForm(false);
                  setEditingReading(null);
                  setQuickEntryValue(null);
                }}
                initialData={
                  editingReading ||
                  (quickEntryValue ? { value: quickEntryValue } : undefined)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
