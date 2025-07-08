import React from "react";
import { WeeklyMealPlan, DayOfWeek, MealType } from "@/src/types/meal-plan";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface MealPlanViewProps {
  mealPlan: WeeklyMealPlan;
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
  onSwapMeal: (dayIndex: number, mealType: MealType) => void;
  onRegenerateDay: (dayIndex: number) => void;
}

export function MealPlanView({
  mealPlan,
  selectedDay,
  onSelectDay,
  onSwapMeal,
  onRegenerateDay,
}: MealPlanViewProps) {
  const daysOfWeek: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const selectedDayIndex = daysOfWeek.indexOf(selectedDay);
  const selectedDayPlan = mealPlan.days[selectedDayIndex];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getMealTypeDisplay = (mealType: MealType): string => {
    const displays: Record<MealType, string> = {
      breakfast: "Breakfast",
      morningSnack: "Morning Snack",
      lunch: "Lunch",
      afternoonSnack: "Afternoon Snack",
      dinner: "Dinner",
      eveningSnack: "Evening Snack (Bedtime)",
    };
    return displays[mealType];
  };

  const getMealTypeIcon = (mealType: MealType): string => {
    const icons: Record<MealType, string> = {
      breakfast: "🌅",
      morningSnack: "🍎",
      lunch: "🥗",
      afternoonSnack: "🥜",
      dinner: "🍽️",
      eveningSnack: "🌙",
    };
    return icons[mealType];
  };

  return (
    <div>
      {/* Week Overview */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Week of {mealPlan.weekStartDate.toLocaleDateString()}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Status: <span className="font-medium capitalize">{mealPlan.status}</span>
          </p>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {mealPlan.summary.avgDailyCarbs}g
            </div>
            <div className="text-sm text-gray-600">Daily Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {mealPlan.summary.avgDailyCalories}
            </div>
            <div className="text-sm text-gray-600">Daily Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-purple-600">
              {mealPlan.summary.avgDailyProtein}g
            </div>
            <div className="text-sm text-gray-600">Daily Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-600">
              {mealPlan.summary.avgDailyFiber}g
            </div>
            <div className="text-sm text-gray-600">Daily Fiber</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-indigo-600">
              {mealPlan.summary.totalUniqueRecipes}
            </div>
            <div className="text-sm text-gray-600">Unique Recipes</div>
          </div>
        </div>
      </Card>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {daysOfWeek.map((day, index) => {
          const dayPlan = mealPlan.days[index];
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`relative px-4 py-3 rounded-lg whitespace-nowrap transition-all min-w-[100px] ${
                selectedDay === day
                  ? "bg-green-500 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="text-sm font-medium capitalize">{day}</div>
              <div className="text-xs mt-1 opacity-80">
                {formatDate(dayPlan.date)}
              </div>
              {selectedDay === day && (
                <div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
                  border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent 
                  border-t-[6px] border-t-green-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Meals */}
      {selectedDayPlan && (
        <div>
          {/* Day Summary */}
          <Card className="p-4 mb-6 bg-blue-50">
            <h3 className="font-semibold text-lg mb-2">
              {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Nutrition
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Total Carbs:</span>
                <div className="font-semibold text-blue-700">
                  {selectedDayPlan.nutrition.totalCarbs}g
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Calories:</span>
                <div className="font-semibold text-green-700">
                  {selectedDayPlan.nutrition.totalCalories}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Protein:</span>
                <div className="font-semibold text-purple-700">
                  {selectedDayPlan.nutrition.totalProtein}g
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Fiber:</span>
                <div className="font-semibold text-orange-700">
                  {selectedDayPlan.nutrition.totalFiber}g
                </div>
              </div>
            </div>
          </Card>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedDayPlan.meals.map((meal, mealIndex) => (
              <Card key={meal.mealType} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMealTypeIcon(meal.mealType)}</span>
                    <h4 className="font-semibold text-lg">
                      {getMealTypeDisplay(meal.mealType)}
                    </h4>
                  </div>
                  <button
                    onClick={() => onSwapMeal(selectedDayIndex, meal.mealType)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    title="Swap this meal"
                  >
                    ↻
                  </button>
                </div>

                {meal.recipe ? (
                  <>
                    <h5 className="font-medium mb-2">{meal.recipe.title}</h5>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex justify-between">
                        <span>Carbs:</span>
                        <span className="font-medium">{meal.recipe.nutrition.carbohydrates}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{meal.recipe.nutrition.calories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protein:</span>
                        <span className="font-medium">{meal.recipe.nutrition.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prep Time:</span>
                        <span className="font-medium">{meal.recipe.totalTime} min</span>
                      </div>
                    </div>

                    <a
                      href={`/recipes/${meal.recipe.id}`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      View Recipe →
                    </a>

                    {meal.mealType === "eveningSnack" && (
                      <div className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        Includes protein for stable overnight glucose
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">No recipe assigned</p>
                )}
              </Card>
            ))}
          </div>

          {/* Day Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => onRegenerateDay(selectedDayIndex)}
              variant="outline"
              size="sm"
            >
              Regenerate This Day
            </Button>
          </div>

          {/* Prep Notes */}
          {selectedDayPlan.prepNotes && selectedDayPlan.prepNotes.length > 0 && (
            <Card className="p-4 mt-6 bg-yellow-50">
              <h4 className="font-semibold mb-2">Prep Notes</h4>
              <ul className="space-y-1">
                {selectedDayPlan.prepNotes.map((note, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {note}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}