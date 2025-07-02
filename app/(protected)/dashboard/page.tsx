import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your pregnancy plate planner dashboard',
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Welcome back!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-sm text-neutral-600 mb-1">Today's Average</div>
          <div className="text-2xl font-bold text-primary-600">5.2 mmol/L</div>
          <div className="text-sm text-green-600 mt-1">Within target range</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-sm text-neutral-600 mb-1">Meals Logged</div>
          <div className="text-2xl font-bold text-secondary-600">4 / 6</div>
          <div className="text-sm text-neutral-500 mt-1">2 more to go</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-sm text-neutral-600 mb-1">Weekly Progress</div>
          <div className="text-2xl font-bold text-accent-600">85%</div>
          <div className="text-sm text-accent-600 mt-1">Great job!</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-sm text-neutral-600 mb-1">Days Until Due</div>
          <div className="text-2xl font-bold text-neutral-900">84</div>
          <div className="text-sm text-neutral-500 mt-1">12 weeks remaining</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Today's Meal Plan</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <div className="font-medium">Breakfast</div>
                <div className="text-sm text-neutral-600">Oatmeal with berries - 30g carbs</div>
              </div>
              <div className="text-green-600">✓ Logged</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <div className="font-medium">Snack</div>
                <div className="text-sm text-neutral-600">Apple with almond butter - 15g carbs</div>
              </div>
              <div className="text-green-600">✓ Logged</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div>
                <div className="font-medium">Lunch</div>
                <div className="text-sm text-neutral-600">Grilled chicken salad - 35g carbs</div>
              </div>
              <div className="text-neutral-400">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Glucose Readings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600">Post-breakfast</div>
                <div className="font-medium">5.8 mmol/L</div>
              </div>
              <div className="text-sm text-neutral-500">2 hours ago</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600">Pre-breakfast</div>
                <div className="font-medium">4.9 mmol/L</div>
              </div>
              <div className="text-sm text-neutral-500">4 hours ago</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600">Bedtime</div>
                <div className="font-medium">5.2 mmol/L</div>
              </div>
              <div className="text-sm text-neutral-500">Yesterday</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}