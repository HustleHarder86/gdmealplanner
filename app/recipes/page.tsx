'use client'

import { useState, useMemo } from 'react'
import { RecipeCard, Input } from '@/components/ui'
import { recipeService } from '@/lib/recipe-service'

export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTime, setSelectedTime] = useState('all')
  const [selectedCarbs, setSelectedCarbs] = useState('all')

  const allRecipes = useMemo(() => recipeService.getAllRecipes(), [])

  const filteredRecipes = useMemo(() => {
    let recipes = allRecipes
    
    // Filter by category
    if (selectedCategory !== 'all') {
      recipes = recipeService.getRecipesByCategory(selectedCategory)
    }
    
    // Filter by search term
    if (searchTerm) {
      recipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             recipe.ingredients.some((ing: any) => ing.item.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesSearch
      })
    }
    
    // Filter by time
    if (selectedTime !== 'all') {
      recipes = recipes.filter(recipe => {
        switch (selectedTime) {
          case 'quick':
            return recipe.totalTime <= 15
          case 'medium':
            return recipe.totalTime > 15 && recipe.totalTime <= 30
          case 'long':
            return recipe.totalTime > 30 && recipe.totalTime <= 60
          default:
            return true
        }
      })
    }
    
    // Filter by carbs - updated to match medical guidelines
    if (selectedCarbs !== 'all') {
      recipes = recipes.filter(recipe => {
        const carbs = recipe.nutrition.carbs
        const category = recipe.category
        
        switch (selectedCarbs) {
          case 'breakfast':
            return carbs >= 25 && carbs <= 35 // Medical guideline for breakfast
          case 'main':
            return carbs >= 40 && carbs <= 50 // Medical guideline for lunch/dinner
          case 'snack':
            return carbs >= 15 && carbs <= 30 // Medical guideline for snacks
          case 'bedtime':
            return carbs >= 14 && carbs <= 16 && recipe.nutrition.protein >= 5 // Bedtime snack
          default:
            return true
        }
      })
    }
    
    return recipes
  }, [allRecipes, searchTerm, selectedCategory, selectedTime, selectedCarbs])

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GD-Friendly Recipes</h1>
        <p className="text-neutral-600">
          Browse our collection of {allRecipes.length} gestational diabetes-friendly recipes
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedCarbs}
            onChange={(e) => setSelectedCarbs(e.target.value)}
          >
            <option value="all">All Carb Ranges</option>
            <option value="breakfast">Breakfast (25-35g)</option>
            <option value="main">Lunch/Dinner (40-50g)</option>
            <option value="snack">Snacks (15-30g)</option>
            <option value="bedtime">Bedtime Snack (15g + protein)</option>
          </select>
          
          <select 
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="all">Any Cook Time</option>
            <option value="quick">Under 15 min</option>
            <option value="medium">15-30 min</option>
            <option value="long">30-60 min</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-neutral-600">
          Showing {filteredRecipes.length} of {allRecipes.length} recipes
        </p>
      </div>

      {/* Recipe Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}