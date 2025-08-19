import { useState } from 'react';
import { MealPlan, MealPlanPreferences, MealPlanGenerationOptions } from '@/src/types/meal-plan';
import { MealPlanAlgorithm } from '@/src/lib/meal-planning/meal-plan-algorithm';
import { LocalRecipeService } from '@/src/services/local-recipe-service';
import { DEFAULT_PREFERENCES } from '../constants/preferences';

export function useMealPlan(userId?: string) {
  // Don't initialize if userId is not provided (recipes not ready)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [preferences, setPreferences] = useState<MealPlanPreferences>(DEFAULT_PREFERENCES);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNextMondayISOString = (): string => {
    const today = new Date();
    const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  };

  const generateMealPlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      
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
      plan.userId = userId || 'demo-user';
      
      setMealPlan(plan);
      console.log('[MEAL_PLANNER] Meal plan generated successfully');
      
      return plan;
    } catch (err) {
      console.error('[MEAL_PLANNER] Generation error:', err);
      setError('Failed to generate meal plan. Please try again.');
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const updateWithNewRecipes = async () => {
    if (!mealPlan) return null;
    
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
      console.log('[MEAL_PLANNER] Meal plan updated with new recipes');
      
      return updatedPlan;
    } catch (err) {
      console.error('[MEAL_PLANNER] Update error:', err);
      setError('Failed to update meal plan. Please try again.');
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const swapMeal = async (dayIndex: number, mealType: string) => {
    if (!mealPlan) return null;
    
    try {
      setGenerating(true);
      setError(null);
      
      // Find a different recipe for this meal slot
      const currentDayMeals = mealPlan.days[dayIndex].meals;
      const currentMeal = (currentDayMeals as any)[mealType];
      const categoryFilter = getMealCategoryFilter(mealType);
      const carbDistribution = preferences?.carbDistribution as any;
      const targetCarbs = carbDistribution?.[mealType] || 30;
      
      // Get suitable recipes excluding the current one
      const allRecipes = LocalRecipeService.getAllRecipes();
      const suitableRecipes = allRecipes.filter(recipe => {
        if (recipe.id === currentMeal.recipeId) return false;
        if (categoryFilter && recipe.category !== categoryFilter) return false;
        
        const carbDiff = Math.abs(recipe.nutrition.carbohydrates - targetCarbs);
        return carbDiff <= targetCarbs * 0.4; // 40% tolerance
      });
      
      if (suitableRecipes.length === 0) {
        setError('No suitable alternative recipes found for this meal slot');
        return null;
      }
      
      // Pick a random suitable recipe
      const newRecipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
      
      // Update the meal plan
      const updatedPlan = { ...mealPlan };
      (updatedPlan.days[dayIndex].meals as any)[mealType] = {
        recipeId: newRecipe.id,
        recipeName: newRecipe.title,
        servings: 1,
        nutrition: {
          calories: newRecipe.nutrition.calories,
          carbohydrates: newRecipe.nutrition.carbohydrates,
          protein: newRecipe.nutrition.protein,
          fat: newRecipe.nutrition.fat,
          fiber: newRecipe.nutrition.fiber
        },
        cookTime: newRecipe.totalTime,
        category: newRecipe.category as 'breakfast' | 'lunch' | 'dinner' | 'snack'
      };
      
      // Recalculate day nutrition
      const dayMeals = Object.values(updatedPlan.days[dayIndex].meals);
      updatedPlan.days[dayIndex].totalNutrition = {
        calories: dayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0),
        carbohydrates: dayMeals.reduce((sum, meal) => sum + meal.nutrition.carbohydrates, 0),
        protein: dayMeals.reduce((sum, meal) => sum + meal.nutrition.protein, 0),
        fat: dayMeals.reduce((sum, meal) => sum + meal.nutrition.fat, 0),
        fiber: dayMeals.reduce((sum, meal) => sum + meal.nutrition.fiber, 0),
        mealsCount: dayMeals.filter(meal => !['morningSnack', 'afternoonSnack', 'eveningSnack'].includes(meal.category)).length,
        snacksCount: dayMeals.filter(meal => ['morningSnack', 'afternoonSnack', 'eveningSnack'].includes(meal.category)).length
      };
      
      updatedPlan.version += 1;
      updatedPlan.updatedAt = new Date().toISOString();
      
      setMealPlan(updatedPlan);
      
      return updatedPlan;
    } catch (err) {
      console.error('[MEAL_PLANNER] Swap error:', err);
      setError('Failed to swap meal. Please try again.');
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const getMealCategoryFilter = (mealType: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | null => {
    if (mealType === 'breakfast') return 'breakfast';
    if (mealType === 'lunch') return 'lunch';
    if (mealType === 'dinner') return 'dinner';
    if (mealType.includes('snack') || mealType.includes('Snack')) return 'snack';
    return null;
  };

  return {
    mealPlan,
    preferences,
    generating,
    error,
    setPreferences,
    generateMealPlan,
    updateWithNewRecipes,
    swapMeal
  };
}