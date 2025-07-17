#!/usr/bin/env ts-node

/**
 * Test meal plan generation with various dietary restrictions
 */

import { MealPlanAlgorithm } from '../src/lib/meal-planning/meal-plan-algorithm';
import { MealPlanPreferences, MealPlanGenerationOptions } from '../src/types/meal-plan';
import { LocalRecipeService } from '../src/services/local-recipe-service';
import { DietaryFilterService } from '../src/services/dietary-filter-service';

async function testMealPlanGeneration() {
  console.log('🧪 Testing meal plan generation with dietary restrictions\n');

  // Initialize recipe service
  const allRecipes = LocalRecipeService.getAllRecipes();
  console.log(`Total recipes available: ${allRecipes.length}\n`);

  // Test configurations
  const testConfigs: Array<{
    name: string;
    restrictions: string[];
    dislikes?: string[];
  }> = [
    {
      name: 'No restrictions',
      restrictions: [],
    },
    {
      name: 'Vegetarian',
      restrictions: ['vegetarian'],
    },
    {
      name: 'Vegan',
      restrictions: ['vegan'],
    },
    {
      name: 'Gluten-free',
      restrictions: ['glutenFree'],
    },
    {
      name: 'Vegetarian + Gluten-free',
      restrictions: ['vegetarian', 'glutenFree'],
    },
    {
      name: 'Dairy-free + Nut-free',
      restrictions: ['dairyFree', 'nutFree'],
    },
    {
      name: 'Vegetarian with mushroom dislike',
      restrictions: ['vegetarian'],
      dislikes: ['mushroom'],
    },
  ];

  // Test each configuration
  for (const config of testConfigs) {
    console.log(`\n📋 Testing: ${config.name}`);
    console.log('─'.repeat(50));

    // Create preferences
    const preferences: MealPlanPreferences = {
      dietaryRestrictions: config.restrictions,
      allergies: [],
      dislikedIngredients: config.dislikes || [],
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

    // Check available recipes
    const dietaryPrefs = {
      restrictions: config.restrictions as any[],
      dislikes: config.dislikes || [],
      allergies: [],
    };

    const filterResult = DietaryFilterService.filterRecipes(allRecipes, dietaryPrefs);
    console.log(`Available recipes: ${filterResult.suitable.length}`);

    // Check breakdown by category
    const byCategory = {
      breakfast: filterResult.suitable.filter(r => r.category === 'breakfast').length,
      lunch: filterResult.suitable.filter(r => r.category === 'lunch').length,
      dinner: filterResult.suitable.filter(r => r.category === 'dinner').length,
      snack: filterResult.suitable.filter(r => r.category === 'snack').length,
    };

    console.log(`  - Breakfast: ${byCategory.breakfast}`);
    console.log(`  - Lunch: ${byCategory.lunch}`);
    console.log(`  - Dinner: ${byCategory.dinner}`);
    console.log(`  - Snack: ${byCategory.snack}`);

    // Try to generate meal plan
    const options: MealPlanGenerationOptions = {
      startDate: new Date().toISOString().split('T')[0],
      daysToGenerate: 7,
      prioritizeNew: true,
      avoidRecentMeals: true,
      maxRecipeRepeats: 2,
    };

    try {
      const startTime = Date.now();
      const mealPlan = await MealPlanAlgorithm.generateMealPlan(preferences, options);
      const duration = Date.now() - startTime;

      console.log(`\n✅ Meal plan generated successfully in ${duration}ms`);
      
      // Analyze the meal plan
      const uniqueRecipes = new Set<string>();
      let totalCarbs = 0;
      let totalProtein = 0;
      let totalFiber = 0;

      mealPlan.days.forEach(day => {
        Object.values(day.meals).forEach(meal => {
          if (meal.recipeId) uniqueRecipes.add(meal.recipeId);
        });
        totalCarbs += day.totalNutrition.carbohydrates;
        totalProtein += day.totalNutrition.protein;
        totalFiber += day.totalNutrition.fiber;
      });

      const avgCarbs = totalCarbs / mealPlan.days.length;
      const avgProtein = totalProtein / mealPlan.days.length;
      const avgFiber = totalFiber / mealPlan.days.length;

      console.log(`  - Unique recipes used: ${uniqueRecipes.size}`);
      console.log(`  - Average daily carbs: ${avgCarbs.toFixed(1)}g (target: 175-200g)`);
      console.log(`  - Average daily protein: ${avgProtein.toFixed(1)}g`);
      console.log(`  - Average daily fiber: ${avgFiber.toFixed(1)}g`);

      // Check if carbs are in GD target range
      if (avgCarbs >= 175 && avgCarbs <= 200) {
        console.log(`  - ✅ Carbs within GD target range`);
      } else {
        console.log(`  - ⚠️ Carbs outside GD target range (175-200g)`);
      }

    } catch (error) {
      console.error(`\n❌ Failed to generate meal plan: ${error instanceof Error ? error.message : String(error)}`);
      
      // Provide recommendations
      if (byCategory.breakfast < 7 || byCategory.lunch < 7 || byCategory.dinner < 7 || byCategory.snack < 14) {
        console.log('\n📝 Recommendation: Not enough recipes in some categories.');
        console.log('   Consider relaxing restrictions or adding more recipes.');
      }
    }
  }

  console.log('\n\n🏁 Testing complete!');
}

// Run the test
testMealPlanGeneration().catch(console.error);