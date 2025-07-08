# MCP: Automated Recipe Import System

## Overview

This MCP defines an automated system to build a comprehensive recipe library by importing 100 GD-compliant recipes daily from Spoonacular API, with intelligent filtering and categorization.

## Objective

Build a library of 2,000+ gestational diabetes-friendly recipes over 20 days using automated imports with smart filters, quality validation, and proper categorization.

## System Architecture

### Daily Import Schedule (100 recipes/day)

- **Days 1-2**: Breakfast focus (40 recipes/day)
- **Days 3-4**: Main meals (30 lunch + 30 dinner/day)
- **Days 5-6**: Snacks (40 recipes/day)
- **Day 7**: Gap filling (20 per category)
- **Repeat cycle for 20 days**

### Import Strategy

#### Phase 1: Core Library (Days 1-10)

- 1,000 recipes total
- 300 breakfast, 350 lunch, 350 dinner, 200 snacks
- Focus on popular, well-rated recipes

#### Phase 2: Dietary Variations (Days 11-15)

- 500 recipes for special diets
- Vegetarian, vegan, gluten-free, dairy-free
- Quick recipes (<15 minutes)

#### Phase 3: Seasonal & Special (Days 16-20)

- 500 seasonal and international recipes
- Batch cooking options
- Restaurant favorites (healthified)

## Filter Specifications

### Breakfast Filters (Days 1-2)

```javascript
// Round 1: Classic breakfast (20 recipes)
{
  query: "breakfast eggs omelet frittata",
  maxCarbs: 25,
  minProtein: 10,
  minFiber: 3,
  maxReadyTime: 20,
  excludeIngredients: "syrup,honey,jam,sugar"
}

// Round 2: Quick options (20 recipes)
{
  query: "breakfast smoothie yogurt overnight oats",
  maxCarbs: 30,
  minProtein: 8,
  minFiber: 4,
  maxSugar: 10,
  diet: "balanced"
}
```

### Lunch Filters (Day 3)

```javascript
// Round 1: Salads & bowls (15 recipes)
{
  query: "salad bowl lunch quinoa",
  minCarbs: 25,
  maxCarbs: 40,
  minProtein: 15,
  minFiber: 5,
  type: "salad,main course"
}

// Round 2: Sandwiches & wraps (15 recipes)
{
  query: "sandwich wrap lunch whole grain",
  minCarbs: 30,
  maxCarbs: 45,
  minProtein: 20,
  includeIngredients: "whole grain,whole wheat"
}
```

### Dinner Filters (Day 4)

```javascript
// Round 1: Protein-focused (15 recipes)
{
  query: "chicken fish salmon tofu dinner",
  minCarbs: 30,
  maxCarbs: 45,
  minProtein: 25,
  minFiber: 5,
  maxReadyTime: 45
}

// Round 2: One-pot meals (15 recipes)
{
  query: "casserole stew curry dinner vegetables",
  minCarbs: 35,
  maxCarbs: 45,
  minProtein: 20,
  type: "main course"
}
```

### Snack Filters (Days 5-6)

```javascript
// Round 1: Morning snacks (20 recipes)
{
  query: "snack cheese nuts yogurt high protein",
  maxCarbs: 15,
  minProtein: 5,
  minFiber: 2,
  maxCalories: 200
}

// Round 2: Afternoon snacks (20 recipes)
{
  query: "snack hummus crackers apple peanut butter",
  minCarbs: 15,
  maxCarbs: 20,
  minProtein: 7,
  type: "snack,appetizer"
}
```

### Universal Quality Filters

Applied to ALL queries:

```javascript
{
  addRecipeNutrition: true,
  addRecipeInformation: true,
  instructionsRequired: true,
  fillIngredients: true,
  sort: "popularity",
  number: 20,
  excludeIngredients: "white bread,white rice,sugar,candy,soda,juice,corn syrup"
}
```

## Implementation Tasks

### 1. Automated Import Service

```
/src/services/spoonacular/automated-import/
├── scheduler.ts         # Daily import scheduler
├── import-strategies.ts # Filter configurations
├── quality-validator.ts # Recipe validation
├── deduplicator.ts     # Prevent duplicates
├── categorizer.ts      # Auto-categorization
└── reporter.ts         # Daily reports
```

### 2. Database Schema

