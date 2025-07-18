"use client";

import { useState, useEffect } from "react";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { ShoppingListGenerator } from "@/src/services/meal-plan/shopping-list-generator";
import { ShoppingList } from "@/src/types/meal-plan";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Import working components
import MealPlanDisplay from "./components/MealPlanDisplay";
import ShoppingListView from "./components/ShoppingListView";
import TabNavigation from "./components/TabNavigation";
import DietaryPreferences from "./components/DietaryPreferences";
import WeeklyRotationHeader from "./components/WeeklyRotationHeader";
import { useMealPlan } from "./hooks/useMealPlan";
import { useLocalWeeklyRotation } from "./hooks/useLocalWeeklyRotation";

export default function MealPlannerV2Page() {
  // Smart Rotation system (working locally)
  const {
    currentWeekInfo,
    loading: rotationLoading,
    error: rotationError,
    showingNextWeek,
    switchTrack,
    previewNextWeek,
    returnToCurrentWeek,
    getCurrentMealPlan: getRotationMealPlan,
  } = useLocalWeeklyRotation('demo-user');

  // Fallback meal plan generation (original system)
  const { 
    mealPlan: fallbackMealPlan, 
    preferences,
    setPreferences,
    generating, 
    error: mealPlanError, 
    generateMealPlan, 
    updateWithNewRecipes, 
    swapMeal 
  } = useMealPlan('demo-user');
  
  const [loading, setLoading] = useState(true);
  const [recipeCount, setRecipeCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'shopping-list'>('meal-plan');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        
        // Wait a bit for RecipeProvider to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const allRecipes = LocalRecipeService.getAllRecipes();
        setRecipeCount(allRecipes.length);
        console.log(`[MEAL_PLANNER] Found ${allRecipes.length} recipes available`);
      } catch (err) {
        console.error('[MEAL_PLANNER] Initialization error:', err);
        setError('Failed to load recipe library');
      } finally {
        setLoading(false);
      }
    };
    
    initializePage();
  }, []);
  
  // Determine which meal plan to show (prioritize rotation)
  const displayMealPlan = getRotationMealPlan() || fallbackMealPlan;

  // Generate shopping list when meal plan changes
  useEffect(() => {
    if (displayMealPlan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(displayMealPlan);
      setShoppingList(shopping);
    }
  }, [displayMealPlan]);

  // Handle meal plan generation
  const handleGenerateMealPlan = async () => {
    setShowSuccess(false);
    const plan = await generateMealPlan();
    if (plan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(plan);
      setShoppingList(shopping);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  // Handle meal swap
  const handleSwapMeal = async (dayIndex: number, mealType: string) => {
    const updatedPlan = await swapMeal(dayIndex, mealType);
    if (updatedPlan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(updatedPlan);
      setShoppingList(shopping);
    }
  };

  // Handle meal updates
  const handleUpdateRecipes = async () => {
    const updatedPlan = await updateWithNewRecipes();
    if (updatedPlan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(updatedPlan);
      setShoppingList(shopping);
    }
  };

  // Handle track switching
  const handleTrackSwitch = async (track: any) => {
    await switchTrack(track);
    // Shopping list will update automatically via useEffect
  };

  // Handle next week preview
  const handlePreviewNext = async () => {
    if (showingNextWeek) {
      returnToCurrentWeek();
    } else {
      await previewNextWeek();
    }
    // Shopping list will update automatically via useEffect
  };

  // Export shopping list
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

  const primaryError = error || rotationError || mealPlanError;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Header - only show if no weekly rotation */}
      {!currentWeekInfo && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GD Meal Planner
          </h1>
          <p className="text-gray-600">
            AI-powered meal planning with{" "}
            <span className="font-semibold">
              {recipeCount} GD-friendly recipes
            </span>
          </p>
        </div>
      )}

      {/* Weekly Rotation Header */}
      <WeeklyRotationHeader
        currentWeekInfo={currentWeekInfo}
        loading={rotationLoading}
        onTrackSwitch={handleTrackSwitch}
        onPreviewNext={handlePreviewNext}
        showingNextWeek={showingNextWeek}
      />

      {primaryError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {primaryError}
        </div>
      )}

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 animate-fade-in">
          ✅ Meal plan generated successfully! Your personalized 7-day plan is ready.
        </div>
      )}

      {/* Dietary Preferences */}
      <DietaryPreferences />

      {/* Recipe Stats */}
      <Card className="mb-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Recipe Library Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(LocalRecipeService.getStats().byCategory).map(([category, count]) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-green-600">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{category}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Meal Plan Display - Show if we have any plan (rotation or generated) */}
      {displayMealPlan ? (
        <>
          {/* Tab Navigation */}
          <TabNavigation 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            shoppingItemCount={shoppingList?.totalItems}
          />

          {/* Tab Content */}
          {activeTab === 'meal-plan' ? (
            <MealPlanDisplay
              mealPlan={displayMealPlan}
              onSwapMeal={handleSwapMeal}
              onUpdateRecipes={handleUpdateRecipes}
              onGenerateNew={handleGenerateMealPlan}
              isGenerating={generating}
            />
          ) : (
            <ShoppingListView
              shoppingList={shoppingList}
              onExportText={exportShoppingListText}
            />
          )}
          
          {/* Show rotation status if using rotation plan */}
          {getRotationMealPlan() && (
            <Card className="mt-6 p-6 bg-green-50">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✨ Smart Rotation System Active
              </h3>
              <p className="text-green-800 text-sm mb-3">
                You&apos;re viewing a pre-curated weekly meal plan from our Smart Rotation system:
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-green-700">
                <div>✅ Instant weekly plans</div>
                <div>✅ Maximum recipe variety</div>
                <div>✅ Track switching available</div>
                <div>✅ Next week preview</div>
              </div>
              <p className="text-green-600 text-xs mt-3">
                No more clicking &quot;generate&quot; - your meal plan is ready instantly with smart variety!
              </p>
            </Card>
          )}
          
          {/* Show fallback status if using generated plan */}
          {!getRotationMealPlan() && fallbackMealPlan && (
            <Card className="mt-6 p-6 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🔄 Generated Meal Plan
              </h3>
              <p className="text-blue-800 text-sm">
                This meal plan was generated using the original system. The Smart Rotation system will load automatically on next visit.
              </p>
            </Card>
          )}
        </>
      ) : (
        /* Fallback Section - Show when rotation is loading or failed */
        <Card className="p-8 text-center">
          {rotationLoading ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <h2 className="text-xl font-semibold">Loading Smart Rotation System...</h2>
              <p className="text-gray-600">Preparing your instant weekly meal plan with maximum variety</p>
              <p className="text-sm text-gray-500">This creates 8 weeks of pre-curated meal plans</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Fallback: Generate Meal Plan</h2>
              <p className="text-gray-600 mb-6">
                Smart Rotation is temporarily unavailable. Generate a meal plan using our GD-friendly recipe library of {recipeCount} recipes
              </p>
              {generating ? (
                <div className="space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600">Creating your personalized meal plan...</p>
                  <p className="text-sm text-gray-500">This may take a few seconds</p>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateMealPlan}
                  disabled={generating}
                  variant="primary"
                  size="lg"
                  className="min-w-[200px]"
                >
                  Generate Meal Plan
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Medical Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Medical Note:</strong> This meal planning system follows gestational diabetes guidelines with target daily intake of 175-200g carbohydrates distributed across 3 meals and 3 snacks. Always consult with your healthcare provider.
        </p>
      </div>
    </div>
  );
}