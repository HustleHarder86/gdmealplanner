"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { mealPlanService } from "@/src/services/meal-plan/meal-plan-service";
import { mealPlanAlgorithm } from "@/src/services/meal-plan/meal-plan-algorithm";
import { ShoppingListGenerator } from "@/src/lib/meal-planning/shopping-list-generator";
import { WeeklyMealPlan, DayOfWeek, MealType } from "@/src/types/meal-plan";
import { ShoppingList } from "@/src/types/shopping-list";
import { MealPlanView } from "@/src/components/meal-planner/MealPlanView";
import { ShoppingListView } from "@/src/components/meal-planner/ShoppingListView";
import { GeneratePlanModal } from "@/src/components/meal-planner/GeneratePlanModal";
import { PrintableMealPlan } from "@/src/components/meal-planner/PrintableMealPlan";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function MealPlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<WeeklyMealPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    loadActivePlan();
  }, [user, router]);

  const loadActivePlan = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to get active plan for current week
      const plan = await mealPlanService.getActiveMealPlanForDate(user.uid, new Date());
      
      if (plan) {
        setActivePlan(plan);
        // Generate shopping list
        const list = ShoppingListGenerator.generateFromWeeklyPlan(plan, user.uid);
        setShoppingList(list);
      } else {
        // No active plan, show generate option
        setShowGenerateModal(true);
      }
    } catch (err) {
      console.error("Error loading meal plan:", err);
      setError("Failed to load meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async (startDate: Date) => {
    if (!user) return;
    
    try {
      setGenerating(true);
      setError(null);
      setShowGenerateModal(false);
      
      // Generate new plan
      const newPlan = await mealPlanAlgorithm.generateWeeklyPlan(user.uid, {
        startDate,
        userPreferencesId: user.uid,
        quickBreakfasts: true,
        mealPrepFriendly: true,
      });
      
      // Save to Firebase
      const planId = await mealPlanService.saveMealPlan(newPlan);
      
      // Set as active
      await mealPlanService.updateMealPlanStatus(planId, "active");
      
      // Reload the plan
      const savedPlan = await mealPlanService.getMealPlan(planId);
      if (savedPlan) {
        setActivePlan(savedPlan);
        const list = ShoppingListGenerator.generateFromWeeklyPlan(savedPlan, user.uid);
        setShoppingList(list);
      }
    } catch (err) {
      console.error("Error generating meal plan:", err);
      setError("Failed to generate meal plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapMeal = async (dayIndex: number, mealType: MealType) => {
    if (!activePlan) return;
    
    try {
      const updatedPlan = await mealPlanService.swapMeal({
        planId: activePlan.id!,
        dayIndex,
        mealType,
        maintainNutrition: true,
        excludeCurrentRecipe: true,
      });
      
      if (updatedPlan) {
        setActivePlan(updatedPlan);
        // Regenerate shopping list
        const list = ShoppingListGenerator.generateFromWeeklyPlan(updatedPlan, user!.uid);
        setShoppingList(list);
      }
    } catch (err) {
      console.error("Error swapping meal:", err);
      setError("Failed to swap meal. Please try again.");
    }
  };

  const handleRegenerateDay = async (dayIndex: number) => {
    if (!activePlan) return;
    
    try {
      const updatedPlan = await mealPlanService.regenerateDay(
        activePlan.id!,
        dayIndex
      );
      
      if (updatedPlan) {
        setActivePlan(updatedPlan);
        // Regenerate shopping list
        const list = ShoppingListGenerator.generateFromWeeklyPlan(updatedPlan, user!.uid);
        setShoppingList(list);
      }
    } catch (err) {
      console.error("Error regenerating day:", err);
      setError("Failed to regenerate day. Please try again.");
    }
  };

  const handlePrintPlan = () => {
    window.print();
  };

  const handleSharePlan = async () => {
    if (!activePlan) return;
    
    // Generate shareable text
    const shareText = generateShareableText(activePlan);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Weekly Meal Plan",
          text: shareText,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(shareText);
      alert("Meal plan copied to clipboard!");
    }
  };

  const generateShareableText = (plan: WeeklyMealPlan): string => {
    let text = `Weekly Meal Plan - ${plan.weekStartDate.toLocaleDateString()}\n\n`;
    
    const daysOfWeek: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    for (const day of plan.days) {
      text += `${day.dayOfWeek.toUpperCase()}\n`;
      text += "-".repeat(20) + "\n";
      
      for (const meal of day.meals) {
        if (meal.recipe) {
          const mealName = meal.mealType.replace(/([A-Z])/g, " $1").trim();
          text += `${mealName}: ${meal.recipe.title} (${meal.recipe.nutrition.carbohydrates}g carbs)\n`;
        }
      }
      text += "\n";
    }
    
    text += `\nDaily Averages:\n`;
    text += `Calories: ${plan.summary.avgDailyCalories}\n`;
    text += `Carbs: ${plan.summary.avgDailyCarbs}g\n`;
    text += `Protein: ${plan.summary.avgDailyProtein}g\n`;
    text += `Fiber: ${plan.summary.avgDailyFiber}g\n`;
    
    return text;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your meal plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating your personalized meal plan...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
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
          Weekly Meal Planner
        </h1>
        <p className="text-gray-600">
          Your personalized meal plan following gestational diabetes guidelines
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!activePlan ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Active Meal Plan</h2>
          <p className="text-gray-600 mb-6">
            You don't have an active meal plan for this week. Generate one to get started!
          </p>
          <Button
            onClick={() => setShowGenerateModal(true)}
            variant="primary"
            size="lg"
          >
            Generate Meal Plan
          </Button>
        </Card>
      ) : (
        <>
          {/* Meal Plan View */}
          <MealPlanView
            mealPlan={activePlan}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSwapMeal={handleSwapMeal}
            onRegenerateDay={handleRegenerateDay}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <Button
              onClick={() => setShowShoppingList(!showShoppingList)}
              variant="primary"
            >
              {showShoppingList ? "Hide" : "Show"} Shopping List
            </Button>
            <Button
              onClick={handlePrintPlan}
              variant="secondary"
            >
              Print Plan
            </Button>
            <Button
              onClick={handleSharePlan}
              variant="secondary"
            >
              Share Plan
            </Button>
            <Button
              onClick={() => setShowGenerateModal(true)}
              variant="outline"
            >
              Generate New Plan
            </Button>
          </div>

          {/* Shopping List */}
          {showShoppingList && shoppingList && (
            <div className="mt-8">
              <ShoppingListView shoppingList={shoppingList} />
            </div>
          )}

          {/* Medical Compliance Note */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Medical Note:</strong> This meal plan follows Halton Healthcare 
              guidelines with daily targets of ~180g carbohydrates distributed across 
              3 meals and 3 snacks. Always consult with your healthcare provider.
            </p>
          </div>
        </>
      )}

      {/* Generate Plan Modal */}
      {showGenerateModal && (
        <GeneratePlanModal
          onGenerate={generateNewPlan}
          onClose={() => setShowGenerateModal(false)}
          isGenerating={generating}
        />
      )}

      {/* Printable Version */}
      {activePlan && <PrintableMealPlan mealPlan={activePlan} />}
    </div>
  );
}