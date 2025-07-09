"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function ExportRecipesPage() {
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    metadata?: any;
  } | null>(null);

  async function updateOfflineData() {
    setUpdating(true);
    setResult(null);

    try {
      const response = await fetch("/api/recipes/offline-data", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully updated offline data with ${data.recipesUpdated} recipes`,
          metadata: data.metadata,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to update offline data",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Error updating offline data",
      });
    } finally {
      setUpdating(false);
    }
  }

  async function downloadOfflineData() {
    setDownloading(true);

    try {
      const response = await fetch("/api/recipes/offline-data");

      if (!response.ok) {
        throw new Error("Failed to fetch offline data");
      }

      const data = await response.json();
      
      // Create a blob and download it
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "production-recipes.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResult({
        success: true,
        message: "Downloaded production-recipes.json successfully",
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Error downloading offline data",
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Export Recipe Data</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Offline Recipe Export</h2>
        <p className="text-gray-600 mb-6">
          Update and download the offline recipe data. This file contains all
          recipes from the database in a format suitable for offline use.
        </p>

        <div className="flex gap-4">
          <button
            onClick={updateOfflineData}
            disabled={updating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Update Data
              </>
            )}
          </button>

          <button
            onClick={downloadOfflineData}
            disabled={downloading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <Download className="h-5 w-5 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download JSON
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            result.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <p className="font-medium">{result.message}</p>
          </div>

          {result.metadata && (
            <div className="mt-4 text-sm space-y-1">
              <p>Recipe Count: {result.metadata.recipeCount}</p>
              <p>Last Update: {new Date(result.metadata.lastUpdate).toLocaleString()}</p>
              {result.metadata.categories && (
                <div>
                  <p className="font-medium mt-2">Categories:</p>
                  <ul className="ml-4">
                    {Object.entries(result.metadata.categories).map(([cat, count]) => (
                      <li key={cat}>
                        {cat}: {count as number} recipes
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>
            Click &quot;Update Data&quot; to refresh the offline data with the latest
            recipes from the database
          </li>
          <li>
            Click &quot;Download JSON&quot; to download the production-recipes.json file
          </li>
          <li>
            Place the downloaded file in your project&apos;s{" "}
            <code className="bg-gray-200 px-1 rounded">data/</code> directory
          </li>
          <li>
            Commit and push the updated file to update the offline recipes
          </li>
        </ol>
      </div>
    </div>
  );
}