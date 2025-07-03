import { Recipe } from './types'
import { MedicalComplianceService } from './medical-compliance'
import recipesData from '@/scripts/recipe-scraper/data/recipes/recipes.json'
import breakfastData from '@/scripts/recipe-scraper/data/recipes/breakfast.json'
import lunchData from '@/scripts/recipe-scraper/data/recipes/lunch.json'
import dinnerData from '@/scripts/recipe-scraper/data/recipes/dinner.json'
import snacksData from '@/scripts/recipe-scraper/data/recipes/snacks.json'

// Type the imported data
const allRecipes = recipesData as Recipe[]
const breakfastRecipes = breakfastData as Recipe[]
const lunchRecipes = lunchData as Recipe[]
const dinnerRecipes = dinnerData as Recipe[]
const snackRecipes = snacksData as Recipe[]

export class RecipeService {
  static getAllRecipes(): Recipe[] {
    return allRecipes
  }

  static getRecipesByCategory(category: string): Recipe[] {
    switch (category.toLowerCase()) {
      case 'breakfast':
        return breakfastRecipes
      case 'lunch':
        return lunchRecipes
      case 'dinner':
        return dinnerRecipes
      case 'snacks':
      case 'snack':
        return snackRecipes
      default:
        return allRecipes.filter(r => r.category === category)
    }
  }

  static getRecipeById(id: string): Recipe | undefined {
    return allRecipes.find(recipe => recipe.id === id)
  }

  static searchRecipes(query: string): Recipe[] {
    const searchTerm = query.toLowerCase()
    return allRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes(searchTerm) ||
      recipe.description.toLowerCase().includes(searchTerm) ||
      recipe.ingredients.some(ing => ing.item.toLowerCase().includes(searchTerm)) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  static getRecipesByTag(tag: string): Recipe[] {
    return allRecipes.filter(recipe => 
      recipe.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    )
  }

  static getRecipesByNutrition(filters: {
    maxCarbs?: number
    minProtein?: number
    minFiber?: number
    maxCalories?: number
  }): Recipe[] {
    return allRecipes.filter(recipe => {
      const nutrition = recipe.nutrition
      if (filters.maxCarbs && nutrition.carbs > filters.maxCarbs) return false
      if (filters.minProtein && nutrition.protein < filters.minProtein) return false
      if (filters.minFiber && nutrition.fiber < filters.minFiber) return false
      if (filters.maxCalories && nutrition.calories > filters.maxCalories) return false
      return true
    })
  }

  static getQuickRecipes(maxTime: number = 30): Recipe[] {
    return allRecipes.filter(recipe => recipe.totalTime <= maxTime)
  }

  static getRandomRecipes(count: number = 5): Recipe[] {
    const shuffled = [...allRecipes].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  static getRecipeStats() {
    return {
      total: allRecipes.length,
      byCategory: {
        breakfast: breakfastRecipes.length,
        lunch: lunchRecipes.length,
        dinner: dinnerRecipes.length,
        snacks: snackRecipes.length
      },
      averageTime: Math.round(
        allRecipes.reduce((sum, r) => sum + r.totalTime, 0) / allRecipes.length
      ),
      quickRecipes: allRecipes.filter(r => r.totalTime <= 30).length,
      highProtein: allRecipes.filter(r => r.nutrition.protein >= 20).length,
      highFiber: allRecipes.filter(r => r.nutrition.fiber >= 5).length,
      medicallyCompliant: allRecipes.filter(r => MedicalComplianceService.isRecipeCompliant(r)).length
    }
  }

  // Get only medically compliant recipes
  static getCompliantRecipes(category?: string): Recipe[] {
    const recipes = category ? this.getRecipesByCategory(category) : allRecipes
    return recipes.filter(r => MedicalComplianceService.isRecipeCompliant(r))
  }

  // Get bedtime snack recipes (15g carbs + protein)
  static getBedtimeSnacks(): Recipe[] {
    return snackRecipes.filter(r => 
      r.nutrition.carbs >= 14 && 
      r.nutrition.carbs <= 16 && 
      r.nutrition.protein >= 5
    )
  }
}

// Export a default instance for convenience
export const recipeService = RecipeService