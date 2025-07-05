# Recipe Data Cleanup Plan

## Overview

Clean up recipe data to replace complete dishes listed as ingredients with their actual raw ingredients.

## Problems Identified

1. Recipes with redundant names (e.g., "Wrap Chicken Wrap with mixed vegetables")
2. Complete dishes listed as ingredients (e.g., "8 oz chicken wrap" instead of "8 oz chicken breast")
3. Inconsistent naming patterns

## Todo Items

### Phase 1: Analysis

- [ ] Identify all problematic recipes with dish names as ingredients
- [ ] Create a comprehensive mapping of dishes to ingredients
- [ ] List all affected recipe files

### Phase 2: Data Cleanup Script

- [ ] Create a script to fix recipe data
- [ ] Replace dish ingredients with raw ingredients
- [ ] Fix redundant recipe names
- [ ] Preserve nutritional data accuracy

### Phase 3: Validation

- [ ] Verify all recipes have valid ingredients
- [ ] Check nutritional totals still match
- [ ] Ensure no data loss
- [ ] Update meal plans if needed

## Implementation Notes

- Backup original data before making changes
- Maintain recipe IDs for meal plan consistency
- Preserve all nutritional information
- Fix both scraped data and generated meal plans

## Review

(To be completed after implementation)
