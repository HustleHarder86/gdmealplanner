import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glucose Tracking',
  description: 'Track your blood glucose levels',
}

export default function GlucoseTrackingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Glucose Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Quick Entry</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="glucose" className="block text-sm font-medium text-neutral-700 mb-1">
                Blood Glucose Level
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="glucose"
                  step="0.1"
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5.5"
                />
                <select className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option>mmol/L</option>
                  <option>mg/dL</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mealTime" className="block text-sm font-medium text-neutral-700 mb-1">
                Measurement Time
              </label>
              <select
                id="mealTime"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option>Pre-breakfast</option>
                <option>Post-breakfast (1 hour)</option>
                <option>Post-breakfast (2 hours)</option>
                <option>Pre-lunch</option>
                <option>Post-lunch (1 hour)</option>
                <option>Post-lunch (2 hours)</option>
                <option>Pre-dinner</option>
                <option>Post-dinner (1 hour)</option>
                <option>Post-dinner (2 hours)</option>
                <option>Bedtime</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Any relevant notes..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Log Reading
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">Target Ranges</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Fasting/Pre-meal: &lt; 5.3 mmol/L</div>
              <div>1 hour post-meal: &lt; 7.8 mmol/L</div>
              <div>2 hours post-meal: &lt; 6.7 mmol/L</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Today's Readings</h2>
            <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
              <span className="text-neutral-500">Glucose chart visualization</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">5.8 mmol/L</div>
                  <div className="text-sm text-neutral-600">Post-breakfast</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">Within range</div>
                  <div className="text-xs text-neutral-500">2 hours ago</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">4.9 mmol/L</div>
                  <div className="text-sm text-neutral-600">Pre-breakfast</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">Within range</div>
                  <div className="text-xs text-neutral-500">4 hours ago</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">8.2 mmol/L</div>
                  <div className="text-sm text-neutral-600">Post-dinner (1 hour)</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-600">Above range</div>
                  <div className="text-xs text-neutral-500">Yesterday</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}