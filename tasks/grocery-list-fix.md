# Grocery List Quantity Fix Plan

## Problem

The grocery list items have `amount` and `unit` properties in the JSON data, but the UI is trying to display `item.quantity` which doesn't exist, resulting in missing quantities.

## Root Cause

- Type mismatch: GroceryItem interface expects `quantity` and `unit` as separate fields
- JSON data uses `amount` and `unit` instead
- UI expects `item.quantity` but should use `item.amount` and `item.unit`

## Todo Items

### Immediate Fix (Simple Approach)

- [x] Update the meal-planner page UI to display quantities correctly
- [x] Change `{item.quantity} {item.name}` to `{item.amount} {item.unit} {item.name}`
- [x] Test with different items to ensure proper formatting

### Type Definition Update

- [ ] Update GroceryItem type to match actual data structure (deferred - would require data migration)
- [ ] Change `quantity: string` to `amount: string` in type definition
- [ ] Ensure consistency across the codebase

### Visual Improvements

- [x] Add better shadows to meal cards for depth
- [x] Increase week progress dots size for visibility
- [x] Make print button more prominent with text label
- [ ] Handle plural units correctly (future enhancement)
- [ ] Group identical items from different recipes (future enhancement)

## Implementation Notes

- Keep changes minimal and focused
- Test with actual data to ensure correctness
- Maintain existing functionality
