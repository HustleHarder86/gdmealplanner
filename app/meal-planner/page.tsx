'use client'

import { useState, useEffect } from 'react'
import { mealPlanService } from '@/lib/meal-plan-service'
import { recipeService } from '@/lib/recipe-service'
import { WeeklyMasterPlan } from '@/lib/meal-plan-types'
import { Recipe } from '@/lib/types'
import { Badge, Button } from '@/components/ui'

export default function MealPlannerPage() {
  const [currentWeek, setCurrentWeek] = useState(1)
  const [mealPlan, setMealPlan] = useState<WeeklyMasterPlan | null>(null)
  const [weekDates, setWeekDates] = useState<{ [key: string]: Date }>({})
  const [selectedDay, setSelectedDay] = useState<string>('monday')
  const [showGroceryList, setShowGroceryList] = useState(false)

  useEffect(() => {
    // Get current week based on date
    const weekNum = mealPlanService.getWeekNumberForDate(new Date())
    setCurrentWeek(weekNum)
    
    // Load meal plan
    const plan = mealPlanService.getWeekPlan(weekNum)
    setMealPlan(plan)
    
    // Get week dates
    const dates = mealPlanService.getWeekDates(new Date())
    setWeekDates(dates)
  }, [])

  const loadWeek = (weekNumber: number) => {
    setCurrentWeek(weekNumber)
    const plan = mealPlanService.getWeekPlan(weekNumber)
    setMealPlan(plan)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'next' 
      ? (currentWeek === 12 ? 1 : currentWeek + 1)
      : (currentWeek === 1 ? 12 : currentWeek - 1)
    loadWeek(newWeek)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getMealRecipe = (recipeId: string): Recipe | undefined => {
    return recipeService.getRecipeById(recipeId)
  }

  if (!mealPlan) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">Loading meal plan...</div>
      </div>
    )
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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            ←
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{mealPlan.theme}</h2>
            <p className="text-sm text-neutral-600">Week {currentWeek} of 12</p>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
        
        <p className="text-center text-neutral-600 mb-4">
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

      {/* Day Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.keys(mealPlan.meals).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="font-medium capitalize">{day}</div>
            {weekDates[day] && (
              <div className="text-xs opacity-80">
                {formatDate(weekDates[day])}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Daily Meals */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(mealPlan.meals[selectedDay as keyof typeof mealPlan.meals]).map(([mealType, recipeId]) => {
          const recipe = getMealRecipe(recipeId)
          if (!recipe) return null

          return (
            <div key={mealType} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-lg mb-2 capitalize">
                {mealType.replace(/([A-Z])/g, ' $1').trim()}
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
              {mealType === 'eveningSnack' && (
                <Badge variant="success" size="sm" className="mt-2">
                  Bedtime Snack
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => setShowGroceryList(!showGroceryList)}
          variant="primary"
        >
          {showGroceryList ? 'Hide' : 'Show'} Grocery List
        </Button>
        <Button variant="secondary">
          Print Week
        </Button>
      </div>

      {/* Grocery List */}
      {showGroceryList && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">Grocery List</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mealPlan.groceryList.categories.map((category) => (
              <div key={category.name}>
                <h4 className="font-medium text-lg mb-2">{category.name}</h4>
                <ul className="space-y-1">
                  {category.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1 rounded"
                        id={`${category.name}-${index}`}
                      />
                      <label
                        htmlFor={`${category.name}-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        {item.quantity} {item.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Compliance Note */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Medical Note:</strong> This meal plan follows Halton Healthcare guidelines 
          with daily targets of ~180g carbohydrates distributed across 3 meals and 3 snacks. 
          Always consult with your healthcare provider.
        </p>
      </div>
    </div>
  )
}