interface NutritionBadgeProps {
  icon: string;
  value: number;
  unit: string;
  label?: string;
  color?: "blue" | "purple" | "green" | "orange";
}

export default function NutritionBadge({
  icon,
  value,
  unit,
  label,
  color = "blue"
}: NutritionBadgeProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700"
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${colorClasses[color]}`}>
      <span className="text-base">{icon}</span>
      <span className="font-medium">
        {value}{unit}
      </span>
      {label && <span className="text-xs opacity-75">{label}</span>}
    </div>
  );
}