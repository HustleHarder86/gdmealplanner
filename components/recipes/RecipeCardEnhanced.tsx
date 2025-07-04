import Link from "next/link";
import Card, { CardContent, CardFooter } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Recipe } from "@/lib/mock-data";

interface RecipeCardEnhancedProps {
  recipe: Recipe;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showQuickAdd?: boolean;
  onQuickAdd?: () => void;
}

export default function RecipeCardEnhanced({
  recipe,
  onFavorite,
  isFavorite = false,
  showQuickAdd = false,
  onQuickAdd,
}: RecipeCardEnhancedProps) {
  const getCarbRange = (carbs: number) => {
    if (carbs <= 20) return { label: "15-20g", color: "success" };
    if (carbs <= 30) return { label: "20-30g", color: "warning" };
    return { label: "30-45g", color: "primary" };
  };

  const carbRange = getCarbRange(recipe.nutrition.carbs);

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden h-full flex flex-col"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl opacity-50">
            {recipe.category === "breakfast" && "🍳"}
            {recipe.category === "lunch" && "🥗"}
            {recipe.category === "dinner" && "🍽️"}
            {recipe.category === "snack" && "🥜"}
          </span>
        </div>

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={onFavorite}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-current" : "text-neutral-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Prep Time Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="default" size="sm" className="bg-white/90">
            ⏱️ {recipe.prepTime + recipe.cookTime} min
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1 p-4">
        {/* Title and Description */}
        <h3 className="text-lg font-semibold mb-1 line-clamp-1">
          {recipe.title}
        </h3>
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Nutrition Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-neutral-50 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Carbs</div>
            <div className="font-semibold text-sm">
              {recipe.nutrition.carbs}g
            </div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Protein</div>
            <div className="font-semibold text-sm">
              {recipe.nutrition.protein}g
            </div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Fiber</div>
            <div className="font-semibold text-sm">
              {recipe.nutrition.fiber}g
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant={carbRange.color as any} size="sm">
            {carbRange.label} carbs
          </Badge>
          {recipe.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/recipes/${recipe.id}`} className="flex-1">
          <Button variant="primary" size="sm" fullWidth>
            View Recipe
          </Button>
        </Link>
        {showQuickAdd && onQuickAdd && (
          <Button variant="outline" size="sm" onClick={onQuickAdd}>
            + Add
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
