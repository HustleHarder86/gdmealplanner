import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipes',
  description: 'Browse gestational diabetes-friendly recipes',
}

export default function RecipesPage() {
  const recipes = [
    {
      id: 1,
      title: 'Greek Yogurt Parfait',
      carbs: 25,
      cookTime: 5,
      rating: 4.5,
      image: '/api/placeholder/300/200',
    },
    {
      id: 2,
      title: 'Grilled Chicken Salad',
      carbs: 30,
      cookTime: 20,
      rating: 4.8,
      image: '/api/placeholder/300/200',
    },
    {
      id: 3,
      title: 'Veggie Stir-Fry',
      carbs: 35,
      cookTime: 15,
      rating: 4.6,
      image: '/api/placeholder/300/200',
    },
    {
      id: 4,
      title: 'Overnight Oats',
      carbs: 28,
      cookTime: 5,
      rating: 4.7,
      image: '/api/placeholder/300/200',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Recipe Collection</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>All Meals</option>
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
          <option>Snacks</option>
        </select>
        <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>All Diets</option>
          <option>Vegetarian</option>
          <option>Vegan</option>
          <option>Gluten-Free</option>
          <option>Dairy-Free</option>
        </select>
        <select className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          <option>Carb Range</option>
          <option>0-15g</option>
          <option>15-30g</option>
          <option>30-45g</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 bg-neutral-200">
              <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-primary-600 text-lg font-medium">Recipe Image</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
                <span>{recipe.carbs}g carbs</span>
                <span>{recipe.cookTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm">{recipe.rating}</span>
                </div>
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View Recipe
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
          Load More Recipes
        </button>
      </div>
    </div>
  )
}