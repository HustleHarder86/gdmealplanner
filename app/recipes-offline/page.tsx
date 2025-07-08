"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui";
import RecipeCard from "@/components/RecipeCardWithFallback";
import { Recipe } from "@/src/types/recipe";
import { LocalRecipeService } from "@/src/services/local-recipe-service";

export default function RecipesOfflinePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectedCarbs, setSelectedCarbs] = useState("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recipes using LocalRecipeService
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);

        // First try to load fresh data from the export API
        try {
          const response = await fetch("/api/recipes/export?format=json");
          if (response.ok) {
            const data = await response.json();
            await LocalRecipeService.initialize(data.recipes);
            LocalRecipeService.saveToLocalStorage();
          }
        } catch (fetchError) {
          console.log("Could not fetch fresh data, using local storage");
          // Initialize from local storage if API fails
          await LocalRecipeService.initialize();
        }

        const allRecipes = LocalRecipeService.getAllRecipes();
        setRecipes(allRecipes);
        setError(null);
      } catch (err) {
        console.error("Error loading recipes:", err);
        setError(err instanceof Error ? err.message : "Failed to load recipes");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    let filteredList = recipes;

    // Filter by category
    if (selectedCategory !== "all") {
      filteredList = filteredList.filter(
        (recipe) => recipe.category === selectedCategory,
      );
    }

    // Filter by search term - use LocalRecipeService search
    if (searchTerm) {
      filteredList = LocalRecipeService.searchRecipes(searchTerm);

      // Apply other filters to search results
      if (selectedCategory !== "all") {
        filteredList = filteredList.filter(
          (recipe) => recipe.category === selectedCategory,
        );
      }
    }

    // Filter by time
    if (selectedTime !== "all") {
      filteredList = filteredList.filter((recipe) => {
        switch (selectedTime) {
          case "quick":
            return recipe.totalTime <= 15;
          case "medium":
            return recipe.totalTime > 15 && recipe.totalTime <= 30;
          case "long":
            return recipe.totalTime > 30 && recipe.totalTime <= 60;
          default:
            return true;
        }
      });
    }

    // Filter by carbs - use LocalRecipeService methods where possible
    if (selectedCarbs !== "all") {
      if (selectedCarbs === "bedtime") {
        // Use specialized method for bedtime snacks
        const bedtimeSnacks = LocalRecipeService.getBedtimeSnacks();
        filteredList = filteredList.filter((recipe) =>
          bedtimeSnacks.some((snack) => snack.id === recipe.id),
        );
      } else {
        filteredList = filteredList.filter((recipe) => {
          const carbs = recipe.nutrition.carbohydrates;

          switch (selectedCarbs) {
            case "breakfast":
              return carbs >= 25 && carbs <= 35;
            case "main":
              return carbs >= 40 && carbs <= 50;
            case "snack":
              return carbs >= 15 && carbs <= 30;
            default:
              return true;
          }
        });
      }
    }

    return filteredList;
  }, [recipes, searchTerm, selectedCategory, selectedTime, selectedCarbs]);

  // Get statistics for display
  const stats = useMemo(() => {
    return LocalRecipeService.getStats();
  }, []);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading offline recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-lg font-semibold">Failed to load recipes</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          GD-Friendly Recipes (Offline Mode)
        </h1>
        <p className="text-neutral-600">
          Browse our collection of {recipes.length} gestational
          diabetes-friendly recipes - no internet required!
        </p>
        {stats && (
          <div className="mt-2 text-sm text-neutral-500">
            {stats.withLocalImages} recipes with local images •{" "}
            {stats.quickRecipes} quick recipes • {stats.bedtimeSnacks} bedtime
            snacks
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search recipes by title, ingredient, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snacks</option>
          </select>

          <select
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedCarbs}
            onChange={(e) => setSelectedCarbs(e.target.value)}
          >
            <option value="all">All Carb Ranges</option>
            <option value="breakfast">Breakfast (25-35g)</option>
            <option value="main">Lunch/Dinner (40-50g)</option>
            <option value="snack">Snacks (15-30g)</option>
            <option value="bedtime">Bedtime Snack (15g + protein)</option>
          </select>

          <select
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="all">Any Cook Time</option>
            <option value="quick">Under 15 min</option>
            <option value="medium">15-30 min</option>
            <option value="long">30-60 min</option>
          </select>

          <button
            onClick={() => {
              // Show quick recipes using LocalRecipeService
              setRecipes(LocalRecipeService.getQuickRecipes());
              setSelectedTime("quick");
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Quick Recipes
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-neutral-600">
          Showing {filteredRecipes.length} of {recipes.length} recipes
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* No results message */}
      {filteredRecipes.length === 0 && recipes.length > 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-600 text-lg">
            No recipes match your current filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
              setSelectedTime("all");
              setSelectedCarbs("all");
              setRecipes(LocalRecipeService.getAllRecipes());
            }}
            className="mt-4 px-4 py-2 text-primary-600 hover:text-primary-700"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
