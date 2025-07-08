"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { Calendar, Package, AlertCircle, CheckCircle } from "lucide-react";

interface ImportSession {
  id: string;
  timestamp: Date;
  recipesImported: number;
  recipesSkipped: number;
  recipesFailed: number;
  totalProcessed: number;
  errors: string[];
  importType: string;
  performedBy: string;
}

export default function ImportHistoryPage() {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImportHistory();
  }, []);

  async function loadImportHistory() {
    try {
      const q = query(
        collection(db, "importHistory"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const history: ImportSession[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
          recipesImported: data.recipesImported || 0,
          recipesSkipped: data.recipesSkipped || 0,
          recipesFailed: data.recipesFailed || 0,
          totalProcessed: data.totalProcessed || 0,
          errors: data.errors || [],
          importType: data.importType || "unknown",
          performedBy: data.performedBy || "system",
        });
      });

      setSessions(history);
    } catch (error) {
      console.error("Error loading import history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Import History</h1>
        <div className="animate-pulse">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Import History</h1>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No import sessions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const successRate = session.totalProcessed > 0
              ? Math.round((session.recipesImported / session.totalProcessed) * 100)
              : 0;

            return (
              <div key={session.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        {session.timestamp.toLocaleDateString()} at{" "}
                        {session.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Type: <span className="font-medium">{session.importType}</span> |
                      By: <span className="font-medium">{session.performedBy}</span>
                    </p>
                  </div>
                  
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                    successRate >= 80
                      ? "bg-green-100 text-green-800"
                      : successRate >= 50
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {successRate >= 80 ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-1" />
                    )}
                    {successRate}% Success
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600">Total Processed</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {session.totalProcessed}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Imported</p>
                    <p className="text-lg font-semibold text-green-900">
                      {session.recipesImported}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs text-yellow-600">Skipped</p>
                    <p className="text-lg font-semibold text-yellow-900">
                      {session.recipesSkipped}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600">Failed</p>
                    <p className="text-lg font-semibold text-red-900">
                      {session.recipesFailed}
                    </p>
                  </div>
                </div>

                {session.errors.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      View {session.errors.length} error{session.errors.length !== 1 ? "s" : ""}
                    </summary>
                    <ul className="mt-2 text-sm text-red-600 space-y-1">
                      {session.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="pl-4">• {error}</li>
                      ))}
                      {session.errors.length > 5 && (
                        <li className="pl-4 text-gray-500">
                          ...and {session.errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}