```
/recipes_library/
├── imported_recipes/
│   ├── {recipeId}/
│   │   ├── spoonacular_data
│   │   ├── gd_validation
│   │   ├── category
│   │   ├── import_metadata
│   │   └── quality_score
├── import_history/
│   ├── {date}/
│   │   ├── recipes_imported
│   │   ├── api_calls_used
│   │   ├── success_rate
│   │   └── category_breakdown
└── import_config/
    ├── active_filters
    ├── excluded_ids
    └── schedule
```

### 3. Admin Dashboard

```
/app/admin/recipe-import/
├── page.tsx           # Dashboard overview
├── schedule.tsx       # View/edit schedule
├── history.tsx        # Import history
├── analytics.tsx      # Success metrics
└── manual-import.tsx  # Manual override
```

## Automation Logic

### Daily Execution Flow

1. **2:00 AM**: Wake up scheduler
2. **2:05 AM**: Determine today's category focus
3. **2:10 AM**: Load filter configurations
4. **2:15 AM**: Execute 5 rounds of imports (20 recipes each)
5. **3:00 AM**: Validate all imported recipes
6. **3:30 AM**: Check for duplicates
7. **3:45 AM**: Calculate quality scores
8. **4:00 AM**: Store in Firebase
9. **4:30 AM**: Generate daily report
10. **5:00 AM**: Send summary email

### Import Algorithm

```typescript
async function dailyImport() {
  const dayOfCycle = getDayOfCycle(); // 1-7
  const strategies = getImportStrategies(dayOfCycle);

  for (const strategy of strategies) {
    const recipes = await searchRecipes(strategy.filters);
    const validated = await validateRecipes(recipes);
    const unique = await checkDuplicates(validated);
    const categorized = await categorizeRecipes(unique);
    await storeRecipes(categorized);
  }

  await generateReport();
}
```

## Quality Scoring System

Each recipe gets scored 0-100 based on:

- **GD Compliance (40 points)**
  - Carb range compliance: 20pts
  - Protein adequacy: 10pts
  - Fiber content: 10pts
- **Practicality (30 points)**
  - Cooking time: 10pts
  - Ingredient availability: 10pts
  - Difficulty level: 10pts
- **Popularity (30 points)**
  - Spoonacular rating: 15pts
  - Number of reviews: 15pts

## Monitoring & Adjustments

### Daily Metrics

- Total recipes imported
- GD compliance rate
- Category distribution
- Average quality score
- API quota usage

### Weekly Adjustments

- Identify underperforming categories
- Adjust filters based on success rates
- Remove poor-performing search terms
- Add trending ingredients

### Failure Handling

- Retry failed imports up to 3 times
- Log all failures with reasons
- Email alerts for >10% failure rate
- Automatic filter adjustment for consistent failures

## Success Criteria

- [ ] 2,000+ recipes imported in 20 days
- [ ] 90%+ GD compliance rate
- [ ] <5% duplicate rate
- [ ] All categories well-represented
- [ ] Average quality score >70
- [ ] Daily import success rate >95%

## Manual Overrides

- Pause/resume schedule
- Skip specific days
- Adjust daily quota
- Blacklist specific recipes
- Force re-import
- Manual category assignment

## Reporting

### Daily Report Includes

- Recipes imported by category
- Quality score distribution
- Failed imports with reasons
- API quota remaining
- Tomorrow's planned imports

### Weekly Report Includes

- Total library growth
- Category balance analysis
- Popular recipes identified
- User engagement metrics
- Recommendations for adjustments

## Security & Performance

- API keys stored securely
- Rate limiting: 1 request/second
- Batch operations where possible
- Efficient deduplication queries
- Indexed recipe lookups

## Future Enhancements

- Machine learning for better categorization
- User preference learning
- Seasonal recipe prioritization
- Automatic bad recipe removal
- Integration with meal planning algorithm

---

Last Updated: [Current Date]
Status: Ready for Implementation
Assigned To: Automated Recipe Import Subagent

## Implementation Phases

1. **Phase 1**: Build core import service (Day 1-2)
2. **Phase 2**: Add scheduling and automation (Day 3-4)
3. **Phase 3**: Create admin dashboard (Day 5)
4. **Phase 4**: Test with small batches (Day 6)
5. **Phase 5**: Launch full automation (Day 7+)
