"use client";

import { useState, useEffect } from "react";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { Recipe } from "@/src/types/recipe";

export default function OfflineDemo() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);

  useEffect(() => {
    async function loadRecipes() {
      try {
        // In a real app, you would load this from the export API or a static file
        const response = await fetch("/api/recipes/export?format=json");
        if (response.ok) {
          const data = await response.json();
          await LocalRecipeService.initialize(data.recipes);

          // Save to local storage for offline use
          LocalRecipeService.saveToLocalStorage();

          // Get all recipes and stats
          const allRecipes = LocalRecipeService.getAllRecipes();
          setRecipes(allRecipes);
          setStats(LocalRecipeService.getStats());
        }
      } catch (error) {
        console.error("Error loading recipes:", error);
        // Try to load from local storage
        await LocalRecipeService.initialize();
        const allRecipes = LocalRecipeService.getAllRecipes();
        setRecipes(allRecipes);
        setStats(LocalRecipeService.getStats());
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = LocalRecipeService.searchRecipes(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  if (loading) {
    return <div className="p-8">Loading offline recipe data...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Offline Recipe Service Demo</h1>

      {stats && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Recipe Statistics</h2>
          <p>Total Recipes: {stats.total}</p>
          <p>With Local Images: {stats.withLocalImages}</p>
          <p>Quick Recipes (≤30 min): {stats.quickRecipes}</p>
          <p>Bedtime Snacks: {stats.bedtimeSnacks}</p>
          <div className="mt-2">
            <p className="font-semibold">By Category:</p>
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <p key={category} className="ml-4">
                {category}: {count as number}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Recipes</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by title, ingredient, or tag..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">
            Search Results ({searchResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((recipe) => (
              <div key={recipe.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold">{recipe.title}</h4>
                <p className="text-sm text-gray-600">
                  {recipe.category} | {recipe.nutrition.carbohydrates}g carbs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Quick Recipes (≤30 minutes)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LocalRecipeService.getQuickRecipes()
            .slice(0, 6)
            .map((recipe) => (
              <div key={recipe.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{recipe.title}</h3>
                <p className="text-sm text-gray-600">
                  {recipe.totalTime} min | {recipe.nutrition.carbohydrates}g
                  carbs
                </p>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Bedtime Snacks (14-16g carbs with protein)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LocalRecipeService.getBedtimeSnacks().map((recipe) => (
            <div key={recipe.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{recipe.title}</h3>
              <p className="text-sm text-gray-600">
                {recipe.nutrition.carbohydrates}g carbs |{" "}
                {recipe.nutrition.protein}g protein
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
