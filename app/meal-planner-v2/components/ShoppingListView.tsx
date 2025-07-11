"use client";

import { useState, useEffect } from 'react';
import { ShoppingList } from '@/src/types/meal-plan';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CATEGORY_ICONS, SHOPPING_TIPS } from '../constants/categories';

interface ShoppingListViewProps {
  shoppingList: ShoppingList | null;
  onExportText: () => void;
}

export default function ShoppingListView({ shoppingList, onExportText }: ShoppingListViewProps) {
  const [shoppingProgress, setShoppingProgress] = useState({ checked: 0, total: 0 });

  const updateShoppingProgress = () => {
    const allCheckboxes = document.querySelectorAll('.shopping-item input[type="checkbox"]');
    const checkedBoxes = document.querySelectorAll('.shopping-item input[type="checkbox"]:checked');
    setShoppingProgress({ checked: checkedBoxes.length, total: allCheckboxes.length });
  };

  // Initialize progress when component mounts
  useEffect(() => {
    setTimeout(updateShoppingProgress, 100);
  }, []);

  if (!shoppingList) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No shopping list available. Generate a meal plan first.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Shopping List</h3>
            <p className="text-gray-600 mb-2">
              {shoppingList.totalItems} items • Week of {new Date(shoppingList.weekStartDate).toLocaleDateString()}
            </p>
            {/* Progress Bar */}
            {shoppingProgress.total > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{shoppingProgress.checked} of {shoppingProgress.total} items</span>
                  <span>{Math.round((shoppingProgress.checked / shoppingProgress.total) * 100)}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-600 h-2 transition-all duration-300 ease-out"
                    style={{ width: `${(shoppingProgress.checked / shoppingProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const percentage = Math.round(shoppingProgress.checked/shoppingProgress.total*100);
                alert(`Shopping Progress:\n\n✅ ${shoppingProgress.checked} of ${shoppingProgress.total} items checked\n📊 ${percentage}% complete`);
              }}
              variant="outline"
              size="sm"
            >
              📊 Progress
            </Button>
            <Button
              onClick={onExportText}
              variant="outline"
              size="sm"
            >
              📄 Download
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
            >
              🖨️ Print
            </Button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => {
              document.querySelectorAll('input[type="checkbox"]').forEach((cb: any) => {
                cb.checked = true;
                const itemText = cb.nextElementSibling as HTMLElement;
                itemText.classList.add('line-through', 'text-gray-400');
                cb.closest('.shopping-item')?.classList.add('bg-gray-50');
              });
              updateShoppingProgress();
            }}
            className="text-xs bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-full transition-colors"
          >
            ✅ Check All
          </button>
          <button
            onClick={() => {
              document.querySelectorAll('input[type="checkbox"]').forEach((cb: any) => {
                cb.checked = false;
                const itemText = cb.nextElementSibling as HTMLElement;
                itemText.classList.remove('line-through', 'text-gray-400');
                cb.closest('.shopping-item')?.classList.remove('bg-gray-50');
              });
              updateShoppingProgress();
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full transition-colors"
          >
            🔄 Clear All
          </button>
          <button
            onClick={() => {
              const checkedItems = document.querySelectorAll('input[type="checkbox"]:checked');
              if (checkedItems.length === 0) {
                alert('No items checked to hide');
                return;
              }
              if (confirm(`Hide ${checkedItems.length} checked items?`)) {
                checkedItems.forEach((cb: any) => {
                  cb.closest('.shopping-item').style.display = 'none';
                });
              }
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            👁️ Hide Checked
          </button>
          <button
            onClick={() => {
              document.querySelectorAll('.shopping-item').forEach((item: any) => {
                item.style.display = 'flex';
              });
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            👁️ Show All
          </button>
        </div>
      </Card>
      
      {/* Shopping Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shoppingList.categories.map(category => (
          <Card key={category.name} className="overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <span className="text-xl">{CATEGORY_ICONS[category.name] || '🛒'}</span>
                {category.name}
                <span className="text-sm font-normal text-gray-500 ml-auto">
                  ({category.items.length} items)
                </span>
              </h4>
            </div>
            <div className="p-4 space-y-1">
              {category.items.map((item, index) => (
                <label 
                  key={index} 
                  className="shopping-item flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                    onChange={(e) => {
                      const itemText = e.target.nextElementSibling as HTMLElement;
                      if (e.target.checked) {
                        itemText.classList.add('line-through', 'text-gray-400');
                        e.target.closest('.shopping-item')?.classList.add('bg-gray-50');
                      } else {
                        itemText.classList.remove('line-through', 'text-gray-400');
                        e.target.closest('.shopping-item')?.classList.remove('bg-gray-50');
                      }
                      updateShoppingProgress();
                    }}
                  />
                  <span className="text-sm flex-1 transition-all leading-relaxed">
                    <span className="font-medium text-gray-900">
                      {typeof item.amount === 'string' ? item.amount : `${item.amount} ${item.unit}`}
                    </span>
                    <span className="text-gray-700 ml-1">
                      {item.name}
                    </span>
                    {item.notes && (
                      <span className="text-gray-500 block text-xs mt-0.5 italic">
                        {item.notes}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
      
      {/* Shopping Tips */}
      <Card className="p-4 bg-green-50 border-green-200">
        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <span>💡</span> Shopping Tips
        </h4>
        <ul className="text-sm text-green-800 space-y-1">
          {SHOPPING_TIPS.map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}