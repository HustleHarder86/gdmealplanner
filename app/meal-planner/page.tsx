export default function MealPlannerPage() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const meals = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack']

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">7-Day Meal Planner</h1>
        <button className="btn-primary">Generate New Plan</button>
      </div>

      {/* Nutrition Targets */}
      <div className="bg-primary-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Daily Nutrition Targets</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-primary-700">175g</div>
            <div className="text-sm text-neutral-600">Min Carbs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">30g</div>
            <div className="text-sm text-neutral-600">Fiber</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">80g</div>
            <div className="text-sm text-neutral-600">Protein</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">2200</div>
            <div className="text-sm text-neutral-600">Calories</div>
          </div>
        </div>
      </div>

      {/* Meal Plan Grid */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-primary-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Meal</th>
              {days.map((day) => (
                <th key={day} className="px-4 py-3 text-center">
                  {day.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meals.map((meal, index) => (
              <tr key={meal} className={index % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                <td className="px-4 py-3 font-medium">{meal}</td>
                {days.map((day) => (
                  <td key={`${day}-${meal}`} className="px-4 py-3">
                    <div className="text-center">
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        + Add
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button className="btn-primary">Save Meal Plan</button>
        <button className="btn-secondary">Print Plan</button>
        <button className="btn-secondary">Generate Shopping List</button>
      </div>
    </div>
  )
}