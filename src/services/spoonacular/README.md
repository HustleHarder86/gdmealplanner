# Spoonacular Recipe API Integration

This service integrates the Spoonacular Recipe API to import and validate recipes for gestational diabetes meal planning.

## Setup

1. **Get an API Key**
   - Sign up at [Spoonacular](https://spoonacular.com/food-api)
   - Get your free API key (150 requests/day)
   - Add to `.env.local`:
     ```
     SPOONACULAR_API_KEY=your_api_key_here
     ```

2. **Test Connection**

   ```bash
   npx tsx src/services/spoonacular/test-connection.ts
   ```

3. **Import Test Recipes**
   ```bash
   npx tsx src/services/spoonacular/import-test-recipes.ts
   ```

## Features

### Recipe Search with GD Filters

- Carbohydrate range filtering (10-50g)
- Minimum protein requirements (5g+)
- Minimum fiber requirements (2g+)
- Meal type categorization

### GD Validation

- Automatic validation against medical guidelines
- GD compliance scoring (0-100)
- Adjustment suggestions for non-compliant recipes
- Morning suitability detection

### Data Transformation

- Converts Spoonacular format to app recipe format
- Standardizes units and measurements
- Extracts structured instructions
- Generates appropriate tags

## Usage Examples

### Basic Recipe Search

```typescript
import { SpoonacularClient } from "./client";

const client = new SpoonacularClient();
const results = await client.searchRecipes({
  query: "chicken salad",
  minCarbs: 30,
  maxCarbs: 45,
  minProtein: 15,
  number: 10,
});
```

### Import GD-Compliant Recipes

```typescript
import { RecipeImportService } from "./recipe-import";

const importService = new RecipeImportService();
const breakfastRecipes = await importService.searchGDCompliantRecipes(
  "breakfast",
  {
    maxReadyTime: 20,
    diet: "vegetarian",
  },
);
```

### Validate a Specific Recipe

```typescript
import { validateRecipeForGD } from "./validators";

const validation = validateRecipeForGD(spoonacularRecipe, "lunch");
if (validation.isValid) {
  // Recipe meets GD requirements
} else {
  console.log("Issues:", validation.warnings);
  console.log("Suggestions:", validation.adjustmentSuggestions);
}
```

## API Quota Management

The free tier includes:

- 150 requests per day
- 1 request per second rate limit

To check your quota:

```typescript
const quota = await client.getQuotaStatus();
console.log(`Remaining: ${quota.remaining}/${quota.limit}`);
```

## File Structure

```
/src/services/spoonacular/
├── client.ts           # API client with authentication
├── types.ts            # TypeScript interfaces
├── validators.ts       # GD compliance validation
├── transformers.ts     # Data transformation utilities
├── recipe-import.ts    # Main import service
├── test-connection.ts  # Connection test script
└── import-test-recipes.ts # Test import script
```

## Error Handling

The service includes:

- Automatic retry with exponential backoff
- Detailed error logging
- Graceful degradation
- API quota awareness

## Security

- API key is only used server-side
- Never exposed to client
- All requests are validated
- Input sanitization included
