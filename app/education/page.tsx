import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Education',
  description: 'Learn about gestational diabetes management',
}

export default function EducationPage() {
  const articles = [
    {
      id: 1,
      title: 'Understanding Gestational Diabetes',
      category: 'Basics',
      readTime: '5 min',
      description: 'Learn what gestational diabetes is, how it affects pregnancy, and why management is important.',
    },
    {
      id: 2,
      title: 'Carb Counting Basics',
      category: 'Nutrition',
      readTime: '8 min',
      description: 'Master the fundamentals of counting carbohydrates for better blood sugar control.',
    },
    {
      id: 3,
      title: 'Safe Exercise During GD Pregnancy',
      category: 'Exercise',
      readTime: '6 min',
      description: 'Discover safe and effective exercises to help manage blood glucose levels.',
    },
    {
      id: 4,
      title: 'Reading Food Labels',
      category: 'Nutrition',
      readTime: '7 min',
      description: 'Learn how to read and understand nutrition labels to make informed food choices.',
    },
    {
      id: 5,
      title: 'Managing Morning Glucose Spikes',
      category: 'Management',
      readTime: '5 min',
      description: 'Tips and strategies for controlling dawn phenomenon and morning blood sugar levels.',
    },
    {
      id: 6,
      title: 'Meal Timing for Optimal Control',
      category: 'Nutrition',
      readTime: '6 min',
      description: 'Understand how meal timing affects blood sugar and learn optimal eating schedules.',
    },
  ]

  const categories = ['All', 'Basics', 'Nutrition', 'Exercise', 'Management', 'Medical']

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Education Center</h1>
        <p className="text-neutral-600">Evidence-based information to help you manage gestational diabetes</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg transition-colors ${
              category === 'All'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  {article.category}
                </span>
                <span className="text-xs text-neutral-500">{article.readTime} read</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
              <p className="text-sm text-neutral-600 mb-4">{article.description}</p>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Read Article →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-primary-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Need Personalized Guidance?</h2>
        <p className="text-neutral-600 mb-4">
          Connect with certified diabetes educators and registered dietitians
        </p>
        <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
          Schedule a Consultation
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Interactive Guides</h3>
          <p className="text-sm text-neutral-600">
            Visual tools to help you understand portion sizes and food choices
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Video Tutorials</h3>
          <p className="text-sm text-neutral-600">
            Watch expert-led videos on glucose monitoring and meal preparation
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Printable Resources</h3>
          <p className="text-sm text-neutral-600">
            Download handouts and trackers to share with your healthcare team
          </p>
        </div>
      </div>
    </div>
  )
}