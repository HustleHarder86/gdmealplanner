"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { GlucoseService } from "@/src/services/glucose/glucose-service";
import { GlucoseReading } from "@/src/types/glucose";

export default function GlucoseImportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [importing, setImporting] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        // Parse CSV preview (simplified)
        const lines = content.split("\n").slice(0, 6);
        setPreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!user || !csvContent) return;

    setImporting(true);
    try {
      // TODO: Implement CSV parsing and import logic
      // For now, just show a message
      alert("Import functionality will be implemented soon!");
    } catch (error) {
      console.error("Import error:", error);
      alert("Error importing data");
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">
            Checking authentication...
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
            <h1 className="text-3xl font-bold">Import Glucose Data</h1>
            <p className="text-neutral-600 mt-1">
              Import blood glucose readings from CSV files
            </p>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">CSV Import</h2>
        
        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-4">
            Upload a CSV file with the following columns: Date, Time, Value, Unit (mg/dL or mmol/L), Meal Association (optional), Notes (optional)
          </p>
          
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer"
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-neutral-600">
                Click to upload CSV file or drag and drop
              </p>
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Preview:</h3>
            <div className="bg-neutral-50 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{preview.join("\n")}</pre>
            </div>
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!csvContent || importing}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? "Importing..." : "Import Data"}
        </button>
      </div>

      {/* Format Guide */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
        <h3 className="text-lg font-semibold mb-3 text-primary-900">CSV Format Guide</h3>
        <div className="text-sm text-primary-800">
          <p className="mb-2">Example CSV format:</p>
          <code className="block bg-white p-3 rounded border border-primary-200">
            Date,Time,Value,Unit,Meal Association,Notes<br/>
            2025-07-11,07:30,95,mg/dL,fasting,Before breakfast<br/>
            2025-07-11,09:30,125,mg/dL,post-breakfast-2hr,After oatmeal
          </code>
        </div>
      </div>
    </div>
  );
}