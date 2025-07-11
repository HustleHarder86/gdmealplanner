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
          
          // Skip ingredients that are too generic or unhelpful
          if (this.shouldSkipIngredient(normalizedName)) {
            return;
          }
          
          const scaledAmount = (ingredient.amount || 0) * meal.servings;
          const normalizedUnit = this.normalizeUnit(ingredient.unit);
          
          const existing = ingredientMap.get(normalizedName);
          if (existing) {
            // Try to combine similar units
            const combinedUnit = this.combineUnits(existing.unit, normalizedUnit, existing.amount, scaledAmount);
            if (combinedUnit) {
              existing.amount = combinedUnit.amount;
              existing.unit = combinedUnit.unit;
            } else if (existing.unit === normalizedUnit) {
              // Same unit, just add amounts
              existing.amount += scaledAmount;
            } else {
              // For very similar ingredients, force combine even with different units
              if (this.canForceCombine(existing.unit, normalizedUnit)) {
                existing.amount += scaledAmount; // Just add the amounts
                existing.unit = this.getBetterUnit(existing.unit, normalizedUnit);
              } else {
                // Different incompatible units - still combine but note both units
                existing.amount += scaledAmount;
                if (!existing.unit.includes(normalizedUnit) && normalizedUnit !== 'piece' && normalizedUnit !== 'item') {
                  existing.unit = `${existing.unit} + ${normalizedUnit}`;
                }
              }
            }
            
            if (!existing.recipes.includes(recipe.title)) {
              existing.recipes.push(recipe.title);
            }
          } else {
            // Only add if amount is meaningful
            if (scaledAmount > 0 || normalizedUnit === 'piece' || normalizedUnit === 'item') {
              ingredientMap.set(normalizedName, {
                amount: scaledAmount,
                unit: normalizedUnit,
                recipes: [recipe.title],
                isOptional: false
              });
            }
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
      
      // Convert to realistic shopping quantities
      const realisticQuantity = this.convertToShoppingQuantity(data.amount, data.unit, cleanName);
      
      const item: ShoppingItem = {
        name: this.capitalizeFirst(cleanName),
        amount: realisticQuantity.amount,
        unit: realisticQuantity.unit,
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
   * Check if ingredient should be skipped
   */
  private static shouldSkipIngredient(normalizedName: string): boolean {
    const skipList = [
      'water', 'ice', 'salt and pepper', 'to taste', 'as needed',
      'for serving', 'for garnish', 'optional', '', ' '
    ];
    
    return skipList.includes(normalizedName) || normalizedName.length < 2;
  }

  /**
   * Normalize unit names
   */
  private static normalizeUnit(unit: string): string {
    if (!unit || unit.trim() === '') return 'piece';
    
    const unitMappings: Record<string, string> = {
      'cups': 'cup',
      'tablespoons': 'tbsp',
      'tablespoon': 'tbsp',
      'teaspoons': 'tsp',
      'teaspoon': 'tsp',
      'pounds': 'lb',
      'pound': 'lb',
      'ounces': 'oz',
      'ounce': 'oz',
      'pieces': 'piece',
      'items': 'piece',
      'cloves': 'clove',
      'stalks': 'stalk',
      'slices': 'slice'
    };
    
    const normalized = unit.toLowerCase().trim();
    return unitMappings[normalized] || normalized;
  }

  /**
   * Check if units can be force combined
   */
  private static canForceCombine(unit1: string, unit2: string): boolean {
    // Force combine these similar units
    const similarUnits = [
      ['piece', 'clove', 'stalk', 'slice'],
      ['cup', 'tbsp', 'tsp'],
      ['lb', 'oz']
    ];
    
    for (const group of similarUnits) {
      if (group.includes(unit1) && group.includes(unit2)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the better unit between two units
   */
  private static getBetterUnit(unit1: string, unit2: string): string {
    const unitPriority: Record<string, number> = {
      'cup': 3,
      'tbsp': 2,
      'tsp': 1,
      'lb': 3,
      'oz': 2,
      'piece': 1,
      'clove': 1,
      'stalk': 1,
      'slice': 1
    };
    
    const priority1 = unitPriority[unit1] || 0;
    const priority2 = unitPriority[unit2] || 0;
    
    return priority1 >= priority2 ? unit1 : unit2;
  }

  /**
   * Combine similar units and amounts
   */
  private static combineUnits(unit1: string, unit2: string, amount1: number, amount2: number): { amount: number; unit: string } | null {
    const normalizeUnit = (unit: string) => unit.toLowerCase().trim();
    const u1 = normalizeUnit(unit1);
    const u2 = normalizeUnit(unit2);
    
    // Direct matches
    if (u1 === u2) {
      return { amount: amount1 + amount2, unit: unit1 };
    }
    
    // Common unit conversions
    const conversions: Record<string, Record<string, number>> = {
      // Volume conversions
      'cup': { 'cups': 1, 'tablespoon': 16, 'tablespoons': 16, 'tbsp': 16, 'teaspoon': 48, 'teaspoons': 48, 'tsp': 48 },
      'cups': { 'cup': 1, 'tablespoon': 16, 'tablespoons': 16, 'tbsp': 16, 'teaspoon': 48, 'teaspoons': 48, 'tsp': 48 },
      'tablespoon': { 'cup': 1/16, 'cups': 1/16, 'tablespoons': 1, 'tbsp': 1, 'teaspoon': 3, 'teaspoons': 3, 'tsp': 3 },
      'tablespoons': { 'cup': 1/16, 'cups': 1/16, 'tablespoon': 1, 'tbsp': 1, 'teaspoon': 3, 'teaspoons': 3, 'tsp': 3 },
      'tbsp': { 'cup': 1/16, 'cups': 1/16, 'tablespoon': 1, 'tablespoons': 1, 'teaspoon': 3, 'teaspoons': 3, 'tsp': 3 },
      'teaspoon': { 'cup': 1/48, 'cups': 1/48, 'tablespoon': 1/3, 'tablespoons': 1/3, 'tbsp': 1/3, 'teaspoons': 1, 'tsp': 1 },
      'teaspoons': { 'cup': 1/48, 'cups': 1/48, 'tablespoon': 1/3, 'tablespoons': 1/3, 'tbsp': 1/3, 'teaspoon': 1, 'tsp': 1 },
      'tsp': { 'cup': 1/48, 'cups': 1/48, 'tablespoon': 1/3, 'tablespoons': 1/3, 'tbsp': 1/3, 'teaspoon': 1, 'teaspoons': 1 },
      
      // Weight conversions
      'pound': { 'pounds': 1, 'lb': 1, 'lbs': 1, 'ounce': 16, 'ounces': 16, 'oz': 16 },
      'pounds': { 'pound': 1, 'lb': 1, 'lbs': 1, 'ounce': 16, 'ounces': 16, 'oz': 16 },
      'lb': { 'pound': 1, 'pounds': 1, 'lbs': 1, 'ounce': 16, 'ounces': 16, 'oz': 16 },
      'lbs': { 'pound': 1, 'pounds': 1, 'lb': 1, 'ounce': 16, 'ounces': 16, 'oz': 16 },
      'ounce': { 'pound': 1/16, 'pounds': 1/16, 'lb': 1/16, 'lbs': 1/16, 'ounces': 1, 'oz': 1 },
      'ounces': { 'pound': 1/16, 'pounds': 1/16, 'lb': 1/16, 'lbs': 1/16, 'ounce': 1, 'oz': 1 },
      'oz': { 'pound': 1/16, 'pounds': 1/16, 'lb': 1/16, 'lbs': 1/16, 'ounce': 1, 'ounces': 1 }
    };
    
    if (conversions[u1] && conversions[u1][u2]) {
      const conversionFactor = conversions[u1][u2];
      const convertedAmount1 = amount1 * conversionFactor;
      const totalAmount = convertedAmount1 + amount2;
      
      // Use the larger unit if the total is large enough
      if (u2 === 'cup' || u2 === 'cups') {
        return { amount: Math.round(totalAmount * 4) / 4, unit: totalAmount > 1 ? 'cups' : 'cup' }; // Round to quarter
      } else if (u2 === 'pound' || u2 === 'pounds' || u2 === 'lb' || u2 === 'lbs') {
        return { amount: Math.round(totalAmount * 4) / 4, unit: totalAmount > 1 ? 'lbs' : 'lb' }; // Round to quarter
      } else {
        return { amount: Math.round(totalAmount * 100) / 100, unit: unit2 }; // Round to hundredth
      }
    }
    
    return null; // Can't combine these units
  }

  /**
   * Ultra-aggressive ingredient normalization for maximum consolidation
   */
  private static normalizeIngredientName(name: string): string {
    let normalized = name.toLowerCase().trim();
    
    // Remove everything in parentheses and after commas
    normalized = normalized.replace(/\s*\([^)]*\)/g, '');
    normalized = normalized.replace(/,.*$/, '');
    normalized = normalized.replace(/\*.*$/, ''); // Remove asterisks and everything after
    normalized = normalized.replace(/-.*$/, ''); // Remove dashes and everything after
    
    // Remove ALL descriptors - be very aggressive
    const descriptorsToRemove = [
      'fresh', 'dried', 'ground', 'chopped', 'diced', 'sliced', 'minced', 'raw', 'cooked', 'frozen', 'canned',
      'large', 'medium', 'small', 'extra', 'jumbo', 'baby', 'young', 'tiny', 'huge', 'mini',
      'boneless', 'skinless', 'lean', 'organic', 'free-range', 'grass-fed', 'wild-caught',
      'whole', 'halved', 'quartered', 'crushed', 'mashed', 'grated', 'shredded', 'julienned',
      'unsalted', 'salted', 'low-fat', 'non-fat', 'reduced-fat', 'light', 'heavy', 'thick', 'thin',
      'extra-virgin', 'virgin', 'pure', 'natural', 'artificial', 'processed',
      'white', 'brown', 'red', 'green', 'yellow', 'black', 'orange', 'purple', 'pink',
      'sweet', 'hot', 'spicy', 'mild', 'sour', 'bitter', 'tangy',
      'to taste', 'as needed', 'for serving', 'for garnish', 'optional',
      'juice of', 'zest of', 'leaves', 'bunch', 'head', 'stalk', 'clove', 'piece',
      'finely', 'roughly', 'coarsely', 'thinly', 'thickly',
      'roasted', 'toasted', 'grilled', 'baked', 'steamed', 'sauteed',
      'concentrated', 'extract', 'powder', 'granulated', 'liquid',
      'additional', 'extra', 'more', 'some', 'few', 'several'
    ];
    
    descriptorsToRemove.forEach(descriptor => {
      const regex = new RegExp(`\\b${descriptor}\\b`, 'g');
      normalized = normalized.replace(regex, ' ');
    });
    
    // Ultra-aggressive ingredient consolidation
    const ultraConsolidationMap: Record<string, string> = {
      // All proteins become just the main protein
      'chicken breast': 'chicken',
      'chicken breasts': 'chicken',
      'chicken thigh': 'chicken', 
      'chicken thighs': 'chicken',
      'chicken': 'chicken',
      'ground beef': 'ground beef',
      'beef': 'ground beef', // Most beef in recipes is ground
      'pork': 'pork',
      'turkey': 'turkey',
      'salmon': 'fish',
      'tuna': 'fish',
      'fish': 'fish',
      'shrimp': 'shrimp',
      'tofu': 'tofu',
      'egg': 'eggs',
      'eggs': 'eggs',
      
      // All beans become just "beans"
      'black beans': 'beans',
      'kidney beans': 'beans', 
      'cannellini beans': 'beans',
      'garbanzo beans': 'beans',
      'chickpeas': 'beans',
      'pinto beans': 'beans',
      'navy beans': 'beans',
      'beans': 'beans',
      'lentils': 'beans',
      'sprouted mung beans': 'beans',
      
      // All vegetables simplified
      'onion': 'onions',
      'onions': 'onions',
      'garlic': 'garlic',
      'tomato': 'tomatoes',
      'tomatoes': 'tomatoes',
      'bell pepper': 'bell peppers',
      'carrot': 'carrots',
      'carrots': 'carrots',
      'celery': 'celery',
      'spinach': 'leafy greens',
      'lettuce': 'leafy greens',
      'kale': 'leafy greens',
      'arugula': 'leafy greens',
      'swiss chard': 'leafy greens',
      'greens': 'leafy greens',
      'salad': 'leafy greens',
      'cucumber': 'cucumber',
      'broccoli': 'broccoli',
      'cauliflower': 'cauliflower',
      'mushroom': 'mushrooms',
      'mushrooms': 'mushrooms',
      'avocado': 'avocados',
      'avocados': 'avocados',
      'zucchini': 'zucchini',
      'corn': 'corn',
      'peas': 'peas',
      
      // All citrus
      'lemon': 'lemons',
      'lime': 'limes', 
      'orange': 'oranges',
      'lemon juice': 'lemons',
      'lime juice': 'limes',
      'lemon zest': 'lemons',
      
      // All herbs as "fresh herbs"
      'basil': 'fresh herbs',
      'cilantro': 'fresh herbs',
      'parsley': 'fresh herbs',
      'mint': 'fresh herbs',
      'thyme': 'spices',
      'oregano': 'spices',
      'rosemary': 'spices',
      'cumin': 'spices',
      'paprika': 'spices',
      'chili powder': 'spices',
      'curry powder': 'spices',
      'garam masala': 'spices',
      'coriander': 'spices',
      'cinnamon': 'spices',
      'turmeric': 'spices',
      
      // All oils
      'olive oil': 'cooking oil',
      'vegetable oil': 'cooking oil',
      'canola oil': 'cooking oil',
      'coconut oil': 'cooking oil',
      'oil': 'cooking oil',
      
      // All vinegars
      'balsamic vinegar': 'vinegar',
      'apple cider vinegar': 'vinegar',
      'white vinegar': 'vinegar',
      'vinegar': 'vinegar',
      
      // All cheese
      'cheddar cheese': 'cheese',
      'mozzarella': 'cheese',
      'parmesan': 'cheese',
      'feta': 'cheese',
      'cheese': 'cheese',
      
      // Pantry staples
      'salt': 'salt',
      'pepper': 'black pepper',
      'flour': 'flour',
      'sugar': 'sugar',
      'butter': 'butter',
      'milk': 'milk',
      'yogurt': 'yogurt',
      'honey': 'honey',
      'rice': 'rice',
      'quinoa': 'quinoa',
      'oats': 'oats',
      'pasta': 'pasta',
      'bread': 'bread'
    };
    
    // Clean up whitespace first
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    // Try exact matches first
    if (ultraConsolidationMap[normalized]) {
      return ultraConsolidationMap[normalized];
    }
    
    // Try partial matches for compound ingredients
    for (const [pattern, replacement] of Object.entries(ultraConsolidationMap)) {
      if (normalized.includes(pattern)) {
        return replacement;
      }
    }
    
    // Extract main ingredient from compound names
    const words = normalized.split(' ');
    if (words.length > 1) {
      const keyIngredients = ['chicken', 'beef', 'pork', 'fish', 'beans', 'onion', 'garlic', 'tomato', 
                             'pepper', 'carrot', 'cheese', 'milk', 'butter', 'oil', 'flour', 'rice'];
      
      for (const key of keyIngredients) {
        if (words.includes(key)) {
          return ultraConsolidationMap[key] || key;
        }
      }
      
      // Use the last meaningful word (usually the noun)
      const meaningfulWords = words.filter(w => w.length > 2 && !['the', 'and', 'or', 'of'].includes(w));
      if (meaningfulWords.length > 0) {
        const lastWord = meaningfulWords[meaningfulWords.length - 1];
        return ultraConsolidationMap[lastWord] || lastWord;
      }
    }
    
    return normalized;
  }
  
  /**
   * Convert to realistic shopping quantities with caps to prevent unrealistic amounts
   */
  private static convertToShoppingQuantity(amount: number, unit: string, ingredientName: string): { amount: number | string; unit: string } {
    const lowerName = ingredientName.toLowerCase();
    
    // HARD CAPS - prevent ridiculous quantities regardless of ingredient
    if (amount > 100 && ['piece', 'cup', 'tbsp', 'tsp'].includes(unit)) {
      amount = Math.min(amount, 10); // Cap at 10 for most cooking units
    }
    
    // Ultra-aggressive consolidation for common problem ingredients
    if (lowerName.includes('onion')) {
      return { amount: '1 bag', unit: '(3 lbs)' };
    }
    
    if (lowerName.includes('tomato')) {
      return { amount: '1 container', unit: '(cherry tomatoes)' };
    }
    
    if (lowerName.includes('beans') || lowerName.includes('chickpea') || lowerName.includes('lentil')) {
      return { amount: '2-3 cans', unit: 'or 1 bag dried' };
    }
    
    if (lowerName.includes('pepper') || lowerName.includes('bell')) {
      return { amount: '1 bag', unit: '(mixed peppers)' };
    }
    
    if (lowerName.includes('carrot')) {
      return { amount: '1 bag', unit: '(2 lbs)' };
    }
    
    if (lowerName.includes('leafy') || lowerName.includes('spinach') || lowerName.includes('lettuce') || lowerName.includes('salad')) {
      return { amount: '1-2 bags', unit: 'leafy greens' };
    }
    
    if (lowerName.includes('fresh herbs') || lowerName.includes('cilantro') || lowerName.includes('parsley') || lowerName.includes('basil')) {
      return { amount: '1 package', unit: 'fresh herbs' };
    }
    
    if (lowerName.includes('spices') || lowerName.includes('cumin') || lowerName.includes('paprika')) {
      return { amount: '1 container', unit: 'spice blend' };
    }
    
    // Proteins - convert to realistic portions
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || lowerName.includes('turkey')) {
      // Cap protein at reasonable amounts for weekly shopping
      const maxProteinOz = 64; // 4 lbs max
      const totalOz = unit === 'lb' ? amount * 16 : (unit === 'oz' ? amount : amount * 6);
      const cappedOz = Math.min(totalOz, maxProteinOz);
      
      if (cappedOz <= 16) return { amount: '1 lb', unit: '' };
      if (cappedOz <= 32) return { amount: '2 lbs', unit: '' };
      return { amount: '3-4 lbs', unit: '' };
    }
    
    // Fish - capped and simplified
    if (lowerName.includes('fish')) {
      return { amount: '1-2 lbs', unit: 'fresh fish' };
    }
    
    if (lowerName.includes('shrimp')) {
      return { amount: '1 lb', unit: 'shrimp' };
    }
    
    // Eggs - reasonable caps
    if (lowerName.includes('egg')) {
      const totalEggs = Math.min(Math.ceil(amount), 24); // Cap at 2 dozen
      if (totalEggs <= 12) return { amount: '1 dozen', unit: '' };
      return { amount: '2 dozen', unit: '' };
    }
    
    // Garlic - simplified
    if (lowerName.includes('garlic')) {
      return { amount: '1 head', unit: 'garlic' };
    }
    
    // Avocados - capped
    if (lowerName.includes('avocado')) {
      return { amount: '3-4', unit: 'avocados' };
    }
    
    // Citrus - simplified
    if (lowerName.includes('lemon')) {
      return { amount: '2-3', unit: 'lemons' };
    }
    
    if (lowerName.includes('lime')) {
      return { amount: '2-3', unit: 'limes' };
    }
    
    // Basic produce - already handled above with consolidated names
    
    // Oils and liquids - simplified
    if (lowerName.includes('oil')) {
      return { amount: '1 bottle', unit: 'cooking oil' };
    }
    
    if (lowerName.includes('vinegar')) {
      return { amount: '1 bottle', unit: 'vinegar' };
    }
    
    if (lowerName.includes('milk')) {
      return { amount: '1/2 gallon', unit: 'milk' };
    }
    
    if (lowerName.includes('butter')) {
      return { amount: '1 pack', unit: 'butter (4 sticks)' };
    }
    
    if (lowerName.includes('yogurt')) {
      return { amount: '1 large container', unit: 'yogurt' };
    }
    
    // Cheese - simplified
    if (lowerName.includes('cheese')) {
      return { amount: '1-2 packages', unit: 'cheese' };
    }
    
    // Pantry staples - simplified with reasonable caps
    if (lowerName.includes('flour')) {
      return { amount: '1 bag', unit: 'flour (5 lbs)' };
    }
    
    if (lowerName.includes('sugar')) {
      return { amount: '1 bag', unit: 'sugar (2 lbs)' };
    }
    
    if (lowerName.includes('rice')) {
      return { amount: '1 bag', unit: 'rice (2 lbs)' };
    }
    
    if (lowerName.includes('quinoa')) {
      return { amount: '1 bag', unit: 'quinoa (1 lb)' };
    }
    
    if (lowerName.includes('oats')) {
      return { amount: '1 container', unit: 'oats' };
    }
    
    if (lowerName.includes('pasta')) {
      return { amount: '1-2 boxes', unit: 'pasta' };
    }
    
    if (lowerName.includes('bread')) {
      return { amount: '1 loaf', unit: 'bread' };
    }
    
    if (lowerName.includes('honey')) {
      return { amount: '1 jar', unit: 'honey' };
    }
    
    // Salt and pepper - check pantry first
    if (lowerName.includes('salt')) {
      return { amount: '1 container', unit: 'salt (check pantry first)' };
    }
    
    if (lowerName.includes('pepper')) {
      return { amount: '1 container', unit: 'black pepper (check pantry first)' };
    }
    
    // Default conversion for remaining items
    return this.convertDefaultUnits(amount, unit);
  }
  
  /**
   * Round amount to reasonable precision
   */
  private static roundAmount(amount: number): number {
    if (amount < 1) {
      return Math.round(amount * 100) / 100; // Round to 2 decimal places for small amounts
    } else if (amount < 10) {
      return Math.round(amount * 10) / 10; // Round to 1 decimal place
    } else {
      return Math.round(amount); // Round to whole numbers for larger amounts
    }
  }

  /**
   * Default unit conversion for remaining items with caps
   */
  private static convertDefaultUnits(amount: number, unit: string): { amount: number | string; unit: string } {
    // Apply hard caps to prevent ridiculous amounts
    const cappedAmount = Math.min(amount, 50); // Never more than 50 of anything in default
    
    switch (unit.toLowerCase()) {
      case 'cup':
      case 'cups':
        if (cappedAmount < 0.25) return { amount: '2 tbsp', unit: '' };
        if (cappedAmount < 0.5) return { amount: '1/4 cup', unit: '' };
        if (cappedAmount < 0.75) return { amount: '1/2 cup', unit: '' };
        if (cappedAmount < 1) return { amount: '3/4 cup', unit: '' };
        if (cappedAmount < 1.5) return { amount: '1 cup', unit: '' };
        if (cappedAmount < 2) return { amount: '1 1/2 cups', unit: '' };
        if (cappedAmount > 8) return { amount: '1 container', unit: '' }; // Cap large amounts
        return { amount: Math.ceil(cappedAmount), unit: cappedAmount > 1 ? 'cups' : 'cup' };
        
      case 'tbsp':
      case 'tablespoon':
      case 'tablespoons':
        if (cappedAmount < 0.5) return { amount: '1 tsp', unit: '' };
        if (cappedAmount < 1) return { amount: '1/2 tbsp', unit: '' };
        if (cappedAmount < 1.5) return { amount: '1 tbsp', unit: '' };
        if (cappedAmount > 16) return { amount: '1 container', unit: '' }; // Cap large amounts
        return { amount: Math.ceil(cappedAmount), unit: 'tbsp' };
        
      case 'tsp':
      case 'teaspoon':
      case 'teaspoons':
        if (cappedAmount < 0.5) return { amount: 'pinch', unit: '' };
        if (cappedAmount < 1) return { amount: '1/2 tsp', unit: '' };
        if (cappedAmount < 1.5) return { amount: '1 tsp', unit: '' };
        if (cappedAmount > 48) return { amount: '1 container', unit: '' }; // Cap large amounts
        return { amount: Math.ceil(cappedAmount), unit: 'tsp' };
        
      case 'lb':
      case 'lbs':
      case 'pound':
      case 'pounds':
        if (cappedAmount < 0.5) return { amount: '1/2 lb', unit: '' };
        if (cappedAmount < 1) return { amount: '3/4 lb', unit: '' };
        if (cappedAmount > 10) return { amount: '1 large bag', unit: '' }; // Cap at 10 lbs
        return { amount: Math.ceil(cappedAmount), unit: cappedAmount > 1 ? 'lbs' : 'lb' };
        
      case 'oz':
      case 'ounce':
      case 'ounces':
        if (cappedAmount <= 8) return { amount: Math.ceil(cappedAmount), unit: 'oz' };
        const lbs = Math.ceil(cappedAmount / 16);
        if (lbs > 5) return { amount: '1 large package', unit: '' }; // Cap large amounts
        return { amount: lbs, unit: lbs > 1 ? 'lbs' : 'lb' };
        
      case 'piece':
      case 'pieces':
      case 'clove':
      case 'cloves':
      case 'stalk':
      case 'stalks':
        if (cappedAmount > 20) return { amount: '1 package', unit: '' }; // Cap large counts
        return { amount: Math.ceil(cappedAmount), unit: '' };
        
      case 'g':
      case 'gr':
      case 'gram':
      case 'grams':
        if (cappedAmount > 1000) return { amount: '1 large package', unit: '' };
        if (cappedAmount < 50) return { amount: '1 small package', unit: '' };
        return { amount: '1 package', unit: '' };
        
      case 'ml':
      case 'milliliter':
      case 'milliliters':
        if (cappedAmount > 500) return { amount: '1 bottle', unit: '' };
        if (cappedAmount < 100) return { amount: '1 small bottle', unit: '' };
        return { amount: '1 bottle', unit: '' };
        
      default:
        // For unknown units, just cap and return
        if (cappedAmount > 10) return { amount: '1 package', unit: unit };
        return { amount: Math.ceil(cappedAmount), unit: unit };
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