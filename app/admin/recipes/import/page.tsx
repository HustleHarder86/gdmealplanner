"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Import,
  Loader2,
  CheckCircle,
  XCircle,
  Check,
  RefreshCw,
  Cloud,
} from "lucide-react";
import RecipePreviewModal from "@/components/admin/RecipePreviewModal";
import { SpoonacularRecipe } from "@/src/types/spoonacular";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";

interface SearchFilters {
  query: string;
  maxCarbs: number;
  mealType: string;
  maxReadyTime: number;
  diet: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  recipesImported?: number;
  errors?: string[];
}

export default function RecipeImportPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    maxCarbs: 45,
    mealType: "all",
    maxReadyTime: 60,
    diet: "none",
  });

  const [searchResults, setSearchResults] = useState<SpoonacularRecipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    recipeCount?: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<SpoonacularRecipe | null>(
    null,
  );
  const [existingRecipeIds, setExistingRecipeIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingExisting, setLoadingExisting] = useState(true);

  const mealTypes = [
    { value: "all", label: "All Types" },
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  const dietTypes = [
    { value: "none", label: "No Restriction" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten free", label: "Gluten Free" },
    { value: "dairy free", label: "Dairy Free" },
  ];

  // Load existing recipe IDs on mount
  useEffect(() => {
    async function loadExistingRecipes() {
      try {
        const recipesSnapshot = await getDocs(collection(db, "recipes"));
        const ids = new Set<string>();
        recipesSnapshot.docs.forEach((doc) => {
          // Store both the full ID and just the numeric part for Spoonacular recipes
          ids.add(doc.id);
          if (doc.id.startsWith("spoonacular-")) {
            ids.add(doc.id.replace("spoonacular-", ""));
          }
        });
        setExistingRecipeIds(ids);
      } catch (error) {
        console.error("Error loading existing recipes:", error);
      } finally {
        setLoadingExisting(false);
      }
    }
    loadExistingRecipes();
  }, []);

  async function searchRecipes() {
    setLoading(true);
    setImportResult(null);

    try {
      const params = new URLSearchParams({
        query: filters.query,
        maxCarbs: filters.maxCarbs.toString(),
        maxReadyTime: filters.maxReadyTime.toString(),
        number: "20",
      });

      if (filters.mealType !== "all") {
        params.append("type", filters.mealType);
      }

      if (filters.diet !== "none") {
        params.append("diet", filters.diet);
      }

      const response = await fetch(
        `/api/admin/recipes/search-spoonacular?${params}`,
      );

      if (!response.ok) {
        throw new Error("Failed to search recipes");
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setSelectedRecipes(new Set());
    } catch (error) {
      console.error("Search error:", error);
      setImportResult({
        success: false,
        message: "Failed to search recipes. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function importSelected() {
    if (selectedRecipes.size === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const recipeIds = Array.from(selectedRecipes);

      const response = await fetch("/api/admin/recipes/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.imported} recipes!`,
          recipesImported: result.imported,
        });

        // Clear selection after successful import
        setSelectedRecipes(new Set());
        
        // Refresh existing recipe IDs to mark newly imported ones
        const recipesSnapshot = await getDocs(collection(db, "recipes"));
        const ids = new Set<string>();
        recipesSnapshot.docs.forEach((doc) => {
          ids.add(doc.id);
          if (doc.id.startsWith("spoonacular-")) {
            ids.add(doc.id.replace("spoonacular-", ""));
          }
        });
        setExistingRecipeIds(ids);
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
          errors: result.errors,
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: "Failed to import recipes. Please try again.",
      });
    } finally {
      setImporting(false);
    }
  }


  function toggleRecipeSelection(recipeId: number) {
    // Don't allow selection of recipes already in the library
    if (existingRecipeIds.has(recipeId.toString())) {
      return;
    }
    
    const newSelection = new Set(selectedRecipes);
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId);
    } else {
      newSelection.add(recipeId);
    }
    setSelectedRecipes(newSelection);
  }

  function selectAll() {
    const newSelection = new Set<number>();
    searchResults.forEach((recipe) => {
      if (!existingRecipeIds.has(recipe.id.toString())) {
        newSelection.add(recipe.id);
      }
    });
    setSelectedRecipes(newSelection);
  }

  function deselectAll() {
    setSelectedRecipes(new Set());
  }

  async function syncOfflineData() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch("/api/admin/sync-offline-data", {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message,
          recipeCount: result.recipeCount,
        });
      } else {
        setSyncResult({
          success: false,
          message: result.error || "Sync failed",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncResult({
        success: false,
        message: "Failed to sync offline data. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Import Recipes from Spoonacular
      </h1>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Search Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              placeholder="e.g., chicken, salad, soup"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Carbs (g)
            </label>
            <input
              type="number"
              value={filters.maxCarbs}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxCarbs: parseInt(e.target.value) || 45,
                })
              }
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meal Type
            </label>
            <select
              value={filters.mealType}
              onChange={(e) =>
                setFilters({ ...filters, mealType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {mealTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Ready Time (min)
            </label>
            <input
              type="number"
              value={filters.maxReadyTime}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxReadyTime: parseInt(e.target.value) || 60,
                })
              }
              min="5"
              max="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diet
            </label>
            <select
              value={filters.diet}
              onChange={(e) => setFilters({ ...filters, diet: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {dietTypes.map((diet) => (
                <option key={diet.value} value={diet.value}>
                  {diet.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={searchRecipes}
            disabled={loading}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search Recipes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help text about duplicates */}
      {!loadingExisting && searchResults.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
          <p className="text-blue-800">
            <span className="font-medium">💡 Tip:</span> Recipes with a blue background and &quot;In Library&quot; label are already imported and cannot be selected again.
          </p>
        </div>
      )}

      {/* Import Result Alert */}
      {importResult && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            importResult.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <p className="font-medium">{importResult.message}</p>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {importResult.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
          {importResult.success && importResult.recipesImported && importResult.recipesImported > 0 && !syncResult && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-green-700">
                To make these recipes available offline, sync the data:
              </p>
              <button
                onClick={syncOfflineData}
                disabled={syncing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 mr-2" />
                    Sync Offline Data
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sync Result Alert */}
      {syncResult && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            syncResult.success
              ? "bg-blue-50 text-blue-800 border border-blue-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center">
            {syncResult.success ? (
              <RefreshCw className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <p className="font-medium">{syncResult.message}</p>
          </div>
          {syncResult.success && syncResult.recipeCount && (
            <p className="mt-2 text-sm">
              Total recipes now available offline: <strong>{syncResult.recipeCount}</strong>
            </p>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Search Results ({searchResults.length})
                </h2>
                {!loadingExisting && (
                  <p className="text-sm text-gray-600 mt-1">
                    {searchResults.filter(r => existingRecipeIds.has(r.id.toString())).length} already in library
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={selectAll}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  Deselect All
                </button>
                <button
                  onClick={importSelected}
                  disabled={selectedRecipes.size === 0 || importing}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Import className="h-4 w-4 mr-2" />
                      Import Selected ({selectedRecipes.size})
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((recipe) => {
                const isInLibrary = existingRecipeIds.has(recipe.id.toString());
                return (
                  <div
                    key={recipe.id}
                    className={`border rounded-lg p-4 transition-all ${
                      isInLibrary
                        ? "border-blue-300 bg-blue-50 opacity-75"
                        : selectedRecipes.has(recipe.id)
                        ? "border-green-500 bg-green-50 cursor-pointer"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                    onClick={() => !isInLibrary && toggleRecipeSelection(recipe.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 flex-1 pr-2">
                        {recipe.title}
                      </h3>
                      {isInLibrary ? (
                        <div className="flex items-center text-blue-600">
                          <Check className="h-4 w-4 mr-1" />
                          <span className="text-xs font-medium">In Library</span>
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selectedRecipes.has(recipe.id)}
                          onChange={() => {}}
                          className="mt-1 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                        />
                      )}
                    </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Ready in: {recipe.readyInMinutes} minutes</p>
                    <p>Servings: {recipe.servings}</p>
                    {recipe.nutrition?.nutrients && (
                      <p>
                        Carbs:{" "}
                        {recipe.nutrition.nutrients.find(
                          (n) => n.name === "Carbohydrates",
                        )?.amount || "N/A"}
                        g
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewRecipe(recipe);
                    }}
                    className="mt-3 text-sm text-green-600 hover:text-green-700"
                  >
                    Preview Details
                  </button>
                </div>
              );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && searchResults.length === 0 && filters.query && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">
            No recipes found matching your criteria. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Recipe Preview Modal */}
      {previewRecipe && (
        <RecipePreviewModal
          recipe={previewRecipe}
          onClose={() => setPreviewRecipe(null)}
          onImport={async () => {
            await importSelected();
            setPreviewRecipe(null);
          }}
        />
      )}
    </div>
  );
}
