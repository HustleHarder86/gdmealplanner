# Recipe Update Plan - Replace Fake Recipes with Real Data

## Problem Summary
- 47 out of 48 recipes (97.9%) have fake URLs that don't exist on diabetesfoodhub.org
- These recipes appear to be programmatically generated, not scraped from real sources
- Only "Mediterranean Chicken Pita" is a real recipe with a valid URL

## Solution Approach

### Phase 1: Identify Real Recipe Sources
1. Search diabetesfoodhub.org for gestational diabetes-friendly recipes
2. Identify other reputable sources for GD recipes:
   - diabetes.org/recipes
   - diabetic.org/recipes
   - gestationaldiabetes.co.uk/recipes

### Phase 2: Create Real Recipe Scraper
1. Update the Python scraper to find actual GD-friendly recipes
2. Ensure we capture:
   - Exact recipe titles from the source
   - Actual ingredients as listed
   - Real cooking instructions (not generic templates)
   - Verified nutritional information
   - Actual prep/cook times

### Phase 3: Recipe Requirements
For each recipe, we need:
1. **Breakfast**: 25-45g carbs, high fiber, balanced protein
2. **Lunch/Dinner**: 30-45g carbs, adequate protein (15g+)
3. **Snacks**: 10-20g carbs, protein included
4. **All recipes**: Under 45 minutes total time

### Phase 4: Implementation Steps
1. Create a new scraper that verifies URLs before saving
2. Scrape real recipes from verified sources
3. Validate nutritional content meets GD guidelines
4. Replace current fake recipes with real ones
5. Update meal plans with new recipe IDs

## Immediate Actions Needed
1. Disable or remove fake recipe URLs from current data
2. Add disclaimer that recipes are "inspired by" sources, not exact copies
3. Begin scraping real recipes to replace fake ones