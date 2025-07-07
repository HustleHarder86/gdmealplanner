import Link from "next/link";
import { Database, CheckCircle, Upload, BookOpen } from "lucide-react";

export default function AdminPage() {
  const adminTools = [
    {
      href: "/admin/setup-verification",
      title: "Setup Verification",
      description: "Check Firebase connection and configuration status",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      href: "/admin/import-recipes",
      title: "Import Recipes",
      description: "Build recipe library from Spoonacular API",
      icon: Upload,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      href: "/admin/recipes",
      title: "Recipe Library",
      description: "View and manage all imported recipes",
      icon: BookOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      href: "/api/test-firebase",
      title: "Firebase Test API",
      description: "Raw Firebase connection test endpoint",
      icon: Database,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Tools</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {adminTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                  <Icon className={`w-6 h-6 ${tool.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">{tool.title}</h2>
                  <p className="text-gray-600">{tool.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">Quick Links</h2>
        <ul className="space-y-2">
          <li>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Firebase Console →
            </a>
          </li>
          <li>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Vercel Dashboard →
            </a>
          </li>
          <li>
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google Cloud Console →
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}