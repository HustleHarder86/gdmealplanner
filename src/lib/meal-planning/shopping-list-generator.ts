/**
 * Shopping List Generator
 * Generates shopping lists from meal plans with ingredient aggregation
 */

import { WeeklyMealPlan, DailyMealPlan, MealAssignment } from "@/src/types/meal-plan";
import { Recipe, Ingredient } from "@/src/types/recipe";
import { 
  ShoppingList, 
  ShoppingListItem, 
  ShoppingListSection,
  StoreSection,
  IngredientUnit,
  UNIT_CONVERSIONS,
  INGREDIENT_SECTIONS
} from "@/src/types/shopping-list";

export class ShoppingListGenerator {
  /**
   * Generate a shopping list from a weekly meal plan
   */
  static generateFromWeeklyPlan(
    mealPlan: WeeklyMealPlan,
    userId: string
  ): ShoppingList {
    const items = new Map<string, ShoppingListItem>();
    const recipeTitles = new Map<string, string>();

    // Process each day
    for (const day of mealPlan.days) {
      this.processDayMeals(day, items, recipeTitles);
    }

    // Convert to sections
    const sections = this.organizeIntoSections(items);

    // Calculate summary
    const totalItems = Array.from(items.values()).length;
    const checkedItems = Array.from(items.values()).filter(item => item.checked).length;

    // Get date range
    const startDate = mealPlan.weekStartDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    return {
      userId,
      mealPlanId: mealPlan.id || "",
      startDate,
      endDate,
      sections,
      summary: {
        totalItems,
        checkedItems,
      },
      additionalItems: [],
      removedItems: [],
      createdAt: new Date(),
    };
  }

  /**
   * Process meals from a single day
   */
  private static processDayMeals(
    day: DailyMealPlan,
    items: Map<string, ShoppingListItem>,
    recipeTitles: Map<string, string>
  ): void {
    for (const meal of day.meals) {
      if (meal.recipe) {
        recipeTitles.set(meal.recipe.id, meal.recipe.title);
        this.processRecipeIngredients(
          meal.recipe,
          meal.servings,
          items,
          day.date,
          meal.mealType
        );
      }
    }
  }

