import { WeeklyMasterPlan, UserMealPlan, MealCustomization } from './meal-plan-types'
import masterPlansData from '@/data/meal-plans/master-plans.json'

export class MealPlanService {
  private static masterPlans: WeeklyMasterPlan[] = masterPlansData as WeeklyMasterPlan[]

  // Get current week's meal plan (cycles through 12 weeks)
  static getCurrentWeekPlan(): WeeklyMasterPlan {
    const currentDate = new Date()
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
    const weeksSinceStart = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const weekNumber = (weeksSinceStart % 12) + 1
    
    return this.getWeekPlan(weekNumber)
  }

  // Get specific week's meal plan
  static getWeekPlan(weekNumber: number): WeeklyMasterPlan {
    const plan = this.masterPlans.find(p => p.weekNumber === weekNumber)
    if (!plan) {
      throw new Error(`Week ${weekNumber} meal plan not found`)
    }
    return plan
  }

  // Get all available meal plans
  static getAllMealPlans(): WeeklyMasterPlan[] {
    return this.masterPlans
  }

  // Get next week's plan
  static getNextWeekPlan(currentWeek: number): WeeklyMasterPlan {
    const nextWeek = currentWeek === 12 ? 1 : currentWeek + 1
    return this.getWeekPlan(nextWeek)
  }

  // Get previous week's plan
  static getPreviousWeekPlan(currentWeek: number): WeeklyMasterPlan {
    const prevWeek = currentWeek === 1 ? 12 : currentWeek - 1
    return this.getWeekPlan(prevWeek)
  }

  // Create user-specific meal plan from master plan
  static createUserMealPlan(
    userId: string,
    weekNumber: number,
    startDate: Date
  ): UserMealPlan {
    return {
      id: `${userId}-week${weekNumber}-${startDate.toISOString()}`,
      userId,
      masterPlanWeek: weekNumber,
      startDate,
      customizations: [],
      groceryListChecked: [],
      createdAt: new Date()
    }
  }

  // Apply customization to user meal plan
  static applyCustomization(
    userPlan: UserMealPlan,
    customization: MealCustomization
  ): UserMealPlan {
    // Remove any existing customization for the same day/meal
    const filtered = userPlan.customizations.filter(
      c => !(c.day === customization.day && c.mealType === customization.mealType)
    )
    
    return {
      ...userPlan,
      customizations: [...filtered, customization]
    }
  }

  // Get effective meal plan with customizations applied
  static getEffectiveMealPlan(userPlan: UserMealPlan): WeeklyMasterPlan {
    const masterPlan = this.getWeekPlan(userPlan.masterPlanWeek)
    const effectivePlan = JSON.parse(JSON.stringify(masterPlan)) // Deep copy
    
    // Apply customizations
    userPlan.customizations.forEach(custom => {
      if (effectivePlan.meals[custom.day as keyof typeof effectivePlan.meals]) {
        effectivePlan.meals[custom.day as keyof typeof effectivePlan.meals][custom.mealType] = custom.newRecipeId
      }
    })
    
    return effectivePlan
  }

  // Check/uncheck grocery list items
  static toggleGroceryItem(
    userPlan: UserMealPlan,
    itemId: string,
    checked: boolean
  ): UserMealPlan {
    const checkedItems = new Set(userPlan.groceryListChecked)
    
    if (checked) {
      checkedItems.add(itemId)
    } else {
      checkedItems.delete(itemId)
    }
    
    return {
      ...userPlan,
      groceryListChecked: Array.from(checkedItems)
    }
  }

  // Get week number for a given date
  static getWeekNumberForDate(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const weeksSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return (weeksSinceStart % 12) + 1
  }

  // Get dates for a week
  static getWeekDates(startDate: Date): { [key: string]: Date } {
    const dates: { [key: string]: Date } = {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    // Find the Monday of the week
    const monday = new Date(startDate)
    const dayOfWeek = monday.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    monday.setDate(monday.getDate() + daysToMonday)
    
    days.forEach((day, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      dates[day] = date
    })
    
    return dates
  }
}

export const mealPlanService = MealPlanService