"use client";

import { MealSlot } from '@/src/types/meal-plan';
import { LocalRecipeService } from '@/src/services/local-recipe-service';

interface MealCardProps {
  mealType: string;
  meal: MealSlot;
  onSwap: () => void;
  onViewRecipe: (recipeId: string) => void;
  isSwapping?: boolean;
}

export default function MealCard({ 
  mealType, 
  meal, 
  onSwap, 
  onViewRecipe,
  isSwapping = false 
}: MealCardProps) {
  const recipe = meal.recipeId ? LocalRecipeService.getRecipeById(meal.recipeId) : null;
  
  if (!meal.recipeId || !recipe) {
    return (
      <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
        <div className="font-medium text-sm text-gray-600 mb-2 capitalize">
          {mealType.replace(/([A-Z])/g, ' $1').trim()}
        </div>
        <div className="text-gray-400 italic text-center py-6 text-sm">No meal</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="font-medium text-sm text-gray-600 mb-2 capitalize">
        {mealType.replace(/([A-Z])/g, ' $1').trim()}
      </div>
      <div className="space-y-2">
        {/* Recipe Image */}
        <div className="relative h-20 w-full rounded overflow-hidden bg-gray-100">
          <img
            src={recipe.imageUrl || recipe.localImageUrl || '/api/placeholder/200/150'}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/200/150';
            }}
          />
        </div>
        
        {/* Recipe Info */}
        <div>
          <div className="font-medium text-sm leading-tight mb-1 line-clamp-2" title={meal.recipeName}>
            {meal.recipeName}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {meal.nutrition.carbohydrates}g carbs • {meal.cookTime}min
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewRecipe(recipe.id)}
              className="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 transition-colors"
            >
              View
            </button>
            <button
              onClick={onSwap}
              disabled={isSwapping}
              className="bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              title="Swap"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}