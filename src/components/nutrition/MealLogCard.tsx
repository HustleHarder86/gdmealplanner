import { NutritionEntry, MealType } from "@/src/types/nutrition";

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

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-neutral-600">
            {totalCarbs}g carbs • {totalCalories} cal
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${carbStatus.color}`}>
            {carbStatus.message}
          </p>
          {plannedRecipe && entries.length === 0 && (
            <button
              onClick={onQuickAddFromPlan}
              className="text-xs text-primary-600 hover:text-primary-700 mt-1"
            >
              Log from meal plan
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
        className="w-full py-2 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
      >
        + Add Food
      </button>
    </div>
  );
}