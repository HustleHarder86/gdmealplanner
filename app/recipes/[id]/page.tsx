"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { Recipe } from "@/src/types/recipe";

export default function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/recipes/${params.id}`);
        
        if (response.status === 404) {
          notFound();
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load recipe: ${response.status}`);
        }
        
        const data = await response.json();
        setRecipe(data.recipe || null);
        setError(null);
      } catch (err) {
        console.error('Error loading recipe:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Recipe not found</p>
            <p className="text-sm">{error || 'The requested recipe could not be found.'}</p>
          </div>
          <Link 
            href="/recipes"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  const carbChoices = Math.round(recipe.nutrition.carbohydrates / 15);

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              href="/recipes"
              className="text-primary-600 hover:text-primary-800"
            >
              Recipes
            </Link>
          </li>
          <li className="text-neutral-400">/</li>
          <li className="text-neutral-600">{recipe.title}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
          <p className="text-neutral-600 mb-6">{recipe.description}</p>

          {/* Recipe Meta */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">⏱️</span>
              <span className="text-sm">
                Prep: {recipe.prepTime}min | Cook: {recipe.cookTime}min
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">🍽️</span>
              <span className="text-sm">Serves {recipe.servings}</span>
            </div>
            <Badge variant="primary">{recipe.category}</Badge>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {recipe.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" size="sm">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Recipe Image */}
          <div className="aspect-video bg-neutral-100 rounded-lg mb-8 flex items-center justify-center overflow-hidden">
            {recipe.imageUrl ? (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl">🍽️</span>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="pt-1">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Nutrition Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold mb-4">Nutrition per Serving</h3>
            {recipe.category === "snack" &&
              recipe.nutrition.carbohydrates >= 14 &&
              recipe.nutrition.carbohydrates <= 16 &&
              recipe.nutrition.protein >= 5 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Suitable for bedtime snack
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    15g carbs + adequate protein
                  </p>
                </div>
              )}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Calories</span>
                <span className="font-medium">{recipe.nutrition.calories}</span>
              </div>
              <div className="flex justify-between">
                <span>Carbohydrates</span>
                <span className="font-medium">{recipe.nutrition.carbohydrates}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carb Choices</span>
                <span className="font-medium">{carbChoices} choices</span>
              </div>
              <div className="flex justify-between">
                <span>Fiber</span>
                <span className="font-medium">{recipe.nutrition.fiber}g</span>
              </div>
              <div className="flex justify-between">
                <span>Sugar</span>
                <span className="font-medium">{recipe.nutrition.sugar}g</span>
              </div>
              <div className="flex justify-between">
                <span>Protein</span>
                <span className="font-medium">{recipe.nutrition.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat</span>
                <span className="font-medium">{recipe.nutrition.fat}g</span>
              </div>
              <div className="flex justify-between">
                <span>Sodium</span>
                <span className="font-medium">{recipe.nutrition.sodium}mg</span>
              </div>
            </div>
          </div>

          {/* Ingredients Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5">•</span>
                  <span>
                    {ingredient.amount && (
                      <span className="font-medium">{ingredient.amount}</span>
                    )}
                    {ingredient.unit && (
                      <span className="font-medium"> {ingredient.unit}</span>
                    )}
                    {(ingredient.amount || ingredient.unit) && " "}
                    {ingredient.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Source Attribution */}
      <div className="mt-8 pt-8 border-t border-neutral-200">
        <p className="text-sm text-neutral-600">
          Recipe from{" "}
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800"
          >
            {recipe.source}
          </a>
        </p>
      </div>
    </div>
  );
}