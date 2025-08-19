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
    <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-8 shadow-lg border border-neutral-200 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">Daily Summary</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        {[
          { 
            key: 'calories', 
            value: totalNutrition.calories, 
            unit: '', 
            label: 'Calories', 
            range: `${goals.calories.min}-${goals.calories.max}`,
            adherence: goalAdherence.calories,
            icon: '🔥'
          },
          { 
            key: 'carbs', 
            value: totalNutrition.carbohydrates, 
            unit: 'g', 
            label: 'Carbs', 
            range: `${goals.carbohydrates.min}-${goals.carbohydrates.max}g`,
            adherence: goalAdherence.carbs,
            icon: '🌾'
          },
          { 
            key: 'protein', 
            value: totalNutrition.protein, 
            unit: 'g', 
            label: 'Protein', 
            range: `${goals.protein.min}-${goals.protein.max}g`,
            adherence: goalAdherence.protein,
            icon: '🥩'
          },
          { 
            key: 'fat', 
            value: totalNutrition.fat, 
            unit: 'g', 
            label: 'Fat', 
            range: `${goals.fat.min}-${goals.fat.max}g`,
            adherence: goalAdherence.fat,
            icon: '🥑'
          },
          { 
            key: 'fiber', 
            value: totalNutrition.fiber, 
            unit: 'g', 
            label: 'Fiber', 
            range: `${goals.fiber.min}g+`,
            adherence: goalAdherence.fiber,
            icon: '🌿'
          }
        ].map((macro) => (
          <div key={macro.key} className="text-center p-4 rounded-lg bg-white border border-neutral-100 hover:shadow-md transition-shadow duration-200">
            <div className="text-2xl mb-2">{macro.icon}</div>
            <div className={`text-3xl font-bold mb-1 ${getColorByPercentage(macro.adherence)}`}>
              {macro.value}{macro.unit}
            </div>
            <div className="text-sm font-medium text-neutral-700 mb-1">{macro.label}</div>
            <div className="text-xs text-neutral-500 px-2 py-1 bg-neutral-50 rounded-full">
              {macro.range}
            </div>
          </div>
        ))}
      </div>

      {/* Micronutrients */}
      <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">👶</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-800">
            Key Pregnancy Nutrients
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { 
              name: 'Folate', 
              value: totalNutrition.folate || 0, 
              target: goals.folate, 
              unit: 'mcg', 
              icon: '🥬',
              color: 'text-green-600'
            },
            { 
              name: 'Iron', 
              value: totalNutrition.iron || 0, 
              target: goals.iron, 
              unit: 'mg', 
              icon: '🩸',
              color: 'text-red-600'
            },
            { 
              name: 'Calcium', 
              value: totalNutrition.calcium || 0, 
              target: goals.calcium, 
              unit: 'mg', 
              icon: '🦴',
              color: 'text-blue-600'
            },
            { 
              name: 'DHA', 
              value: totalNutrition.dha || 0, 
              target: goals.dha, 
              unit: 'mg', 
              icon: '🐟',
              color: 'text-cyan-600'
            }
          ].map((nutrient) => {
            const percentage = (nutrient.value / nutrient.target) * 100;
            return (
              <div key={nutrient.name} className="bg-white rounded-lg p-3 border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{nutrient.icon}</span>
                  <span className={`text-xs font-medium ${percentage >= 90 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="text-sm font-medium text-neutral-700 mb-1">{nutrient.name}</div>
                <div className={`text-lg font-bold ${nutrient.color}`}>
                  {nutrient.value}<span className="text-xs text-neutral-500">/{nutrient.target}{nutrient.unit}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      percentage >= 90 ? 'bg-green-500' : 
                      percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
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