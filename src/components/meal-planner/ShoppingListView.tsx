import React, { useState } from "react";
import { ShoppingList, ShoppingListItem } from "@/src/types/shopping-list";
import { ShoppingListGenerator } from "@/src/lib/meal-planning/shopping-list-generator";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface ShoppingListViewProps {
  shoppingList: ShoppingList;
}

export function ShoppingListView({ shoppingList }: ShoppingListViewProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handlePrint = () => {
    const printContent = ShoppingListGenerator.generatePrintableList(shoppingList);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shopping List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              h2 { color: #666; margin-top: 20px; }
              ul { list-style: none; padding: 0; }
              li { margin: 5px 0; }
              @media print { 
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    const shareText = ShoppingListGenerator.generatePrintableList(shoppingList);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shopping List",
          text: shareText,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Shopping list copied to clipboard!");
    }
  };

  const getSectionIcon = (sectionName: string): string => {
    const icons: Record<string, string> = {
      produce: "🥬",
      "meat-seafood": "🥩",
      dairy: "🥛",
      "bakery-grains": "🌾",
      pantry: "🥫",
      frozen: "❄️",
      other: "📦",
    };
    return icons[sectionName] || "📦";
  };

  const formatSectionName = (name: string): string => {
    return name
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Shopping List</h3>
          <p className="text-sm text-gray-600 mt-1">
            {shoppingList.summary.totalItems} items
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            Print
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            Share
          </Button>
        </div>
      </div>

      <div className="divide-y">
        {shoppingList.sections.map((section) => (
          <div key={section.name}>
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-2">
              <span className="text-lg">{getSectionIcon(section.name)}</span>
              <h4 className="font-medium text-gray-700">
                {formatSectionName(section.name)}
              </h4>
              <span className="text-sm text-gray-500 ml-auto">
                {section.items.length} items
              </span>
            </div>
            
            <div className="px-4 py-3">
              <ul className="space-y-3">
                {section.items.map((item) => {
                  const formattedQty = ShoppingListGenerator.formatQuantity(
                    item.quantity,
                    item.unit
                  );
                  const isChecked = checkedItems.has(item.id);
                  
                  return (
                    <li key={item.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          id={item.id}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={item.id}
                            className={`cursor-pointer block ${
                              isChecked ? "line-through text-gray-400" : ""
                            }`}
                          >
                            <span className="font-medium">
                              {formattedQty} {item.unit && item.unit !== "piece" ? item.unit : ""} {item.name}
                            </span>
                          </label>
                          {item.fromRecipes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Used in: {item.fromRecipes.slice(0, 2).map(r => r.recipeTitle).join(", ")}
                              {item.fromRecipes.length > 2 && ` +${item.fromRecipes.length - 2} more`}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Shopping Progress</span>
          <span className="text-sm font-medium">
            {checkedItems.size} / {shoppingList.summary.totalItems}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(checkedItems.size / shoppingList.summary.totalItems) * 100}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
}