'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { FoodSearch } from './FoodSearch'
import { MealType, NutritionInfo } from '@/src/types/firebase'

interface LoggedMeal {
  id: string
  name: string
  nutrition: NutritionInfo
  servings: number
  mealType: MealType
  photoUrl?: string
  timestamp: Date
}

interface MealLoggerProps {
  onLog: (meal: LoggedMeal) => void
  defaultMealType?: MealType
  className?: string
}

const quickAddMeals = [
  {
    id: 'quick-1',
    name: 'Oatmeal with Berries',
    nutrition: { calories: 250, carbs: 45, protein: 8, fat: 5, fiber: 6, sugar: 12, sodium: 150, cholesterol: 0, saturatedFat: 1, transFat: 0 },
    mealType: 'breakfast' as MealType
  },
  {
    id: 'quick-2',
    name: 'Grilled Chicken Salad',
    nutrition: { calories: 320, carbs: 15, protein: 35, fat: 12, fiber: 5, sugar: 8, sodium: 380, cholesterol: 85, saturatedFat: 3, transFat: 0 },
    mealType: 'lunch' as MealType
  },
  {
    id: 'quick-3',
    name: 'Greek Yogurt Parfait',
    nutrition: { calories: 180, carbs: 22, protein: 15, fat: 4, fiber: 2, sugar: 18, sodium: 80, cholesterol: 15, saturatedFat: 2, transFat: 0 },
    mealType: 'snack' as MealType
  }
]

export function MealLogger({
  onLog,
  defaultMealType = 'breakfast',
  className = ''
}: MealLoggerProps) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType)
  const [servings, setServings] = useState(1)
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLogging, setIsLogging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleQuickAdd = (meal: typeof quickAddMeals[0]) => {
    const loggedMeal: LoggedMeal = {
      id: `${meal.id}-${Date.now()}`,
      name: meal.name,
      nutrition: meal.nutrition,
      servings: 1,
      mealType: meal.mealType,
      timestamp: new Date()
    }
    
    onLog(loggedMeal)
    // Show success feedback
    setIsLogging(true)
    setTimeout(() => setIsLogging(false), 1000)
  }
  
  const handleLogMeal = async () => {
    if (!selectedFood) return
    
    setIsLogging(true)
    
    try {
      // In real app, upload photo to storage if exists
      let photoUrl: string | undefined
      if (photoFile) {
        // photoUrl = await uploadPhoto(photoFile)
        photoUrl = photoPreview || undefined // Mock for now
      }
      
      const adjustedNutrition: NutritionInfo = {
        calories: Math.round(selectedFood.nutrition.calories * servings),
        carbs: Math.round(selectedFood.nutrition.carbs * servings),
        protein: Math.round(selectedFood.nutrition.protein * servings),
        fat: Math.round(selectedFood.nutrition.fat * servings),
        fiber: selectedFood.nutrition.fiber ? Math.round(selectedFood.nutrition.fiber * servings) : undefined,
        sugar: selectedFood.nutrition.sugar ? Math.round(selectedFood.nutrition.sugar * servings) : undefined,
        sodium: selectedFood.nutrition.sodium ? Math.round(selectedFood.nutrition.sodium * servings) : undefined,
        cholesterol: selectedFood.nutrition.cholesterol ? Math.round(selectedFood.nutrition.cholesterol * servings) : undefined,
        saturatedFat: selectedFood.nutrition.saturatedFat ? Math.round(selectedFood.nutrition.saturatedFat * servings) : undefined,
        transFat: selectedFood.nutrition.transFat ? Math.round(selectedFood.nutrition.transFat * servings) : undefined
      }
      
      const loggedMeal: LoggedMeal = {
        id: `${selectedFood.id}-${Date.now()}`,
        name: selectedFood.name,
        nutrition: adjustedNutrition,
        servings,
        mealType,
        photoUrl,
        timestamp: new Date()
      }
      
      onLog(loggedMeal)
      
      // Reset form
      setSelectedFood(null)
      setServings(1)
      setPhotoFile(null)
      setPhotoPreview(null)
    } finally {
      setIsLogging(false)
    }
  }
  
  const mealTypeOptions: { value: MealType; label: string; icon: JSX.Element }[] = [
    {
      value: 'breakfast',
      label: 'Breakfast',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
    {
      value: 'lunch',
      label: 'Lunch',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
    },
    {
      value: 'dinner',
      label: 'Dinner',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    {
      value: 'snack',
      label: 'Snack',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    }
  ]
  
  return (
    <motion.div 
      className={`bg-white rounded-lg shadow p-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-lg font-semibold mb-4">Log Meal</h3>
      
      {/* Meal type selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Meal Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {mealTypeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMealType(option.value)}
              className={`
                flex items-center justify-center gap-2 p-2 rounded-lg transition-colors
                ${mealType === option.value 
                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                  : 'bg-neutral-50 text-neutral-700 border-2 border-transparent hover:bg-neutral-100'
                }
              `}
            >
              {option.icon}
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Quick add section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Quick Add</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {quickAddMeals.map(meal => (
            <motion.button
              key={meal.id}
              type="button"
              onClick={() => handleQuickAdd(meal)}
              className="text-left p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-medium text-sm text-neutral-900">{meal.name}</div>
              <div className="text-xs text-neutral-600 mt-1">
                {meal.nutrition.calories} cal • {meal.nutrition.carbs}g carbs
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Food search */}
      <div className="mb-4">
        <FoodSearch
          onSelect={setSelectedFood}
          label="Search Food"
          placeholder="Search for food or scan barcode..."
        />
      </div>
      
      {/* Selected food details */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-primary-50 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-neutral-900">
                  {selectedFood.name}
                  {selectedFood.brand && (
                    <span className="text-sm text-neutral-600 ml-2">
                      {selectedFood.brand}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-neutral-600">{selectedFood.servingSize}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFood(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Servings adjuster */}
            <div className="flex items-center gap-4 mb-3">
              <label className="text-sm font-medium text-neutral-700">Servings:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-16 text-center border border-neutral-300 rounded px-2 py-1"
                  step="0.5"
                  min="0.5"
                />
                <button
                  type="button"
                  onClick={() => setServings(servings + 0.5)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Adjusted nutrition */}
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{Math.round(selectedFood.nutrition.calories * servings)}</div>
                <div className="text-xs text-neutral-600">Calories</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{Math.round(selectedFood.nutrition.carbs * servings)}g</div>
                <div className="text-xs text-neutral-600">Carbs</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{Math.round(selectedFood.nutrition.protein * servings)}g</div>
                <div className="text-xs text-neutral-600">Protein</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{Math.round(selectedFood.nutrition.fat * servings)}g</div>
                <div className="text-xs text-neutral-600">Fat</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Photo upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Add Photo (optional)
        </label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {photoFile ? 'Change Photo' : 'Take Photo'}
          </Button>
          
          {photoPreview && (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Meal preview"
                className="w-20 h-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Log button */}
      <Button
        onClick={handleLogMeal}
        disabled={!selectedFood || isLogging}
        loading={isLogging}
        fullWidth
      >
        Log Meal
      </Button>
      
      {/* Success animation */}
      <AnimatePresence>
        {isLogging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Meal logged successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Loading skeleton for MealLogger
export function MealLoggerSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-neutral-200 rounded w-24 mb-4" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 bg-neutral-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-10 bg-neutral-200 rounded-lg" />
        <div className="h-20 bg-neutral-200 rounded-lg" />
        <div className="h-10 bg-neutral-200 rounded-lg" />
      </div>
    </div>
  )
}