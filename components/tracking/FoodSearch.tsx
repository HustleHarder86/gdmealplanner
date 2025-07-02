'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NutritionInfo } from '@/src/types/firebase'

interface FoodItem {
  id: string
  name: string
  brand?: string
  nutrition: NutritionInfo
  servingSize: string
  category: string
}

interface FoodSearchProps {
  onSelect: (food: FoodItem) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  className?: string
}

// Mock food database - in real app, this would come from an API or Firebase
const mockFoodDatabase: FoodItem[] = [
  {
    id: '1',
    name: 'Apple',
    nutrition: { calories: 95, carbs: 25, protein: 0.5, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2, cholesterol: 0, saturatedFat: 0.1, transFat: 0 },
    servingSize: '1 medium (182g)',
    category: 'Fruits'
  },
  {
    id: '2',
    name: 'Greek Yogurt',
    brand: 'Chobani',
    nutrition: { calories: 100, carbs: 6, protein: 17, fat: 0, fiber: 0, sugar: 6, sodium: 65, cholesterol: 10, saturatedFat: 0, transFat: 0 },
    servingSize: '1 container (150g)',
    category: 'Dairy'
  },
  {
    id: '3',
    name: 'Whole Wheat Bread',
    brand: 'Dave\'s Killer Bread',
    nutrition: { calories: 110, carbs: 22, protein: 5, fat: 1.5, fiber: 3, sugar: 5, sodium: 170, cholesterol: 0, saturatedFat: 0, transFat: 0 },
    servingSize: '1 slice (45g)',
    category: 'Grains'
  },
  {
    id: '4',
    name: 'Almonds',
    nutrition: { calories: 164, carbs: 6, protein: 6, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 0, cholesterol: 0, saturatedFat: 1.1, transFat: 0 },
    servingSize: '1 oz (28g)',
    category: 'Nuts & Seeds'
  },
  {
    id: '5',
    name: 'Chicken Breast',
    nutrition: { calories: 165, carbs: 0, protein: 31, fat: 3.6, fiber: 0, sugar: 0, sodium: 74, cholesterol: 85, saturatedFat: 1, transFat: 0 },
    servingSize: '3 oz (85g)',
    category: 'Protein'
  }
]

export function FoodSearch({
  onSelect,
  placeholder = 'Search for food...',
  label,
  required = false,
  error,
  className = ''
}: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<FoodItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hoveredItem, setHoveredItem] = useState<FoodItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Filter results based on query
  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockFoodDatabase.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(query.toLowerCase()))
      )
      setResults(filtered)
      setIsOpen(filtered.length > 0)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }
  
  const handleSelect = (food: FoodItem) => {
    onSelect(food)
    setQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
  }
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-3 py-2 bg-white border rounded-lg transition-colors
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}
            focus:outline-none focus:ring-2 focus:ring-offset-2
          `}
          aria-label={label || 'Search for food'}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="food-search-results"
        />
        <svg 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}
      
      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            id="food-search-results"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-neutral-200 max-h-96 overflow-y-auto"
            role="listbox"
          >
            <div className="p-2">
              {results.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => {
                    setSelectedIndex(index)
                    setHoveredItem(item)
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full text-left p-3 rounded transition-colors
                    ${selectedIndex === index ? 'bg-primary-50' : 'hover:bg-neutral-50'}
                  `}
                  role="option"
                  aria-selected={selectedIndex === index}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-neutral-900">
                        {item.name}
                        {item.brand && (
                          <span className="text-sm text-neutral-500 ml-2">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {item.servingSize} • {item.category}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{item.nutrition.calories} cal</div>
                      <div className="text-neutral-600">{item.nutrition.carbs}g carbs</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Nutrition preview on hover */}
            <AnimatePresence>
              {hoveredItem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-neutral-200 p-4 bg-neutral-50"
                >
                  <h4 className="font-medium text-sm mb-2">Nutrition Facts</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Calories:</span>
                      <span className="font-medium">{hoveredItem.nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Protein:</span>
                      <span className="font-medium">{hoveredItem.nutrition.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Carbs:</span>
                      <span className="font-medium">{hoveredItem.nutrition.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Fat:</span>
                      <span className="font-medium">{hoveredItem.nutrition.fat}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Fiber:</span>
                      <span className="font-medium">{hoveredItem.nutrition.fiber}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Sugar:</span>
                      <span className="font-medium">{hoveredItem.nutrition.sugar}g</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recent searches or suggestions */}
      {!query && !isOpen && (
        <div className="mt-2">
          <p className="text-xs text-neutral-500 mb-1">Quick add:</p>
          <div className="flex flex-wrap gap-1">
            {['Apple', 'Greek Yogurt', 'Almonds'].map(food => (
              <button
                key={food}
                type="button"
                onClick={() => setQuery(food)}
                className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
              >
                {food}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Loading skeleton for FoodSearch
export function FoodSearchSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-20 mb-1" />
      <div className="h-10 bg-neutral-200 rounded-lg" />
      <div className="mt-2 flex gap-1">
        <div className="h-6 bg-neutral-200 rounded-full w-16" />
        <div className="h-6 bg-neutral-200 rounded-full w-20" />
        <div className="h-6 bg-neutral-200 rounded-full w-16" />
      </div>
    </div>
  )
}