import RecipeCard from '@/components/RecipeCard'
import { mockRecipes } from '@/lib/mock-data'

export default function RecipesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">GD-Friendly Recipes</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <select className="px-4 py-2 border border-neutral-300 rounded-lg">
            <option>All Meals</option>
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snacks</option>
          </select>
          <select className="px-4 py-2 border border-neutral-300 rounded-lg">
            <option>All Carb Ranges</option>
            <option>15-20g carbs</option>
            <option>20-30g carbs</option>
            <option>30-45g carbs</option>
          </select>
          <select className="px-4 py-2 border border-neutral-300 rounded-lg">
            <option>Any Cook Time</option>
            <option>Under 15 min</option>
            <option>15-30 min</option>
            <option>30-60 min</option>
          </select>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}