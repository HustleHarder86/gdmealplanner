import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary-800 mb-4">
          Pregnancy Plate Planner
        </h1>
        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
          Manage gestational diabetes with confidence through personalized meal plans, 
          easy tracking, and expert guidance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/meal-planner" className="btn-primary">
            Start Planning Meals
          </Link>
          <Link href="/education" className="btn-secondary">
            Learn About GD
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🍽️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Smart Meal Planning</h3>
          <p className="text-neutral-600">
            7-day meal plans tailored for gestational diabetes with balanced carbs and nutrients.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Glucose Tracking</h3>
          <p className="text-neutral-600">
            Log and visualize your blood sugar levels to identify patterns and stay on target.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Expert Education</h3>
          <p className="text-neutral-600">
            Learn carb counting, portion control, and GD management from trusted sources.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white rounded-xl p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">1</div>
            <h4 className="font-semibold mb-1">Create Profile</h4>
            <p className="text-sm text-neutral-600">Tell us about your pregnancy and dietary needs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">2</div>
            <h4 className="font-semibold mb-1">Get Meal Plan</h4>
            <p className="text-sm text-neutral-600">Receive a personalized 7-day GD-friendly plan</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">3</div>
            <h4 className="font-semibold mb-1">Track Progress</h4>
            <p className="text-sm text-neutral-600">Log glucose readings and meals daily</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">4</div>
            <h4 className="font-semibold mb-1">Stay Healthy</h4>
            <p className="text-sm text-neutral-600">Manage GD effectively for you and baby</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
        <p className="text-lg text-neutral-700 mb-6">
          Join thousands of moms managing gestational diabetes successfully.
        </p>
        <Link href="/recipes" className="btn-primary text-lg px-6 py-3">
          Browse GD-Friendly Recipes
        </Link>
      </section>
    </div>
  )
}