# Automated Recipe Import System

This system automatically imports 100 gestational diabetes-compliant recipes daily from the Spoonacular API, building a comprehensive library of 2,000+ recipes over 20 days.

## System Overview

### Key Features
- **Intelligent Filtering**: Uses rotating strategies to import diverse recipe types
- **Quality Validation**: Scores recipes 0-100 based on GD compliance, practicality, and popularity
- **Deduplication**: Prevents duplicate recipes using fingerprinting and fuzzy matching
- **Auto-categorization**: Intelligently categorizes recipes into breakfast, lunch, dinner, or snack
- **Daily Reports**: Generates comprehensive reports on import performance

### Import Schedule (7-day cycle)
- **Days 1-2**: Breakfast focus (40-60 recipes/day)
- **Days 3-4**: Main meals (30 lunch + 30 dinner/day)
- **Days 5-6**: Snacks (40-60 recipes/day)
- **Day 7**: Gap filling (20 per category)

### Campaign Phases
- **Phase 1 (Days 1-10)**: Core library - popular, well-rated recipes
- **Phase 2 (Days 11-15)**: Dietary variations - vegetarian, vegan, gluten-free
- **Phase 3 (Days 16-20)**: Seasonal & special - international cuisines, batch cooking

## Quick Start

```typescript
import { RecipeImportScheduler } from './automated-import';

const scheduler = new RecipeImportScheduler(process.env.SPOONACULAR_API_KEY, {
  campaignStartDate: '2024-01-01',
  dailyQuota: 100,
  minQualityScore: 50,
});

// Execute daily import
const report = await scheduler.executeDailyImport();
console.log(formatReportForDisplay(report));
```

## Quality Scoring System

Each recipe is scored 0-100 based on:

### GD Compliance (40 points)
- Carb range compliance: 20pts
- Protein adequacy: 10pts
- Fiber content: 10pts

### Practicality (30 points)
- Cooking time: 10pts
- Ingredient availability: 10pts
- Difficulty level: 10pts

### Popularity (30 points)
- Spoonacular rating: 15pts
- Number of reviews: 15pts

## Deduplication

The system prevents duplicates through:
1. **Exact ID matching**: Checks Spoonacular recipe IDs
2. **Title matching**: Normalized title comparison
3. **Similar recipe detection**: Fuzzy matching on title and ingredients
4. **Variant detection**: Identifies same dishes with different preparations

## Auto-categorization

Recipes are categorized based on:
- Nutritional profile matching
- Keyword analysis
- Ingredient patterns
- Preparation time and complexity
- Explicit dish type information

## Configuration

### Import Strategies
Edit `import-strategies.ts` to modify:
- Search queries
- Nutritional constraints
- Excluded ingredients
- Sort preferences

### Quality Thresholds
Adjust in scheduler configuration:
- `minQualityScore`: Minimum score to accept (default: 50)
- `maxRetries`: API retry attempts (default: 3)
- `rateLimitDelay`: Delay between API calls (default: 1000ms)

## Daily Reports

Reports include:
- Import summary (recipes imported, rejected, API usage)
- Category breakdown with average quality scores
- Quality score distribution
- GD compliance metrics
- Common warnings and issues
- Actionable recommendations

## Manual Import

For testing or filling specific gaps:

```typescript
const customStrategy = {
  name: "High Fiber Lunch",
  description: "Import high fiber lunch recipes",
  filters: {
    query: "salad bowl quinoa beans",
    minFiber: 8,
    minCarbs: 30,
    maxCarbs: 45,
  },
  targetCount: 20,
  priority: 1,
};

const report = await scheduler.manualImport(customStrategy, 20);
```

## Monitoring

Check campaign status:

```typescript
const status = await scheduler.getCampaignStatus();
console.log(`Day ${status.currentDay}/${status.totalDays}`);
console.log(`Phase: ${status.phase}`);
console.log(`Total imported: ${status.totalRecipesImported}`);
```

## Error Handling

The system handles:
- API rate limits with automatic delays
- Network failures with retries
- Invalid recipe data with validation
- Duplicate content with deduplication

Failed imports are logged with detailed error information for manual review.

## Next Steps

1. **Firebase Integration**: Connect to Firebase for persistent storage
2. **Email Reports**: Set up automated email delivery of daily reports
3. **Admin Dashboard**: Build UI for monitoring and manual control
4. **Machine Learning**: Improve categorization with ML models
5. **User Feedback**: Incorporate user ratings into quality scores