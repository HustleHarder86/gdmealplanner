import Link from 'next/link'

export default function TrackingPage() {
  // Mock data for demo
  const todayStats = {
    avgGlucose: 105,
    carbsConsumed: 142,
    mealsLogged: 4,
    waterIntake: 6,
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Health Tracking</h1>

      {/* Today's Summary */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{todayStats.avgGlucose}</div>
            <div className="text-sm text-neutral-600">Avg Glucose (mg/dL)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{todayStats.carbsConsumed}g</div>
            <div className="text-sm text-neutral-600">Carbs Consumed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{todayStats.mealsLogged}/6</div>
            <div className="text-sm text-neutral-600">Meals Logged</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">{todayStats.waterIntake}</div>
            <div className="text-sm text-neutral-600">Glasses of Water</div>
          </div>
        </div>
      </div>

      {/* Tracking Options */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/tracking/glucose" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold">Glucose Tracking</h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Log blood sugar readings, view trends, and identify patterns in your glucose levels.
          </p>
          <div className="text-primary-600 font-medium">Track Glucose →</div>
        </Link>

        <Link href="/tracking/nutrition" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">🥗</span>
            </div>
            <h3 className="text-xl font-semibold">Nutrition Tracking</h3>
          </div>
          <p className="text-neutral-600 mb-4">
            Log meals, track macros, and monitor your daily nutritional intake.
          </p>
          <div className="text-primary-600 font-medium">Track Nutrition →</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-primary-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn-primary">Log Glucose Reading</button>
          <button className="btn-secondary">Log Meal</button>
          <button className="btn-secondary">Add Water</button>
          <button className="btn-secondary">Export Data</button>
        </div>
      </div>
    </div>
  )
}