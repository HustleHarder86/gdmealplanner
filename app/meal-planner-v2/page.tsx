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
import { useMealPlan } from "./hooks/useMealPlan";

export default function MealPlannerV2Page() {
  // Working meal plan generation (original system)
  const { 
    mealPlan, 
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
  
  // Generate shopping list when meal plan changes
  useEffect(() => {
    if (mealPlan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(mealPlan);
      setShoppingList(shopping);
    }
  }, [mealPlan]);

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

  const primaryError = error || mealPlanError;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Header */}
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

      {/* Meal Plan Display - Show if we have a generated plan */}
      {mealPlan ? (
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
              mealPlan={mealPlan}
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
          
          {/* Smart Rotation Status - Show below meal plan */}
          <Card className="mt-6 p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🔄 Smart Rotation System (Coming Soon)
            </h3>
            <p className="text-blue-800 text-sm mb-3">
              The next-generation meal planning system has been built and validated:
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
              <div>✅ Pre-curated weekly rotations</div>
              <div>✅ Recipe spacing algorithm</div>
              <div>✅ Multiple dietary tracks</div>
              <div>✅ 52+ weeks of variety</div>
            </div>
            <p className="text-blue-600 text-xs mt-3">
              Currently using the original meal plan generator. Smart Rotation will eliminate the "generate" button with instant weekly plans.
            </p>
          </Card>
        </>
      ) : (
        /* Generate Section - Show when no meal plan exists */
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Generate Your Meal Plan</h2>
          <p className="text-gray-600 mb-6">
            Create a personalized 7-day meal plan using our GD-friendly recipe library of {recipeCount} recipes
          </p>
          {generating ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Creating your personalized meal plan...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleGenerateMealPlan}
                disabled={generating}
                variant="primary"
                size="lg"
                className="min-w-[200px]"
              >
                Generate Meal Plan
              </Button>
              
              {/* Smart Rotation teaser */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Coming Soon:</strong> Smart Rotation system will show you an instant meal plan with pre-curated variety and track switching options!
                </p>
              </div>
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