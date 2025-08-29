'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FreeMealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeMealPlannerModal({ isOpen, onClose }: FreeMealPlannerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    weeksPregnant: '',
    dietaryRestrictions: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You would typically send this to your backend
    alert('Thank you! Your free meal planner will be sent to your email shortly.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Get Your Free Meal Planner
          </h3>
          <p className="text-gray-600">
            Personalized for your gestational diabetes needs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="weeks" className="block text-sm font-medium text-gray-700 mb-2">
              How many weeks pregnant are you?
            </label>
            <select
              id="weeks"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.weeksPregnant}
              onChange={(e) => setFormData({ ...formData, weeksPregnant: e.target.value })}
            >
              <option value="">Select weeks</option>
              {Array.from({ length: 28 }, (_, i) => i + 13).map(week => (
                <option key={week} value={week.toString()}>{week} weeks</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="restrictions" className="block text-sm font-medium text-gray-700 mb-2">
              Any dietary restrictions?
            </label>
            <select
              id="restrictions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
            >
              <option value="">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-free</option>
              <option value="dairy-free">Dairy-free</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition"
          >
            Send My Free Meal Planner
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            We&apos;ll email you a personalized 3-day meal plan sample. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
}