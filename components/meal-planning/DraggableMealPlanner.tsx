'use client'

import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, Active, Over } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { MealPlanEntry, MealType, Recipe, DayMealPlan } from '@/src/types/firebase'
import { MealPlanCard } from './MealPlanCard'

interface DraggableMealPlannerProps {
  weekPlan: { [key: string]: DayMealPlan }
  recipes: { [id: string]: Recipe }
  onUpdate: (updatedPlan: { [key: string]: DayMealPlan }) => void
  className?: string
}

interface DraggableItemProps {
  id: string
  entry: MealPlanEntry
  recipe?: Recipe
  date: string
}

function DraggableItem({ id, entry, recipe, date }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MealPlanCard
        entry={entry}
        recipe={recipe}
        isDragging={isDragging}
        className="cursor-move"
      />
    </div>
  )
}

export function DraggableMealPlanner({
  weekPlan,
  recipes,
  onUpdate,
  className = ''
}: DraggableMealPlannerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<{ entry: MealPlanEntry; recipe?: Recipe; date: string } | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Get all days of the week
  const weekDays = Object.keys(weekPlan).sort()
  
  // Create a flat list of all meal entries with unique IDs
  const allMeals = weekDays.flatMap(date => 
    weekPlan[date].meals.map((meal, index) => ({
      id: `${date}-${meal.mealType}-${index}`,
      date,
      entry: meal,
      recipe: recipes[meal.recipeId]
    }))
  )
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const item = allMeals.find(meal => meal.id === active.id)
    if (item) {
      setActiveItem(item)
    }
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) {
      setActiveId(null)
      setActiveItem(null)
      return
    }
    
    const activeItem = allMeals.find(meal => meal.id === active.id)
    const overItem = allMeals.find(meal => meal.id === over.id)
    
    if (!activeItem || !overItem) {
      setActiveId(null)
      setActiveItem(null)
      return
    }
    
    // Create a new week plan with the swapped meals
    const newWeekPlan = { ...weekPlan }
    
    // If dragging within the same day
    if (activeItem.date === overItem.date) {
      const dayPlan = { ...newWeekPlan[activeItem.date] }
      const oldIndex = dayPlan.meals.findIndex(m => m === activeItem.entry)
      const newIndex = dayPlan.meals.findIndex(m => m === overItem.entry)
      
      dayPlan.meals = arrayMove(dayPlan.meals, oldIndex, newIndex)
      newWeekPlan[activeItem.date] = dayPlan
    } else {
      // If dragging between different days, swap the meals
      const activeDay = { ...newWeekPlan[activeItem.date] }
      const overDay = { ...newWeekPlan[overItem.date] }
      
      const activeIndex = activeDay.meals.findIndex(m => m === activeItem.entry)
      const overIndex = overDay.meals.findIndex(m => m === overItem.entry)
      
      // Swap the meals
      const temp = activeDay.meals[activeIndex]
      activeDay.meals[activeIndex] = overDay.meals[overIndex]
      overDay.meals[overIndex] = temp
      
      newWeekPlan[activeItem.date] = activeDay
      newWeekPlan[overItem.date] = overDay
    }
    
    onUpdate(newWeekPlan)
    setActiveId(null)
    setActiveItem(null)
  }
  
  const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`grid grid-cols-1 lg:grid-cols-7 gap-4 ${className}`}>
        {weekDays.map(date => {
          const dayPlan = weekPlan[date]
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
          const dayNumber = new Date(date).getDate()
          
          // Sort meals by meal type
          const sortedMeals = [...dayPlan.meals].sort((a, b) => 
            mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
          )
          
          const dayMealIds = sortedMeals.map((meal, index) => 
            `${date}-${meal.mealType}-${dayPlan.meals.indexOf(meal)}`
          )
          
          return (
            <motion.div
              key={date}
              className="bg-neutral-50 rounded-lg p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-center mb-3">
                <div className="font-semibold text-neutral-900">{dayName}</div>
                <div className="text-2xl font-bold text-primary-600">{dayNumber}</div>
              </div>
              
              <SortableContext
                items={dayMealIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sortedMeals.map((meal, index) => {
                    const originalIndex = dayPlan.meals.indexOf(meal)
                    const id = `${date}-${meal.mealType}-${originalIndex}`
                    const recipe = recipes[meal.recipeId]
                    
                    return (
                      <DraggableItem
                        key={id}
                        id={id}
                        entry={meal}
                        recipe={recipe}
                        date={date}
                      />
                    )
                  })}
                </div>
              </SortableContext>
              
              {sortedMeals.length === 0 && (
                <div className="text-center py-8 text-neutral-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-sm">No meals planned</p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
      
      <DragOverlay>
        {activeId && activeItem && (
          <div className="opacity-90 transform rotate-3">
            <MealPlanCard
              entry={activeItem.entry}
              recipe={activeItem.recipe}
              isDragging={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// Simplified version without drag and drop for mobile
export function SimpleMealPlanner({
  weekPlan,
  recipes,
  onSwap,
  className = ''
}: {
  weekPlan: { [key: string]: DayMealPlan }
  recipes: { [id: string]: Recipe }
  onSwap?: (date: string, mealIndex: number) => void
  className?: string
}) {
  const weekDays = Object.keys(weekPlan).sort()
  const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
  
  return (
    <div className={`space-y-4 ${className}`}>
      {weekDays.map(date => {
        const dayPlan = weekPlan[date]
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        
        // Sort meals by meal type
        const sortedMeals = [...dayPlan.meals].sort((a, b) => 
          mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
        )
        
        return (
          <motion.div
            key={date}
            className="bg-white rounded-lg shadow p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="font-semibold text-lg text-neutral-900 mb-3">{dayName}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {sortedMeals.map((meal, index) => {
                const recipe = recipes[meal.recipeId]
                const originalIndex = dayPlan.meals.indexOf(meal)
                
                return (
                  <MealPlanCard
                    key={`${date}-${meal.mealType}-${index}`}
                    entry={meal}
                    recipe={recipe}
                    onSwap={onSwap ? () => onSwap(date, originalIndex) : undefined}
                  />
                )
              })}
            </div>
            
            {sortedMeals.length === 0 && (
              <div className="text-center py-6 text-neutral-400">
                <p className="text-sm">No meals planned for this day</p>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}