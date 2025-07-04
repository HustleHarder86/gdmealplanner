export default function EducationPage() {
  const articles = [
    {
      id: "1",
      title: "Understanding Gestational Diabetes",
      description:
        "Learn the basics of GD, why it happens, and what it means for your pregnancy.",
      readTime: "8 min",
      category: "Basics",
    },
    {
      id: "2",
      title: "Carb Counting Made Simple",
      description:
        "Master the art of counting carbohydrates to manage your blood sugar effectively.",
      readTime: "10 min",
      category: "Nutrition",
    },
    {
      id: "3",
      title: "Safe Exercise During GD Pregnancy",
      description:
        "Discover safe and effective exercises to help manage your glucose levels.",
      readTime: "6 min",
      category: "Exercise",
    },
    {
      id: "4",
      title: "Reading Food Labels Like a Pro",
      description:
        "Learn to decode nutrition labels and make informed food choices.",
      readTime: "7 min",
      category: "Nutrition",
    },
    {
      id: "5",
      title: "Managing Morning Glucose Spikes",
      description:
        "Tips and strategies for dealing with the dawn phenomenon in pregnancy.",
      readTime: "5 min",
      category: "Management",
    },
    {
      id: "6",
      title: "Meal Timing for Better Control",
      description: "How when you eat can be just as important as what you eat.",
      readTime: "6 min",
      category: "Management",
    },
  ];

  const categories = ["All", "Basics", "Nutrition", "Exercise", "Management"];

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">GD Education Center</h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Evidence-based information to help you understand and manage
          gestational diabetes effectively.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-md transition-colors ${
                category === "All"
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {articles.map((article) => (
          <div
            key={article.id}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1 rounded-full inline-block mb-3">
              {article.category}
            </div>
            <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
            <p className="text-neutral-600 mb-4">{article.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">
                {article.readTime} read
              </span>
              <button className="text-primary-600 font-medium hover:text-primary-700">
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Quick Resources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Printable Guides</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  📄 GD Food List PDF
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  📄 Portion Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  📄 Glucose Log Sheet
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Interactive Tools</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  🧮 Carb Calculator
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  📊 GI Index Lookup
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:text-primary-700">
                  📝 Knowledge Quiz
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
