"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { MealPlanAlgorithm } from "@/src/lib/meal-planning/meal-plan-algorithm";
import { ShoppingListGenerator } from "@/src/services/meal-plan/shopping-list-generator";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { 
  MealPlan, 
  MealPlanPreferences, 
  MealPlanGenerationOptions,
  ShoppingList 
} from "@/src/types/meal-plan";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function MealPlannerV2Page() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'shopping-list'>('meal-plan');
  const [expandedDays, setExpandedDays] = useState<number[]>([0]); // Only first day expanded by default
  const [preferences, setPreferences] = useState<MealPlanPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      
      // Initialize LocalRecipeService if needed
      const allRecipes = LocalRecipeService.getAllRecipes();
      console.log(`[MEAL_PLANNER] Found ${allRecipes.length} recipes available`);
      
      // Set default preferences
      const defaultPrefs: MealPlanPreferences = {
        dietaryRestrictions: [],
        allergies: [],
        dislikedIngredients: [],
        preferredCookTime: 'any',
        mealPrepFriendly: false,
        familySize: 1,
        carbDistribution: {
          breakfast: 30,        // 25-35g
          lunch: 45,           // 40-50g
          dinner: 45,          // 40-50g
          morningSnack: 20,    // 15-30g
          afternoonSnack: 20,  // 15-30g
          eveningSnack: 15     // 14-16g with protein
        },
        skipMorningSnack: false,
        skipAfternoonSnack: false,
        requireEveningSnack: true
      };
      
      setPreferences(defaultPrefs);
      
    } catch (err) {
      console.error('[MEAL_PLANNER] Initialization error:', err);
      setError('Failed to initialize meal planner');
    } finally {
      setLoading(false);
    }
  };

  const generateMealPlan = async () => {
    if (!preferences) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      // Generation options
      const options: MealPlanGenerationOptions = {
        startDate: getNextMondayISOString(),
        daysToGenerate: 7,
        prioritizeNew: true,
        avoidRecentMeals: true,
        maxRecipeRepeats: 2
      };
      
      console.log('[MEAL_PLANNER] Generating meal plan...');
      const plan = await MealPlanAlgorithm.generateMealPlan(preferences, options);
      
      // Add user ID
      plan.userId = user?.uid || 'demo-user';
      
      setMealPlan(plan);
      
      // Generate shopping list
      const shopping = ShoppingListGenerator.generateFromMealPlan(plan);
      setShoppingList(shopping);
      
      console.log('[MEAL_PLANNER] Meal plan generated successfully');
      
    } catch (err) {
      console.error('[MEAL_PLANNER] Generation error:', err);
      setError('Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const updateWithNewRecipes = async () => {
    if (!mealPlan) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      console.log('[MEAL_PLANNER] Updating meal plan with new recipes...');
      const updatedPlan = await MealPlanAlgorithm.updateMealPlanWithNewRecipes(
        mealPlan, 
        { 
          replacePercentage: 30,
          prioritizeNewRecipes: true 
        }
      );
      
      setMealPlan(updatedPlan);
      
      // Update shopping list
      const shopping = ShoppingListGenerator.generateFromMealPlan(updatedPlan);
      setShoppingList(shopping);
      
      console.log('[MEAL_PLANNER] Meal plan updated with new recipes');
      
    } catch (err) {
      console.error('[MEAL_PLANNER] Update error:', err);
      setError('Failed to update meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const exportShoppingListText = () => {
    if (!shoppingList) return;
    
    const text = ShoppingListGenerator.exportToText(shoppingList);
    
    // Create download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const swapMeal = async (dayIndex: number, mealType: string) => {
    if (!mealPlan) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      // Find a different recipe for this meal slot
      const currentDayMeals = mealPlan.days[dayIndex].meals;
      const currentMeal = (currentDayMeals as any)[mealType];
      const categoryFilter = getMealCategoryFilter(mealType);
      const carbDistribution = preferences?.carbDistribution as any;
      const targetCarbs = carbDistribution?.[mealType] || 30;
      
      // Get suitable recipes excluding the current one
      const allRecipes = LocalRecipeService.getAllRecipes();
      const suitableRecipes = allRecipes.filter(recipe => {
        if (recipe.id === currentMeal.recipeId) return false;
        if (categoryFilter && recipe.category !== categoryFilter) return false;
        
        const carbDiff = Math.abs(recipe.nutrition.carbohydrates - targetCarbs);
        return carbDiff <= targetCarbs * 0.4; // 40% tolerance
      });
      
      if (suitableRecipes.length === 0) {
        setError('No suitable alternative recipes found for this meal slot');
        return;
      }
      
      // Pick a random suitable recipe
      const newRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
      
      // Update the meal plan
      const updatedPlan = { ...mealPlan };
      (updatedPlan.days[dayIndex].meals as any)[mealType] = {
        recipeId: newRecipe.id,
        recipeName: newRecipe.title,
        servings: 1,
        nutrition: {
          calories: newRecipe.nutrition.calories,
          carbohydrates: newRecipe.nutrition.carbohydrates,
          protein: newRecipe.nutrition.protein,
          fat: newRecipe.nutrition.fat,
          fiber: newRecipe.nutrition.fiber
        },
        cookTime: newRecipe.totalTime,
        category: newRecipe.category as 'breakfast' | 'lunch' | 'dinner' | 'snack'
      };
      
      // Recalculate day nutrition
      const dayMeals = Object.values(updatedPlan.days[dayIndex].meals);
      updatedPlan.days[dayIndex].totalNutrition = {
        calories: dayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0),
        carbohydrates: dayMeals.reduce((sum, meal) => sum + meal.nutrition.carbohydrates, 0),
        protein: dayMeals.reduce((sum, meal) => sum + meal.nutrition.protein, 0),
        fat: dayMeals.reduce((sum, meal) => sum + meal.nutrition.fat, 0),
        fiber: dayMeals.reduce((sum, meal) => sum + meal.nutrition.fiber, 0),
        mealsCount: dayMeals.filter(meal => !['morningSnack', 'afternoonSnack', 'eveningSnack'].includes(meal.category)).length,
        snacksCount: dayMeals.filter(meal => ['morningSnack', 'afternoonSnack', 'eveningSnack'].includes(meal.category)).length
      };
      
      updatedPlan.version += 1;
      updatedPlan.updatedAt = new Date().toISOString();
      
      setMealPlan(updatedPlan);
      
      // Update shopping list
      const shopping = ShoppingListGenerator.generateFromMealPlan(updatedPlan);
      setShoppingList(shopping);
      
    } catch (err) {
      console.error('[MEAL_PLANNER] Swap error:', err);
      setError('Failed to swap meal. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getMealCategoryFilter = (mealType: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | null => {
    if (mealType === 'breakfast') return 'breakfast';
    if (mealType === 'lunch') return 'lunch';
    if (mealType === 'dinner') return 'dinner';
    if (mealType.includes('snack') || mealType.includes('Snack')) return 'snack';
    return null;
  };

  const getNextMondayISOString = (): string => {
    const today = new Date();
    const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Initializing meal planner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          GD Meal Planner v2
        </h1>
        <p className="text-gray-600">
          AI-powered meal planning with {LocalRecipeService.getAllRecipes().length} GD-friendly recipes
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Recipe Stats */}
      <Card className="mb-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Recipe Library Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(LocalRecipeService.getStats().byCategory).map(([category, count]) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-green-600">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate Section */}
      {!mealPlan ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Generate Your Meal Plan</h2>
          <p className="text-gray-600 mb-6">
            Create a personalized 7-day meal plan using our GD-friendly recipe library
          </p>
          <Button
            onClick={generateMealPlan}
            disabled={generating}
            variant="primary"
            size="lg"
          >
            {generating ? 'Generating...' : 'Generate Meal Plan'}
          </Button>
        </Card>
      ) : (
        <>
          {/* Sticky Tab Navigation */}
          <div className="sticky top-0 z-10 bg-white border-b mb-6 -mx-4 px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('meal-plan')}
                className={`py-3 px-6 font-medium border-b-2 transition-colors ${
                  activeTab === 'meal-plan' 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Meal Plan
              </button>
              <button
                onClick={() => setActiveTab('shopping-list')}
                className={`py-3 px-6 font-medium border-b-2 transition-colors ${
                  activeTab === 'shopping-list' 
                    ? 'border-green-600 text-green-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🛒 Shopping List {shoppingList && `(${shoppingList.totalItems} items)`}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'meal-plan' ? (
            /* Meal Plan Tab */
            <div>
              {/* Plan Header */}
              <Card className="mb-4 p-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{mealPlan.name}</h2>
                    <p className="text-gray-600">
                      Week of {new Date(mealPlan.weekStartDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setExpandedDays(expandedDays.length === 7 ? [] : [0,1,2,3,4,5,6])}
                      variant="outline"
                      size="sm"
                    >
                      {expandedDays.length === 7 ? '➖ Collapse All' : '➕ Expand All'}
                    </Button>
                    <Button
                      onClick={updateWithNewRecipes}
                      disabled={generating}
                      variant="secondary"
                      size="sm"
                    >
                      {generating ? '🔄 Updating...' : '✨ Update Recipes'}
                    </Button>
                    <Button
                      onClick={generateMealPlan}
                      disabled={generating}
                      variant="outline"
                      size="sm"
                    >
                      {generating ? '🧠 Generating...' : '🎲 New Plan'}
                    </Button>
                    <Button
                      onClick={() => window.print()}
                      variant="outline"
                      size="sm"
                    >
                      🖨️ Print
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* Days - Collapsible */}
              <div className="space-y-3">
                {mealPlan.days.map((day, index) => {
                  const isExpanded = expandedDays.includes(index);
                  const dayDate = new Date(day.date);
                  const isToday = new Date().toDateString() === dayDate.toDateString();
                  
                  return (
                    <Card key={day.date} className={`overflow-hidden ${isToday ? 'ring-2 ring-green-500' : ''}`}>
                      {/* Day Header - Always Visible */}
                      <div 
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setExpandedDays(isExpanded 
                            ? expandedDays.filter(d => d !== index)
                            : [...expandedDays, index]
                          );
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                {isToday && <span className="ml-2 text-green-600 text-sm">(Today)</span>}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {day.totalNutrition.carbohydrates}g carbs • {day.totalNutrition.calories} cal • {day.totalNutrition.protein}g protein
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {Object.values(day.meals).filter(m => m.recipeId).length} meals planned
                          </div>
                        </div>
                      </div>
                      
                      {/* Day Content - Collapsible */}
                      {isExpanded && (
                        <div className="p-4">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(day.meals).map(([mealType, meal]) => {
                              const recipe = meal.recipeId ? LocalRecipeService.getRecipeById(meal.recipeId) : null;
                              
                              return (
                                <div key={mealType} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                                  <div className="font-medium text-sm text-gray-600 mb-2 capitalize">
                                    {mealType.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  {meal.recipeId && recipe ? (
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
                                        <div className="font-medium text-sm leading-tight mb-1 line-clamp-2" title={meal.recipeName}>{meal.recipeName}</div>
                                        <div className="text-xs text-gray-600 mb-2">
                                          {meal.nutrition.carbohydrates}g carbs • {meal.cookTime}min
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => window.open(`/recipes/${recipe.id}`, '_blank')}
                                            className="flex-1 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 transition-colors"
                                          >
                                            View
                                          </button>
                                          <button
                                            onClick={() => swapMeal(index, mealType)}
                                            disabled={generating}
                                            className="bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            title="Swap"
                                          >
                                            🔄
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 italic text-center py-6 text-sm">No meal</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Shopping List Tab */
            <Card>
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Shopping List</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const checked = document.querySelectorAll('input[type="checkbox"]:checked').length;
                        const total = document.querySelectorAll('input[type="checkbox"]').length;
                        alert(`Shopping Progress: ${checked}/${total} items checked off (${Math.round(checked/total*100)}%)`);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      📊 Progress
                    </Button>
                    <Button
                      onClick={exportShoppingListText}
                      variant="outline"
                      size="sm"
                    >
                      📄 Download
                    </Button>
                  </div>
                </div>
                <p className="text-gray-600 mt-1">
                  {shoppingList?.totalItems} items for week of {shoppingList && new Date(shoppingList.weekStartDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-6">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                  <button
                    onClick={() => {
                      document.querySelectorAll('input[type="checkbox"]').forEach((cb: any) => {
                        cb.checked = true;
                        const itemText = cb.nextElementSibling as HTMLElement;
                        itemText.classList.add('line-through', 'text-gray-400');
                      });
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    ✅ Check All
                  </button>
                  <button
                    onClick={() => {
                      document.querySelectorAll('input[type="checkbox"]').forEach((cb: any) => {
                        cb.checked = false;
                        const itemText = cb.nextElementSibling as HTMLElement;
                        itemText.classList.remove('line-through', 'text-gray-400');
                      });
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    🔄 Uncheck All
                  </button>
                  <button
                    onClick={() => {
                      const checkedItems = document.querySelectorAll('input[type="checkbox"]:checked');
                      checkedItems.forEach((cb: any) => {
                        cb.closest('label').style.display = 'none';
                      });
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
                  >
                    🗑️ Hide Checked
                  </button>
                </div>
                
                {/* Shopping List Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shoppingList?.categories.map(category => (
                    <div key={category.name} className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3 text-base sticky top-0 bg-white py-1">{category.name}</h4>
                      <div className="space-y-2">
                        {category.items.map((item, index) => (
                          <label 
                            key={index} 
                            className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              onChange={(e) => {
                                const itemText = e.target.nextElementSibling as HTMLElement;
                                if (e.target.checked) {
                                  itemText.classList.add('line-through', 'text-gray-400');
                                } else {
                                  itemText.classList.remove('line-through', 'text-gray-400');
                                }
                              }}
                            />
                            <span className="text-sm flex-1 transition-all">
                              <span className="font-medium">
                                {typeof item.amount === 'string' ? item.amount : `${item.amount} ${item.unit}`}
                              </span> {item.name}
                              {item.notes && <span className="text-gray-500 block text-xs">({item.notes})</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
      
      {/* Medical Guidelines - Outside tabs, always visible when meal plan exists */}
      {mealPlan && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Medical Note:</strong> This meal plan follows gestational diabetes guidelines with target daily intake of 175-200g carbohydrates distributed across 3 meals and 3 snacks. Evening snacks include protein for blood sugar stability. Always consult with your healthcare provider.
          </p>
        </div>
      )}
    </div>
  );
}