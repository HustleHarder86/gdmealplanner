import { 
  MealPlan, 
  ShoppingList, 
  ShoppingCategory, 
  ShoppingItem 
} from '@/src/types/meal-plan';
import { LocalRecipeService } from '@/src/services/local-recipe-service';

/**
 * Shopping List Generator
 * 
 * Generates comprehensive shopping lists from meal plans
 * Groups ingredients by store sections and aggregates quantities
 */
export class ShoppingListGenerator {
  
  /**
   * Generate shopping list from meal plan
   */
  static generateFromMealPlan(mealPlan: MealPlan): ShoppingList {
    console.log(`[SHOPPING_LIST] Generating shopping list for: ${mealPlan.name}`);
    
    // Collect all ingredients from all meals
    const ingredientMap = new Map<string, {
      amount: number;
      unit: string;
      recipes: string[];
      isOptional: boolean;
    }>();
    
    // Process each day's meals
    mealPlan.days.forEach(day => {
      Object.values(day.meals).forEach(meal => {
        if (!meal.recipeId) return; // Skip empty meals
        
        const recipe = LocalRecipeService.getRecipeById(meal.recipeId);
        if (!recipe) {
          console.warn(`[SHOPPING_LIST] Recipe not found: ${meal.recipeId}`);
          return;
        }
        
        // Process each ingredient
        recipe.ingredients.forEach(ingredient => {
          const normalizedName = this.normalizeIngredientName(ingredient.name);
          const scaledAmount = (ingredient.amount || 0) * meal.servings;
          
          const existing = ingredientMap.get(normalizedName);
          if (existing) {
            // Aggregate if same unit, otherwise keep separate entries
            if (existing.unit === ingredient.unit) {
              existing.amount += scaledAmount;
            } else {
              // Create a compound key for different units
              const compoundKey = `${normalizedName}_${ingredient.unit}`;
              ingredientMap.set(compoundKey, {
                amount: scaledAmount,
                unit: ingredient.unit,
                recipes: [recipe.title],
                isOptional: false
              });
              return;
            }
            
            if (!existing.recipes.includes(recipe.title)) {
              existing.recipes.push(recipe.title);
            }
          } else {
            ingredientMap.set(normalizedName, {
              amount: scaledAmount,
              unit: ingredient.unit,
              recipes: [recipe.title],
              isOptional: false
            });
          }
        });
      });
    });
    
    // Group ingredients by store categories
    const categories = this.groupByStoreCategories(ingredientMap);
    
    // Calculate totals
    const totalItems = Array.from(ingredientMap.values()).length;
    
    const shoppingList: ShoppingList = {
      mealPlanId: mealPlan.id,
      weekStartDate: mealPlan.weekStartDate,
      categories,
      totalItems,
      generatedAt: new Date().toISOString()
    };
    
    console.log(`[SHOPPING_LIST] Generated shopping list with ${totalItems} items across ${categories.length} categories`);
    
    return shoppingList;
  }
  
