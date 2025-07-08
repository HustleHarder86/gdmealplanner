"use client";

import { X, Clock, Users, Flame, CheckCircle, AlertCircle } from "lucide-react";
import { SpoonacularRecipe } from "@/src/types/spoonacular";
import Image from "next/image";

interface RecipePreviewModalProps {
  recipe: SpoonacularRecipe;
  onClose: () => void;
  onImport: () => void;
}

export default function RecipePreviewModal({
  recipe,
  onClose,
  onImport,
}: RecipePreviewModalProps) {
  const nutrients = recipe.nutrition?.nutrients || [];
  const carbs = nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0;
  const protein = nutrients.find((n) => n.name === "Protein")?.amount || 0;
  const fat = nutrients.find((n) => n.name === "Fat")?.amount || 0;
  const fiber = nutrients.find((n) => n.name === "Fiber")?.amount || 0;
  const calories = nutrients.find((n) => n.name === "Calories")?.amount || 0;

  // Check GD compliance
  const isGDCompliant = carbs <= 45 && carbs >= 15;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Recipe Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            {/* Recipe Title and Image */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {recipe.title}
              </h3>
              {recipe.image && (
                <div className="relative h-64 w-full rounded-lg overflow-hidden mb-4">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Ready in</p>
                <p className="font-semibold">{recipe.readyInMinutes} min</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Servings</p>
                <p className="font-semibold">{recipe.servings}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Calories</p>
                <p className="font-semibold">{Math.round(calories)}</p>
              </div>
            </div>

            {/* GD Compliance Check */}
            <div
              className={`rounded-lg p-4 mb-6 ${
                isGDCompliant
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              }`}
            >
              <div className="flex items-center">
                {isGDCompliant ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">GD Compliant</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Review Required</span>
                  </>
                )}
              </div>
              <p className="text-sm mt-1">
                {carbs}g carbs per serving
                {!isGDCompliant && " (Recommended: 15-45g per meal)"}
              </p>
            </div>

            {/* Nutrition Information */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Nutrition per Serving
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Carbohydrates</p>
                  <p className="font-semibold">{carbs}g</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Protein</p>
                  <p className="font-semibold">{protein}g</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Fat</p>
                  <p className="font-semibold">{fat}g</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Fiber</p>
                  <p className="font-semibold">{fiber}g</p>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            {recipe.extendedIngredients &&
              recipe.extendedIngredients.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Ingredients
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {recipe.extendedIngredients.map((ingredient, index) => (
                      <li key={index}>{ingredient.original}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Diet Labels */}
            {(recipe.vegetarian ||
              recipe.vegan ||
              recipe.glutenFree ||
              recipe.dairyFree) && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Diet Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recipe.vegetarian && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Vegetarian
                    </span>
                  )}
                  {recipe.vegan && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Vegan
                    </span>
                  )}
                  {recipe.glutenFree && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Gluten Free
                    </span>
                  )}
                  {recipe.dairyFree && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      Dairy Free
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            {recipe.summary && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: recipe.summary.replace(/<[^>]*>/g, ""),
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Import Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
