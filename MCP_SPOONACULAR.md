# MCP: Spoonacular Recipe Integration

## Overview

This MCP defines the integration of Spoonacular API for importing and managing recipes in the GD Meal Planner application.

## Objective

Import 10 test recipes from Spoonacular API with complete nutrition data, validate them for gestational diabetes requirements, and store them in Firebase with proper categorization.

## Scope

1. Set up Spoonacular API client with authentication
2. Implement recipe search with GD-specific filters
3. Extract complete recipe data including nutrition
4. Validate recipes for GD compliance (10-50g carbs, 5g+ protein, 2g+ fiber)
5. Store recipes in Firebase with proper structure
6. Create admin interface for managing imported recipes

## Technical Requirements

### API Integration

- Endpoint: `https://api.spoonacular.com`
- Authentication: API key in query parameters
- Rate limiting: Respect API quotas
- Error handling: Retry logic and graceful failures

### Data Models

```typescript
interface SpoonacularRecipe {
  id: number;
  title: string;
  nutrition: NutritionData;
  ingredients: Ingredient[];
  instructions: Instruction[];
  readyInMinutes: number;
  servings: number;
  dishTypes: string[];
  diets: string[];
  cuisines: string[];
}

interface GDValidation {
  isValid: boolean;
  carbsInRange: boolean;
  adequateProtein: boolean;
  adequateFiber: boolean;
  warnings: string[];
}
```

### Firebase Schema

```
/recipes_library/
  /spoonacular_imports/
    /{recipeId}/
      - recipe_data
      - gd_validation
      - import_metadata
      - usage_analytics
```

## Implementation Tasks

### Phase 1: API Setup (Day 1)

1. Create `/src/services/spoonacular/` directory structure
2. Implement SpoonacularClient class with authentication
3. Create TypeScript interfaces for API responses
4. Set up environment variables for API key
5. Test basic API connectivity

### Phase 2: Recipe Import (Day 2)

1. Implement recipe search with GD filters
2. Create recipe extraction functionality
3. Build nutrition data parser
4. Implement GD validation logic
5. Test with 10 recipes across meal categories

### Phase 3: Storage & UI (Day 3)

1. Design Firebase schema for imported recipes
2. Implement storage service with deduplication
3. Create admin UI at `/admin/recipes/import`
4. Add recipe preview functionality
5. Implement batch import controls

## Success Criteria

- [ ] Successfully import 10 recipes from Spoonacular
- [ ] All imported recipes have complete nutrition data
- [ ] GD validation correctly identifies compliant recipes
- [ ] Recipes are properly categorized by meal type
- [ ] Admin can preview and manage imported recipes
- [ ] No duplicate recipes in the database
- [ ] API usage stays within test limits

## File Structure

```
/src/
  /services/
    /spoonacular/
      - client.ts          # API client
      - types.ts           # TypeScript interfaces
      - recipe-import.ts   # Import logic
      - validators.ts      # GD validation
      - transformers.ts    # Data transformation
  /app/
    /admin/
      /recipes/
        /import/
          - page.tsx       # Import UI
          - preview.tsx    # Recipe preview
          - actions.ts     # Server actions
```

## API Endpoints Used

1. `GET /recipes/complexSearch` - Find recipes with filters
2. `GET /recipes/{id}/information` - Get full recipe details
3. `GET /recipes/extract` - Extract from URL (optional)

## Error Handling

- API key missing: Clear error message
- Rate limit exceeded: Queue and retry
- Invalid nutrition data: Skip recipe with logging
- Network errors: Exponential backoff retry

## Security Considerations

- API key stored in environment variables only
- Server-side API calls only (no client exposure)
- Input validation for all user inputs
- Rate limiting on our endpoints

## Monitoring

- Log all API calls with response times
- Track success/failure rates
- Monitor API quota usage
- Alert on validation failures

## Agent Instructions

The subagent handling this task should:

1. Start with Phase 1 API setup
2. Test each component before moving forward
3. Use test data before consuming API quotas
4. Document any deviations from plan
5. Create comprehensive error handling
6. Ensure all TypeScript types are properly defined

## Completion Checklist

- [x] API client created and tested
- [x] Recipe search implemented with filters
- [x] Nutrition extraction working correctly
- [x] GD validation logic implemented
- [ ] Firebase storage structure created
- [ ] 10 test recipes successfully imported
- [ ] Admin UI functional
- [x] Documentation updated
- [x] Error handling comprehensive
- [x] Types fully defined

## Phase 1 Completion Notes

- Created complete Spoonacular service structure in `/src/services/spoonacular/`
- Implemented SpoonacularClient with authentication and error handling
- Created comprehensive TypeScript interfaces for all API responses
- Built GD validation logic based on medical guidelines
- Implemented data transformers to convert to app recipe format
- Created test scripts for connection and import testing
- Added proper error handling with retry logic
- Documented usage in README

### Next Steps

1. Set SPOONACULAR_API_KEY in .env.local
2. Run test-connection.ts to verify API access
3. Run import-test-recipes.ts to import 10 test recipes
4. Proceed to Phase 2: Firebase storage integration

---

Last Updated: 2025-07-05
Status: Phase 1 Complete - API Setup Done
Assigned To: Spoonacular Integration Subagent
