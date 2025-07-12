"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { NutritionService } from "@/src/services/nutrition/nutrition-service";
import { MealPlanService } from "@/src/services/meal-plan/meal-plan-service";
import {
  NutritionEntry,
  DailyNutritionSummary,
  MealType,
  MEAL_TYPE_LABELS,
  DEFAULT_GD_NUTRITION_GOALS,
} from "@/src/types/nutrition";
import { format } from "date-fns";
import NutritionEntryForm from "@/src/components/nutrition/NutritionEntryForm";
import DailyNutritionSummaryCard from "@/src/components/nutrition/DailyNutritionSummaryCard";
import MacroProgressRings from "@/src/components/nutrition/MacroProgressRings";
import MealLogCard from "@/src/components/nutrition/MealLogCard";

export default function NutritionTrackingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [activeMealPlan, setActiveMealPlan] = useState<any>(null);
  const [waterGlasses, setWaterGlasses] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const loadDailyData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load daily summary
      const summary = await NutritionService.getDailySummary(
        user.uid,
        selectedDate
      );
      setDailySummary(summary);
      setWaterGlasses(summary.waterIntake || 0);

      // Check if user has an active meal plan
      const mealPlan = await MealPlanService.getActiveMealPlan(user.uid);
      setActiveMealPlan(mealPlan);
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadDailyData();
  }, [loadDailyData]);

  const handleNewEntry = async (entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt">) => {
    try {
      await NutritionService.createEntry(entry);
      setShowEntryForm(false);
      loadDailyData(); // Reload data
    } catch (error) {
      console.error("Error saving nutrition entry:", error);
      alert("Error saving entry. Please try again.");
    }
  };

  const handleQuickAddFromMealPlan = async (mealType: MealType) => {
    if (!activeMealPlan || !user) return;

    // Find the recipe for this meal type in today's plan
    const dayIndex = new Date().getDay();
    const todayMeals = activeMealPlan.meals[dayIndex];
    const mealRecipe = todayMeals?.[mealType];

    if (!mealRecipe) {
      alert("No meal planned for this time");
      return;
    }

    try {
      const entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt"> = {
        userId: user.uid,
        timestamp: new Date(),
        mealType,
        foods: [{
          name: mealRecipe.title,
          quantity: 1,
          unit: "serving",
          nutrition: {
            calories: mealRecipe.calories,
            carbohydrates: mealRecipe.carbs,
            fiber: mealRecipe.fiber,
            sugar: mealRecipe.sugar,
            protein: mealRecipe.protein,
            fat: mealRecipe.fat,
            saturatedFat: mealRecipe.saturatedFat,
            sodium: mealRecipe.sodium,
          },
          recipeId: mealRecipe.id,
        }],
        totalNutrition: {
          calories: mealRecipe.calories,
          carbohydrates: mealRecipe.carbs,
          fiber: mealRecipe.fiber,
          sugar: mealRecipe.sugar,
          protein: mealRecipe.protein,
          fat: mealRecipe.fat,
          saturatedFat: mealRecipe.saturatedFat,
          sodium: mealRecipe.sodium,
        },
        mealPlanId: activeMealPlan.id,
        recipeId: mealRecipe.id,
        notes: "From meal plan",
      };

      await NutritionService.createEntry(entry);
      
      // Log meal timing
      await NutritionService.logMealTime(user.uid, new Date(), mealType, new Date());
      
      loadDailyData();
    } catch (error) {
      console.error("Error logging meal from plan:", error);
      alert("Error logging meal. Please try again.");
    }
  };

  const handleWaterUpdate = async (glasses: number) => {
    if (!user) return;

    try {
      await NutritionService.logWater(user.uid, selectedDate, glasses);
      setWaterGlasses(glasses);
    } catch (error) {
      console.error("Error updating water intake:", error);
    }
  };

  const handleQuickSnack = async (snackName: string, mealType: MealType) => {
    if (!user) return;

    try {
      await NutritionService.quickAddSnack(user.uid, snackName, mealType);
      loadDailyData();
    } catch (error) {
      console.error("Error adding quick snack:", error);
      alert("Error adding snack. Please try again.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-neutral-600">
            {authLoading ? "Checking authentication..." : "Loading nutrition data..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nutrition Tracking</h1>
          <p className="text-neutral-600 mt-1 text-sm sm:text-base">
            Track your meals and monitor your nutrition goals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => setShowEntryForm(true)}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Add Food
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="mb-8">
          <DailyNutritionSummaryCard
            summary={dailySummary}
            goals={DEFAULT_GD_NUTRITION_GOALS}
          />
        </div>
      )}

      {/* Macro Progress */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Progress</h2>
        <MacroProgressRings
          nutrition={dailySummary?.totalNutrition || {
            calories: 0,
            carbohydrates: 0,
            fiber: 0,
            sugar: 0,
            protein: 0,
            fat: 0,
            saturatedFat: 0,
          }}
          goals={DEFAULT_GD_NUTRITION_GOALS}
        />
        
        {/* Water Tracking */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Water Intake</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleWaterUpdate(Math.max(0, waterGlasses - 1))}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                -
              </button>
              <span className="px-3 py-1 bg-primary-50 rounded-lg">
                {waterGlasses} glasses
              </span>
              <button
                onClick={() => handleWaterUpdate(waterGlasses + 1)}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Log by Type */}
      <div className="grid gap-6">
        {Object.entries(MEAL_TYPE_LABELS).map(([mealType, label]) => {
          const mealEntries = dailySummary?.entries.filter(
            (e) => e.mealType === mealType
          ) || [];
          const mealPlanRecipe = activeMealPlan?.meals[new Date().getDay()]?.[mealType as MealType];

          return (
            <MealLogCard
              key={mealType}
              mealType={mealType as MealType}
              label={label}
              entries={mealEntries}
              plannedRecipe={mealPlanRecipe}
              onAddFood={() => {
                setSelectedMealType(mealType as MealType);
                setShowEntryForm(true);
              }}
              onQuickAddFromPlan={() => handleQuickAddFromMealPlan(mealType as MealType)}
              carbTarget={DEFAULT_GD_NUTRITION_GOALS.carbohydrates.distribution[mealType as MealType]}
            />
          );
        })}
      </div>

      {/* Quick Snacks */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6 border border-primary-200">
        <h3 className="text-lg font-semibold mb-4 text-primary-900">
          Quick Healthy Snacks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            "Apple with Peanut Butter",
            "Greek Yogurt with Berries",
            "Cheese and Crackers",
            "Hummus with Veggies",
          ].map((snack) => (
            <button
              key={snack}
              onClick={() => {
                const now = new Date().getHours();
                const mealType = now < 12 ? "morning-snack" : 
                                now < 17 ? "afternoon-snack" : "bedtime-snack";
                handleQuickSnack(snack, mealType as MealType);
              }}
              className="p-3 bg-white hover:bg-primary-100 rounded-lg transition-colors text-sm font-medium text-center"
            >
              {snack}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Food Entry</h2>
                <button
                  onClick={() => setShowEntryForm(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <NutritionEntryForm
                userId={user!.uid}
                defaultMealType={selectedMealType}
                onSubmit={handleNewEntry}
                onCancel={() => setShowEntryForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={() => router.push("/tracking/nutrition/history")}
          className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors"
        >
          View History
        </button>
        <button
          onClick={() => router.push("/tracking/nutrition/insights")}
          className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors"
        >
          Weekly Insights
        </button>
        <button
          onClick={() => router.push("/tracking/nutrition/foods")}
          className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors"
        >
          Manage Foods
        </button>
      </div>
    </div>
  );
}