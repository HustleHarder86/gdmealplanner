'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Recipe } from '@/lib/mock-data'

interface MealSlotProps {
  mealType: 'breakfast' | 'morning-snack' | 'lunch' | 'afternoon-snack' | 'dinner' | 'evening-snack'
  day: string
  recipe?: Recipe
  targetCarbs: { min: number; max: number }
  onAddRecipe?: () => void
  onRemoveRecipe?: () => void
  onSwapRecipe?: () => void
}

export default function MealSlot({
  mealType,
  day,
  recipe,
  targetCarbs,
  onAddRecipe,
  onRemoveRecipe,
  onSwapRecipe,
}: MealSlotProps) {
  const [showDetails, setShowDetails] = useState(false)

  const mealTypeLabels = {
    'breakfast': 'Breakfast',
    'morning-snack': 'Morning Snack',
    'lunch': 'Lunch',
    'afternoon-snack': 'Afternoon Snack',
    'dinner': 'Dinner',
    'evening-snack': 'Evening Snack',
  }

  const isSnack = mealType.includes('snack')
  const carbTarget = isSnack ? '15-20g' : '30-45g'

  if (!recipe) {
    return (
      <Card variant="bordered" padding="sm" className="h-full min-h-[120px] flex items-center justify-center">
        <button
          onClick={onAddRecipe}
          className="text-center p-4 hover:bg-neutral-50 rounded-lg transition-colors w-full"
        >
          <div className="text-2xl mb-1">+</div>
          <div className="text-sm text-neutral-600">Add {mealTypeLabels[mealType]}</div>
          <div className="text-xs text-neutral-500">{carbTarget} carbs</div>
        </button>
      </Card>
    )
  }

  const isInRange = recipe.nutrition.carbs >= targetCarbs.min && recipe.nutrition.carbs <= targetCarbs.max
  
  return (
    <>
      <Card 
        variant="bordered" 
        padding="sm" 
        className="h-full cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col h-full">
          {/* Recipe Title */}
          <h4 className="font-medium text-sm line-clamp-2 mb-2">{recipe.title}</h4>
          
          {/* Nutrition Info */}
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={isInRange ? 'success' : 'warning'} 
              size="sm"
            >
              {recipe.nutrition.carbs}g carbs
            </Badge>
            <span className="text-xs text-neutral-500">
              {recipe.nutrition.calories} cal
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSwapRecipe?.()
              }}
              className="flex-1 text-xs"
            >
              Swap
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onRemoveRecipe?.()
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>

      {/* Recipe Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={recipe.title}
        description={`${mealTypeLabels[mealType]} for ${day}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Nutrition Summary */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Calories</div>
              <div className="font-semibold">{recipe.nutrition.calories}</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Carbs</div>
              <div className="font-semibold">{recipe.nutrition.carbs}g</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Protein</div>
              <div className="font-semibold">{recipe.nutrition.protein}g</div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-2">
              <div className="text-xs text-neutral-500">Fiber</div>
              <div className="font-semibold">{recipe.nutrition.fiber}g</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" fullWidth onClick={onSwapRecipe}>
              Swap Recipe
            </Button>
            <Button variant="outline" size="sm" fullWidth>
              View Full Recipe
            </Button>
          </div>

          {/* Ingredients Preview */}
          <div>
            <h5 className="font-medium mb-2">Ingredients:</h5>
            <ul className="text-sm text-neutral-600 space-y-1">
              {recipe.ingredients.slice(0, 5).map((ingredient, i) => (
                <li key={i}>• {ingredient}</li>
              ))}
              {recipe.ingredients.length > 5 && (
                <li className="text-neutral-500">• and {recipe.ingredients.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}