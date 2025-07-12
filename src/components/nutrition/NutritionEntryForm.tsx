"use client";

import { useState, useEffect } from "react";
import {
  NutritionEntry,
  FoodItem,
  MealType,
  MEAL_TYPE_LABELS,
  calculateNutritionTotals,
  recipeToFoodItem,
} from "@/src/types/nutrition";
import { NutritionService } from "@/src/services/nutrition/nutrition-service";
import { LocalRecipeService } from "@/src/services/local-recipe-service";

interface NutritionEntryFormProps {
  userId: string;
  defaultMealType: MealType;
  onSubmit: (entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  initialData?: Partial<NutritionEntry>;
}

export default function NutritionEntryForm({
  userId,
  defaultMealType,
  onSubmit,
  onCancel,
  initialData,
}: NutritionEntryFormProps) {
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "custom">("search");

  // Custom food form
  const [customFood, setCustomFood] = useState<Partial<FoodItem>>({
    name: "",
    quantity: 1,
    unit: "serving",
    nutrition: {
      calories: 0,
      carbohydrates: 0,
      fiber: 0,
      sugar: 0,
      protein: 0,
      fat: 0,
      saturatedFat: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      setMealType(initialData.mealType || defaultMealType);
      setFoods(initialData.foods || []);
      setNotes(initialData.notes || "");
    }
  }, [initialData, defaultMealType]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      // Search in recipes first
      const recipes = await LocalRecipeService.searchRecipes(searchTerm);
      const recipeResults = recipes.slice(0, 5).map(recipe => ({
        type: "recipe",
        data: recipe,
      }));

      // Search in common foods
      const commonFoods = await NutritionService.searchFoods(searchTerm, userId);
      const foodResults = commonFoods.slice(0, 5).map(food => ({
        type: "food",
        data: food,
      }));

      setSearchResults([...recipeResults, ...foodResults]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFood = (result: any) => {
    let foodItem: FoodItem;

    if (result.type === "recipe") {
      foodItem = recipeToFoodItem(result.data);
    } else {
      foodItem = {
        name: result.data.name,
        brand: result.data.brand,
        quantity: result.data.defaultQuantity,
        unit: result.data.defaultUnit,
        nutrition: result.data.nutrition,
      };
    }

    setFoods([...foods, foodItem]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleAddCustomFood = () => {
    if (!customFood.name || !customFood.nutrition) return;

    const foodItem: FoodItem = {
      name: customFood.name,
      quantity: customFood.quantity || 1,
      unit: customFood.unit || "serving",
      nutrition: customFood.nutrition,
      isCustom: true,
    };

    setFoods([...foods, foodItem]);

    // Reset custom food form
    setCustomFood({
      name: "",
      quantity: 1,
      unit: "serving",
      nutrition: {
        calories: 0,
        carbohydrates: 0,
        fiber: 0,
        sugar: 0,
        protein: 0,
        fat: 0,
        saturatedFat: 0,
      },
    });
  };

  const handleRemoveFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedFoods = [...foods];
    const originalFood = foods[index];
    const scaleFactor = quantity / originalFood.quantity;

    updatedFoods[index] = {
      ...originalFood,
      quantity,
      nutrition: {
        calories: Math.round(originalFood.nutrition.calories * scaleFactor),
        carbohydrates: Math.round(originalFood.nutrition.carbohydrates * scaleFactor),
        fiber: Math.round(originalFood.nutrition.fiber * scaleFactor),
        sugar: Math.round(originalFood.nutrition.sugar * scaleFactor),
        protein: Math.round(originalFood.nutrition.protein * scaleFactor),
        fat: Math.round(originalFood.nutrition.fat * scaleFactor),
        saturatedFat: Math.round(originalFood.nutrition.saturatedFat * scaleFactor),
      },
    };

    setFoods(updatedFoods);
  };

  const handleSubmit = () => {
    if (foods.length === 0) {
      alert("Please add at least one food item");
      return;
    }

    const totalNutrition = calculateNutritionTotals(foods);

    const entry: Omit<NutritionEntry, "id" | "createdAt" | "updatedAt"> = {
      userId,
      timestamp: new Date(),
      mealType,
      foods,
      totalNutrition,
      notes,
    };

    onSubmit(entry);
  };

  const totalNutrition = calculateNutritionTotals(foods);

  return (
    <div className="space-y-6">
      {/* Meal Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Meal Type</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Food Search/Add Tabs */}
      <div>
        <div className="flex border-b border-neutral-200 mb-4">
          <button
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 font-medium ${
              activeTab === "search"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-neutral-600"
            }`}
          >
            Search Foods
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`px-4 py-2 font-medium ${
              activeTab === "custom"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-neutral-600"
            }`}
          >
            Add Custom
          </button>
        </div>

        {activeTab === "search" ? (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search recipes or foods..."
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300"
              >
                {searching ? "..." : "Search"}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddFood(result)}
                    className="w-full text-left p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium">{result.data.name || result.data.title}</div>
                    <div className="text-sm text-neutral-600">
                      {result.type === "recipe" ? (
                        <>
                          {result.data.carbs}g carbs • {result.data.calories} cal per serving
                        </>
                      ) : (
                        <>
                          {result.data.nutrition.carbohydrates}g carbs • {result.data.nutrition.calories} cal
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={customFood.name || ""}
              onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
              placeholder="Food name"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-neutral-600">Quantity</label>
                <input
                  type="number"
                  value={customFood.quantity || 1}
                  onChange={(e) => setCustomFood({ ...customFood, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">Unit</label>
                <input
                  type="text"
                  value={customFood.unit || "serving"}
                  onChange={(e) => setCustomFood({ ...customFood, unit: e.target.value })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-neutral-600">Calories</label>
                <input
                  type="number"
                  value={customFood.nutrition?.calories || 0}
                  onChange={(e) => setCustomFood({
                    ...customFood,
                    nutrition: { ...customFood.nutrition!, calories: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">Carbs (g)</label>
                <input
                  type="number"
                  value={customFood.nutrition?.carbohydrates || 0}
                  onChange={(e) => setCustomFood({
                    ...customFood,
                    nutrition: { ...customFood.nutrition!, carbohydrates: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">Protein (g)</label>
                <input
                  type="number"
                  value={customFood.nutrition?.protein || 0}
                  onChange={(e) => setCustomFood({
                    ...customFood,
                    nutrition: { ...customFood.nutrition!, protein: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-600">Fat (g)</label>
                <input
                  type="number"
                  value={customFood.nutrition?.fat || 0}
                  onChange={(e) => setCustomFood({
                    ...customFood,
                    nutrition: { ...customFood.nutrition!, fat: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1 border border-neutral-300 rounded"
                />
              </div>
            </div>

            <button
              onClick={handleAddCustomFood}
              disabled={!customFood.name}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-neutral-300"
            >
              Add Custom Food
            </button>
          </div>
        )}
      </div>

      {/* Added Foods */}
      {foods.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Added Foods</h3>
          <div className="space-y-2">
            {foods.map((food, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-neutral-600">
                    {food.nutrition.carbohydrates}g carbs • {food.nutrition.calories} cal
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={food.quantity}
                    onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-neutral-300 rounded"
                    min="0.1"
                    step="0.1"
                  />
                  <span className="text-sm text-neutral-600">{food.unit}</span>
                  <button
                    onClick={() => handleRemoveFood(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Nutrition */}
          <div className="mt-3 p-3 bg-primary-50 rounded-lg">
            <div className="text-sm font-medium">Total Nutrition:</div>
            <div className="text-sm text-primary-800 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              <span>{totalNutrition.calories} cal</span>
              <span>{totalNutrition.carbohydrates}g carbs</span>
              <span>{totalNutrition.protein}g protein</span>
              <span>{totalNutrition.fat}g fat</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Took prenatal vitamin, felt satisfied..."
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={foods.length === 0}
          className="flex-1 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 transition-colors"
        >
          Save Entry
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}