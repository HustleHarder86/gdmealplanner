import { SpoonacularSearchParams } from "../types";

/**
 * Import Strategy Configuration for Automated Recipe Import
 * Based on MCP_AUTOMATED_RECIPE_IMPORT.md specifications
 */

export interface ImportStrategy {
  name: string;
  description: string;
  filters: SpoonacularSearchParams;
  targetCount: number;
  priority: number;
}

export interface DayStrategy {
  day: number;
  category: string;
  strategies: ImportStrategy[];
  totalRecipes: number;
}

// Universal filters applied to all searches
const UNIVERSAL_FILTERS: Partial<SpoonacularSearchParams> = {
  addRecipeNutrition: true,
  addRecipeInformation: true,
  sort: "popularity",
  number: 20, // 20 recipes per API call
};

// Excluded ingredients for all recipes
const EXCLUDED_INGREDIENTS = [
  "white bread",
  "white rice",
  "sugar",
  "candy",
  "soda",
  "juice",
  "corn syrup",
  "honey",
  "maple syrup",
  "jam",
  "jelly",
].join(",");

/**
 * Breakfast import strategies (Days 1-2)
 */
export const BREAKFAST_STRATEGIES: ImportStrategy[] = [
  {
    name: "Classic Breakfast",
    description: "Traditional breakfast dishes with eggs and protein",
    filters: {
      query: "breakfast eggs omelet frittata scrambled",
      maxCarbs: 25,
      minProtein: 10,
      minFiber: 3,
      maxReadyTime: 20,
      excludeIngredients: EXCLUDED_INGREDIENTS,
      type: "breakfast",
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 1,
  },
  {
    name: "Quick Breakfast Options",
    description: "Fast breakfast options with smoothies and overnight oats",
    filters: {
      query: "breakfast smoothie yogurt overnight oats chia",
      maxCarbs: 30,
      minProtein: 8,
      minFiber: 4,
      maxReadyTime: 15,
      excludeIngredients: EXCLUDED_INGREDIENTS,
      diet: "balanced",
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 2,
  },
  {
    name: "Savory Breakfast",
    description: "Savory breakfast options with vegetables",
    filters: {
      query: "breakfast avocado toast whole grain vegetables",
      minCarbs: 15,
      maxCarbs: 30,
      minProtein: 12,
      minFiber: 4,
      includeIngredients: "whole grain,whole wheat",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 3,
  },
  {
    name: "High Protein Breakfast",
    description: "Protein-rich breakfast options",
    filters: {
      query: "breakfast greek yogurt cottage cheese protein",
      maxCarbs: 25,
      minProtein: 15,
      minFiber: 2,
      maxReadyTime: 10,
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 4,
  },
  {
    name: "Weekend Breakfast",
    description: "Special weekend breakfast options",
    filters: {
      query: "breakfast pancakes waffles french toast whole grain",
      minCarbs: 20,
      maxCarbs: 35,
      minProtein: 10,
      minFiber: 3,
      includeIngredients: "whole wheat,almond flour,oat flour",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 5,
  },
];

/**
 * Lunch import strategies (Day 3)
 */
export const LUNCH_STRATEGIES: ImportStrategy[] = [
  {
    name: "Salads & Bowls",
    description: "Nutritious salads and grain bowls",
    filters: {
      query: "salad bowl lunch quinoa chickpea lentil",
      minCarbs: 25,
      maxCarbs: 40,
      minProtein: 15,
      minFiber: 5,
      type: "salad,main course",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 1,
  },
  {
    name: "Sandwiches & Wraps",
    description: "Whole grain sandwiches and wraps",
    filters: {
      query: "sandwich wrap lunch whole grain turkey chicken",
      minCarbs: 30,
      maxCarbs: 45,
      minProtein: 20,
      includeIngredients: "whole grain,whole wheat",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 2,
  },
  {
    name: "Soup & Stew Lunches",
    description: "Hearty soups and stews",
    filters: {
      query: "soup stew lunch vegetable bean lentil",
      minCarbs: 20,
      maxCarbs: 40,
      minProtein: 12,
      minFiber: 6,
      type: "soup",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 3,
  },
  {
    name: "Leftover-Friendly Lunches",
    description: "Meals that work great as leftovers",
    filters: {
      query: "casserole bake lunch meal prep",
      minCarbs: 30,
      maxCarbs: 45,
      minProtein: 18,
      minFiber: 4,
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 4,
  },
];

/**
 * Dinner import strategies (Day 4)
 */
export const DINNER_STRATEGIES: ImportStrategy[] = [
  {
    name: "Protein-Focused Dinners",
    description: "Main dishes with lean protein",
    filters: {
      query: "chicken fish salmon tofu dinner grilled baked",
      minCarbs: 30,
      maxCarbs: 45,
      minProtein: 25,
      minFiber: 5,
      maxReadyTime: 45,
      type: "main course",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 1,
  },
  {
    name: "One-Pot Dinners",
    description: "Easy one-pot meals",
    filters: {
      query: "casserole stew curry dinner vegetables one pot",
      minCarbs: 35,
      maxCarbs: 45,
      minProtein: 20,
      type: "main course",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 2,
  },
  {
    name: "Vegetarian Dinners",
    description: "Plant-based dinner options",
    filters: {
      query: "vegetarian dinner beans lentils quinoa vegetables",
      minCarbs: 30,
      maxCarbs: 45,
      minProtein: 15,
      minFiber: 8,
      diet: "vegetarian",
      type: "main course",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 3,
  },
  {
    name: "Quick Weeknight Dinners",
    description: "Fast dinner options for busy nights",
    filters: {
      query: "dinner quick easy 30 minute meal",
      minCarbs: 25,
      maxCarbs: 45,
      minProtein: 20,
      maxReadyTime: 30,
      type: "main course",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 15,
    priority: 4,
  },
];

/**
 * Snack import strategies (Days 5-6)
 */
export const SNACK_STRATEGIES: ImportStrategy[] = [
  {
    name: "Morning Snacks",
    description: "High-protein morning snacks",
    filters: {
      query: "snack cheese nuts yogurt protein morning",
      maxCarbs: 15,
      minProtein: 5,
      minFiber: 2,
      maxReadyTime: 10,
      type: "snack,appetizer",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 1,
  },
  {
    name: "Afternoon Snacks",
    description: "Balanced afternoon snacks",
    filters: {
      query: "snack hummus crackers apple peanut butter afternoon",
      minCarbs: 15,
      maxCarbs: 20,
      minProtein: 7,
      type: "snack,appetizer",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 2,
  },
  {
    name: "Evening Snacks",
    description: "Bedtime-friendly snacks",
    filters: {
      query: "snack evening bedtime protein low carb",
      minCarbs: 10,
      maxCarbs: 20,
      minProtein: 7,
      minFiber: 2,
      type: "snack",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 3,
  },
  {
    name: "Portable Snacks",
    description: "On-the-go snack options",
    filters: {
      query: "snack portable trail mix energy balls bars",
      maxCarbs: 20,
      minProtein: 6,
      minFiber: 3,
      maxReadyTime: 15,
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 4,
  },
  {
    name: "Savory Snacks",
    description: "Savory snack options",
    filters: {
      query: "snack savory vegetable dip cheese crackers",
      maxCarbs: 18,
      minProtein: 8,
      type: "snack,appetizer",
      excludeIngredients: EXCLUDED_INGREDIENTS,
      ...UNIVERSAL_FILTERS,
    },
    targetCount: 20,
    priority: 5,
  },
];

/**
 * Get import strategies for a specific day in the 7-day cycle
 */
export function getImportStrategiesForDay(dayOfCycle: number): DayStrategy {
  switch (dayOfCycle) {
    case 1:
    case 2:
      return {
        day: dayOfCycle,
        category: "breakfast",
        strategies: BREAKFAST_STRATEGIES.slice(0, dayOfCycle === 1 ? 2 : 3),
        totalRecipes: dayOfCycle === 1 ? 40 : 60,
      };
    case 3:
      return {
        day: 3,
        category: "lunch",
        strategies: LUNCH_STRATEGIES.slice(0, 2),
        totalRecipes: 30,
      };
    case 4:
      return {
        day: 4,
        category: "dinner",
        strategies: DINNER_STRATEGIES.slice(0, 2),
        totalRecipes: 30,
      };
    case 5:
    case 6:
      return {
        day: dayOfCycle,
        category: "snack",
        strategies: SNACK_STRATEGIES.slice(0, dayOfCycle === 5 ? 2 : 3),
        totalRecipes: dayOfCycle === 5 ? 40 : 60,
      };
    case 7:
      // Gap filling day - 20 recipes per category
      return {
        day: 7,
        category: "mixed",
        strategies: [
          BREAKFAST_STRATEGIES[3],
          LUNCH_STRATEGIES[2],
          DINNER_STRATEGIES[2],
          SNACK_STRATEGIES[3],
          SNACK_STRATEGIES[4],
        ],
        totalRecipes: 100,
      };
    default:
      throw new Error(`Invalid day of cycle: ${dayOfCycle}`);
  }
}

/**
 * Get all strategies for a specific meal category
 */
export function getStrategiesByCategory(
  category: "breakfast" | "lunch" | "dinner" | "snack"
): ImportStrategy[] {
  switch (category) {
    case "breakfast":
      return BREAKFAST_STRATEGIES;
    case "lunch":
      return LUNCH_STRATEGIES;
    case "dinner":
      return DINNER_STRATEGIES;
    case "snack":
      return SNACK_STRATEGIES;
    default:
      throw new Error(`Invalid category: ${category}`);
  }
}

/**
 * Apply additional filters based on the current phase of import campaign
 */
export function applyPhaseFilters(
  strategy: ImportStrategy,
  phase: 1 | 2 | 3
): ImportStrategy {
  const modifiedStrategy = { ...strategy };

  switch (phase) {
    case 1:
      // Phase 1: Core library - focus on popular, well-rated recipes
      modifiedStrategy.filters = {
        ...modifiedStrategy.filters,
        sort: "popularity",
      };
      break;
    case 2:
      // Phase 2: Dietary variations
      // Add specific dietary filters based on strategy
      if (modifiedStrategy.name.includes("Vegetarian")) {
        modifiedStrategy.filters.diet = "vegetarian";
      }
      break;
    case 3:
      // Phase 3: Seasonal & special
      // Add seasonal ingredients or international cuisines
      modifiedStrategy.filters = {
        ...modifiedStrategy.filters,
        sort: "random", // Get more variety
      };
      break;
  }

  return modifiedStrategy;
}

/**
 * Calculate which phase we're in based on the day number
 */
export function getCurrentPhase(dayNumber: number): 1 | 2 | 3 {
  if (dayNumber <= 10) return 1;
  if (dayNumber <= 15) return 2;
  return 3;
}