"use client";

import { useState } from 'react';
import { MealPlan, DayMealPlan } from '@/src/types/meal-plan';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import MealCard from './MealCard';
import UserRecipeSelector from './UserRecipeSelector';

interface MealPlanDisplayProps {
  mealPlan: MealPlan | null;
  onSwapMeal: (dayIndex: number, mealType: string) => void;
  onSwapWithSpecificRecipe?: (dayIndex: number, mealType: string, recipeId: string) => void;
  onDeleteMeal?: (dayIndex: number, mealType: string) => void;
  onUpdateRecipes: () => void;
  onGenerateNew: () => void;
  onSaveToMyRecipes?: (recipeId: string) => void;
  isGenerating?: boolean;
}

export default function MealPlanDisplay({
  mealPlan,
  onSwapMeal,
  onSwapWithSpecificRecipe,
  onDeleteMeal,
  onUpdateRecipes,
  onGenerateNew,
  onSaveToMyRecipes,
  isGenerating = false
}: MealPlanDisplayProps) {
  // All hooks must be declared before any returns
  const [expandedDays, setExpandedDays] = useState<number[]>([0]); // First day expanded by default
  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<string | null>(null);
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [recipeSelectorOpen, setRecipeSelectorOpen] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<{dayIndex: number, mealType: string, meal: any} | null>(null);
  
  // Show loading state if generating initial meal plan
  if (!mealPlan && isGenerating) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Generating Your Meal Plan...</h2>
          <p className="text-gray-600">Creating a personalized 7-day meal plan</p>
          <p className="text-sm text-gray-500">This only takes a moment</p>
        </div>
      </Card>
    );
  }
  
  // Show empty state if no meal plan
  if (!mealPlan) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">No Meal Plan Yet</h2>
          <p className="text-gray-600">Click below to generate your personalized meal plan</p>
          <Button onClick={onGenerateNew} size="lg">
            Generate Meal Plan
          </Button>
        </div>
      </Card>
    );
  }

  const handleViewRecipe = (recipeId: string) => {
    window.open(`/recipes/${recipeId}`, '_blank');
  };

  const handleSaveToMyRecipes = async (recipeId: string) => {
    if (!onSaveToMyRecipes) return;
    
    setSavingRecipe(recipeId);
    try {
      await onSaveToMyRecipes(recipeId);
    } finally {
      setSavingRecipe(null);
    }
  };

  const handleOpenRecipeSelector = (dayIndex: number, mealType: string, meal: any) => {
    setSelectedMealSlot({ dayIndex, mealType, meal });
    setRecipeSelectorOpen(true);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (!selectedMealSlot || !onSwapWithSpecificRecipe) return;
    
    const { dayIndex, mealType } = selectedMealSlot;
    await onSwapWithSpecificRecipe(dayIndex, mealType, recipeId);
    setRecipeSelectorOpen(false);
    setSelectedMealSlot(null);
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
                      const deleteKey = `${index}-${mealType}`;
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
                          onSwapWithUserRecipe={onSwapWithSpecificRecipe ? () => {
                            handleOpenRecipeSelector(index, mealType, meal);
                          } : undefined}
                          onDelete={onDeleteMeal ? async () => {
                            setDeletingMeal(deleteKey);
                            await onDeleteMeal(index, mealType);
                            setDeletingMeal(null);
                          } : undefined}
                          onViewRecipe={handleViewRecipe}
                          onSaveToMyRecipes={handleSaveToMyRecipes}
                          isSwapping={swappingMeal === swapKey}
                          isDeleting={deletingMeal === deleteKey}
                          isSaving={savingRecipe === meal.recipeId}
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

      {/* Recipe Selector Modal */}
      {selectedMealSlot && (
        <UserRecipeSelector
          isOpen={recipeSelectorOpen}
          onClose={() => {
            setRecipeSelectorOpen(false);
            setSelectedMealSlot(null);
          }}
          onSelectRecipe={handleSelectRecipe}
          mealType={selectedMealSlot.meal.category}
          targetCarbs={selectedMealSlot.meal.nutrition?.carbohydrates || 30}
          currentRecipeId={selectedMealSlot.meal.recipeId}
        />
      )}
    </div>
  );
}