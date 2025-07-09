"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/src/lib/firebase/client";
import { Recipe } from "@/src/types/recipe";
import Link from "next/link";
import Image from "next/image";

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    try {
      console.log("Attempting to load recipes from Firestore...");
      const recipesSnapshot = await getDocs(collection(db, "recipes"));
      console.log(
        "Firestore query completed, found:",
        recipesSnapshot.size,
        "recipes",
      );

      const recipesData = recipesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Recipe[];

      // Sort by title
      recipesData.sort((a, b) => a.title.localeCompare(b.title));

      setRecipes(recipesData);
      setError(null);
    } catch (error) {
      console.error("Error loading recipes:", error);
      if (error instanceof Error) {
        setError(`Failed to load recipes: ${error.message}`);
      } else {
        setError("Failed to load recipes. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecipe(recipeId: string) {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      await deleteDoc(doc(db, "recipes", recipeId));
      setRecipes(recipes.filter((r) => r.id !== recipeId));
    } catch (error) {
      console.error("Error deleting recipe:", error);
      alert("Failed to delete recipe");
    }
  }

  const filteredRecipes =
    selectedCategory === "all"
      ? recipes
      : recipes.filter((r) => r.category === selectedCategory);

  const categories = ["all", "breakfast", "lunch", "dinner", "snack"];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Recipe Library</h1>
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Recipe Library</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p className="text-sm mt-2">
            This usually means Firestore security rules need to be updated.
            Check the browser console for more details.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recipe Library</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/import-recipes"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Import More Recipes
          </Link>
          <Link
            href="/admin/export-recipes"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export Offline Data
          </Link>
        </div>
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
                  ({recipes.filter((r) => r.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="border rounded-lg p-6 bg-white shadow"
          >
            <div className="flex gap-6">
              {/* Recipe Image */}
              {recipe.imageUrl && (
                <div className="flex-shrink-0 relative w-48 h-32">
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Recipe Content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{recipe.title}</h2>
                    <p className="text-sm text-gray-600">
                      Category: {recipe.category} | Prep: {recipe.prepTime}min |
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
                    <p className="font-semibold">
                      {recipe.nutrition.carbohydrates}g
                    </p>
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
                      <li key={idx}>
                        {ing.name} - {ing.amount} {ing.unit}
                      </li>
                    ))}
                    {recipe.ingredients.length > 5 && (
                      <li className="text-gray-600">
                        ...and {recipe.ingredients.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>

                {recipe.importedAt && (
                  <div className="text-xs text-gray-500">
                    <p>
                      Imported:{" "}
                      {new Date(recipe.importedAt).toLocaleDateString()}
                    </p>
                    {recipe.gdValidation && (
                      <p>GD Score: {recipe.gdValidation.score}/100</p>
                    )}
                    <p>Source: {recipe.source}</p>
                  </div>
                )}
              </div>
            </div>
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
