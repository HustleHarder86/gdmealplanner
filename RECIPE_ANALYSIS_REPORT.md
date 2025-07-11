# Recipe Database Analysis Report

## Summary

The 360 recipes in `/scripts/recipe-scraper/output-full/recipes.json` are **PROGRAMMATICALLY GENERATED**, not scraped from real sources.

## Evidence of Generation

### 1. Title Pattern - 100% Template Match

**ALL 360 recipes** follow this exact pattern:

```
[Style/Cuisine] [Base Dish] with [Addition1] and [Addition2]
```

Examples:

- Mediterranean Scrambled Eggs with whole grain bread and berries
- American Greek Yogurt Bowl with berries and nuts
- Asian-inspired Smoothie with avocado and chia seeds
- Southwest Tofu Stir-fry with wild rice and leafy greens

The generator used:

- **38 style prefixes**: Mediterranean, American, Mexican, Asian-inspired, Nordic, French, Italian, Middle Eastern, Indian-spiced, Southwest, Stuffed, Baked, Quick, etc.
- **41 base dishes**: Greek Yogurt, Smoothie, Tofu Stir-fry, Grilled Chicken, Turkey Meatballs, etc.
- **Various additions**: berries, nuts, whole grain bread, vegetables, quinoa, wild rice, etc.

### 2. Instruction Templates - 75% Duplication

Only **64 unique instruction sets** exist for 360 recipes. The most common patterns:

**Pattern A** (used 10 times):

1. Prepare all ingredients and preheat oven to 375°F if baking.
2. Whisk eggs with milk, salt, and pepper.
3. Heat oil in a non-stick pan over medium heat.
4. Pour in eggs and gently scramble until just set.
5. Prepare [addition1] and [addition2] as desired.
6. Combine all components and serve immediately.

**Pattern B** (used 10 times):

1. Prepare all ingredients and preheat oven to 375°F if baking.
2. Prepare greek yogurt bowl according to package directions or standard method.
3. Prepare [addition1] and [addition2] as desired.
4. Combine all components and serve immediately.

### 3. Ingredient Patterns - 85% Duplication

Only **54 unique ingredient combinations** for 360 recipes. Every single recipe includes:

- 1 tbsp olive oil
- 1/4 tsp salt
- 1/4 tsp black pepper

Common ingredient templates:

- Greek yogurt recipes: Always 2 cups yogurt + olive oil + salt + pepper + 2 additions
- Scrambled eggs: Always 4 eggs + 2 tbsp milk + olive oil + salt + pepper + cinnamon
- Smoothies: Base ingredients + olive oil + salt + pepper (oddly)

### 4. URL Generation

**100% of URLs** are programmatically generated:

```
https://diabetesfoodhub.org/recipes/[exact-recipe-id]
```

Real scraped recipes would have varied URL structures, shortened URLs, or different naming conventions.

### 5. Nutritional Data Patterns

Only **23 unique carb values** across 360 recipes, suggesting calculated rather than analyzed:

- Always whole numbers (no decimals)
- Suspiciously consistent ranges per recipe type
- Identical nutrition for recipes with same base but different cuisines

### 6. Other Red Flags

- **Single source**: All 360 recipes claim to be from diabetesfoodhub.org
- **No authentic ethnic ingredients**: "Mexican" scrambled eggs have same ingredients as "French" version
- **Bizarre combinations**: Smoothies with olive oil, salt, and black pepper
- **Generic descriptions**: "Delicious breakfast option", "Quick and healthy", "Nutritious recipe"
- **Prep times**: Random values between 5-20 minutes with no correlation to complexity

## Specific Examples of Generated Patterns

### Example 1: The "Scrambled Eggs" Series

All 10 variations have identical ingredients and instructions, just different cuisine labels:

- Mediterranean Scrambled Eggs with whole grain bread and berries
- American Scrambled Eggs with whole grain bread and berries
- Mexican Scrambled Eggs with whole grain bread and berries
- (etc.)

### Example 2: The "Greek Yogurt Bowl" Matrix

Generated by combining:

- 10 cuisine styles × 2 addition combinations = 20 Greek Yogurt Bowl recipes
- All have 2 cups yogurt, olive oil, salt, pepper, plus additions

### Example 3: Nonsensical Combinations

- Smoothies containing olive oil, salt, and black pepper
- "Mediterranean" dishes with no Mediterranean ingredients
- "Asian-inspired" recipes lacking any Asian elements

## Recommendations

1. **Do not use these recipes** for a real meal planning application
2. **Replace with real recipe data** from legitimate sources:
   - Actually scrape from diabetesfoodhub.org
   - Use recipe APIs (Spoonacular, Edamam)
   - Partner with certified nutritionists
3. **If keeping generated recipes**, at minimum:
   - Remove nonsensical ingredients (olive oil in smoothies)
   - Add authentic cultural ingredients
   - Vary instructions realistically
   - Calculate accurate nutritional data
4. **Add variety**:
   - Different cooking methods
   - Seasonal ingredients
   - Budget considerations
   - Prep/cook time realism

## Conclusion

These 360 recipes were created by a template-based generator, not scraped from real sources. They lack authenticity, variety, and practical cooking knowledge. For a gestational diabetes meal planner serving real users, this data should be replaced with genuine, medically-appropriate recipes.
