# Grocery List Data Fix Plan

## Problem
Complete recipes/dishes are appearing as grocery items (e.g., "turkey sandwich", "chicken wrap", "tuna salad") instead of their raw ingredients.

## Root Cause
The recipe JSON files contain recipes with complete dishes listed as ingredients:
- Recipe: "Wrap Chicken Wrap with mixed vegetables"
- Ingredient: "8 oz chicken wrap" (should be "8 oz chicken breast")

## Todo Items

### Immediate Fix (Code Solution)
- [x] Create a mapping of dish names to raw ingredients
- [x] Add transformation logic in grocery utils
- [x] Filter out complete dish names from grocery lists
- [x] Replace with appropriate raw ingredients

### Long-term Fix (Data Solution)
- [ ] Update recipe JSON files to use raw ingredients
- [ ] Fix recipe generation script to prevent this issue
- [ ] Add validation to catch these errors

## Implementation Plan

### Phase 1: Quick Fix in Code
1. Add ingredient transformation map
2. Apply transformations when processing grocery items
3. Test with current data

### Phase 2: Data Cleanup (Future)
1. Audit all recipe files
2. Replace dish names with raw ingredients
3. Update recipe generator

## Review

### Summary of Changes:

1. **Added Dish-to-Ingredient Transformation**
   - Created `transformDishToIngredient()` function
   - Maps complete dishes to their raw ingredients
   - Handles common cases like "chicken wrap" → "chicken breast"

2. **Transformations Implemented**
   - chicken wrap → chicken breast
   - turkey sandwich → sliced turkey
   - tuna salad → canned tuna
   - chicken salad → chicken breast
   - egg salad → hard boiled eggs
   - grilled cheese → cheese slices (2 slices)
   - peanut butter sandwich → peanut butter (2 tablespoons)

3. **Integration with Grouping**
   - Applied transformation before normalization
   - Ensures dishes are converted to ingredients before grouping
   - Maintains proper amounts and units

### Example Transformations:
- "8 oz chicken wrap" → "8 oz chicken breast"
- "8 oz turkey sandwich" → "8 oz sliced turkey"
- "8 oz tuna salad" → "8 oz canned tuna"

This fix ensures users see actual grocery items they can purchase rather than complete dishes in their shopping list.