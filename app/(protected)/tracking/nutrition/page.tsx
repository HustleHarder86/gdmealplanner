import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nutrition Tracking',
  description: 'Track your daily nutrition intake',
}

export default function NutritionTrackingPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Nutrition Tracking</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Carbohydrates</span>
                <span className="text-sm font-medium">125g / 175g</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '71%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Protein</span>
                <span className="text-sm font-medium">68g / 85g</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-secondary-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Fat</span>
                <span className="text-sm font-medium">52g / 65g</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-accent-600 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-neutral-600">Calories</span>
                <span className="text-sm font-medium">1,820 / 2,200</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-neutral-600 h-2 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Key Nutrients</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Fiber</span>
              <span className="text-sm font-medium">22g / 25g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Folate</span>
              <span className="text-sm font-medium">580mcg / 600mcg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Iron</span>
              <span className="text-sm font-medium">24mg / 27mg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">Calcium</span>
              <span className="text-sm font-medium">980mg / 1000mg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">DHA</span>
              <span className="text-sm font-medium">180mg / 200mg</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Add</h2>
          <div className="space-y-3">
            <button className="w-full p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium">
              Log from Meal Plan
            </button>
            <button className="w-full p-3 bg-secondary-50 text-secondary-700 rounded-lg hover:bg-secondary-100 transition-colors text-sm font-medium">
              Add Custom Food
            </button>
            <button className="w-full p-3 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors text-sm font-medium">
              Scan Barcode
            </button>
            <button className="w-full p-3 bg-neutral-50 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium">
              Recent Foods
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold">Today's Food Log</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          <div className="p-6">
            <h3 className="font-medium mb-3">Breakfast</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Oatmeal with berries</div>
                  <div className="text-sm text-neutral-600">1 cup oatmeal, 1/2 cup mixed berries</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">30g carbs</div>
                  <div className="text-xs text-neutral-500">280 cal</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Greek yogurt</div>
                  <div className="text-sm text-neutral-600">150g plain, 2% fat</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">8g carbs</div>
                  <div className="text-xs text-neutral-500">140 cal</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-medium mb-3">Morning Snack</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Apple with almond butter</div>
                  <div className="text-sm text-neutral-600">1 medium apple, 1 tbsp almond butter</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">20g carbs</div>
                  <div className="text-xs text-neutral-500">185 cal</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-medium mb-3">Lunch</h3>
            <div className="flex items-center justify-center py-8 text-neutral-400">
              <span>No foods logged yet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}