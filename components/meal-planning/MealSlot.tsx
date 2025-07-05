"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { Recipe } from "@/lib/mock-data";

interface MealSlotProps {
  mealType:
    | "breakfast"
    | "morning-snack"
    | "lunch"
    | "afternoon-snack"
    | "dinner"
    | "evening-snack";
  day: string;
  recipe?: Recipe;
  targetCarbs: { min: number; max: number };
  onAddRecipe?: () => void;
  onRemoveRecipe?: () => void;
  onSwapRecipe?: () => void;
}

export default function MealSlot({
  mealType,
  day,
  recipe,
  targetCarbs,
  onAddRecipe,
  onRemoveRecipe,
  onSwapRecipe,
}: MealSlotProps) {
  const [showDetails, setShowDetails] = useState(false);

  const mealTypeLabels = {
    breakfast: "Breakfast",
    "morning-snack": "Morning Snack",
    lunch: "Lunch",
    "afternoon-snack": "Afternoon Snack",
    dinner: "Dinner",
    "evening-snack": "Evening Snack",
  };

  const isSnack = mealType.includes("snack");
  const carbTarget = isSnack ? "15-20g" : "30-45g";

  if (!recipe) {
    return (
      <Card
        variant="bordered"
        padding="sm"
        className="h-full min-h-[120px] flex items-center justify-center"
      >
        <button
          onClick={onAddRecipe}
          className="text-center p-4 hover:bg-neutral-50 rounded-lg transition-colors w-full"
        >
          <div className="text-2xl mb-1">+</div>
          <div className="text-sm text-neutral-600">
            Add {mealTypeLabels[mealType]}
          </div>
          <div className="text-xs text-neutral-500">{carbTarget} carbs</div>
        </button>
      </Card>
    );
  }

  const isInRange =
    recipe.nutrition.carbs >= targetCarbs.min &&
    recipe.nutrition.carbs <= targetCarbs.max;

  return (
    <>
      <Card
        variant="bordered"
        padding="sm"
        className="h-full cursor-pointer hover:shadow-md transition-shadow group"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col h-full">
          {/* Recipe Image Placeholder */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-md mb-3 overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <span className="text-2xl">
                {mealType === "breakfast" && "🍳"}
                {mealType === "lunch" && "🥗"}
                {mealType === "dinner" && "🍽️"}
                {mealType.includes("snack") && "🥜"}
              </span>
            </div>
            {/* Hover Quick Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Favorite action placeholder
                }}
                className="p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm transition-colors"
                title="Add to favorites"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapRecipe?.();
                }}
                className="p-1.5 bg-white/90 rounded-full hover:bg-white shadow-sm transition-colors"
                title="Swap recipe"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Recipe Title */}
          <h4 className="font-medium text-sm line-clamp-2 mb-2">
            {recipe.title}
          </h4>

          {/* Visual Carb Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Carbs</span>
              <span
                className={`font-semibold ${isInRange ? "text-green-600" : "text-amber-600"}`}
              >
                {recipe.nutrition.carbs}g / {carbTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  isInRange ? "bg-green-500" : "bg-amber-500"
                }`}
                style={{
                  width: `${Math.min((recipe.nutrition.carbs / targetCarbs.max) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Quick Nutrition Info */}
          <div className="flex gap-2 mb-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>🔥</span>
              <span>{recipe.nutrition.calories}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>💪</span>
              <span>{recipe.nutrition.protein}g</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>🌾</span>
              <span>{recipe.nutrition.fiber}g</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSwapRecipe?.();
              }}
              className="flex-1 text-xs"
            >
              Swap
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveRecipe?.();
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      </Card>

      {/* Recipe Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={recipe.title}
        description={`${mealTypeLabels[mealType]} for ${day}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Nutrition Summary */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Calories</div>
              <div className="font-semibold">{recipe.nutrition.calories}</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Carbs</div>
              <div className="font-semibold">{recipe.nutrition.carbs}g</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Protein</div>
              <div className="font-semibold">{recipe.nutrition.protein}g</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Fiber</div>
              <div className="font-semibold">{recipe.nutrition.fiber}g</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onSwapRecipe}
            >
              Swap Recipe
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              View Full Recipe
            </Button>
          </div>

          {/* Ingredients Preview */}
          <div>
            <h5 className="font-medium mb-2">Ingredients:</h5>
            <ul className="text-sm text-neutral-600 space-y-1">
              {recipe.ingredients.slice(0, 5).map((ingredient, i) => (
                <li key={i}>• {ingredient}</li>
              ))}
              {recipe.ingredients.length > 5 && (
                <li className="text-neutral-500">
                  • and {recipe.ingredients.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
    </>
  );
}
