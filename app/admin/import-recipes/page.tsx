"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

interface ImportStatus {
  library: {
    total: number;
    breakdown: {
      breakfast: number;
      lunch: number;
      dinner: number;
      snack: number;
    };
    percentComplete: number;
  };
  availableStrategies: {
    [key: string]: Array<{
      index: number;
      name: string;
      description: string;
    }>;
  };
}

export default function ImportRecipesPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState(true);
  const [failedImports, setFailedImports] = useState<any>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  // Import settings
  const [category, setCategory] = useState("breakfast");
  const [strategyIndex, setStrategyIndex] = useState(0);
  const [count, setCount] = useState(5);

  const fetchStatus = async () => {
    try {
      // Check Firebase connection first
      const firebaseTest = await fetch("/api/test-firebase");
      const firebaseData = await firebaseTest.json();

      if (!firebaseData.firestore.includes("✅")) {
        setFirestoreConnected(false);
        setError("Firestore is not connected. Please complete setup first.");
        return;
      }

      setFirestoreConnected(true);

      // Fetch recipe count
      const countResponse = await fetch("/api/recipes/count");
      const countData = await countResponse.json();
      setRecipeCount(countData.count || 0);

      // Fetch import status
      const response = await fetch(`/api/recipes/import-batch`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError("");
      } else {
        setError("Failed to fetch status.");
      }
    } catch (err) {
      setError("Error fetching status");
    }
  };

  const checkFailedImports = async () => {
    try {
      const response = await fetch("/api/recipes/retry-failed");
      if (response.ok) {
        const data = await response.json();
        setFailedImports(data);
      }
    } catch (err) {
      console.error("Error checking failed imports:", err);
    }
  };

  const retryFailedImports = async () => {
    setRetryLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recipes/retry-failed", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        // Refresh status and failed imports
        await fetchStatus();
        await checkFailedImports();
      } else {
        setError(data.error || "Retry failed");
      }
    } catch (err) {
      setError("Error retrying imports");
    } finally {
      setRetryLoading(false);
    }
  };

  const runImport = async () => {
    setLoading(true);
    setError("");
    setImportResult(null);

    try {
      const response = await fetch("/api/recipes/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          count,
          strategyIndex,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        // Refresh status
        await fetchStatus();
        // Check for any failures
        await checkFailedImports();
      } else {
        setError(data.error || "Import failed");
      }
    } catch (err) {
      setError("Error running import");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    if (firestoreConnected) {
      checkFailedImports();
    }
  }, [firestoreConnected]);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Recipe Import Manager</h1>

      {/* Recipe Count Banner */}
      {recipeCount !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-800">Current Recipe Library:</span>
              <span className="text-2xl font-bold text-blue-900">
                {recipeCount} recipes
              </span>
            </div>
            <a
              href="/admin/setup-verification"
              className="text-blue-600 hover:underline text-sm"
            >
              Check Setup Status →
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800">{error}</p>
              {!firestoreConnected && (
                <a
                  href="/admin/setup-verification"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  Go to Setup Verification →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Status */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Library Status</h2>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Total Progress</span>
              <span className="font-bold">
                {status.library.total} / 600 ({status.library.percentComplete}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ width: `${status.library.percentComplete}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {status.library.breakdown.breakfast}
              </p>
              <p className="text-sm text-gray-600">Breakfast</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {status.library.breakdown.lunch}
              </p>
              <p className="text-sm text-gray-600">Lunch</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {status.library.breakdown.dinner}
              </p>
              <p className="text-sm text-gray-600">Dinner</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {status.library.breakdown.snack}
              </p>
              <p className="text-sm text-gray-600">Snack</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Controls */}
      {status && firestoreConnected && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Import New Recipes</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setStrategyIndex(0);
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Recipes
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Import Strategy
            </label>
            <select
              value={strategyIndex}
              onChange={(e) => setStrategyIndex(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              {status.availableStrategies[category]?.map((strategy) => (
                <option key={strategy.index} value={strategy.index}>
                  {strategy.name} - {strategy.description}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={runImport}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Importing..." : `Import ${count} ${category} recipes`}
          </button>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Import Results</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Strategy Used</p>
              <p className="font-semibold">{importResult.import.strategy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold capitalize">
                {importResult.import.category}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipes Imported</p>
              <p className="font-semibold text-green-600">
                {importResult.import.imported}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipes Rejected</p>
              <p className="font-semibold text-red-600">
                {importResult.import.rejected}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="font-semibold">{importResult.import.processed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Calls Used</p>
              <p className="font-semibold">{importResult.import.apiCalls}</p>
            </div>
          </div>

          {importResult.import.errors?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-600">
                {importResult.import.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">New Library Total</p>
            <p className="text-2xl font-bold">
              {importResult.library.total} recipes
            </p>
          </div>
        </div>
      )}

      {/* Failed Imports Recovery */}
      {failedImports && failedImports.hasFailures && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-900">
            Failed Import Recovery
          </h2>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-orange-700">Failed Sessions</p>
                <p className="text-lg font-semibold text-orange-900">
                  {failedImports.failedSessions.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-orange-700">Unresolved Failures</p>
                <p className="text-lg font-semibold text-orange-900">
                  {failedImports.unresolvedFailures}
                </p>
              </div>
            </div>

            {failedImports.failedSessions.length > 0 && (
              <div className="border-t border-orange-200 pt-4">
                <h3 className="text-sm font-medium text-orange-900 mb-2">
                  Recent Failed Sessions
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {failedImports.failedSessions
                    .slice(0, 3)
                    .map((session: any) => (
                      <div
                        key={session.sessionId}
                        className="text-sm bg-white p-2 rounded"
                      >
                        <div className="flex justify-between">
                          <span>{session.date}</span>
                          <span className="text-orange-600">
                            {session.recipesRejected} rejected, {session.errors}{" "}
                            errors
                          </span>
                        </div>
                        {session.retryCount > 0 && (
                          <div className="text-xs text-gray-500">
                            Retried {session.retryCount} time
                            {session.retryCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={retryFailedImports}
              disabled={
                retryLoading ||
                !failedImports.failedSessions.some((s: any) => s.canRetry)
              }
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
              {retryLoading ? "Retrying..." : "Retry Failed Imports"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
