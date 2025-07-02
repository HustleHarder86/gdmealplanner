import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meal Planner',
  description: 'Plan your gestational diabetes-friendly meals',
}

export default function MealPlannerPage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const meals = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack']

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Weekly Meal Plan</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Generate New Plan
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">Meal</th>
                {days.map((day) => (
                  <th key={day} className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, mealIndex) => (
                <tr key={meal} className={mealIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                  <td className="px-4 py-3 font-medium text-sm">{meal}</td>
                  {days.map((day) => (
                    <td key={`${day}-${meal}`} className="px-4 py-3">
                      <div className="min-w-[150px]">
                        <div className="text-sm font-medium text-neutral-900">Meal Name</div>
                        <div className="text-xs text-neutral-600">20g carbs</div>
                        <button className="text-xs text-primary-600 hover:text-primary-700 mt-1">
                          Swap
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Daily Totals</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Carbohydrates</span>
              <span className="font-medium">175g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Protein</span>
              <span className="font-medium">85g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Fat</span>
              <span className="font-medium">65g</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Preferences</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-primary-600" defaultChecked />
              <span className="ml-2 text-sm">Vegetarian options</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-primary-600" />
              <span className="ml-2 text-sm">Dairy-free</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded text-primary-600" />
              <span className="ml-2 text-sm">Gluten-free</span>
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors text-sm">
              Generate Shopping List
            </button>
            <button className="w-full px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm">
              Print Meal Plan
            </button>
            <button className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
              Save as Favorite
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}