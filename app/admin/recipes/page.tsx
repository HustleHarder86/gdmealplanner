"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { Recipe } from "@/src/types/recipe";
import Link from "next/link";

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      const recipesSnapshot = await getDocs(collection(db, "recipes"));
      const recipesData = recipesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Recipe[];
      
      // Sort by title
      recipesData.sort((a, b) => a.title.localeCompare(b.title));
      
      setRecipes(recipesData);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipe(recipeId: string) {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    
    try {
      await deleteDoc(doc(db, "recipes", recipeId));
      setRecipes(recipes.filter(r => r.id !== recipeId));
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    }
  }

  const filteredRecipes = selectedCategory === "all" 
    ? recipes 
    : recipes.filter(r => r.category === selectedCategory);

  const categories = ["all", "breakfast", "lunch", "dinner", "snack"];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Recipe Library</h1>
        <p>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recipe Library</h1>
        <Link
          href="/admin/import-recipes"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Import More Recipes
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-lg mb-4">Total Recipes: {recipes.length}</p>
        
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
              {cat !== "all" && (
                <span className="ml-2">
                  ({recipes.filter(r => r.category === cat).length})
                </span>
              )}
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
    </div>
  );
}