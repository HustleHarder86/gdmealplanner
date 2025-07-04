/**
 * Utility functions for grocery list processing
 */

/**
 * Pluralize common cooking units based on amount
 */
export function pluralizeUnit(amount: string, unit: string): string {
  // Parse amount to determine if plural is needed
  const numericAmount = parseAmount(amount);
  
  // Don't pluralize if amount is 1 or less
  if (numericAmount <= 1) {
    return unit;
  }

  // Handle common cooking units
  const pluralMap: Record<string, string> = {
    cup: "cups",
    tablespoon: "tablespoons",
    teaspoon: "teaspoons",
    pound: "pounds",
    ounce: "ounces",
    clove: "cloves",
    slice: "slices",
    piece: "pieces",
    can: "cans",
    package: "packages",
    bunch: "bunches",
    head: "heads",
    stalk: "stalks",
    leaf: "leaves",
  };

  // Check if unit has a known plural
  const lowerUnit = unit.toLowerCase();
  if (pluralMap[lowerUnit]) {
    // Preserve original casing
    if (unit[0] === unit[0].toUpperCase()) {
      return pluralMap[lowerUnit].charAt(0).toUpperCase() + pluralMap[lowerUnit].slice(1);
    }
    return pluralMap[lowerUnit];
  }

  // Return original unit if no plural form found
  return unit;
}

/**
 * Parse amount string to numeric value for comparison
 */
export function parseAmount(amount: string): number {
  if (!amount) return 0;
  
  // Handle fractions like "1/2", "3/4"
  if (amount.includes("/")) {
    const [numerator, denominator] = amount.split("/").map(Number);
    return numerator / denominator;
  }
  
  // Handle mixed numbers like "1 1/2"
  if (amount.includes(" ") && amount.split(" ")[1]?.includes("/")) {
    const [whole, fraction] = amount.split(" ");
    const [numerator, denominator] = fraction.split("/").map(Number);
    return Number(whole) + numerator / denominator;
  }
  
  // Handle regular numbers
  return Number(amount) || 0;
}

/**
 * Normalize ingredient names for better grouping
 */
export function normalizeIngredientName(name: string): string {
  // Convert to lowercase for consistency
  let normalized = name.toLowerCase().trim();
  
  // Remove common variations
  const replacements: Record<string, string> = {
    "cottage cheese bowl": "cottage cheese",
    "plain greek yogurt": "greek yogurt",
    "low-fat cottage cheese": "cottage cheese",
    "non-fat greek yogurt": "greek yogurt",
    "whole wheat": "whole-wheat",
    "whole grain": "whole-grain",
  };
  
  for (const [pattern, replacement] of Object.entries(replacements)) {
    if (normalized.includes(pattern)) {
      normalized = normalized.replace(pattern, replacement);
    }
  }
  
  return normalized;
}

/**
 * Add two fractional amounts together
 */
export function addAmounts(amount1: string, amount2: string): string {
  const num1 = parseAmount(amount1);
  const num2 = parseAmount(amount2);
  const sum = num1 + num2;
  
  // Convert back to fraction if needed
  if (sum % 1 === 0) {
    return sum.toString();
  }
  
  // Common fractions
  const fractions: Record<number, string> = {
    0.25: "1/4",
    0.33: "1/3",
    0.5: "1/2",
    0.66: "2/3",
    0.75: "3/4",
  };
  
  // Check if sum is close to a common fraction
  for (const [decimal, fraction] of Object.entries(fractions)) {
    if (Math.abs(sum % 1 - Number(decimal)) < 0.01) {
      const whole = Math.floor(sum);
      return whole > 0 ? `${whole} ${fraction}` : fraction;
    }
  }
  
  // Return decimal if no common fraction found
  return sum.toFixed(2);
}

/**
 * Group grocery items by normalized name and sum quantities
 */
export interface GroupedGroceryItem {
  name: string;
  displayName: string;
  totalAmount: string;
  unit: string;
  category: string;
  recipes: string[];
  items: Array<{
    amount: string;
    unit: string;
    recipes: string[];
  }>;
}

export function groupGroceryItems(items: any[]): GroupedGroceryItem[] {
  const grouped = new Map<string, GroupedGroceryItem>();
  
  for (const item of items) {
    const normalizedName = normalizeIngredientName(item.name);
    const existing = grouped.get(normalizedName);
    
    if (existing) {
      // Add to existing group
      existing.items.push({
        amount: item.amount,
        unit: item.unit,
        recipes: item.recipes || [],
      });
      
      // Combine recipes (avoid duplicates)
      const allRecipes = [...existing.recipes, ...(item.recipes || [])];
      existing.recipes = Array.from(new Set(allRecipes));
      
      // Sum amounts if units match
      if (existing.unit === item.unit) {
        existing.totalAmount = addAmounts(existing.totalAmount, item.amount);
      }
    } else {
      // Create new group
      grouped.set(normalizedName, {
        name: normalizedName,
        displayName: item.name, // Keep original name for display
        totalAmount: item.amount,
        unit: item.unit,
        category: item.category,
        recipes: item.recipes || [],
        items: [{
          amount: item.amount,
          unit: item.unit,
          recipes: item.recipes || [],
        }],
      });
    }
  }
  
  return Array.from(grouped.values());
}