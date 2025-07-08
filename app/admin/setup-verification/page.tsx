"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface VerificationResult {
  firebaseAdmin: string;
  firestore: string;
  spoonacular: string;
  environment: {
    hasFirebaseAdminKey: boolean;
    hasProjectId: boolean;
    hasPrivateKey: boolean;
    hasClientEmail: boolean;
    hasPrivateKeyId: boolean;
    hasClientId: boolean;
    hasSpoonacularKey: boolean;
  };
  projectInfo: {
    projectIdFromEnv: string;
    projectIdFromAdminKey: string;
    projectIdIssue?: string;
  };
  error?: string;
  recipeCount?: number;
}

export default function SetupVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VerificationResult | null>(null);
  const [testImportResult, setTestImportResult] = useState<any>(null);
  const [testImportLoading, setTestImportLoading] = useState(false);

  const runVerification = async () => {
    setLoading(true);
    try {
      // Test Firebase connection
      const firebaseTest = await fetch("/api/test-firebase");
      const firebaseData = await firebaseTest.json();

      // Get project info
      const projectTest = await fetch("/api/check-project");
      const projectData = await projectTest.json();

      // Get recipe count
      let recipeCount = 0;
      try {
        const countResponse = await fetch("/api/recipes/count");
        const countData = await countResponse.json();
        recipeCount = countData.count || 0;
      } catch (error) {
        console.error("Failed to get recipe count:", error);
      }

      // Test Spoonacular connection
      let spoonacularStatus = "❌ Not tested";
      try {
        const spoonResponse = await fetch("/api/recipes/test-spoonacular");
        if (spoonResponse.ok) {
          spoonacularStatus = "✅ Connected";
        } else {
          spoonacularStatus = "❌ Failed";
        }
      } catch (error) {
        spoonacularStatus = "❌ Error";
      }

      // Check for project ID issues
      let projectIdIssue;
      if (
        projectData.projectIdFromEnv &&
        projectData.projectIdFromEnv.includes('"')
      ) {
        projectIdIssue =
          "Project ID has quotes around it in environment variable. Remove quotes from 'project_id' in Vercel.";
      }

      setResults({
        ...firebaseData,
        spoonacular: spoonacularStatus,
        projectInfo: {
          ...projectData,
          projectIdIssue,
        },
        recipeCount,
      });
    } catch (error) {
      console.error("Verification failed:", error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const runTestImport = async () => {
    setTestImportLoading(true);
    setTestImportResult(null);
    try {
      const response = await fetch("/api/recipes/import-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numberOfRecipes: 1,
          mealTypes: ["breakfast"],
          maxCarbs: 30,
        }),
      });
      const data = await response.json();
      setTestImportResult(data);
    } catch (error) {
      setTestImportResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setTestImportLoading(false);
    }
  };

  useEffect(() => {
    runVerification();
  }, []);

  const getStatusIcon = (status: string) => {
    if (status.includes("✅"))
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status.includes("❌"))
      return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">
        Setup Verification
      </h1>

      <div className="mb-4 flex justify-center">
        <button
          onClick={runVerification}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running..." : "Re-run Verification"}
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running verification tests...</p>
        </div>
      )}

      {results && !loading && (
        <div className="space-y-6">
          {/* Core Services */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Core Services</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Firebase Admin SDK</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.firebaseAdmin)}
                  <span>{results.firebaseAdmin}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Firestore Database</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.firestore)}
                  <span>{results.firestore}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Spoonacular API</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.spoonacular)}
                  <span>{results.spoonacular}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Recipe Count</span>
                <span className="font-bold text-lg">
                  {results.recipeCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Project Configuration */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Project Configuration
            </h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Project ID from env:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                  {results.projectInfo.projectIdFromEnv || "Not set"}
                </code>
              </div>
              <div>
                <span className="font-medium">Project ID from admin key:</span>
                <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                  {results.projectInfo.projectIdFromAdminKey || "Not available"}
                </code>
              </div>
              {results.projectInfo.projectIdIssue && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">
                    {results.projectInfo.projectIdIssue}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Environment Variables
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(results.environment).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          {(results.firestore.includes("❌") || results.error) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-yellow-900">
                Action Required
              </h2>
              <div className="space-y-3">
                {results.firestore.includes("NOT_FOUND") && (
                  <div>
                    <h3 className="font-medium text-yellow-900 mb-2">
                      Enable Firestore API:
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                      <li>
                        <a
                          href={`https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${results.projectInfo.projectIdFromAdminKey || results.projectInfo.projectIdFromEnv?.replace(/"/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Click here to open Google Cloud Console
                        </a>
                      </li>
                      <li>Click &ldquo;Enable API&rdquo; button</li>
                      <li>Wait 2-3 minutes for propagation</li>
                      <li>Click &ldquo;Re-run Verification&rdquo; above</li>
                    </ol>
                  </div>
                )}
                {results.firestore.includes("PERMISSION_DENIED") && (
                  <div>
                    <h3 className="font-medium text-yellow-900 mb-2">
                      Enable Firebase Admin SDK API:
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                      <li>
                        <a
                          href={`https://console.developers.google.com/apis/api/firebase.googleapis.com/overview?project=${results.projectInfo.projectIdFromAdminKey || results.projectInfo.projectIdFromEnv?.replace(/"/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Click here to enable Firebase Admin SDK API
                        </a>
                      </li>
                      <li>Click &ldquo;Enable API&rdquo; button</li>
                      <li>Wait 2-3 minutes for propagation</li>
                      <li>Click &ldquo;Re-run Verification&rdquo; above</li>
                    </ol>
                  </div>
                )}
                {results.projectInfo.projectIdIssue && (
                  <div>
                    <h3 className="font-medium text-yellow-900 mb-2">
                      Fix Project ID Configuration:
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Remove quotes from the &apos;project_id&apos; environment
                      variable in Vercel settings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Import */}
          {results.firestore.includes("✅") && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Test Recipe Import</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Test importing a single recipe to verify the system is working
                  correctly.
                </p>
                <button
                  onClick={runTestImport}
                  disabled={testImportLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {testImportLoading ? "Importing..." : "Test Import 1 Recipe"}
                </button>

                {testImportResult && (
                  <div
                    className={`p-4 rounded-md ${testImportResult.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}
                  >
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(testImportResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {results.firebaseAdmin.includes("✅") &&
            results.firestore.includes("✅") &&
            results.spoonacular.includes("✅") && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2 text-green-900">
                  ✅ Setup Complete!
                </h2>
                <p className="text-green-800">
                  All services are properly configured. You can now{" "}
                  <a
                    href="/admin/import-recipes"
                    className="text-blue-600 hover:underline"
                  >
                    start importing recipes
                  </a>
                  .
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
