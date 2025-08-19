"use client";

import { useState, useRef, useEffect } from 'react';
import { NutritionEntry, MealType } from "@/src/types/nutrition";
import AnimatedCounter from "../ui/AnimatedCounter";

interface SwipeableMealCardProps {
  mealType: MealType;
  label: string;
  entries: NutritionEntry[];
  onSwipeLeft?: () => void; // Edit action
  onSwipeRight?: () => void; // Delete action
  onTap?: () => void; // View details
  carbTarget: { min: number; max: number };
}

export default function SwipeableMealCard({
  mealType,
  label,
  entries,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  carbTarget
}: SwipeableMealCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const totalCarbs = entries.reduce((sum, entry) => sum + entry.totalNutrition.carbohydrates, 0);
  const totalCalories = entries.reduce((sum, entry) => sum + entry.totalNutrition.calories, 0);

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'morning-snack': return '🍎';
      case 'afternoon-snack': return '🥨';
      case 'bedtime-snack': return '🌛';
      default: return '🍽️';
    }
  };

  const getCardBorderStyle = () => {
    if (totalCarbs === 0) return 'border-neutral-200';
    if (totalCarbs < carbTarget.min) return 'nutrition-warning border-2';
    if (totalCarbs > carbTarget.max) return 'nutrition-danger border-2';
    return 'nutrition-success border-2';
  };

  const getMealTimeStyle = () => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'meal-breakfast';
      case 'lunch': return 'meal-lunch'; 
      case 'dinner': return 'meal-dinner';
      default: return 'meal-snack';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100; // pixels
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0 && onSwipeRight) {
        // Swipe right - delete
        setShowActions(true);
        onSwipeRight();
      } else if (dragOffset < 0 && onSwipeLeft) {
        // Swipe left - edit
        setShowActions(true);
        onSwipeLeft();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleClick = () => {
    if (!isDragging && onTap) {
      onTap();
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Action buttons revealed on swipe */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4">
        <button 
          className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg"
          onClick={() => onSwipeLeft?.()}
        >
          ✏️
        </button>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
        <button 
          className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
          onClick={() => onSwipeRight?.()}
        >
          🗑️
        </button>
      </div>

      {/* Main card */}
      <div
        ref={cardRef}
        className={`bg-white rounded-xl p-4 shadow-md border mobile-card-swipeable touch-feedback ${getCardBorderStyle()} ${isDragging ? 'swiping' : ''}`}
        style={{
          transform: `translateX(${dragOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {/* Mobile-optimized header */}
        <div className="meal-card-mobile">
          <div className="meal-header">
            <div className="flex items-center gap-3 w-full">
              <div className={`meal-icon rounded-xl flex items-center justify-center border ${getMealTimeStyle()}`}>
                {getMealIcon(mealType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-neutral-800 truncate">{label}</h3>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    🌾 <AnimatedCounter value={totalCarbs} suffix="g" /> carbs
                  </span>
                  <span className="flex items-center gap-1">
                    🔥 <AnimatedCounter value={totalCalories} /> cal
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
              totalCarbs === 0 ? 'nutrition-info' :
              totalCarbs < carbTarget.min ? 'nutrition-warning' :
              totalCarbs > carbTarget.max ? 'nutrition-danger' :
              'nutrition-success'
            }`}>
              {totalCarbs === 0 ? '⚪ No food' : 
               totalCarbs < carbTarget.min ? '🟡 Too low' : 
               totalCarbs > carbTarget.max ? '🔴 Too high' : 
               '🟢 On target'}
            </div>
          </div>

          {/* Food entries (simplified for mobile) */}
          {entries.length > 0 ? (
            <div className="space-y-1">
              {entries.slice(0, 2).map((entry, index) => (
                <div key={entry.id || index} className="text-sm text-neutral-600">
                  {entry.foods.slice(0, 1).map((food, foodIndex) => (
                    <span key={foodIndex}>
                      {food.name} • {food.nutrition.carbohydrates}g carbs
                    </span>
                  ))}
                  {entry.foods.length > 1 && (
                    <span className="text-xs opacity-75"> +{entry.foods.length - 1} more</span>
                  )}
                </div>
              ))}
              {entries.length > 2 && (
                <div className="text-xs text-neutral-500">
                  +{entries.length - 2} more entries
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No food logged yet</p>
          )}
        </div>

        {/* Swipe indicator */}
        {!isDragging && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-300 text-xs">
            ← swipe →
          </div>
        )}
      </div>
    </div>
  );
}