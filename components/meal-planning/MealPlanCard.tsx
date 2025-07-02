'use client'

import { MealPlanEntry, MealType, Recipe, NutritionInfo } from '@/src/types/firebase'
import { Button } from '@/components/ui'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface MealPlanCardProps {
  entry: MealPlanEntry
  recipe?: Recipe
  onSwap?: () => void
  onRemove?: () => void
  onEdit?: () => void
  isDragging?: boolean
  className?: string
}

const mealTypeConfig: Record<MealType, { label: string; icon: JSX.Element; bgColor: string }> = {
  breakfast: {
    label: 'Breakfast',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    bgColor: 'bg-accent-100'
  },
  lunch: {
    label: 'Lunch',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    bgColor: 'bg-primary-100'
  },
  dinner: {
    label: 'Dinner',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bgColor: 'bg-secondary-100'
  },
  snack: {
    label: 'Snack',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    bgColor: 'bg-neutral-100'
  }
}

export function MealPlanCard({ 
  entry, 
  recipe, 
  onSwap, 
  onRemove, 
  onEdit,
  isDragging = false,
  className = '' 
}: MealPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const mealConfig = mealTypeConfig[entry.mealType]
  
  // Calculate nutrition based on servings
  const adjustedNutrition = recipe ? {
    calories: Math.round(recipe.nutrition.calories * entry.servings),
    carbs: Math.round(recipe.nutrition.carbs * entry.servings),
    protein: Math.round(recipe.nutrition.protein * entry.servings),
    fat: Math.round(recipe.nutrition.fat * entry.servings)
  } : null

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all ${isDragging ? 'opacity-50' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      layout
    >
      {/* Header */}
      <div className={`px-4 py-3 rounded-t-lg ${mealConfig.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-neutral-700">
              {mealConfig.icon}
            </div>
            <h3 className="font-medium text-neutral-900">{mealConfig.label}</h3>
            {entry.servings !== 1 && (
              <span className="text-sm text-neutral-600">({entry.servings} servings)</span>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg 
              className={`w-5 h-5 text-neutral-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h4 className="font-medium text-neutral-900 mb-2 line-clamp-2">
          {entry.recipeName}
        </h4>
        
        {/* Quick nutrition info */}
        {adjustedNutrition && (
          <div className="grid grid-cols-4 gap-2 text-sm mb-3">
            <div className="text-center">
              <div className="text-neutral-500 text-xs">Calories</div>
              <div className="font-medium">{adjustedNutrition.calories}</div>
            </div>
            <div className="text-center">
              <div className="text-neutral-500 text-xs">Carbs</div>
              <div className="font-medium">{adjustedNutrition.carbs}g</div>
            </div>
            <div className="text-center">
              <div className="text-neutral-500 text-xs">Protein</div>
              <div className="font-medium">{adjustedNutrition.protein}g</div>
            </div>
            <div className="text-center">
              <div className="text-neutral-500 text-xs">Fat</div>
              <div className="font-medium">{adjustedNutrition.fat}g</div>
            </div>
          </div>
        )}
        
        {/* Expanded details */}
        {isExpanded && recipe && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-neutral-100"
          >
            {recipe.description && (
              <p className="text-sm text-neutral-600 mb-3">{recipe.description}</p>
            )}
            
            {entry.notes && (
              <div className="bg-neutral-50 rounded p-2 mb-3">
                <p className="text-sm text-neutral-700">
                  <span className="font-medium">Note:</span> {entry.notes}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{recipe.prepTime + recipe.cookTime} min total time</span>
            </div>
          </motion.div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {onSwap && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwap}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          )}
          
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Loading skeleton for MealPlanCard
export function MealPlanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-neutral-200" />
      <div className="p-4">
        <div className="h-5 bg-neutral-200 rounded mb-3" />
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-3 bg-neutral-200 rounded mb-1" />
              <div className="h-4 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-neutral-200 rounded flex-1" />
          <div className="h-8 bg-neutral-200 rounded flex-1" />
        </div>
      </div>
    </div>
  )
}