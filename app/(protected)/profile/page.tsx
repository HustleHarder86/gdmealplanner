import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your profile and settings',
}

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="Jane"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="Doe"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  defaultValue="jane.doe@example.com"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Pregnancy Details</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="2024-06-15"
                  />
                </div>
                <div>
                  <label htmlFor="weeks" className="block text-sm font-medium text-neutral-700 mb-1">
                    Current Week
                  </label>
                  <input
                    type="text"
                    id="weeks"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50"
                    value="28 weeks"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-neutral-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="165"
                  />
                </div>
                <div>
                  <label htmlFor="preWeight" className="block text-sm font-medium text-neutral-700 mb-1">
                    Pre-pregnancy Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="preWeight"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="60"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Update Details
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Glucose Targets</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fastingTarget" className="block text-sm font-medium text-neutral-700 mb-1">
                    Fasting/Pre-meal Target
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="fastingTarget"
                      step="0.1"
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      defaultValue="5.3"
                    />
                    <select className="px-3 py-2 border border-neutral-300 rounded-lg">
                      <option>mmol/L</option>
                      <option>mg/dL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="postMealTarget" className="block text-sm font-medium text-neutral-700 mb-1">
                    Post-meal Target (2hr)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="postMealTarget"
                      step="0.1"
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      defaultValue="6.7"
                    />
                    <select className="px-3 py-2 border border-neutral-300 rounded-lg">
                      <option>mmol/L</option>
                      <option>mg/dL</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Save Targets
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Dietary Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-primary-600" />
                <span className="ml-2 text-sm">Vegetarian</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-primary-600" />
                <span className="ml-2 text-sm">Vegan</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-primary-600" />
                <span className="ml-2 text-sm">Gluten-free</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-primary-600" />
                <span className="ml-2 text-sm">Dairy-free</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-primary-600" />
                <span className="ml-2 text-sm">Nut-free</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Glucose reminders</span>
                <input type="checkbox" className="rounded text-primary-600" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Meal reminders</span>
                <input type="checkbox" className="rounded text-primary-600" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Weekly reports</span>
                <input type="checkbox" className="rounded text-primary-600" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Educational content</span>
                <input type="checkbox" className="rounded text-primary-600" />
              </label>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                Change Password
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                Export Data
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}