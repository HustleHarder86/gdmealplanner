"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import {
  ChefHat,
  Import,
  History,
  TrendingUp,
  Database,
  CheckCircle,
  Upload,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalRecipes: number;
  categoryBreakdown: Record<string, number>;
  lastImportDate: string | null;
  importHistory: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0,
    categoryBreakdown: {},
    lastImportDate: null,
    importHistory: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  async function loadDashboardStats() {
    try {
      // Load recipes count and breakdown
      const recipesSnapshot = await getDocs(collection(db, "recipes"));
      const categoryBreakdown: Record<string, number> = {};

      recipesSnapshot.forEach((doc) => {
        const recipe = doc.data();
        const category = recipe.category || "uncategorized";
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      });

      // Load import history
      const importHistorySnapshot = await getDocs(
        collection(db, "importHistory"),
      );
      let lastImportDate = null;

      if (!importHistorySnapshot.empty) {
        const imports = importHistorySnapshot.docs.map((doc) => ({
          ...doc.data(),
          timestamp:
            doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp),
        }));

        imports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (imports.length > 0) {
          lastImportDate = imports[0].timestamp.toISOString();
        }
      }

      setStats({
        totalRecipes: recipesSnapshot.size,
        categoryBreakdown,
        lastImportDate,
        importHistory: importHistorySnapshot.size,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <div className="animate-pulse">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Total Recipes</h3>
            <ChefHat className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalRecipes}
          </p>
          <p className="text-sm text-gray-500 mt-2">In database</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Import Sessions
            </h3>
            <History className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.importHistory}
          </p>
          <p className="text-sm text-gray-500 mt-2">Total imports</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Last Import</h3>
            <Import className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-lg font-medium text-gray-900">
            {stats.lastImportDate
              ? new Date(stats.lastImportDate).toLocaleDateString()
              : "Never"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {stats.lastImportDate
              ? new Date(stats.lastImportDate).toLocaleTimeString()
              : "No imports yet"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Categories</h3>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Object.keys(stats.categoryBreakdown).length}
          </p>
          <p className="text-sm text-gray-500 mt-2">Recipe categories</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recipe Categories
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 capitalize">{category}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/recipes/import"
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Import className="h-5 w-5 mr-2" />
            Import New Recipes
          </Link>
          <Link
            href="/admin/recipes"
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChefHat className="h-5 w-5 mr-2" />
            Manage Recipes
          </Link>
          <Link
            href="/admin/recipes/history"
            className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <History className="h-5 w-5 mr-2" />
            View Import History
          </Link>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Admin Tools
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/admin/setup-verification"
            className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Setup Verification
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Check Firebase connection and configuration status
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="/api/test-firebase"
            className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Database className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Firebase Test API</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Raw Firebase connection test endpoint
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
