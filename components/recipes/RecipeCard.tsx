'use client'

import { Recipe } from '@/src/types/firebase'
import { motion } from 'framer-motion'

interface RecipeCardProps {
  recipe: Recipe
  onClick?: () => void
  className?: string
}

export function RecipeCard({ recipe, onClick, className = '' }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime
  const rating = recipe.averageRating || 0
  
  return (
    <motion.article
      className={`group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Recipe: ${recipe.title}`}
    >
      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg 
              className="w-16 h-16 text-primary-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 13h18M3 13a9 9 0 0118 0m-18 0a9 9 0 0118 0M3 13l7.586-7.586a2 2 0 012.828 0L21 13m-18 0l7.586 7.586a2 2 0 002.828 0L21 13" 
              />
            </svg>
          </div>
        )}
        
        {/* Quick stats overlay */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {recipe.tags.includes('gd-friendly') && (
            <span className="bg-secondary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              GD Friendly
            </span>
          )}
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {recipe.title}
        </h3>
        
        {/* Key nutritional info */}
        <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{totalTime} min</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18m-9 6h9" />
            </svg>
            <span>{recipe.nutrition.carbs}g carbs</span>
          </div>
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2" aria-label={`Rating: ${rating.toFixed(1)} out of 5`}>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= rating ? 'text-accent-500' : 'text-neutral-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-neutral-600">
            {rating > 0 ? rating.toFixed(1) : 'Not rated'}
          </span>
          {recipe.totalRatings && recipe.totalRatings > 0 && (
            <span className="text-xs text-neutral-500">({recipe.totalRatings})</span>
          )}
        </div>
        
        {/* Additional nutrition preview */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-3 text-xs text-neutral-600">
          <span>{recipe.nutrition.calories} cal</span>
          <span>{recipe.nutrition.protein}g protein</span>
          <span>{recipe.nutrition.fat}g fat</span>
        </div>
      </div>
    </motion.article>
  )
}

// Loading skeleton for RecipeCard
export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="h-48 bg-neutral-200" />
      <div className="p-4">
        <div className="h-5 bg-neutral-200 rounded mb-2" />
        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-3" />
        <div className="flex gap-4 mb-3">
          <div className="h-4 bg-neutral-200 rounded w-20" />
          <div className="h-4 bg-neutral-200 rounded w-24" />
        </div>
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-4 h-4 bg-neutral-200 rounded" />
          ))}
        </div>
        <div className="pt-3 border-t border-neutral-100 flex gap-3">
          <div className="h-3 bg-neutral-200 rounded w-16" />
          <div className="h-3 bg-neutral-200 rounded w-20" />
          <div className="h-3 bg-neutral-200 rounded w-16" />
        </div>
      </div>
    </div>
  )
}