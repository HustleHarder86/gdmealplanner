"use client";

import { useState, useEffect } from "react";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { ShoppingListGenerator } from "@/src/services/meal-plan/shopping-list-generator";
import { ShoppingList } from "@/src/types/meal-plan";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useRecipes } from "@/src/hooks/useRecipes";
import { useAuth } from "@/src/contexts/AuthContext";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserRecipeService } from "@/src/services/user-recipe-service";
import { UserRecipeInput } from "@/src/types/recipe";

// Import working components
import MealPlanDisplay from "./components/MealPlanDisplay";
import ShoppingListView from "./components/ShoppingListView";
import TabNavigation from "./components/TabNavigation";
import DietaryPreferences from "./components/DietaryPreferences";
import WeeklyRotationHeader from "./components/WeeklyRotationHeader";
import { useMealPlan } from "./hooks/useMealPlan";
import { useLocalWeeklyRotation } from "./hooks/useLocalWeeklyRotation";

export default function MealPlannerV2Page() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Recipe data from provider
  const { 
    recipes, 
    loading: recipesLoading, 
    error: recipesError, 
    initialized: recipesInitialized,
    stats,
    refreshUserRecipes
  } = useRecipes();

  // Smart Rotation system (working locally) - only start after recipes are loaded
  const {
    currentWeekInfo,
    loading: rotationLoading,
    error: rotationError,
    showingNextWeek,
    switchTrack,
    previewNextWeek,
    returnToCurrentWeek,
    getCurrentMealPlan: getRotationMealPlan,
  } = useLocalWeeklyRotation(recipesInitialized ? 'demo-user' : undefined);

  // Fallback meal plan generation (original system) - only start after recipes are loaded
  const { 
    mealPlan: fallbackMealPlan, 
    preferences,
    setPreferences,
    generating, 
    error: mealPlanError, 
    generateMealPlan, 
    updateWithNewRecipes, 
    swapMeal,
    swapWithSpecificRecipe,
    deleteMeal 
  } = useMealPlan(recipesInitialized ? 'demo-user' : undefined);
  
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'shopping-list'>('meal-plan');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Determine which meal plan to show (prioritize rotation)
  const displayMealPlan = getRotationMealPlan() || fallbackMealPlan;

  // Log recipe count when recipes are loaded
  useEffect(() => {
    if (recipesInitialized && recipes.length > 0) {
      console.log(`[MEAL_PLANNER] Found ${recipes.length} recipes available`);
    }
  }, [recipesInitialized, recipes.length]);
  
  // Auto-generate meal plan on initial load if none exists
  useEffect(() => {
    // Check if we have recipes and no meal plan yet
    if (recipesInitialized && recipes.length > 0 && !displayMealPlan && !generating && !rotationLoading) {
      console.log('[MEAL_PLANNER] Auto-generating initial meal plan...');
      // Use rotation system if available, otherwise use fallback
      if (!currentWeekInfo) {
        // Only generate fallback if rotation system isn't working
        handleGenerateMealPlan();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipesInitialized, recipes.length, displayMealPlan, generating, rotationLoading, currentWeekInfo]);

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
    
    // Ensure loading state is visible for at least 1 second for better UX
    const startTime = Date.now();
    const plan = await generateMealPlan();
    const elapsedTime = Date.now() - startTime;
    const minimumDelay = 1000; // 1 second minimum
    
    if (elapsedTime < minimumDelay) {
      await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsedTime));
    }
    
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

  // Handle meal delete
  const handleDeleteMeal = async (dayIndex: number, mealType: string) => {
    const updatedPlan = await deleteMeal(dayIndex, mealType);
    if (updatedPlan) {
      const shopping = ShoppingListGenerator.generateFromMealPlan(updatedPlan);
      setShoppingList(shopping);
    }
  };

  // Handle swap with specific recipe
  const handleSwapWithSpecificRecipe = async (dayIndex: number, mealType: string, recipeId: string) => {
    const updatedPlan = await swapWithSpecificRecipe(dayIndex, mealType, recipeId);
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

  // Navigate to add recipe page
  const handleAddRecipe = () => {
    if (user) {
      router.push('/my-recipes');
    } else {
      router.push('/auth/login');
    }
  };

  // Save system recipe to user's collection
  const handleSaveToMyRecipes = async (recipeId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      // Get the original recipe
      const originalRecipe = LocalRecipeService.getRecipeById(recipeId);
      if (!originalRecipe) {
        throw new Error('Recipe not found');
      }

      // Convert to user recipe input
      const userRecipeInput: UserRecipeInput = {
        title: `${originalRecipe.title} (My Copy)`,
        description: originalRecipe.description,
        category: originalRecipe.category,
        tags: [...originalRecipe.tags, 'copied-recipe'],
        prepTime: originalRecipe.prepTime,
        cookTime: originalRecipe.cookTime,
        servings: originalRecipe.servings,
        ingredients: originalRecipe.ingredients,
        instructions: originalRecipe.instructions,
        nutrition: originalRecipe.nutrition,
        dietaryInfo: originalRecipe.dietaryInfo,
        allergenInfo: originalRecipe.allergenInfo,
        imageUrl: originalRecipe.imageUrl,
        isPrivate: false,
      };

      // Create the user recipe
      await UserRecipeService.createRecipe(user.uid, userRecipeInput);
      
      // Refresh user recipes in the provider
      await refreshUserRecipes();
      
      // Show success message (you could add a toast here)
      console.log('Recipe saved to My Recipes successfully!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      // You could add error handling/toast here
    }
  };

  // Show loading state while recipes are loading
  if (recipesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading recipe library...</p>
            <p className="text-gray-500 text-sm mt-2">Loading 450+ GD-friendly recipes</p>
          </div>
        </div>
      </div>
    );
  }

  const primaryError = recipesError || rotationError || mealPlanError;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Header - only show if no weekly rotation */}
      {!currentWeekInfo && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                GD Meal Planner
              </h1>
              <p className="text-gray-600">
                AI-powered meal planning with{" "}
                <span className="font-semibold">
                  {recipes.length} GD-friendly recipes
                </span>
              </p>
            </div>
            <Button
              onClick={handleAddRecipe}
              variant="secondary"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          </div>
        </div>
      )}

      {/* Weekly Rotation Header */}
      <WeeklyRotationHeader
        currentWeekInfo={currentWeekInfo}
        loading={rotationLoading}
        onTrackSwitch={handleTrackSwitch}
        onPreviewNext={handlePreviewNext}
        showingNextWeek={showingNextWeek}
        onAddRecipe={handleAddRecipe}
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
          {Object.entries(stats.byCategory).map(([category, count]) => (
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
              onSwapWithSpecificRecipe={handleSwapWithSpecificRecipe}
              onDeleteMeal={handleDeleteMeal}
              onUpdateRecipes={handleUpdateRecipes}
              onGenerateNew={handleGenerateMealPlan}
              onSaveToMyRecipes={handleSaveToMyRecipes}
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
                Smart Rotation is temporarily unavailable. Generate a meal plan using our GD-friendly recipe library of {recipes.length} recipes
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