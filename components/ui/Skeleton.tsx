interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-neutral-200";

  const variants = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const defaultHeights = {
    text: "h-4",
    circular: "h-12 w-12",
    rectangular: "h-20",
  };

  const skeletonStyle = {
    width: width,
    height: height,
  };

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${!width && variant === "text" ? "w-full" : ""}
        ${!height ? defaultHeights[variant] : ""}
        ${className}
      `}
      style={skeletonStyle}
    />
  ));

  return count > 1 ? <div className="space-y-2">{elements}</div> : elements[0];
}

// Preset skeleton components
export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <Skeleton variant="rectangular" height={192} className="mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton variant="text" width={60} />
        <Skeleton variant="text" width={60} />
        <Skeleton variant="text" width={60} />
      </div>
      <Skeleton variant="rectangular" height={36} />
    </div>
  );
}

export function MealPlanSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }, (_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>
    </div>
  );
}
