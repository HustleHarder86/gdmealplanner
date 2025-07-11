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
          {/* Meal Plan Display */}
          <Card className="mb-6">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{mealPlan.name}</h2>
                  <p className="text-gray-600">
                    Week of {new Date(mealPlan.weekStartDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Version {mealPlan.version}
                </div>
              </div>
            </div>
            
            {/* Days */}
            <div className="p-6">
              <div className="space-y-6">
                {mealPlan.days.map((day, index) => (
                  <div key={day.date} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(day.meals).map(([mealType, meal]) => (
                        <div key={mealType} className="border rounded p-3">
                          <div className="font-medium text-sm text-gray-600 mb-1 capitalize">
                            {mealType.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          {meal.recipeId ? (
                            <div>
                              <div className="font-medium">{meal.recipeName}</div>
                              <div className="text-sm text-gray-600">
                                {meal.nutrition.carbohydrates}g carbs • {meal.cookTime}min
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 italic">No meal</div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Daily totals */}
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">
                        <strong>Daily totals:</strong> {day.totalNutrition.calories} calories • {day.totalNutrition.carbohydrates}g carbs • {day.totalNutrition.protein}g protein • {day.totalNutrition.fiber}g fiber
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={() => setShowShoppingList(!showShoppingList)}
              variant="primary"
            >
              {showShoppingList ? 'Hide' : 'Show'} Shopping List
            </Button>
            <Button
              onClick={updateWithNewRecipes}
              disabled={generating}
              variant="secondary"
            >
              {generating ? 'Updating...' : 'Update with New Recipes'}
            </Button>
            <Button
              onClick={generateMealPlan}
              disabled={generating}
              variant="outline"
            >
              Generate New Plan
            </Button>
          </div>

          {/* Shopping List */}
          {showShoppingList && shoppingList && (
            <Card className="mb-6">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Shopping List</h3>
                  <Button
                    onClick={exportShoppingListText}
                    variant="outline"
                    size="sm"
                  >
                    Download as Text
                  </Button>
                </div>
                <p className="text-gray-600">
                  {shoppingList.totalItems} items for week of {new Date(shoppingList.weekStartDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shoppingList.categories.map(category => (
                    <div key={category.name}>
                      <h4 className="font-semibold text-gray-900 mb-3">{category.name}</h4>
                      <ul className="space-y-1">
                        {category.items.map((item, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{item.amount} {item.unit}</span> {item.name}
                            {item.notes && <span className="text-gray-500"> ({item.notes})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Medical Guidelines */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Medical Note:</strong> This meal plan follows gestational diabetes guidelines with target daily intake of 175-200g carbohydrates distributed across 3 meals and 3 snacks. Evening snacks include protein for blood sugar stability. Always consult with your healthcare provider.
            </p>
          </div>
        </>
      )}
    </div>
  );
}