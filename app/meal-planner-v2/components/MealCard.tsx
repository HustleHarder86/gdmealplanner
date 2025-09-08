"use client";

import { useState } from 'react';
import { MealSlot } from '@/src/types/meal-plan';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { Clock, Utensils, RefreshCw, Eye, BookmarkPlus, Trash2, ChefHat } from 'lucide-react';

interface MealCardProps {
  mealType: string;
  meal: MealSlot;
  onSwap: () => void;
  onSwapWithUserRecipe?: () => void;
  onDelete?: () => void;
  onViewRecipe: (recipeId: string) => void;
  onSaveToMyRecipes?: (recipeId: string) => void;
  isSwapping?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function MealCard({ 
  mealType, 
  meal, 
  onSwap, 
  onSwapWithUserRecipe,
  onDelete,
  onViewRecipe,
  onSaveToMyRecipes,
  isSwapping = false,
  isSaving = false,
  isDeleting = false 
}: MealCardProps) {
  const recipe = meal.recipeId ? LocalRecipeService.getRecipeById(meal.recipeId) : null;
  
  if (!meal.recipeId || !recipe) {
    return (
      <div className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50">
        <div className="font-medium text-sm text-gray-600 mb-2 capitalize">
          {mealType.replace(/([A-Z])/g, ' $1').trim()}
        </div>
        <div className="text-gray-400 italic text-center py-4 text-sm">No meal selected</div>
        <div className="flex justify-center">
          <button
            onClick={onSwap}
            className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-3"
          >
            <RefreshCw className="h-3 w-3" />
            Add Meal
          </button>
        </div>
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
          isUserCreated={recipe.isUserCreated}
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
          <div className="flex gap-1">
            <button
              onClick={() => onViewRecipe(recipe.id)}
              className="flex-1 btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5"
            >
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">View</span>
            </button>
            
            {/* Save to My Recipes - only show for system recipes */}
            {!recipe.isUserCreated && onSaveToMyRecipes && (
              <button
                onClick={() => onSaveToMyRecipes(recipe.id)}
                disabled={isSaving}
                className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-2 disabled:opacity-50"
                title="Save to My Recipes"
              >
                <BookmarkPlus className={`h-3 w-3 ${isSaving ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isSaving ? 'Saving' : 'Save'}</span>
              </button>
            )}
            
            <button
              onClick={onSwap}
              disabled={isSwapping}
              className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-2 disabled:opacity-50"
              title="Random swap"
            >
              <RefreshCw className={`h-3 w-3 ${isSwapping ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{isSwapping ? '' : 'Random'}</span>
            </button>
            
            {/* Choose from recipes button */}
            {onSwapWithUserRecipe && (
              <button
                onClick={onSwapWithUserRecipe}
                className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-2"
                title="Choose recipe"
              >
                <ChefHat className="h-3 w-3" />
                <span className="hidden lg:inline">Choose</span>
              </button>
            )}
            
            {/* Delete button */}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="btn-view rounded flex items-center justify-center gap-1 text-xs py-1.5 px-2 disabled:opacity-50 hover:bg-red-50 hover:text-red-600"
                title="Remove meal"
              >
                <Trash2 className={`h-3 w-3 ${isDeleting ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{isDeleting ? '' : 'Remove'}</span>
              </button>
            )}
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
  isGlutenFree,
  isUserCreated 
}: { 
  imageUrl: string; 
  alt: string; 
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isUserCreated?: boolean;
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
      {(isVegetarian || isGlutenFree || isUserCreated) && (
        <div className="absolute top-1 right-1 flex gap-1">
          {isUserCreated && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
              Mine
            </span>
          )}
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