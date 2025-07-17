"use client";

import { useState, useEffect } from "react";
import { DIETARY_LABELS, DietaryRestriction } from "@/src/types/dietary";
import { useDietaryPreferences } from "@/src/hooks/useDietaryPreferences";
import { ChevronDown, ChevronUp, Info, Leaf, Wheat, Milk, TreePine, Fish, Egg, Plus } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LocalRecipeService } from "@/src/services/local-recipe-service";
import { DietaryFilterService } from "@/src/services/dietary-filter-service";

export default function DietaryPreferences() {
  const {
    preferences,
    loading,
    saving,
    toggleRestriction,
    addDislike,
    removeDislike,
  } = useDietaryPreferences();

  const [isExpanded, setIsExpanded] = useState(false);
  const [newDislike, setNewDislike] = useState("");
  const [availableRecipes, setAvailableRecipes] = useState<number>(0);

  // Calculate available recipes when preferences change
  useEffect(() => {
    const calculateAvailable = () => {
      const allRecipes = LocalRecipeService.getAllRecipes();
      if (preferences.restrictions.length === 0 && preferences.dislikes.length === 0) {
        setAvailableRecipes(allRecipes.length);
      } else {
        const filtered = DietaryFilterService.filterRecipes(allRecipes, preferences);
        setAvailableRecipes(filtered.suitable.length);
      }
    };
    
    calculateAvailable();
  }, [preferences]);

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      addDislike(newDislike.trim());
      setNewDislike("");
    }
  };

  const restrictionOptions: { key: DietaryRestriction; icon: any }[] = [
    { key: 'vegetarian', icon: Leaf },
    { key: 'vegan', icon: Plus },
    { key: 'glutenFree', icon: Wheat },
    { key: 'dairyFree', icon: Milk },
    { key: 'nutFree', icon: TreePine },
    { key: 'pescatarian', icon: Fish },
    { key: 'eggFree', icon: Egg },
  ];

  if (loading) {
    return (
      <Card className="p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Dietary Preferences
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {preferences.restrictions.length > 0 || preferences.dislikes.length > 0 ? (
                <>
                  <span>
                    Active: {preferences.restrictions.map(r => DIETARY_LABELS[r]).join(", ")}
                    {preferences.dislikes.length > 0 && ` • Avoiding: ${preferences.dislikes.join(", ")}`}
                  </span>
                  <span className="ml-2 text-green-600 font-medium">
                    ({availableRecipes} recipes available)
                  </span>
                </>
              ) : (
                "No dietary restrictions set"
              )}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Dietary Restrictions */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {restrictionOptions.map(({ key, icon: Icon }) => {
                const isChecked = preferences.restrictions.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg transition-colors ${
                      isChecked ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50'
                    } border ${isChecked ? 'border-green-300' : 'border-transparent'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRestriction(key)}
                      disabled={saving}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <Icon className={`h-4 w-4 ${isChecked ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${isChecked ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                      {DIETARY_LABELS[key]}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Disliked Ingredients */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Disliked Ingredients
              <Info className="inline-block h-4 w-4 ml-1 text-gray-400" />
            </h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddDislike()}
                placeholder="e.g., mushrooms, cilantro"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Button
                onClick={handleAddDislike}
                disabled={!newDislike.trim() || saving}
                size="sm"
              >
                Add
              </Button>
            </div>
            {preferences.dislikes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferences.dislikes.map((dislike) => (
                  <span
                    key={dislike}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    {dislike}
                    <button
                      onClick={() => removeDislike(dislike)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      disabled={saving}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-900">
                <p className="font-medium mb-1">How dietary preferences work:</p>
                <ul className="space-y-1 text-green-800">
                  <li>• Recipes are automatically filtered based on your selections</li>
                  <li>• {availableRecipes} recipes match your current preferences</li>
                  <li>• All generated meal plans will respect these restrictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}