'use client'

import { motion } from 'framer-motion'
import { NutritionInfo } from '@/src/types/firebase'

interface NutritionRingProps {
  current: NutritionInfo
  target: NutritionInfo
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

interface RingData {
  name: string
  current: number
  target: number
  color: string
  unit: string
}

const sizeConfig = {
  sm: { radius: 40, strokeWidth: 8, fontSize: 'text-xs', spacing: 'gap-2' },
  md: { radius: 60, strokeWidth: 10, fontSize: 'text-sm', spacing: 'gap-4' },
  lg: { radius: 80, strokeWidth: 12, fontSize: 'text-base', spacing: 'gap-6' }
}

export function NutritionRing({ 
  current, 
  target, 
  size = 'md', 
  showLabels = true,
  className = '' 
}: NutritionRingProps) {
  const config = sizeConfig[size]
  const circumference = 2 * Math.PI * config.radius
  
  const ringData: RingData[] = [
    { name: 'Calories', current: current.calories, target: target.calories, color: '#e85b3c', unit: '' },
    { name: 'Carbs', current: current.carbs, target: target.carbs, color: '#f09247', unit: 'g' },
    { name: 'Protein', current: current.protein, target: target.protein, color: '#5c955f', unit: 'g' },
    { name: 'Fat', current: current.fat, target: target.fat, color: '#7db281', unit: 'g' }
  ]
  
  return (
    <div className={`flex flex-wrap justify-center ${config.spacing} ${className}`}>
      {ringData.map((nutrient) => {
        const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100)
        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
        
        return (
          <motion.div
            key={nutrient.name}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <svg
                width={config.radius * 2 + config.strokeWidth}
                height={config.radius * 2 + config.strokeWidth}
                className="transform -rotate-90"
              >
                {/* Background ring */}
                <circle
                  cx={config.radius + config.strokeWidth / 2}
                  cy={config.radius + config.strokeWidth / 2}
                  r={config.radius}
                  stroke="#e5e5e5"
                  strokeWidth={config.strokeWidth}
                  fill="none"
                />
                
                {/* Progress ring */}
                <motion.circle
                  cx={config.radius + config.strokeWidth / 2}
                  cy={config.radius + config.strokeWidth / 2}
                  r={config.radius}
                  stroke={nutrient.color}
                  strokeWidth={config.strokeWidth}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-semibold ${config.fontSize}`}>
                  {nutrient.current}{nutrient.unit}
                </span>
                <span className={`text-neutral-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                  /{nutrient.target}{nutrient.unit}
                </span>
              </div>
            </div>
            
            {showLabels && (
              <div className="mt-2 text-center">
                <div className={`font-medium ${config.fontSize}`}>{nutrient.name}</div>
                <div className={`text-neutral-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                  {percentage.toFixed(0)}%
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Compact version for smaller displays
export function NutritionRingCompact({ 
  current, 
  target, 
  className = '' 
}: Omit<NutritionRingProps, 'size' | 'showLabels'>) {
  const nutrients = [
    { name: 'Calories', current: current.calories, target: target.calories, color: '#e85b3c', unit: '' },
    { name: 'Carbs', current: current.carbs, target: target.carbs, color: '#f09247', unit: 'g' },
    { name: 'Protein', current: current.protein, target: target.protein, color: '#5c955f', unit: 'g' },
    { name: 'Fat', current: current.fat, target: target.fat, color: '#7db281', unit: 'g' }
  ]
  
  return (
    <div className={`space-y-3 ${className}`}>
      {nutrients.map((nutrient) => {
        const percentage = Math.min((nutrient.current / nutrient.target) * 100, 100)
        
        return (
          <div key={nutrient.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{nutrient.name}</span>
              <span className="text-neutral-600">
                {nutrient.current}{nutrient.unit} / {nutrient.target}{nutrient.unit}
              </span>
            </div>
            <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ backgroundColor: nutrient.color }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Loading skeleton for NutritionRing
export function NutritionRingSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const config = sizeConfig[size]
  
  return (
    <div className={`flex flex-wrap justify-center ${config.spacing} animate-pulse`}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div 
            className="bg-neutral-200 rounded-full"
            style={{ 
              width: config.radius * 2 + config.strokeWidth,
              height: config.radius * 2 + config.strokeWidth
            }}
          />
          <div className="mt-2 space-y-1">
            <div className="h-4 bg-neutral-200 rounded w-16" />
            <div className="h-3 bg-neutral-200 rounded w-12 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  )
}