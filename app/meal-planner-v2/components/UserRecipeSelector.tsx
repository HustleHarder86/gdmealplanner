"use client";

import { useState, useEffect } from 'react';
import { Recipe } from '@/src/types/recipe';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { X, Search, Check } from 'lucide-react';
import Button from '@/components/ui/Button';

interface UserRecipeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: string) => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  targetCarbs?: number;
  currentRecipeId?: string;
}

export default function UserRecipeSelector({
  isOpen,
  onClose,
  onSelectRecipe,
  mealType,
  targetCarbs = 30,
  currentRecipeId
}: UserRecipeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserRecipesOnly, setShowUserRecipesOnly] = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Get all recipes
      const allRecipes = LocalRecipeService.getAllRecipes();
      const userRecipes = allRecipes.filter(r => r.isUserCreated);
      console.log(`[UserRecipeSelector] Found ${allRecipes.length} total recipes, ${userRecipes.length} user recipes`);
      
      // Debug: Log first few user recipes
      if (userRecipes.length > 0) {
        console.log('[UserRecipeSelector] Sample user recipes:', userRecipes.slice(0, 3).map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          carbs: r.nutrition.carbohydrates,
          calories: r.nutrition.calories
        })));
      }
      
      // Filter by meal type and exclude current recipe
      const suitable = allRecipes.filter(recipe => {
        if (recipe.id === currentRecipeId) return false;
        
        // For system recipes, strict category matching
        if (!recipe.isUserCreated && recipe.category !== mealType) return false;
        
        // For user recipes, be more lenient - allow based on nutritional profile
        if (recipe.isUserCreated) {
          const calories = recipe.nutrition.calories;
          const carbs = recipe.nutrition.carbohydrates;
          
          // Basic nutritional bounds for each meal type
          if (mealType === 'breakfast') {
            // Allow wider range for user recipes
            if (calories < 150 || calories > 700) return false;
            if (carbs < 10 || carbs > 60) return false;
          } else if (mealType === 'lunch' || mealType === 'dinner') {
            // Allow wider range for user recipes
            if (calories < 250 || calories > 900) return false;
            if (carbs < 15 || carbs > 75) return false;
          } else if (mealType === 'snack') {
            // Stricter for snacks
            if (calories > 350) return false;
            if (carbs > 40) return false;
            
            // Check for inappropriate titles
            const title = recipe.title.toLowerCase();
            const mainDishWords = ['chili', 'soup', 'pasta', 'rice', 'casserole', 'roast', 'steak'];
            if (mainDishWords.some(word => title.includes(word))) return false;
          }
        } else {
          // For system recipes, also check snack filtering
          if (mealType === 'snack') {
            const calories = recipe.nutrition.calories;
            if (calories > 300) return false;
            
            const title = recipe.title.toLowerCase();
            const mainDishWords = ['chili', 'soup', 'pasta', 'rice', 'salad', 'bowl'];
            if (mainDishWords.some(word => title.includes(word))) return false;
          }
        }
        
        // Check carb range (with 50% tolerance for user recipes, 40% for system)
        const carbTolerance = targetCarbs * (recipe.isUserCreated ? 0.5 : 0.4);
        const recipeCarbs = recipe.nutrition.carbohydrates;
        if (recipeCarbs < targetCarbs - carbTolerance || 
            recipeCarbs > targetCarbs + carbTolerance) {
          return false;
        }
        
        return true;
      });
      
      console.log(`[UserRecipeSelector] ${suitable.length} recipes suitable for ${mealType} (target ${targetCarbs}g carbs)`);
      const suitableUserRecipes = suitable.filter(r => r.isUserCreated);
      console.log(`[UserRecipeSelector] Including ${suitableUserRecipes.length} user recipes`);
      
      // Debug: Show why user recipes might be filtered out
      if (userRecipes.length > 0 && suitableUserRecipes.length === 0) {
        console.log('[UserRecipeSelector] User recipes were filtered out. Checking reasons...');
        userRecipes.slice(0, 3).forEach(recipe => {
          const carbTolerance = targetCarbs * 0.5; // Updated tolerance
          const recipeCarbs = recipe.nutrition.carbohydrates;
          const carbReason = (recipeCarbs < targetCarbs - carbTolerance || recipeCarbs > targetCarbs + carbTolerance) 
            ? `Carbs out of range (${recipeCarbs}g vs target ${targetCarbs}±${carbTolerance}g)` 
            : 'Carbs OK';
          
          let calorieReason = 'Calories OK';
          const calories = recipe.nutrition.calories;
          if (mealType === 'breakfast' && (calories < 150 || calories > 700)) {
            calorieReason = `Breakfast calories out of range (${calories})`;
          } else if ((mealType === 'lunch' || mealType === 'dinner') && (calories < 250 || calories > 900)) {
            calorieReason = `Main meal calories out of range (${calories})`;
          } else if (mealType === 'snack' && calories > 350) {
            calorieReason = `Snack calories too high (${calories})`;
          }
          
          console.log(`[UserRecipeSelector] ${recipe.title}: ${carbReason}, ${calorieReason}`);
        });
      }
      
      setAvailableRecipes(suitable);
      setFilteredRecipes(suitable);
    }
  }, [isOpen, mealType, targetCarbs, currentRecipeId]);

  useEffect(() => {
    // Filter recipes based on search and user preference
    let filtered = availableRecipes;
    
    if (showUserRecipesOnly) {
      filtered = filtered.filter(r => r.isUserCreated);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(search))
      );
    }
    
    // Sort by best match (carbs closest to target)
    filtered.sort((a, b) => {
      const aDiff = Math.abs(a.nutrition.carbohydrates - targetCarbs);
      const bDiff = Math.abs(b.nutrition.carbohydrates - targetCarbs);
      return aDiff - bDiff;
    });
    
    setFilteredRecipes(filtered);
  }, [searchTerm, showUserRecipesOnly, availableRecipes, targetCarbs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Select {mealType === 'snack' ? 'Snack' : mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </h2>
            <p className="text-sm text-gray-600">
              Target: {targetCarbs}g carbs • {filteredRecipes.length} options available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUserRecipesOnly}
                onChange={(e) => setShowUserRecipesOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">My recipes only</span>
            </label>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Generate random selection
                if (filteredRecipes.length > 0) {
                  const randomIndex = Math.floor(Math.random() * Math.min(5, filteredRecipes.length));
                  onSelectRecipe(filteredRecipes[randomIndex].id);
                }
              }}
            >
              🎲 Random Pick
            </Button>
          </div>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {showUserRecipesOnly ? 
                "No saved recipes match this meal type" : 
                "No recipes found matching your criteria"}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => onSelectRecipe(recipe.id)}
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium flex items-center gap-2">
                        {recipe.title}
                        {recipe.isUserCreated && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            My Recipe
                          </span>
                        )}
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span className="font-medium text-primary-600">
                          {recipe.nutrition.carbohydrates}g carbs
                        </span>
                        <span>{recipe.nutrition.calories} cal</span>
                        <span>{recipe.nutrition.protein}g protein</span>
                        <span>{recipe.totalTime}min</span>
                      </div>
                      {recipe.dietaryInfo && (
                        <div className="flex gap-2 mt-2">
                          {recipe.dietaryInfo.isVegetarian && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Vegetarian
                            </span>
                          )}
                          {recipe.dietaryInfo.isGlutenFree && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Gluten-Free
                            </span>
                          )}
                          {recipe.dietaryInfo.isDairyFree && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                              Dairy-Free
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {recipe.imageUrl && (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}