"use client";

import { useState } from "react";
import { format, subDays, differenceInDays } from "date-fns";

interface ReportGeneratorProps {
  onGenerate: (
    startDate: Date,
    endDate: Date,
    format: "pdf" | "csv",
    includeCharts: boolean,
    includeStats: boolean,
    includeNotes: boolean,
  ) => void;
  generating: boolean;
}

export default function ReportGenerator({
  onGenerate,
  generating,
}: ReportGeneratorProps) {
  // Common report presets
  const reportPresets = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 14 Days", days: 14 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
  ];
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 14), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportFormat, setReportFormat] = useState<"pdf" | "csv">("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onGenerate(
      new Date(startDate),
      new Date(endDate),
      reportFormat,
      includeCharts,
      includeStats,
      includeNotes,
    );
  };

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const dateRange =
    differenceInDays(new Date(endDate), new Date(startDate)) + 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Generate Healthcare Provider Report
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Create a comprehensive report for your healthcare provider with
          glucose readings, patterns, and statistics.
        </p>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Quick Select
          </label>
          <div className="flex flex-wrap gap-2">
            {reportPresets.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => handlePresetClick(preset.days)}
                className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Report Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                reportFormat === "pdf"
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                value="pdf"
                checked={reportFormat === "pdf"}
                onChange={(e) => setReportFormat(e.target.value as "pdf")}
                className="mr-3"
              />
              <div>
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-neutral-600">
                  Best for healthcare providers
                </div>
              </div>
            </label>
            <label
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                reportFormat === "csv"
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                value="csv"
                checked={reportFormat === "csv"}
                onChange={(e) => setReportFormat(e.target.value as "csv")}
                className="mr-3"
              />
              <div>
                <div className="font-medium">CSV Export</div>
                <div className="text-xs text-neutral-600">
                  For data analysis
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Options (only for PDF) */}
        {reportFormat === "pdf" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Include in Report
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="mr-2"
                />
                <span>Charts and Visualizations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="mr-2"
                />
                <span>Statistical Summary</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="mr-2"
                />
                <span>Notes and Comments</span>
              </label>
            </div>
          </div>
        )}

        {/* Report Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
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
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Report will include:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{dateRange} days of glucose readings</li>
                <li>
                  Time-in-range statistics based on gestational diabetes targets
                </li>
                <li>Daily averages and patterns by meal type</li>
                <li>Compliance with recommended testing schedule</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={generating || dateRange <= 0}
          className="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating Report...
            </span>
          ) : (
            `Generate ${dateRange} Day Report`
          )}
        </button>
      </div>
    </form>
  );
}
