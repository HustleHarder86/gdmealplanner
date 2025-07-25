"use client";

import { useState } from 'react';
import { MealPlan, DayMealPlan } from '@/src/types/meal-plan';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import MealCard from './MealCard';

interface MealPlanDisplayProps {
  mealPlan: MealPlan;
  onSwapMeal: (dayIndex: number, mealType: string) => void;
  onUpdateRecipes: () => void;
  onGenerateNew: () => void;
  isGenerating?: boolean;
}

export default function MealPlanDisplay({
  mealPlan,
  onSwapMeal,
  onUpdateRecipes,
  onGenerateNew,
  isGenerating = false
}: MealPlanDisplayProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([0]); // First day expanded by default
  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);

  const handleViewRecipe = (recipeId: string) => {
    window.open(`/recipes/${recipeId}`, '_blank');
  };

  return (
    <div>
      {/* Plan Header */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">{mealPlan.name}</h2>
            <p className="text-gray-600">
              Week of {new Date(mealPlan.weekStartDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setExpandedDays(expandedDays.length === 7 ? [] : [0,1,2,3,4,5,6])}
              variant="outline"
              size="sm"
            >
              {expandedDays.length === 7 ? '➖ Collapse All' : '➕ Expand All'}
            </Button>
            <Button
              onClick={onUpdateRecipes}
              disabled={isGenerating}
              variant="secondary"
              size="sm"
            >
              {isGenerating ? '🔄 Updating...' : '✨ Update Recipes'}
            </Button>
            <Button
              onClick={onGenerateNew}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? '🧠 Generating...' : '🎲 New Plan'}
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
            >
              🖨️ Print
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Days - Collapsible */}
      <div className="space-y-3">
        {mealPlan.days.map((day, index) => {
          const isExpanded = expandedDays.includes(index);
          const dayDate = new Date(day.date);
          const isToday = new Date().toDateString() === dayDate.toDateString();
          
          return (
            <Card key={day.date} className={`overflow-hidden ${isToday ? 'ring-2 ring-green-500' : ''}`}>
              {/* Day Header - Always Visible */}
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setExpandedDays(isExpanded 
                    ? expandedDays.filter(d => d !== index)
                    : [...expandedDays, index]
                  );
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        {isToday && <span className="ml-2 text-green-600 text-sm">(Today)</span>}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {day.totalNutrition.carbohydrates}g carbs • {day.totalNutrition.calories} cal • {day.totalNutrition.protein}g protein
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Object.values(day.meals).filter(m => m.recipeId).length} meals planned
                  </div>
                </div>
              </div>
              
              {/* Day Content - Collapsible */}
              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(day.meals).map(([mealType, meal]) => {
                      const swapKey = `${index}-${mealType}`;
                      return (
                        <MealCard
                          key={mealType}
                          mealType={mealType}
                          meal={meal}
                          onSwap={async () => {
                            setSwappingMeal(swapKey);
                            await onSwapMeal(index, mealType);
                            setSwappingMeal(null);
                          }}
                          onViewRecipe={handleViewRecipe}
                          isSwapping={swappingMeal === swapKey}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}