"use client";

interface TabNavigationProps {
  activeTab: 'meal-plan' | 'shopping-list';
  onTabChange: (tab: 'meal-plan' | 'shopping-list') => void;
  shoppingItemCount?: number;
}

export default function TabNavigation({ 
  activeTab, 
  onTabChange, 
  shoppingItemCount 
}: TabNavigationProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b mb-6 -mx-4 px-4">
      <div className="flex gap-4">
        <button
          onClick={() => onTabChange('meal-plan')}
          className={`py-3 px-6 font-medium border-b-2 transition-colors ${
            activeTab === 'meal-plan' 
              ? 'border-green-600 text-green-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Meal Plan
        </button>
        <button
          onClick={() => onTabChange('shopping-list')}
          className={`py-3 px-6 font-medium border-b-2 transition-colors ${
            activeTab === 'shopping-list' 
              ? 'border-green-600 text-green-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🛒 Shopping List {shoppingItemCount && `(${shoppingItemCount} items)`}
        </button>
      </div>
    </div>
  );
}