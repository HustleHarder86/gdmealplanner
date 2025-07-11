"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui";
import RecipeCard from "@/components/RecipeCardWithFallback";
import { useRecipes } from "@/src/hooks/useRecipes";

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [selectedCarbs, setSelectedCarbs] = useState("all");

  // Get recipes from the provider
  const { recipes, loading, error } = useRecipes();

  const filteredRecipes = useMemo(() => {
    let filteredList = recipes;

    // Filter by category
    if (selectedCategory !== "all") {
      filteredList = filteredList.filter(
        (recipe) => recipe.category === selectedCategory,
      );
    }

    // Filter by search term
    if (searchTerm) {
      filteredList = filteredList.filter((recipe) => {
        const matchesSearch =
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (recipe.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ??
            false) ||
          recipe.ingredients.some((ing) =>
            ing.name.toLowerCase().includes(searchTerm.toLowerCase()),
          );
        return matchesSearch;
      });
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

    // Filter by carbs - updated to match medical guidelines
    if (selectedCarbs !== "all") {
      filteredList = filteredList.filter((recipe) => {
        const carbs = recipe.nutrition.carbohydrates;

        switch (selectedCarbs) {
          case "breakfast":
            return carbs >= 25 && carbs <= 35; // Medical guideline for breakfast
          case "main":
            return carbs >= 40 && carbs <= 50; // Medical guideline for lunch/dinner
          case "snack":
            return carbs >= 15 && carbs <= 30; // Medical guideline for snacks
          case "bedtime":
            return carbs >= 14 && carbs <= 16 && recipe.nutrition.protein >= 5; // Bedtime snack
          default:
            return true;
        }
      });
    }

    return filteredList;
  }, [recipes, searchTerm, selectedCategory, selectedTime, selectedCarbs]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading recipes...</p>
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
        <h1 className="text-3xl font-bold mb-2">GD-Friendly Recipes</h1>
        <p className="text-neutral-600">
          Browse our collection of {recipes.length} gestational
          diabetes-friendly recipes
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Offline Mode - No internet required</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search recipes..."
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
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-neutral-600">
          Showing {filteredRecipes.length} of {recipes.length} recipes
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
