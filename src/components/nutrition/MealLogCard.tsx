import { NutritionEntry, MealType } from "@/src/types/nutrition";
import AnimatedCounter from "../ui/AnimatedCounter";

interface MealLogCardProps {
  mealType: MealType;
  label: string;
  entries: NutritionEntry[];
  plannedRecipe?: any; // Recipe from meal plan
  onAddFood: () => void;
  onQuickAddFromPlan: () => void;
  carbTarget: { min: number; max: number };
}

export default function MealLogCard({
  mealType,
  label,
  entries,
  plannedRecipe,
  onAddFood,
  onQuickAddFromPlan,
  carbTarget,
}: MealLogCardProps) {
  const totalCarbs = entries.reduce(
    (sum, entry) => sum + entry.totalNutrition.carbohydrates,
    0
  );
  const totalCalories = entries.reduce(
    (sum, entry) => sum + entry.totalNutrition.calories,
    0
  );

  const getCarbStatus = () => {
    if (totalCarbs === 0) return { color: "text-neutral-400", message: "No food logged" };
    if (totalCarbs < carbTarget.min) 
      return { color: "text-yellow-600", message: `Below target (${carbTarget.min}g min)` };
    if (totalCarbs > carbTarget.max) 
      return { color: "text-red-600", message: `Above target (${carbTarget.max}g max)` };
    return { color: "text-green-600", message: "Within target" };
  };

  const carbStatus = getCarbStatus();

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

  return (
    <div className={`bg-white rounded-xl p-5 shadow-md border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${getCardBorderStyle()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border ${getMealTimeStyle()}`}>
            {getMealIcon(mealType)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-800">{label}</h3>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1">
                🌾 <AnimatedCounter value={totalCarbs} suffix="g" /> carbs
              </span>
              <span className="flex items-center gap-1">
                🔥 <AnimatedCounter value={totalCalories} /> cal
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${
            totalCarbs === 0 ? 'nutrition-info' :
            totalCarbs < carbTarget.min ? 'nutrition-warning' :
            totalCarbs > carbTarget.max ? 'nutrition-danger' :
            'nutrition-success achievement-glow'
          }`}>
            {totalCarbs === 0 ? '⚪' : totalCarbs < carbTarget.min ? '🟡' : totalCarbs > carbTarget.max ? '🔴' : '🟢'}
            {carbStatus.message}
          </div>
          {plannedRecipe && entries.length === 0 && (
            <button
              onClick={onQuickAddFromPlan}
              className="text-xs text-primary-600 hover:text-primary-700 mt-2 bg-primary-50 px-2 py-1 rounded-full hover:bg-primary-100 transition-colors duration-200"
            >
              ✨ Log from meal plan
            </button>
          )}
        </div>
      </div>

      {/* Food entries */}
      {entries.length > 0 ? (
        <div className="space-y-2 mb-3">
          {entries.map((entry, index) => (
            <div key={entry.id || index} className="text-sm">
              {entry.foods.map((food, foodIndex) => (
                <div key={foodIndex} className="flex justify-between py-1">
                  <span className="text-neutral-700">
                    {food.name} ({food.quantity} {food.unit})
                  </span>
                  <span className="text-neutral-600">
                    {food.nutrition.carbohydrates}g carbs
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : plannedRecipe ? (
        <div className="text-sm text-neutral-500 mb-3">
          <p className="italic">Planned: {plannedRecipe.title}</p>
          <p className="text-xs">
            {plannedRecipe.carbs}g carbs • {plannedRecipe.calories} cal
          </p>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 mb-3">No food logged yet</p>
      )}

      <button
        onClick={onAddFood}
        className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 transform hover:scale-[0.98] active:scale-[0.96] shadow-md hover:shadow-lg button-ripple"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Food
        </span>
      </button>
    </div>
  );
}