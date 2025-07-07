"use client";

import { useState } from "react";
import { Recipe } from "@/src/types/recipe";

interface RecipeListProps {
  initialRecipes: Recipe[];
}

export default function RecipeList({ initialRecipes }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredRecipes = selectedCategory === "all" 
    ? recipes 
    : recipes.filter(r => r.category === selectedCategory);

  const categories = ["all", "breakfast", "lunch", "dinner", "snack"];
  
  // Count recipes per category
  const categoryCounts: Record<string, number> = {
    all: recipes.length,
    breakfast: recipes.filter(r => r.category === "breakfast").length,
    lunch: recipes.filter(r => r.category === "lunch").length,
    dinner: recipes.filter(r => r.category === "dinner").length,
    snack: recipes.filter(r => r.category === "snack").length,
  };

  async function deleteRecipe(recipeId: string) {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRecipes(recipes.filter(r => r.id !== recipeId));
      } else {
        alert("Failed to delete recipe");
      }
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    }
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded ${
                selectedCategory === cat
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
              <span className="ml-2">({categoryCounts[cat] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="border rounded-lg p-6 bg-white shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{recipe.title}</h2>
                <p className="text-sm text-gray-600">
                  Category: {recipe.category} | 
                  Prep: {recipe.prepTime}min | 
                  Cook: {recipe.cookTime}min
                </p>
              </div>
              <button
                onClick={() => deleteRecipe(recipe.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Carbs</p>
                <p className="font-semibold">{recipe.nutrition.carbohydrates}g</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Protein</p>
                <p className="font-semibold">{recipe.nutrition.protein}g</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Fiber</p>
                <p className="font-semibold">{recipe.nutrition.fiber}g</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm text-gray-600">Calories</p>
                <p className="font-semibold">{recipe.nutrition.calories}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Ingredients:</h3>
              <ul className="list-disc list-inside text-sm">
                {recipe.ingredients.slice(0, 5).map((ing, idx) => (
                  <li key={idx}>{ing.name} - {ing.amount} {ing.unit}</li>
                ))}
                {recipe.ingredients.length > 5 && (
                  <li className="text-gray-600">...and {recipe.ingredients.length - 5} more</li>
                )}
              </ul>
            </div>

            {recipe.importedAt && (
              <div className="text-xs text-gray-500">
                <p>Imported: {new Date(recipe.importedAt).toLocaleDateString()}</p>
                {recipe.gdValidation && (
                  <p>GD Score: {recipe.gdValidation.score}/100</p>
                )}
                <p>Source: {recipe.source}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <p className="text-center text-gray-600 mt-8">
          No recipes found in this category.
        </p>
      )}
    </>
  );
}