"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { format, subDays } from "date-fns";
import { GlucoseService } from "@/src/services/glucose/glucose-service";
import { GlucoseTargetsService } from "@/src/services/glucose/glucose-targets-service";
import ReportGenerator from "@/src/components/glucose/ReportGenerator";
import {
  GlucoseReading,
  GlucoseStatistics,
  GlucosePattern,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  MEAL_ASSOCIATION_LABELS,
  PersonalizedGlucoseTargets,
} from "@/src/types/glucose";

export default function GlucoseReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [generating, setGenerating] = useState(false);

  // Use actual user ID from auth context
  const userId = user?.uid || null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleGenerateReport = async (
    startDate: Date,
    endDate: Date,
    format: "pdf" | "csv",
    includeCharts: boolean,
    includeStats: boolean,
    includeNotes: boolean,
  ) => {
    if (!userId) {
      alert("Please log in to generate reports");
      return;
    }

    try {
      setGenerating(true);

      // Get readings for the date range
      const readings = await GlucoseService.getReadingsByDateRange(
        userId,
        startDate,
        endDate,
      );

      // Get personalized targets (if available)
      let personalizedTargets: PersonalizedGlucoseTargets | null = null;
      try {
        personalizedTargets = await GlucoseTargetsService.getPersonalizedTargets(userId);
      } catch (error) {
        console.log("No personalized targets found, using defaults");
      }

      // Get statistics with personalized targets
      const stats = await GlucoseService.calculateStatistics(
        userId,
        startDate,
        endDate,
        "mg/dL",
        !!personalizedTargets, // Convert to boolean
      );

      // Get patterns with personalized targets
      const patterns = await GlucoseService.identifyPatterns(
        userId,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      if (format === "csv") {
        // Generate CSV
        generateCSV(readings, startDate, endDate);
      } else {
        // Generate PDF
        generatePDFReport(
          readings,
          stats,
          patterns,
          startDate,
          endDate,
          includeCharts,
          includeStats,
          includeNotes,
          personalizedTargets,
        );
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const generateCSV = (
    readings: GlucoseReading[],
    startDate: Date,
    endDate: Date,
  ) => {
    // Create CSV content
    const headers = [
      "Date",
      "Time",
      "Value (mg/dL)",
      "Value (mmol/L)",
      "Meal Association",
      "Notes",
    ];
    const rows = readings.map((reading) => [
      format(reading.timestamp, "yyyy-MM-dd"),
      format(reading.timestamp, "HH:mm"),
      reading.unit === "mg/dL"
        ? reading.value
        : Math.round(reading.value * 18.018),
      reading.unit === "mmol/L"
        ? reading.value
        : (reading.value / 18.018).toFixed(1),
      reading.mealAssociation
        ? MEAL_ASSOCIATION_LABELS[reading.mealAssociation]
        : "",
      reading.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `glucose-readings-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = (
    readings: GlucoseReading[],
    stats: GlucoseStatistics,
    patterns: GlucosePattern[],
    startDate: Date,
    endDate: Date,
    includeCharts: boolean,
    includeStats: boolean,
    includeNotes: boolean,
    personalizedTargets?: PersonalizedGlucoseTargets | null,
  ) => {
    // For now, generate a simple HTML report that can be printed as PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Glucose Report - ${format(startDate, "MMM d")} to ${format(endDate, "MMM d, yyyy")}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1, h2, h3 { color: #2563eb; }
          .header { border-bottom: 2px solid #2563eb; margin-bottom: 20px; padding-bottom: 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f3f4f6; font-weight: bold; }
          .in-range { color: #10b981; }
          .high { color: #ef4444; }
          .low { color: #f59e0b; }
          .pattern-box { background: #fef3c7; border: 1px solid #fbbf24; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Gestational Diabetes Glucose Report</h1>
          <p><strong>Period:</strong> ${format(startDate, "MMMM d, yyyy")} to ${format(endDate, "MMMM d, yyyy")}</p>
          <p><strong>Generated:</strong> ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>

        ${
          includeStats
            ? `
        <h2>Summary Statistics</h2>
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value">${stats.average.toFixed(0)} mg/dL</div>
            <div class="stat-label">Average Glucose</div>
          </div>
          <div class="stat-box">
            <div class="stat-value ${stats.timeInRange >= 70 ? "in-range" : stats.timeInRange >= 50 ? "low" : "high"}">${stats.timeInRange.toFixed(0)}%</div>
            <div class="stat-label">Time in Range</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.readingsCount}</div>
            <div class="stat-label">Total Readings</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${stats.standardDeviation.toFixed(0)}</div>
            <div class="stat-label">Std Deviation</div>
          </div>
        </div>
        `
            : ""
        }

        ${
          patterns.length > 0
            ? `
        <h2>Identified Patterns</h2>
        ${patterns
          .map(
            (pattern) => `
          <div class="pattern-box">
            <strong>${pattern.type === "high" ? "High" : pattern.type === "low" ? "Low" : "Variable"} Pattern:</strong>
            ${pattern.mealAssociation ? MEAL_ASSOCIATION_LABELS[pattern.mealAssociation] : "General"}
            (${pattern.frequency} occurrences)
            ${pattern.recommendation ? `<br><em>Recommendation: ${pattern.recommendation}</em>` : ""}
          </div>
        `,
          )
          .join("")}
        `
            : ""
        }

        <h2>Glucose Readings</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Value</th>
              <th>Timing</th>
              ${includeNotes ? "<th>Notes</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${readings
              .map((reading) => {
                const isHigh = reading.value > 140;
                const isLow = reading.value < 70;
                return `
              <tr>
                <td>${format(reading.timestamp, "MMM d")}</td>
                <td>${format(reading.timestamp, "h:mm a")}</td>
                <td class="${isHigh ? "high" : isLow ? "low" : "in-range"}">
                  ${reading.value} ${reading.unit}
                </td>
                <td>${reading.mealAssociation ? MEAL_ASSOCIATION_LABELS[reading.mealAssociation] : "-"}</td>
                ${includeNotes ? `<td>${reading.notes || "-"}</td>` : ""}
              </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p><strong>Target Ranges ${personalizedTargets ? '(Personalized)' : '(Standard Gestational Diabetes)'}:</strong></p>
          ${personalizedTargets ? `
          <p><strong>Personalized Targets:</strong> Set by ${personalizedTargets.setBy || 'healthcare provider'}</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0; font-size: 12px;">
            ${personalizedTargets.targets.fasting ? `<div>Fasting: <${personalizedTargets.targets.fasting.max} ${personalizedTargets.unit}</div>` : ''}
            ${personalizedTargets.targets.postBreakfast2hr ? `<div>Post-Breakfast (2hr): <${personalizedTargets.targets.postBreakfast2hr.max} ${personalizedTargets.unit}</div>` : ''}
            ${personalizedTargets.targets.postLunch2hr ? `<div>Post-Lunch (2hr): <${personalizedTargets.targets.postLunch2hr.max} ${personalizedTargets.unit}</div>` : ''}
            ${personalizedTargets.targets.postDinner2hr ? `<div>Post-Dinner (2hr): <${personalizedTargets.targets.postDinner2hr.max} ${personalizedTargets.unit}</div>` : ''}
          </div>
          ${personalizedTargets.notes ? `<p><em>Notes: ${personalizedTargets.notes}</em></p>` : ''}
          ` : `
          <p>Fasting: <95 mg/dL (<5.3 mmol/L) | 1hr post-meal: <140 mg/dL (<7.8 mmol/L) | 2hr post-meal: <120 mg/dL (<6.7 mmol/L)</p>
          `}
          <p><em>This report is for informational purposes only. Please consult with your healthcare provider for medical advice.</em></p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/tracking/glucose")}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-4"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Tracking
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">Glucose Reports</h1>
        <p className="text-neutral-600 mt-1">
          Generate detailed reports for your healthcare provider
        </p>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-neutral-200">
        <ReportGenerator
          onGenerate={handleGenerateReport}
          generating={generating}
        />
      </div>

      {/* Quick Report Templates */}
      <div className="mt-8 bg-primary-50 rounded-lg p-4 sm:p-6 border border-primary-200">
        <h3 className="text-lg font-semibold mb-4 text-primary-900">
          Quick Reports
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={async () => {
              const endDate = new Date();
              const startDate = subDays(endDate, 7);
              await handleGenerateReport(startDate, endDate, "pdf", true, true, true);
            }}
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
            disabled={generating}
          >
            <h4 className="font-semibold">Last 7 Days</h4>
            <p className="text-sm text-neutral-600 mt-1">
              Complete weekly report with charts and statistics
            </p>
          </button>

          <button
            onClick={async () => {
              const endDate = new Date();
              const startDate = subDays(endDate, 14);
              await handleGenerateReport(
                startDate,
                endDate,
                "pdf",
                true,
                true,
                false,
              );
            }}
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
            disabled={generating}
          >
            <h4 className="font-semibold">Last 2 Weeks</h4>
            <p className="text-sm text-neutral-600 mt-1">
              Two-week summary for routine checkups
            </p>
          </button>

          <button
            onClick={async () => {
              const endDate = new Date();
              const startDate = subDays(endDate, 30);
              await handleGenerateReport(
                startDate,
                endDate,
                "csv",
                false,
                false,
                false,
              );
            }}
            className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
            disabled={generating}
          >
            <h4 className="font-semibold">Monthly Export</h4>
            <p className="text-sm text-neutral-600 mt-1">
              CSV data export for detailed analysis
            </p>
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              About Glucose Reports
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                • Reports include all glucose readings within the selected date
                range
              </li>
              <li>
                • Statistics show time in range based on gestational diabetes
                targets
              </li>
              <li>
                • PDF reports open in a new window for easy printing and sharing
              </li>
              <li>
                • CSV exports can be opened in Excel or Google Sheets for
                analysis
              </li>
              <li>
                • Pattern identification helps spot trends in your glucose
                control
              </li>
              <li>• All times are shown in your local timezone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
