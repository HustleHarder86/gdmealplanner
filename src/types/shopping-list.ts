/**
 * Shopping list types for meal planning
 */

export type StoreSection =
  | "produce"
  | "meat-seafood"
  | "dairy"
  | "bakery"
  | "grains-pasta"
  | "canned-goods"
  | "frozen"
  | "condiments-spices"
  | "beverages"
  | "snacks"
  | "other";

export type IngredientUnit =
  | "cup"
  | "cups"
  | "tablespoon"
  | "tablespoons"
  | "tbsp"
  | "teaspoon"
  | "teaspoons"
  | "tsp"
  | "ounce"
  | "ounces"
  | "oz"
  | "pound"
  | "pounds"
  | "lb"
  | "lbs"
  | "gram"
  | "grams"
  | "g"
  | "kilogram"
  | "kilograms"
  | "kg"
  | "milliliter"
  | "milliliters"
  | "ml"
  | "liter"
  | "liters"
  | "l"
  | "piece"
  | "pieces"
  | "can"
  | "cans"
  | "package"
  | "packages"
  | "bunch"
  | "bunches"
  | "head"
  | "heads"
  | "clove"
  | "cloves"
  | "serving"
  | "servings"
  | "to taste";

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: IngredientUnit;

  // Categorization
  section: StoreSection;

  // Source tracking
  fromRecipes: {
    recipeId: string;
    recipeTitle: string;
    mealDate: Date;
    mealType: string;
  }[];

  // Additional info
  notes?: string;
  isStaple?: boolean; // Pantry staple
  isOptional?: boolean;

  // User interaction
  checked?: boolean;
  customQuantity?: number; // User override
  customUnit?: IngredientUnit;
}

export interface ShoppingList {
  id?: string;
  userId: string;
  mealPlanId: string;

  // Date range this list covers
  startDate: Date;
  endDate: Date;

  // Organized items by section
  sections: ShoppingListSection[];

  // Summary
  summary: {
    totalItems: number;
    checkedItems: number;
    estimatedCost?: number;
  };

  // User customizations
  additionalItems: CustomShoppingItem[];
  removedItems: string[]; // IDs of items user removed

  // Metadata
  createdAt: Date;
  lastModified?: Date;

  // Sharing
  shareToken?: string;
  sharedWith?: string[]; // User IDs
}

export interface ShoppingListSection {
  name: StoreSection;
  items: ShoppingListItem[];

  // Section summary
  itemCount: number;
  checkedCount: number;
}

export interface CustomShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: IngredientUnit;
  section: StoreSection;
  notes?: string;
  checked?: boolean;
  addedAt: Date;
}

export interface ShoppingListGenerationOptions {
  mealPlanId: string;

  // What to include
  includeStaples?: boolean;
  consolidateSimilar?: boolean; // Combine "olive oil" entries

  // Quantity adjustments
  servingMultiplier?: number; // Scale all recipes
  roundUpQuantities?: boolean; // Round to nearest whole unit

  // Organization
  groupBySection?: boolean;
  sortAlphabetically?: boolean;

  // Budget
  includePriceEstimates?: boolean;
  budgetLimit?: number;
}

export interface IngredientConversion {
  from: {
    amount: number;
    unit: IngredientUnit;
  };
  to: {
    amount: number;
    unit: IngredientUnit;
  };
}

// Common conversions for ingredient aggregation
export const UNIT_CONVERSIONS: Record<string, IngredientConversion[]> = {
  volume: [
    {
      from: { amount: 3, unit: "teaspoons" },
      to: { amount: 1, unit: "tablespoon" },
    },
    {
      from: { amount: 16, unit: "tablespoons" },
      to: { amount: 1, unit: "cup" },
    },
    { from: { amount: 2, unit: "cups" }, to: { amount: 1, unit: "pound" } }, // For liquids
    {
      from: { amount: 1000, unit: "milliliters" },
      to: { amount: 1, unit: "liter" },
    },
  ],
  weight: [
    { from: { amount: 16, unit: "ounces" }, to: { amount: 1, unit: "pound" } },
    {
      from: { amount: 1000, unit: "grams" },
      to: { amount: 1, unit: "kilogram" },
    },
    {
      from: { amount: 28.35, unit: "grams" },
      to: { amount: 1, unit: "ounce" },
    },
  ],
};

// Ingredient to store section mapping
export const INGREDIENT_SECTIONS: Record<string, StoreSection> = {
  // Produce
  onion: "produce",
  garlic: "produce",
  tomato: "produce",
  lettuce: "produce",
  carrot: "produce",
  celery: "produce",
  potato: "produce",
  apple: "produce",
  banana: "produce",
  berries: "produce",

  // Meat & Seafood
  chicken: "meat-seafood",
  beef: "meat-seafood",
  pork: "meat-seafood",
  fish: "meat-seafood",
  salmon: "meat-seafood",
  shrimp: "meat-seafood",
  turkey: "meat-seafood",

  // Dairy
  milk: "dairy",
  cheese: "dairy",
  yogurt: "dairy",
  butter: "dairy",
  cream: "dairy",
  eggs: "dairy",

  // Bakery
  bread: "bakery",
  tortilla: "bakery",
  pita: "bakery",

  // Grains & Pasta
  rice: "grains-pasta",
  pasta: "grains-pasta",
  quinoa: "grains-pasta",
  oats: "grains-pasta",
  flour: "grains-pasta",

  // Pantry staples
  oil: "condiments-spices",
  vinegar: "condiments-spices",
  salt: "condiments-spices",
  pepper: "condiments-spices",
  spices: "condiments-spices",
};
