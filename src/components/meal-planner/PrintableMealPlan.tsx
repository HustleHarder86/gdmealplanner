import React from "react";
import { WeeklyMealPlan, DayOfWeek, MealType } from "@/src/types/meal-plan";

interface PrintableMealPlanProps {
  mealPlan: WeeklyMealPlan;
}

export function PrintableMealPlan({ mealPlan }: PrintableMealPlanProps) {
  const daysOfWeek: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  const getMealTypeDisplay = (mealType: MealType): string => {
    const displays: Record<MealType, string> = {
      breakfast: "Breakfast",
      morningSnack: "Morning Snack",
      lunch: "Lunch",
      afternoonSnack: "Afternoon Snack",
      dinner: "Dinner",
      eveningSnack: "Evening Snack",
    };
    return displays[mealType];
  };

  return (
    <div className="print-only bg-white p-8">
      <style jsx>{`
        @media print {
          .print-only {
            display: block !important;
          }
          @page {
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Weekly Meal Plan</h1>
        <p className="text-gray-600">
          Week of {mealPlan.weekStartDate.toLocaleDateString()} - 
          Following Gestational Diabetes Guidelines
        </p>
      </div>

      {/* Weekly Summary */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h2 className="font-semibold mb-2">Weekly Nutrition Summary</h2>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Avg Daily Carbs:</span>
            <span className="font-medium ml-1">{mealPlan.summary.avgDailyCarbs}g</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Daily Calories:</span>
            <span className="font-medium ml-1">{mealPlan.summary.avgDailyCalories}</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Daily Protein:</span>
            <span className="font-medium ml-1">{mealPlan.summary.avgDailyProtein}g</span>
          </div>
          <div>
            <span className="text-gray-600">Avg Daily Fiber:</span>
            <span className="font-medium ml-1">{mealPlan.summary.avgDailyFiber}g</span>
          </div>
        </div>
      </div>

      {/* Daily Plans */}
      {mealPlan.days.map((day, dayIndex) => (
        <div key={dayIndex} className="mb-6 page-break-inside-avoid">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-1">
            {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)} - 
            {day.date.toLocaleDateString()}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-3">
            {day.meals.map((meal) => (
              <div key={meal.mealType} className="border border-gray-200 p-3 rounded">
                <h4 className="font-medium text-sm mb-1">
                  {getMealTypeDisplay(meal.mealType)}
                </h4>
                {meal.recipe ? (
                  <>
                    <p className="text-sm font-medium mb-1">{meal.recipe.title}</p>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div>Carbs: {meal.recipe.nutrition.carbohydrates}g</div>
                      <div>Calories: {meal.recipe.nutrition.calories}</div>
                      <div>Prep Time: {meal.recipe.totalTime} min</div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">No recipe assigned</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-sm bg-blue-50 p-2 rounded">
            <span className="font-medium">Daily Totals:</span>
            <span className="ml-2">
              Carbs: {day.nutrition.totalCarbs}g | 
              Calories: {day.nutrition.totalCalories} | 
              Protein: {day.nutrition.totalProtein}g | 
              Fiber: {day.nutrition.totalFiber}g
            </span>
          </div>
        </div>
      ))}

      {/* Medical Note */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
        <p className="font-semibold mb-1">Medical Guidelines Compliance:</p>
        <p>
          This meal plan follows Halton Healthcare guidelines for gestational diabetes 
          with approximately 180g carbohydrates distributed across 3 meals and 3 snacks daily. 
          The evening snack includes protein to help maintain stable overnight glucose levels.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-xs text-gray-600">
        <p>Generated on {new Date().toLocaleDateString()} | Pregnancy Plate Planner</p>
        <p className="mt-1">
          Always consult with your healthcare provider before making changes to your diet.
        </p>
      </div>
    </div>
  );
}