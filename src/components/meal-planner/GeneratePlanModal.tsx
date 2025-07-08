import React, { useState } from "react";
import Button from "@/components/ui/Button";

interface GeneratePlanModalProps {
  onGenerate: (startDate: Date) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export function GeneratePlanModal({
  onGenerate,
  onClose,
  isGenerating,
}: GeneratePlanModalProps) {
  const [startDate, setStartDate] = useState(() => {
    // Default to next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split("T")[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(new Date(startDate));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Generate Meal Plan</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Week Starting Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Select the Monday when your meal plan week begins
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What to Expect</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 7-day meal plan following GD guidelines</li>
              <li>• ~180g carbs distributed across 6 meals daily</li>
              <li>• Balanced nutrition for pregnancy</li>
              <li>• Complete shopping list</li>
              <li>• Meals you can swap if needed</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : "Generate Plan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}