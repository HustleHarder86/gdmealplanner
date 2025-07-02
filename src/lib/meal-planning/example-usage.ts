/**
 * Example usage of the meal planning system for gestational diabetes
 */

import { User, Recipe } from '@/types/firebase';
import { Timestamp } from 'firebase/firestore';
import {
  MealPlanService,
  MealPlanPreferences,
  MealSwapService,
  PortionCalculator,
  MealPrepOptimizer,
  MealPlanFormatter,
  MealSwapOptions
} from './index';

// Example: Generate a meal plan for a user
export async function generateMealPlanExample() {
  // Example user with gestational diabetes
  const user: User = {
    id: 'user123',
    email: 'jane.doe@example.com',
    displayName: 'Jane Doe',
    subscriptionStatus: 'premium',
    settings: {
      targetGlucoseRange: { min: 70, max: 140 },
      mealReminders: true,
      glucoseReminders: true,
      notificationPreferences: { email: true, push: true }
    },
    dietaryRestrictions: ['vegetarian'],
    allergens: ['nuts'],
    pregnancyProfile: {
      dueDate: Timestamp.fromDate(new Date('2024-06-15')),
      height: 165, // cm
      prePregnancyWeight: 65, // kg
      currentWeight: 72,
      weekOfPregnancy: 24,
      diabetesDiagnosisWeek: 20,
      multiplePregnancy: false
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  // User preferences for meal planning
  const preferences: MealPlanPreferences = {
    dietaryRestrictions: ['vegetarian'],
    allergens: ['nuts', 'shellfish'],
    dislikedIngredients: ['mushrooms', 'olives'],
    favoriteRecipeIds: ['recipe1', 'recipe2'],
    mealsPerDay: 6, // Standard for GD
    breakfastTime: '7:00',
    lunchTime: '12:30',
    dinnerTime: '18:30',
    prepTimePreference: 'quick', // Prefer meals under 20 minutes
    varietyLevel: 'medium',
    mealPrepMode: true // Enable meal prep optimization
  };

  // Fetch available recipes (in real app, this would come from Firestore)
  const availableRecipes: Recipe[] = await fetchRecipesFromDatabase();

  // Generate the meal plan
  const mealPlan = await MealPlanService.generateMealPlan(
    user,
    preferences,
    new Date(), // Start from today
    availableRecipes
  );

  // Save the meal plan
  const mealPlanId = await MealPlanService.saveMealPlan(mealPlan);
  console.log('Meal plan saved with ID:', mealPlanId);

  // Save user preferences for future use
  await MealPlanService.savePreferences(user.id!, preferences);

  return mealPlan;
}

// Example: Swap a meal
export async function swapMealExample() {
  const currentRecipe: Recipe = {
    id: 'current-recipe',
    title: 'High-Carb Breakfast',
    ingredients: [],
    instructions: [],
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    nutrition: {
      calories: 350,
      carbs: 55, // Too high for breakfast
      protein: 15,
      fat: 10,
      fiber: 5
    },
    tags: ['breakfast'],
    userId: 'user123',
    isPublic: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const swapOptions: MealSwapOptions = {
    currentRecipe,
    mealType: 'breakfast',
    targetNutrition: {
      carbs: 30, // GD-friendly breakfast target
      protein: 20
    },
    excludeRecipeIds: ['recipe1', 'recipe2'] // Already used this week
  };

  const availableRecipes = await fetchRecipesFromDatabase();
  const swapCandidates = MealSwapService.findSwapOptions(
    swapOptions,
    availableRecipes,
    5 // Get top 5 options
  );

  console.log('Top swap options:');
  swapCandidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.recipe.title}`);
    console.log(`   Carbs: ${candidate.recipe.nutrition.carbs}g`);
    console.log(`   Score: ${candidate.score.toFixed(2)}`);
  });

  // Get quick swap suggestions
  const suggestions = MealSwapService.getQuickSwapSuggestions(currentRecipe);
  console.log('\nQuick suggestions:', suggestions);
}

// Example: Calculate portion sizes
export function calculatePortionsExample() {
  const recipe: Recipe = {
    id: 'recipe123',
    title: 'Quinoa Bowl',
    ingredients: [
      { name: 'quinoa', amount: 0.5, unit: 'cup' },
      { name: 'chicken breast', amount: 4, unit: 'oz' }
    ],
    instructions: [],
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    nutrition: {
      calories: 400,
      carbs: 40,
      protein: 30,
      fat: 12,
      fiber: 8
    },
    tags: ['lunch', 'dinner'],
    userId: 'user123',
    isPublic: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const user: User = {
    id: 'user123',
    email: 'jane@example.com',
    subscriptionStatus: 'premium',
    settings: {
      targetGlucoseRange: { min: 70, max: 140 },
      mealReminders: true,
      glucoseReminders: true,
      notificationPreferences: { email: true, push: true }
    },
    pregnancyProfile: {
      dueDate: Timestamp.fromDate(new Date('2024-06-15')),
      height: 165,
      prePregnancyWeight: 65,
      weekOfPregnancy: 28, // Third trimester
      multiplePregnancy: false
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  // Calculate portion adjustment
  const portionAdjustment = PortionCalculator.calculatePortionAdjustment(
    recipe,
    user,
    'lunch'
  );

  console.log('Portion adjustment:', portionAdjustment.multiplier);
  console.log('Reason:', portionAdjustment.reason);
  console.log('Adjusted nutrition:', portionAdjustment.adjustedNutrition);

  // Calculate serving for specific carb target
  const carbTargetAdjustment = PortionCalculator.calculateServingForCarbTarget(
    recipe,
    45 // Target 45g carbs for lunch
  );

  console.log('\nCarb-targeted adjustment:', carbTargetAdjustment.multiplier);
  console.log('Resulting carbs:', carbTargetAdjustment.adjustedNutrition.carbs);
}

// Example: Optimize for meal prep
export async function mealPrepExample() {
  const mealPlan = await generateMealPlanExample();
  
  // Optimize the meal plan for batch cooking
  const prepPlan = MealPrepOptimizer.optimizeForMealPrep(mealPlan);

  console.log('Meal Prep Plan:');
  console.log('Prep day:', prepPlan.prepDay.toLocaleDateString());
  console.log('Total prep time:', prepPlan.totalPrepTime, 'minutes');
  
  console.log('\nPrep batches:');
  prepPlan.batches.forEach((batch, index) => {
    console.log(`\nBatch ${index + 1}:`);
    console.log('Ingredients:', batch.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`));
    console.log('Used in:', batch.recipes.length, 'recipes');
    console.log('Prep time:', batch.prepTime, 'minutes');
  });

  // Generate prep schedule
  const schedule = MealPrepOptimizer.generatePrepSchedule(prepPlan);
  console.log('\nPrep Schedule:');
  schedule.forEach(step => console.log(step));
}

