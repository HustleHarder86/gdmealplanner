"use client";

import { useState, useEffect } from "react";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { DietaryFilterService } from "@/src/services/dietary-filter-service";
import { MealPlanAlgorithm } from "@/src/lib/meal-planning/meal-plan-algorithm";
import { MealPlanPreferences, MealPlanGenerationOptions } from "@/src/types/meal-plan";
import { DietaryRestriction } from "@/src/types/dietary";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function TestDietaryPage() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testConfigs = [
    { name: "No restrictions", restrictions: [] },
    { name: "Vegetarian", restrictions: ["vegetarian"] },
    { name: "Vegan", restrictions: ["vegan"] },
    { name: "Gluten-free", restrictions: ["glutenFree"] },
    { name: "Vegetarian + Gluten-free", restrictions: ["vegetarian", "glutenFree"] },
    { name: "Dairy-free", restrictions: ["dairyFree"] },
  ];

  const runTests = async () => {
    setTesting(true);
    const testResults = [];
    const allRecipes = LocalRecipeService.getAllRecipes();

    for (const config of testConfigs) {
      const dietaryPrefs = {
        restrictions: config.restrictions as DietaryRestriction[],
        dislikes: [],
        allergies: [],
      };

      const filterResult = DietaryFilterService.filterRecipes(allRecipes, dietaryPrefs);
      
      const byCategory = {
        breakfast: filterResult.suitable.filter(r => r.category === 'breakfast').length,
        lunch: filterResult.suitable.filter(r => r.category === 'lunch').length,
        dinner: filterResult.suitable.filter(r => r.category === 'dinner').length,
        snack: filterResult.suitable.filter(r => r.category === 'snack').length,
      };

      // Try to generate a meal plan
      let mealPlanSuccess = false;
      let error = null;
      let avgCarbs = 0;

      const preferences: MealPlanPreferences = {
        dietaryRestrictions: config.restrictions,
        allergies: [],
        dislikedIngredients: [],
        preferredCookTime: 'any',
        mealPrepFriendly: false,
        familySize: 1,
        carbDistribution: {
          breakfast: 30,
          lunch: 45,
          dinner: 45,
          morningSnack: 20,
          afternoonSnack: 20,
          eveningSnack: 15,
        },
        skipMorningSnack: false,
        skipAfternoonSnack: false,
        requireEveningSnack: true,
      };

      const options: MealPlanGenerationOptions = {
        startDate: new Date().toISOString().split('T')[0],
        daysToGenerate: 7,
        prioritizeNew: true,
        avoidRecentMeals: true,
        maxRecipeRepeats: 2,
      };

      try {
        const mealPlan = await MealPlanAlgorithm.generateMealPlan(preferences, options);
        mealPlanSuccess = true;
        
        let totalCarbs = 0;
        mealPlan.days.forEach(day => {
          totalCarbs += day.totalNutrition.carbohydrates;
        });
        avgCarbs = totalCarbs / mealPlan.days.length;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }

      testResults.push({
        name: config.name,
        totalRecipes: filterResult.suitable.length,
        byCategory,
        mealPlanSuccess,
        avgCarbs,
        error,
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dietary Restrictions Test</h1>
      
      <Card className="p-6 mb-6">
        <p className="mb-4">
          This page tests meal plan generation with various dietary restrictions.
        </p>
        <Button onClick={runTests} disabled={testing}>
          {testing ? "Running Tests..." : "Run Tests"}
        </Button>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-lg font-semibold mb-2">{result.name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Total Recipes</div>
                  <div className="text-xl font-bold">{result.totalRecipes}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Breakfast</div>
                  <div className="text-xl font-bold">{result.byCategory.breakfast}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Lunch</div>
                  <div className="text-xl font-bold">{result.byCategory.lunch}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Dinner</div>
                  <div className="text-xl font-bold">{result.byCategory.dinner}</div>
                </div>
              </div>
              
              {result.mealPlanSuccess ? (
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-800">
                    ✅ Meal plan generated successfully
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Average daily carbs: {result.avgCarbs.toFixed(1)}g 
                    {result.avgCarbs >= 175 && result.avgCarbs <= 200 ? " (✓ Within GD range)" : " (⚠️ Outside GD range)"}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-red-800">
                    ❌ Failed to generate meal plan
                  </p>
                  {result.error && (
                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}