  /**
   * Process ingredients from a recipe
   */
  private static processRecipeIngredients(
    recipe: Recipe,
    servings: number,
    items: Map<string, ShoppingListItem>,
    mealDate: Date,
    mealType: string
  ): void {
    for (const ingredient of recipe.ingredients) {
      const key = this.getIngredientKey(ingredient);
      const adjustedAmount = (ingredient.amount || 0) * servings;
      
      if (items.has(key)) {
        // Add to existing item
        const existingItem = items.get(key)!;
        existingItem.quantity = this.addQuantities(
          existingItem.quantity,
          existingItem.unit,
          adjustedAmount,
          ingredient.unit as IngredientUnit
        );
        existingItem.fromRecipes.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          mealDate,
          mealType,
        });
      } else {
        // Create new item
        const section = this.determineSection(ingredient.name);
        const unit = this.normalizeUnit(ingredient.unit) as IngredientUnit;
        
        items.set(key, {
          id: `item-${Date.now()}-${Math.random()}`,
          name: ingredient.name,
          quantity: adjustedAmount,
          unit,
          section,
          fromRecipes: [{
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            mealDate,
            mealType,
          }],
          checked: false,
        });
      }
    }
  }

  /**
   * Get a unique key for an ingredient
   */
  private static getIngredientKey(ingredient: Ingredient): string {
    // Normalize the name for better grouping
    const normalizedName = ingredient.name
      .toLowerCase()
      .replace(/[,.]/, '')
      .trim();
    
    // Try to standardize units for better grouping
    const normalizedUnit = this.normalizeUnit(ingredient.unit);
    
    return `${normalizedName}::${normalizedUnit}`;
  }

  /**
   * Normalize units for consistency
   */
  private static normalizeUnit(unit?: string): string {
    if (!unit) return 'piece';
    
    const lowerUnit = unit.toLowerCase();
    
    // Map variations to standard units
    const unitMap: Record<string, string> = {
      'tablespoon': 'tablespoons',
      'tbsp': 'tablespoons',
      'teaspoon': 'teaspoons',
      'tsp': 'teaspoons',
      'pound': 'pounds',
      'lb': 'pounds',
      'lbs': 'pounds',
      'ounce': 'ounces',
      'oz': 'ounces',
      'gram': 'grams',
      'g': 'grams',
      'kilogram': 'kilograms',
      'kg': 'kilograms',
      'milliliter': 'milliliters',
      'ml': 'milliliters',
      'liter': 'liters',
      'l': 'liters',
      'cup': 'cups',
      'item': 'piece',
      'items': 'pieces',
      'count': 'piece',
    };
    
    return unitMap[lowerUnit] || lowerUnit;
  }

  /**
   * Add quantities with unit conversion
   */
  private static addQuantities(
    qty1: number,
    unit1: IngredientUnit,
    qty2: number,
    unit2: IngredientUnit
  ): number {
    // If units are the same, just add
    if (unit1 === unit2) {
      return qty1 + qty2;
    }
    
    // Try to convert using standard conversions
    // For now, just add the raw numbers (user will need to adjust)
    return qty1 + qty2;
  }

  /**
   * Determine which store section an ingredient belongs to
   */
  private static determineSection(ingredientName: string): StoreSection {
    const lowerName = ingredientName.toLowerCase();
    
    // Check explicit mappings first
    for (const [keyword, section] of Object.entries(INGREDIENT_SECTIONS)) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return section;
      }
    }
    
    // Additional pattern matching
    if (lowerName.match(/\b(chicken|beef|pork|turkey|lamb|fish|salmon|tuna|shrimp)\b/)) {
      return 'meat-seafood';
    }
    if (lowerName.match(/\b(milk|yogurt|cheese|butter|cream)\b/)) {
      return 'dairy';
    }
    if (lowerName.match(/\b(bread|bagel|muffin|roll|croissant)\b/)) {
      return 'bakery';
    }
    if (lowerName.match(/\b(rice|pasta|quinoa|oats|flour|cereal)\b/)) {
      return 'grains-pasta';
    }
    if (lowerName.match(/\b(apple|banana|orange|berry|lettuce|tomato|carrot|onion)\b/)) {
      return 'produce';
    }
    
    // Default to other
    return 'other';
  }

  /**
   * Organize items into store sections
   */
  private static organizeIntoSections(
    items: Map<string, ShoppingListItem>
  ): ShoppingListSection[] {
    const sectionMap = new Map<StoreSection, ShoppingListItem[]>();
    
    // Group items by section
    for (const item of items.values()) {
      if (!sectionMap.has(item.section)) {
        sectionMap.set(item.section, []);
      }
      sectionMap.get(item.section)!.push(item);
    }
    
    // Convert to sections array
    const sections: ShoppingListSection[] = [];
    const sectionOrder: StoreSection[] = [
      'produce',
      'meat-seafood',
      'dairy',
      'bakery',
      'grains-pasta',
      'canned-goods',
      'frozen',
      'condiments-spices',
      'beverages',
      'snacks',
      'other'
    ];
    
    for (const sectionName of sectionOrder) {
      const sectionItems = sectionMap.get(sectionName);
      if (sectionItems && sectionItems.length > 0) {
        const sortedItems = sectionItems.sort((a, b) => a.name.localeCompare(b.name));
        sections.push({
          name: sectionName,
          items: sortedItems,
          itemCount: sortedItems.length,
          checkedCount: sortedItems.filter(item => item.checked).length,
        });
      }
    }
    
    return sections;
  }

  /**
   * Format quantity for display
   */
  static formatQuantity(quantity: number, unit?: IngredientUnit): string {
    if (!unit || unit === 'piece') {
      return quantity.toString();
    }
    
    // Round to reasonable precision
    const rounded = Math.round(quantity * 100) / 100;
    
    // Format fractions for common measurements
    if (['cups', 'tablespoons', 'teaspoons'].includes(unit) && rounded % 1 !== 0) {
      const whole = Math.floor(rounded);
      const fraction = rounded - whole;
      
      // Common fractions
      if (Math.abs(fraction - 0.25) < 0.01) return `${whole ? whole + ' ' : ''}1/4`;
      if (Math.abs(fraction - 0.33) < 0.01) return `${whole ? whole + ' ' : ''}1/3`;
      if (Math.abs(fraction - 0.5) < 0.01) return `${whole ? whole + ' ' : ''}1/2`;
      if (Math.abs(fraction - 0.67) < 0.01) return `${whole ? whole + ' ' : ''}2/3`;
      if (Math.abs(fraction - 0.75) < 0.01) return `${whole ? whole + ' ' : ''}3/4`;
    }
    
    return rounded.toString();
  }

  /**
   * Get a printable shopping list
   */
  static generatePrintableList(shoppingList: ShoppingList): string {
    let output = `Shopping List\n`;
    output += `${shoppingList.startDate.toLocaleDateString()} - ${shoppingList.endDate.toLocaleDateString()}\n`;
    output += `${shoppingList.summary.totalItems} items\n\n`;
    
    for (const section of shoppingList.sections) {
      output += `\n${section.name.toUpperCase().replace('-', ' ')}\n`;
      output += '-'.repeat(20) + '\n';
      
      for (const item of section.items) {
        const qty = this.formatQuantity(item.quantity, item.unit);
        const unit = item.unit && item.unit !== 'piece' ? ` ${item.unit}` : '';
        output += `[ ] ${qty}${unit} ${item.name}\n`;
      }
    }
    
    return output;
  }
}