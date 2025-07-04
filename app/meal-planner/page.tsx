"use client";

import { useState, useEffect } from "react";
import { mealPlanService } from "@/lib/meal-plan-service";
import { recipeService } from "@/lib/recipe-service";
import { WeeklyMasterPlan } from "@/lib/meal-plan-types";
import { Recipe } from "@/lib/types";
import { Badge, Button } from "@/components/ui";

export default function MealPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [mealPlan, setMealPlan] = useState<WeeklyMasterPlan | null>(null);
  const [weekDates, setWeekDates] = useState<{ [key: string]: Date }>({});
  const [selectedDay, setSelectedDay] = useState<string>("monday");
  const [showGroceryList, setShowGroceryList] = useState(false);

  useEffect(() => {
    // Get current week based on date
    const weekNum = mealPlanService.getWeekNumberForDate(new Date());
    setCurrentWeek(weekNum);

    // Load meal plan
    const plan = mealPlanService.getWeekPlan(weekNum);
    setMealPlan(plan);

    // Get week dates
    const dates = mealPlanService.getWeekDates(new Date());
    setWeekDates(dates);
  }, []);

  const loadWeek = (weekNumber: number) => {
    setCurrentWeek(weekNumber);
    const plan = mealPlanService.getWeekPlan(weekNumber);
    setMealPlan(plan);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek =
      direction === "next"
        ? currentWeek === 12
          ? 1
          : currentWeek + 1
        : currentWeek === 1
          ? 12
          : currentWeek - 1;
    loadWeek(newWeek);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getMealRecipe = (recipeId: string): Recipe | undefined => {
    return recipeService.getRecipeById(recipeId);
  };

  if (!mealPlan) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">Loading meal plan...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Meal Planner</h1>
        <p className="text-neutral-600">
          Your personalized meal plan following medical guidelines
        </p>
      </div>

      {/* Week Navigation */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek("prev")}
            className="p-3 md:p-2 hover:bg-white/50 rounded-lg transition-all hover:shadow-sm text-lg md:text-base"
            aria-label="Previous week"
          >
            ←
          </button>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">{mealPlan.theme}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-sm text-gray-600">Week {currentWeek} of 12</p>
              <div className="flex gap-1">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i + 1 === currentWeek ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateWeek("next")}
            className="p-3 md:p-2 hover:bg-white/50 rounded-lg transition-all hover:shadow-sm text-lg md:text-base"
            aria-label="Next week"
          >
            →
          </button>
        </div>

        <p className="text-center text-gray-600 mb-4">
          {mealPlan.description}
        </p>

        {/* Week Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary-600">
              {mealPlan.stats.avgDailyCarbs}g
            </div>
            <div className="text-sm text-neutral-600">Daily Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary-600">
              {mealPlan.stats.avgDailyCalories}
            </div>
            <div className="text-sm text-neutral-600">Daily Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary-600">
              {mealPlan.stats.avgPrepTime}min
            </div>
            <div className="text-sm text-neutral-600">Avg Prep Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary-600">
              {mealPlan.groceryList.totalItems}
            </div>
            <div className="text-sm text-neutral-600">Grocery Items</div>
          </div>
        </div>
      </div>

      {/* Daily Nutrition Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Today&apos;s Nutrition Target</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌾</span>
              <span className="text-xs text-gray-600">Carbohydrates</span>
            </div>
            <div className="text-xl font-bold text-blue-600">180g</div>
            <div className="text-xs text-gray-500">target</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💪</span>
              <span className="text-xs text-gray-600">Protein</span>
            </div>
            <div className="text-xl font-bold text-purple-600">75g</div>
            <div className="text-xs text-gray-500">minimum</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🥬</span>
              <span className="text-xs text-gray-600">Fiber</span>
            </div>
            <div className="text-xl font-bold text-green-600">28g</div>
            <div className="text-xs text-gray-500">goal</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🔥</span>
              <span className="text-xs text-gray-600">Calories</span>
            </div>
            <div className="text-xl font-bold text-orange-600">2200</div>
            <div className="text-xs text-gray-500">approx</div>
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.keys(mealPlan.meals).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`relative px-4 py-3 rounded-lg whitespace-nowrap transition-all min-w-[100px] ${
              selectedDay === day
                ? "bg-green-500 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="text-sm font-medium capitalize">{day}</div>
            {weekDates[day] && (
              <div className="text-xs mt-1 opacity-80">
                {formatDate(weekDates[day])}
              </div>
            )}
            {selectedDay === day && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
                border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent 
                border-t-[6px] border-t-green-500" />
            )}
          </button>
        ))}
      </div>

      {/* Daily Meals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        {Object.entries(
          mealPlan.meals[selectedDay as keyof typeof mealPlan.meals],
        ).map(([mealType, recipeId]) => {
          const recipe = getMealRecipe(recipeId);
          if (!recipe) return null;

          return (
            <div key={mealType} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-lg mb-2 capitalize">
                {mealType.replace(/([A-Z])/g, " $1").trim()}
              </h3>
              <h4 className="font-medium mb-2">{recipe.title}</h4>
              <div className="flex gap-2 text-sm text-neutral-600 mb-3">
                <span>{recipe.nutrition.carbs}g carbs</span>
                <span>•</span>
                <span>{recipe.nutrition.calories} cal</span>
                <span>•</span>
                <span>{recipe.totalTime} min</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/recipes/${recipe.id}`}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  View Recipe →
                </a>
              </div>
              {mealType === "eveningSnack" && (
                <Badge variant="success" size="sm" className="mt-2">
                  Bedtime Snack
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowGroceryList(!showGroceryList)}
          variant="primary"
        >
          {showGroceryList ? "Hide" : "Show"} Grocery List
        </Button>
        <Button variant="secondary">Print Week</Button>
      </div>

      {/* Grocery List */}
      {showGroceryList && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-xl font-semibold">Grocery List</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print list"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="divide-y">
            {mealPlan.groceryList.categories.map((category) => (
              <div key={category.name}>
                <div className="px-4 py-2 bg-gray-50 flex items-center gap-2">
                  <span className="text-lg">
                    {category.name === "produce" && "🥬"}
                    {category.name === "grains" && "🌾"}
                    {category.name === "proteins" && "🥩"}
                    {category.name === "dairy" && "🥛"}
                    {category.name === "pantry" && "🥫"}
                    {category.name === "other" && "📦"}
                  </span>
                  <h4 className="font-medium text-gray-700 capitalize">
                    {category.name}
                  </h4>
                  <span className="text-sm text-gray-500 ml-auto">
                    {category.items.length} items
                  </span>
                </div>
                <div className="px-4 py-2">
                  <ul className="space-y-1">
                    {category.items.map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          id={`${category.name}-${index}`}
                        />
                        <label
                          htmlFor={`${category.name}-${index}`}
                          className="flex-1 text-sm cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded"
                        >
                          {item.quantity} {item.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Compliance Note */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg mb-20 md:mb-0">
        <p className="text-sm text-blue-800">
          <strong>Medical Note:</strong> This meal plan follows Halton
          Healthcare guidelines with daily targets of ~180g carbohydrates
          distributed across 3 meals and 3 snacks. Always consult with your
          healthcare provider.
        </p>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
        <div className="flex justify-around">
          <button className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-1">Week</span>
          </button>
          <button 
            onClick={() => {
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              if (Object.keys(mealPlan.meals).includes(today)) {
                setSelectedDay(today);
              }
            }}
            className="flex flex-col items-center p-2 text-green-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">Today</span>
          </button>
          <button 
            onClick={() => setShowGroceryList(!showGroceryList)}
            className="flex flex-col items-center p-2 text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1">Grocery</span>
          </button>
          <button className="flex flex-col items-center p-2 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="text-xs mt-1">Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
