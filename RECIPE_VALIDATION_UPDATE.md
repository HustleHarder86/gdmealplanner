# Recipe Validation Update Required

## Current vs. Required Carbohydrate Ranges

### Current Implementation:
- **Breakfast**: 25-45g (INCORRECT - too wide)
- **Lunch**: 30-45g (CORRECT)
- **Dinner**: 30-45g (CORRECT) 
- **Snacks**: 10-20g (INCORRECT - should be 15-30g)

### Required per Medical Guidelines:
- **Breakfast**: 30g (fixed amount)
- **Lunch**: 45g (fixed amount)
- **Dinner/Supper**: 45g (fixed amount)
- **Snacks**: 15-30g (range)
- **Bedtime Snack**: 15g + protein (special requirement)

## Actions Needed:

### 1. Update Recipe Categories
- Keep current categories: breakfast, lunch, dinner, snacks
- Add new tag: "bedtime-snack" for appropriate snacks

### 2. Recipe Filtering
Since medical guidelines specify EXACT amounts (not ranges) for meals:
- **Breakfast recipes**: Should total ~30g carbs
- **Lunch recipes**: Should total ~45g carbs  
- **Dinner recipes**: Should total ~45g carbs
- **Snack recipes**: Should be 15-30g carbs
- **Bedtime snacks**: Must be ~15g carbs WITH protein

### 3. Meal Planning Logic Updates
The Meal Planning Agent must:
- Always include 3 meals + 3 snacks (including bedtime snack)
- Ensure exact carb targets are met (not just ranges)
- Space meals/snacks evenly throughout the day
- Prioritize high-fiber options
- Include 3 servings of fruit per day
- Include 3 servings of milk/milk alternatives per day

### 4. Recipe Adjustments
Many current recipes may need portion size adjustments to hit exact targets:
- Breakfast recipes averaging 35g need to be adjusted to 30g
- Some snacks under 15g need larger portions
- Consider creating "combo" suggestions (e.g., "half portion + side")

## Tolerance for "Exact" Amounts
Since exact amounts are specified but real food has variation:
- Meals: ±5g tolerance (so breakfast 25-35g, lunch/dinner 40-50g)
- Snacks: Keep as range 15-30g
- Bedtime snack: 13-17g carbs + must have protein