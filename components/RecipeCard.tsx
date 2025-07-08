import Link from "next/link";
import { Recipe } from "@/src/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Recipe Image */}
      <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">
            {recipe.category === "breakfast" && "🍳"}
            {recipe.category === "lunch" && "🥗"}
            {recipe.category === "dinner" && "🍽️"}
            {recipe.category === "snack" && "🥜"}
          </span>
        )}
      </div>

      {/* Recipe Info */}
      <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
      {recipe.description && (
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
        <div className="text-center">
          <div className="font-semibold text-primary-600">
            {recipe.nutrition.carbohydrates}g
          </div>
          <div className="text-neutral-500">Carbs</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary-600">
            {recipe.nutrition.protein}g
          </div>
          <div className="text-neutral-500">Protein</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary-600">
            {recipe.totalTime}m
          </div>
          <div className="text-neutral-500">Time</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Action Button */}
      <Link
        href={`/recipes/${recipe.id}`}
        className="block text-center btn-primary"
      >
        View Recipe
      </Link>
    </div>
  );
}
