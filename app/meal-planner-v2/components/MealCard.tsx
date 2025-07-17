"use client";

import { useState } from 'react';
import { MealSlot } from '@/src/types/meal-plan';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { Clock, Utensils, RefreshCw, Eye } from 'lucide-react';

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
        <MealCardImage 
          imageUrl={recipe.imageUrl || recipe.localImageUrl || '/api/placeholder/200/150'}
          alt={recipe.title}
          isVegetarian={recipe.dietaryInfo?.isVegetarian}
          isGlutenFree={recipe.dietaryInfo?.isGlutenFree}
        />
        
        {/* Recipe Info */}
        <div>
          <div className="font-medium text-sm leading-tight mb-1 line-clamp-2" title={meal.recipeName}>
            {meal.recipeName}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <span className="font-medium">{meal.nutrition.carbohydrates}g carbs</span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meal.cookTime}min
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewRecipe(recipe.id)}
              className="flex-1 btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              onClick={onSwap}
              disabled={isSwapping}
              className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-3 disabled:opacity-50"
              title="Swap meal"
            >
              <RefreshCw className={`h-3 w-3 ${isSwapping ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSwapping ? '' : 'Swap'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for image with loading state
function MealCardImage({ 
  imageUrl, 
  alt, 
  isVegetarian, 
  isGlutenFree 
}: { 
  imageUrl: string; 
  alt: string; 
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative h-20 w-full rounded overflow-hidden bg-gray-100">
      {loading && (
        <div className="absolute inset-0 meal-card-image-loading" />
      )}
      <img
        src={error ? '/images/recipe-placeholder.svg' : imageUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {/* Dietary badges */}
      {(isVegetarian || isGlutenFree) && (
        <div className="absolute top-1 right-1 flex gap-1">
          {isVegetarian && (
            <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
              V
            </span>
          )}
          {isGlutenFree && (
            <span className="bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
              GF
            </span>
          )}
        </div>
      )}
    </div>
  );
}