"use client";

import { useState } from "react";
import { DIETARY_LABELS, DietaryRestriction } from "@/src/types/dietary";
import { useDietaryPreferences } from "@/src/hooks/useDietaryPreferences";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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

  const handleAddDislike = () => {
    if (newDislike.trim()) {
      addDislike(newDislike.trim());
      setNewDislike("");
    }
  };

  const restrictionOptions: DietaryRestriction[] = [
    'vegetarian',
    'vegan',
    'glutenFree',
    'dairyFree',
    'nutFree',
    'pescatarian',
    'eggFree',
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
              {preferences.restrictions.length > 0
                ? `Active: ${preferences.restrictions.map(r => DIETARY_LABELS[r]).join(", ")}`
                : "No dietary restrictions set"}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {restrictionOptions.map((restriction) => (
                <label
                  key={restriction}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={preferences.restrictions.includes(restriction)}
                    onChange={() => toggleRestriction(restriction)}
                    disabled={saving}
                    className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    {DIETARY_LABELS[restriction]}
                  </span>
                </label>
              ))}
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
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Dietary restrictions will filter available recipes. 
              Ensure you have enough variety with your selected restrictions before generating a meal plan.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}