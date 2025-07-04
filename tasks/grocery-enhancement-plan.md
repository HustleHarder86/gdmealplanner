# Grocery List Enhancement Plan

## Overview
Enhance the grocery list with proper plural handling for units and grouping of identical items from different recipes.

## Todo Items

### Phase 1: Plural Unit Handling
- [x] Create a utility function to handle unit pluralization
- [x] Handle common units (cup/cups, tablespoon/tablespoons, etc.)
- [x] Apply pluralization based on amount values
- [x] Test with various unit types

### Phase 2: Item Grouping
- [x] Analyze current grocery list structure
- [x] Create logic to combine identical items
- [x] Sum quantities when items are the same
- [x] Handle unit conversions if needed (e.g., 1/2 cup + 1/2 cup = 1 cup)
- [x] Show which recipes use each item

### Phase 3: Display Improvements
- [x] Update UI to show grouped items
- [x] Display recipe sources for each item
- [x] Format combined quantities properly
- [x] Test with multiple weeks

## Implementation Notes
- Keep utility functions simple and reusable
- Maintain data structure compatibility
- Ensure no loss of information when grouping
- Test edge cases (fractional amounts, different units)

## Review

### Summary of Changes:

1. **Created Grocery Utilities Library** (`/lib/grocery-utils.ts`)
   - `pluralizeUnit()`: Handles pluralization of common cooking units
   - `parseAmount()`: Parses fractional and mixed number amounts
   - `normalizeIngredientName()`: Normalizes ingredient names for better grouping
   - `addAmounts()`: Adds fractional amounts together
   - `groupGroceryItems()`: Groups identical items and sums quantities

2. **Enhanced Grocery List Display**
   - Items with same normalized name are now grouped together
   - Quantities are summed when units match
   - Units are properly pluralized (e.g., "2 cups" instead of "2 cup")
   - Shows which recipes use each ingredient
   - Better visual hierarchy with recipe information

3. **Key Features Implemented**
   - Smart ingredient normalization (e.g., "cottage cheese bowl" → "cottage cheese")
   - Fraction arithmetic for adding amounts (e.g., 1/2 + 1/2 = 1)
   - Recipe tracking shows first 2 recipes plus count of additional
   - Improved spacing and visual separation between items

### Technical Highlights:
- Non-destructive grouping preserves original data
- Handles edge cases like empty units and fractional amounts
- Maintains compatibility with existing data structure
- Efficient grouping using Map for performance

### Example Results:
- "1/2 cup greek yogurt" + "1/2 cup greek yogurt" = "1 cup greek yogurt"
- "1 tablespoon olive oil" becomes "1 tablespoon olive oil"
- "2 tablespoon olive oil" becomes "2 tablespoons olive oil"
- Shows "Used in: Recipe 1, Recipe 2 +3 more" for items used in multiple recipes