// Example: Generate printable meal plan
export async function printMealPlanExample() {
  const mealPlan = await generateMealPlanExample();
  
  // Generate printable version
  const printable = MealPlanFormatter.generatePrintableView(
    mealPlan,
    true, // Include shopping list
    true  // Include nutrition summary
  );

  // In a real app, you would open this in a new window or save as PDF
  console.log('Generated printable HTML with', printable.html.length, 'characters');
  
  // Generate text version for email
  const textVersion = MealPlanFormatter.generateTextVersion(mealPlan);
  console.log('\nText version preview:');
  console.log(textVersion.substring(0, 500) + '...');
}

// Example: Get favorite recipes
export async function getFavoritesExample() {
  const userId = 'user123';
  const favorites = await MealPlanService.getFavoriteRecipes(userId, 10);
  
  console.log('Top 10 most used recipes:');
  favorites.forEach((fav, index) => {
    console.log(`${index + 1}. Recipe ID: ${fav.recipeId}, Used ${fav.count} times`);
  });
}

// Mock function to simulate database fetch
async function fetchRecipesFromDatabase(): Promise<Recipe[]> {
  // In real app, this would fetch from Firestore
  return [
    {
      id: 'recipe1',
      title: 'Greek Yogurt Parfait',
      ingredients: [
        { name: 'Greek yogurt', amount: 1, unit: 'cup' },
        { name: 'Mixed berries', amount: 0.5, unit: 'cup' },
        { name: 'Granola', amount: 2, unit: 'tbsp' }
      ],
      instructions: ['Layer yogurt, berries, and granola'],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      nutrition: {
        calories: 250,
        carbs: 30,
        protein: 20,
        fat: 8,
        fiber: 5
      },
      tags: ['breakfast', 'vegetarian', 'gd-friendly', 'quick'],
      userId: 'system',
      isPublic: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    // Add more recipes...
  ];
}

// Example: Complete workflow
export async function completeWorkflowExample() {
  console.log('=== Gestational Diabetes Meal Planning Workflow ===\n');

  // 1. Load user preferences
  const userId = 'user123';
  const preferences = await MealPlanService.loadPreferences(userId);
  console.log('1. Loaded user preferences');

  // 2. Generate meal plan
  console.log('2. Generating 7-day meal plan...');
  const mealPlan = await generateMealPlanExample();
  console.log('   Generated meal plan for', mealPlan.days.length, 'days');

  // 3. Review and swap a meal if needed
  const dayOne = mealPlan.days[0];
  if (dayOne.breakfast && dayOne.breakfast.nutrition.carbs > 45) {
    console.log('3. Breakfast has too many carbs, finding alternatives...');
    await swapMealExample();
  }

  // 4. Calculate portions
  console.log('4. Calculating personalized portions...');
  calculatePortionsExample();

  // 5. Optimize for meal prep
  console.log('5. Creating meal prep plan...');
  await mealPrepExample();

  // 6. Generate printable version
  console.log('6. Generating printable meal plan...');
  await printMealPlanExample();

  // 7. Save the plan
  console.log('7. Saving meal plan...');
  const mealPlanId = await MealPlanService.saveMealPlan(mealPlan);
  console.log('   Saved with ID:', mealPlanId);

  console.log('\n=== Workflow Complete ===');
}