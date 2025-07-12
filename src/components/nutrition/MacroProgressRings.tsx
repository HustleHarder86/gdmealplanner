import { NutritionInfo, NutritionGoals } from "@/src/types/nutrition";

interface MacroProgressRingsProps {
  nutrition: NutritionInfo;
  goals: NutritionGoals;
}

export default function MacroProgressRings({
  nutrition,
  goals,
}: MacroProgressRingsProps) {
  const calculateProgress = (value: number, min: number, max: number) => {
    const target = (min + max) / 2;
    return Math.min((value / target) * 100, 100);
  };

  const macros = [
    {
      name: "Carbs",
      value: nutrition.carbohydrates,
      progress: calculateProgress(
        nutrition.carbohydrates,
        goals.carbohydrates.min,
        goals.carbohydrates.max
      ),
      color: "stroke-blue-500",
      bgColor: "stroke-blue-100",
    },
    {
      name: "Protein",
      value: nutrition.protein,
      progress: calculateProgress(
        nutrition.protein,
        goals.protein.min,
        goals.protein.max
      ),
      color: "stroke-green-500",
      bgColor: "stroke-green-100",
    },
    {
      name: "Fat",
      value: nutrition.fat,
      progress: calculateProgress(
        nutrition.fat,
        goals.fat.min,
        goals.fat.max
      ),
      color: "stroke-yellow-500",
      bgColor: "stroke-yellow-100",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {macros.map((macro) => (
        <div key={macro.name} className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                strokeWidth="8"
                className={macro.bgColor}
              />
              {/* Progress circle */}
              <circle
                cx="48"
                cy="48"
                r="36"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${(macro.progress / 100) * 226.2} 226.2`}
                strokeLinecap="round"
                className={macro.color}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{macro.value}g</span>
              <span className="text-xs text-neutral-600">{macro.progress.toFixed(0)}%</span>
            </div>
          </div>
          <div className="mt-2 text-sm font-medium">{macro.name}</div>
        </div>
      ))}
    </div>
  );
}