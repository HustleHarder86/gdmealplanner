import { Recipe, GlucoseReading } from './types'

// Medical guidelines from Halton Healthcare
export const MEDICAL_GUIDELINES = {
  carbs: {
    breakfast: { min: 25, target: 30, max: 35 },
    lunch: { min: 40, target: 45, max: 50 },
    dinner: { min: 40, target: 45, max: 50 },
    snacks: { min: 15, target: 20, max: 30 },
    bedtimeSnack: { min: 15, target: 15, max: 15, requiresProtein: true }
  },
  glucose: {
    fasting: { max: 5.3 }, // mmol/L
    oneHourPost: { max: 7.8 }, // mmol/L
    twoHourPost: { max: 6.7 } // mmol/L
  },
  daily: {
    minCarbs: 175, // minimum daily carbs
    meals: 3,
    snacks: 3,
    mealSpacing: { min: 4, max: 6 } // hours
  },
  portions: {
    carbChoice: 15 // 1 choice = 15g carbs
  }
}

export class MedicalComplianceService {
  // Check if a recipe meets medical guidelines
  static isRecipeCompliant(recipe: Recipe): boolean {
    const guidelines = MEDICAL_GUIDELINES.carbs[recipe.category] || MEDICAL_GUIDELINES.carbs.snacks
    return recipe.nutrition.carbs >= guidelines.min && recipe.nutrition.carbs <= guidelines.max
  }

  // Get carb choices (15g = 1 choice)
  static getCarbChoices(carbs: number): number {
    return Math.round(carbs / MEDICAL_GUIDELINES.portions.carbChoice * 10) / 10
  }

  // Check if glucose reading is within target
  static isGlucoseInTarget(reading: GlucoseReading): boolean {
    const { value, type, unit } = reading
    
    // Convert to mmol/L if needed
    const mmolValue = unit === 'mg/dL' ? value / 18.016 : value
    
    switch (type) {
      case 'fasting':
        return mmolValue <= MEDICAL_GUIDELINES.glucose.fasting.max
      case '1hr-post-breakfast':
        return mmolValue <= MEDICAL_GUIDELINES.glucose.oneHourPost.max
      case '2hr-post-breakfast':
      case '2hr-post-lunch':
      case '2hr-post-dinner':
        return mmolValue <= MEDICAL_GUIDELINES.glucose.twoHourPost.max
      default:
        return true // No specific target for other readings
    }
  }

  // Validate daily meal plan
  static validateDailyMealPlan(meals: {
    breakfast?: Recipe
    morningSnack?: Recipe
    lunch?: Recipe
    afternoonSnack?: Recipe
    dinner?: Recipe
    eveningSnack?: Recipe
  }): {
    isValid: boolean
    totalCarbs: number
    issues: string[]
  } {
    const issues: string[] = []
    let totalCarbs = 0

    // Check each meal
    if (!meals.breakfast) {
      issues.push('Missing breakfast')
    } else {
      totalCarbs += meals.breakfast.nutrition.carbs
      if (!this.isRecipeCompliant(meals.breakfast)) {
        issues.push(`Breakfast carbs (${meals.breakfast.nutrition.carbs}g) outside range 25-35g`)
      }
    }

    if (!meals.lunch) {
      issues.push('Missing lunch')
    } else {
      totalCarbs += meals.lunch.nutrition.carbs
      if (!this.isRecipeCompliant(meals.lunch)) {
        issues.push(`Lunch carbs (${meals.lunch.nutrition.carbs}g) outside range 40-50g`)
      }
    }

    if (!meals.dinner) {
      issues.push('Missing dinner')
    } else {
      totalCarbs += meals.dinner.nutrition.carbs
      if (!this.isRecipeCompliant(meals.dinner)) {
        issues.push(`Dinner carbs (${meals.dinner.nutrition.carbs}g) outside range 40-50g`)
      }
    }

    // Check snacks
    const snacks = [meals.morningSnack, meals.afternoonSnack, meals.eveningSnack]
    const snackCount = snacks.filter(s => s !== undefined).length
    
    if (snackCount < 3) {
      issues.push(`Only ${snackCount} snacks planned (need 3)`)
    }

    snacks.forEach((snack, index) => {
      if (snack) {
        totalCarbs += snack.nutrition.carbs
        
        // Evening snack must have protein
        if (index === 2 && snack.nutrition.protein < 5) {
          issues.push('Bedtime snack must include protein (min 5g)')
        }
        
        if (!this.isRecipeCompliant(snack)) {
          const snackName = ['Morning', 'Afternoon', 'Evening'][index]
          issues.push(`${snackName} snack carbs (${snack.nutrition.carbs}g) outside range 15-30g`)
        }
      }
    })

    // Check total daily carbs
    if (totalCarbs < MEDICAL_GUIDELINES.daily.minCarbs) {
      issues.push(`Total daily carbs (${totalCarbs}g) below minimum 175g`)
    }

    return {
      isValid: issues.length === 0,
      totalCarbs,
      issues
    }
  }

  // Get meal timing recommendations
  static getMealTiming(): {
    breakfast: string
    morningSnack: string
    lunch: string
    afternoonSnack: string
    dinner: string
    eveningSnack: string
  } {
    return {
      breakfast: '7:00-8:00 AM',
      morningSnack: '10:00-10:30 AM',
      lunch: '12:00-1:00 PM',
      afternoonSnack: '3:00-3:30 PM',
      dinner: '6:00-7:00 PM',
      eveningSnack: '9:00-10:00 PM (before bed)'
    }
  }

  // Get portion guide for carb counting
  static getPortionGuide(category: string): {
    grains: string[]
    fruits: string[]
    dairy: string[]
  } {
    return {
      grains: [
        '1 slice bread = 1 choice (15g)',
        '1/3 cup rice = 1 choice (15g)',
        '1/2 cup pasta = 1 choice (15g)',
        '3/4 cup cereal = 1 choice (15g)'
      ],
      fruits: [
        '1 medium apple = 1 choice (15g)',
        '1/2 banana = 1 choice (15g)',
        '1 cup berries = 1 choice (15g)',
        '2 small clementines = 1 choice (15g)'
      ],
      dairy: [
        '1 cup milk = 1 choice (15g)',
        '3/4 cup plain yogurt = 1 choice (15g)',
        '1/2 cup chocolate milk = 1 choice (15g)'
      ]
    }
  }
}