  /**
   * Group ingredients by store categories
   */
  private static groupByStoreCategories(
    ingredientMap: Map<string, {
      amount: number;
      unit: string;
      recipes: string[];
      isOptional: boolean;
    }>
  ): ShoppingCategory[] {
    
    const categoryMap = new Map<string, ShoppingItem[]>();
    
    // Define store category mappings
    const categoryMappings = this.getStoreCategoryMappings();
    
    ingredientMap.forEach((data, ingredientName) => {
      // Determine store category
      const category = this.determineStoreCategory(ingredientName, categoryMappings);
      
      // Clean up the ingredient name (remove unit suffixes)
      const cleanName = ingredientName.replace(/_[a-z]+$/, '');
      
      const item: ShoppingItem = {
        name: this.capitalizeFirst(cleanName),
        amount: this.roundAmount(data.amount),
        unit: data.unit,
        recipes: data.recipes,
        isOptional: data.isOptional,
        notes: this.generateItemNotes(cleanName, data.unit)
      };
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });
    
    // Convert to array and sort
    const categories: ShoppingCategory[] = Array.from(categoryMap.entries())
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => {
        // Sort categories by typical shopping order
        const order = [
          'Produce', 'Proteins', 'Dairy', 'Grains & Bread', 
          'Pantry', 'Frozen', 'Snacks', 'Beverages', 'Other'
        ];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
    
    return categories;
  }
  
  /**
   * Determine which store category an ingredient belongs to
   */
  private static determineStoreCategory(
    ingredientName: string, 
    mappings: Map<string, string[]>
  ): string {
    
    const lowerName = ingredientName.toLowerCase();
    
    for (const [category, keywords] of mappings) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    
    return 'Other';
  }
  
  /**
   * Get store category keyword mappings
   */
  private static getStoreCategoryMappings(): Map<string, string[]> {
    return new Map([
      ['Produce', [
        'apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'grape',
        'tomato', 'onion', 'garlic', 'carrot', 'celery', 'pepper', 'spinach',
        'lettuce', 'cucumber', 'broccoli', 'cauliflower', 'mushroom',
        'potato', 'sweet potato', 'avocado', 'herbs', 'cilantro', 'parsley',
        'basil', 'mint', 'ginger', 'zucchini', 'squash', 'cabbage'
      ]],
      ['Proteins', [
        'chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'tuna',
        'eggs', 'egg', 'tofu', 'tempeh', 'beans', 'lentils', 'chickpeas',
        'meat', 'protein', 'ground', 'breast', 'thigh', 'shrimp', 'crab'
      ]],
      ['Dairy', [
        'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
        'cottage cheese', 'cream cheese', 'mozzarella', 'cheddar', 'parmesan'
      ]],
      ['Grains & Bread', [
        'bread', 'rice', 'pasta', 'quinoa', 'oats', 'cereal', 'flour',
        'tortilla', 'bagel', 'roll', 'noodles', 'barley', 'bulgur'
      ]],
      ['Pantry', [
        'oil', 'vinegar', 'salt', 'pepper', 'spice', 'sauce', 'paste',
        'stock', 'broth', 'can', 'jar', 'bottle', 'extract', 'vanilla',
        'sugar', 'honey', 'syrup', 'baking', 'powder', 'soda', 'nuts',
        'seeds', 'nut', 'almond', 'walnut', 'peanut'
      ]],
      ['Frozen', [
        'frozen', 'ice', 'cream'
      ]],
      ['Snacks', [
        'chips', 'crackers', 'popcorn', 'granola', 'bar'
      ]],
      ['Beverages', [
        'juice', 'water', 'soda', 'coffee', 'tea', 'drink'
      ]]
    ]);
  }
  
  /**
   * Normalize ingredient names for better aggregation
   */
  private static normalizeIngredientName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical content
      .replace(/,.*$/, '') // Remove everything after comma
      .replace(/\s*(fresh|dried|ground|chopped|diced|sliced|minced)\s*/g, ' ') // Remove common descriptors
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  /**
   * Round amounts to reasonable precision
   */
  private static roundAmount(amount: number): number {
    if (amount < 1) {
      return Math.round(amount * 100) / 100; // 2 decimal places for small amounts
    } else if (amount < 10) {
      return Math.round(amount * 10) / 10; // 1 decimal place
    } else {
      return Math.round(amount); // Whole numbers for large amounts
    }
  }
  
  /**
   * Capitalize first letter
   */
  private static capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  /**
   * Generate helpful notes for shopping items
   */
  private static generateItemNotes(ingredientName: string, unit: string): string | undefined {
    const lowerName = ingredientName.toLowerCase();
    
    // Generate context-specific notes
    if (lowerName.includes('organic') || lowerName.includes('fresh')) {
      return 'Organic preferred';
    }
    
    if (lowerName.includes('low fat') || lowerName.includes('reduced fat')) {
      return 'Low-fat option';
    }
    
    if (lowerName.includes('whole wheat') || lowerName.includes('whole grain')) {
      return 'Whole grain preferred';
    }
    
    if (unit === 'pinch' || unit === 'dash') {
      return 'Small amount needed';
    }
    
    if (['salt', 'pepper', 'spice'].some(s => lowerName.includes(s))) {
      return 'Check pantry first';
    }
    
    return undefined;
  }
  
  /**
   * Export shopping list to text format
   */
  static exportToText(shoppingList: ShoppingList): string {
    let text = `Shopping List - Week of ${new Date(shoppingList.weekStartDate).toLocaleDateString()}\n`;
    text += `Generated: ${new Date(shoppingList.generatedAt).toLocaleDateString()}\n`;
    text += `Total Items: ${shoppingList.totalItems}\n\n`;
    
    shoppingList.categories.forEach(category => {
      text += `${category.name.toUpperCase()}\n`;
      text += '─'.repeat(category.name.length + 5) + '\n';
      
      category.items.forEach(item => {
        text += `☐ ${item.amount} ${item.unit} ${item.name}`;
        if (item.notes) {
          text += ` (${item.notes})`;
        }
        text += '\n';
      });
      
      text += '\n';
    });
    
    return text;
  }
  
  /**
   * Export shopping list to CSV format
   */
  static exportToCSV(shoppingList: ShoppingList): string {
    let csv = 'Category,Item,Amount,Unit,Notes,Recipes\n';
    
    shoppingList.categories.forEach(category => {
      category.items.forEach(item => {
        const recipes = item.recipes.join('; ');
        const notes = item.notes || '';
        csv += `"${category.name}","${item.name}","${item.amount}","${item.unit}","${notes}","${recipes}"\n`;
      });
    });
    
    return csv;
  }
}