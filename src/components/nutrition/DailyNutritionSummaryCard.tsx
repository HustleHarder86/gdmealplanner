import { DailyNutritionSummary, NutritionGoals } from "@/src/types/nutrition";

interface DailyNutritionSummaryCardProps {
  summary: DailyNutritionSummary;
  goals: NutritionGoals;
}

export default function DailyNutritionSummaryCard({
  summary,
  goals,
}: DailyNutritionSummaryCardProps) {
  const { totalNutrition, goalAdherence } = summary;

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold mb-4">Daily Summary</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getColorByPercentage(goalAdherence.calories)}`}>
            {totalNutrition.calories}
          </div>
          <div className="text-sm text-neutral-600">Calories</div>
          <div className="text-xs text-neutral-500">
            {goals.calories.min}-{goals.calories.max}
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getColorByPercentage(goalAdherence.carbs)}`}>
            {totalNutrition.carbohydrates}g
          </div>
          <div className="text-sm text-neutral-600">Carbs</div>
          <div className="text-xs text-neutral-500">
            {goals.carbohydrates.min}-{goals.carbohydrates.max}g
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getColorByPercentage(goalAdherence.protein)}`}>
            {totalNutrition.protein}g
          </div>
          <div className="text-sm text-neutral-600">Protein</div>
          <div className="text-xs text-neutral-500">
            {goals.protein.min}-{goals.protein.max}g
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getColorByPercentage(goalAdherence.fat)}`}>
            {totalNutrition.fat}g
          </div>
          <div className="text-sm text-neutral-600">Fat</div>
          <div className="text-xs text-neutral-500">
            {goals.fat.min}-{goals.fat.max}g
          </div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getColorByPercentage(goalAdherence.fiber)}`}>
            {totalNutrition.fiber}g
          </div>
          <div className="text-sm text-neutral-600">Fiber</div>
          <div className="text-xs text-neutral-500">
            {goals.fiber.min}g+
          </div>
        </div>
      </div>

      {/* Micronutrients */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-700 mb-2">
          Key Pregnancy Nutrients
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-neutral-600">Folate:</span>{" "}
            <span className="font-medium">
              {totalNutrition.folate || 0}/{goals.folate}mcg
            </span>
          </div>
          <div>
            <span className="text-neutral-600">Iron:</span>{" "}
            <span className="font-medium">
              {totalNutrition.iron || 0}/{goals.iron}mg
            </span>
          </div>
          <div>
            <span className="text-neutral-600">Calcium:</span>{" "}
            <span className="font-medium">
              {totalNutrition.calcium || 0}/{goals.calcium}mg
            </span>
          </div>
          <div>
            <span className="text-neutral-600">DHA:</span>{" "}
            <span className="font-medium">
              {totalNutrition.dha || 0}/{goals.dha}mg
            </span>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        {summary.prenatalVitamin && (
          <div className="flex items-center gap-1 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Prenatal vitamin taken</span>
          </div>
        )}
        {summary.mealPlanAdherence !== undefined && (
          <div className="text-neutral-600">
            Meal plan adherence: {summary.mealPlanAdherence.toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}