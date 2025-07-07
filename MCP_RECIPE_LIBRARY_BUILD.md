# MCP: Recipe Library Building Campaign

## Mission
Build a comprehensive library of 400 gestational diabetes-friendly recipes through systematic importing from Spoonacular API, ensuring variety, nutritional compliance, and practical usability.

## Current Status
- 3 recipes imported (1 snack, 2 lunch)
- Import system functional with relaxed validation
- Spoonacular API connected and working

## Target
400 high-quality, GD-appropriate recipes distributed as:
- Breakfast: 100 recipes (25%)
- Lunch: 100 recipes (25%)
- Dinner: 100 recipes (25%)
- Snacks: 100 recipes (25%)

## Import Strategy Rules

### Query Guidelines
1. Use 1-2 word queries maximum (e.g., "eggs", "chicken salad", NOT "healthy protein-rich breakfast eggs")
2. Avoid combining multiple filters that return 0 results
3. Use common cooking terms Spoonacular recognizes
4. Rotate through synonyms if a query fails

### Nutritional Constraints
- Breakfast: maxCarbs 50g (no minimums)
- Lunch/Dinner: maxCarbs 60g (no minimums)
- Snacks: maxCarbs 30g (no minimums)
- Do NOT set minProtein, minFiber initially
- Let the relaxed validator handle compliance

### Import Process
1. Use `/api/recipes/import-batch` endpoint
2. Import 5-10 recipes per batch
3. Check results after each import
4. Document successful queries in import log
5. Delete any inappropriate recipes immediately

## Phase 1: Core Collection (Days 1-7)

### Day 1-2: Breakfast (50 recipes)
```
Strategies to execute:
- "eggs" (already has 1 strategy)
- "oatmeal"
- "overnight oats"
- "greek yogurt"
- "smoothie breakfast"
- "whole wheat pancakes"
- "quinoa breakfast"
- "chia pudding"
- "avocado toast"
- "cottage cheese"
```

### Day 3-4: Lunch (50 recipes)
```
Strategies to execute:
- "chicken salad"
- "tuna salad"
- "turkey sandwich"
- "veggie wrap"
- "lentil soup"
- "minestrone"
- "chicken soup"
- "grain bowl"
- "mediterranean bowl"
- "bean salad"
```

### Day 5-6: Dinner (50 recipes)
```
Strategies to execute:
- "grilled chicken"
- "baked salmon"
- "turkey meatballs"
- "tofu stir fry"
- "beef stew"
- "vegetable curry"
- "shrimp dinner"
- "pork tenderloin"
- "bean chili"
- "cauliflower"
```

### Day 7: Snacks (50 recipes)
```
Strategies to execute:
- "hummus"
- "greek yogurt snack"
- "cheese crackers"
- "apple peanut butter"
- "mixed nuts"
- "veggie sticks"
- "hard boiled eggs"
- "protein balls"
- "cottage cheese snack"
- "berries"
```

## Import Tracking Template

For each import session, record:
```
Date: [DATE]
Category: [BREAKFAST/LUNCH/DINNER/SNACK]
Query Used: "[EXACT QUERY]"
Results: X recipes imported, Y rejected
Total Library Count: Z recipes
Notes: [Any issues or observations]
```

## Quality Checks
1. After each 50 recipes, review for:
   - Inappropriate ingredients (alcohol, raw fish, high mercury)
   - Duplicate or very similar recipes
   - Proper categorization
   - Image availability
   - Instruction completeness

2. Maintain balance:
   - Variety in protein sources
   - Mix of cooking times (quick vs. slow)
   - Different cuisine styles
   - Various difficulty levels

## Success Criteria
- 400 total recipes achieved
- Each category has 80+ recipes minimum
- Less than 10% rejection rate per batch
- All recipes have images
- Nutritional data is complete
- Instructions are clear and complete

## Tools and Endpoints
- Import endpoint: `POST /api/recipes/import-batch`
- View progress: `/admin/recipes`
- Check count: `GET /api/recipes/count`
- Debug issues: `GET /api/debug-recipes`

## Troubleshooting
- If query returns 0: Try simpler version or synonym
- If high rejection rate: Check nutritional parameters
- If duplicates: Vary queries more
- If API limits: Wait 24 hours or reduce batch size

## Daily Checklist
- [ ] Run 5-10 import batches
- [ ] Review imported recipes
- [ ] Delete inappropriate ones
- [ ] Log successful queries
- [ ] Check category balance
- [ ] Note any issues for next day

Begin with Day 1 breakfast imports immediately.