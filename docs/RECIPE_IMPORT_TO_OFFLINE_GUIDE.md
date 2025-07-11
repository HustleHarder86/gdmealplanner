# Complete Recipe Import to Offline System Guide

This document covers the entire process of importing recipes from Spoonacular API and making them available offline in the app.

## Overview

The system works in 3 stages:
1. **Import**: Get recipes from Spoonacular API → Firebase
2. **Sync**: Export Firebase recipes → Static JSON files  
3. **Display**: Load recipes from static files in the app

## Stage 1: Recipe Import (API → Firebase)

### Prerequisites
- Spoonacular API key in `.env.local`
- Firebase Admin credentials configured
- Local development server running on port 3001

### Import Scripts Available

#### 1. Single Recipe Import
```bash
node scripts/import-recipe-simple.js
```
- Imports 1 test recipe
- Good for testing the import system

#### 2. Small Batch Import (10 recipes)
```bash
node scripts/import-10-recipes.js
```
- Imports 10 healthy recipes
- Good for testing without using too many API calls

#### 3. Comprehensive Import (100+ recipes)
```bash
node scripts/import-100-comprehensive.js
```
- Imports ~100 diverse recipes
- Uses broader search terms for variety

#### 4. Bulk Import (200+ recipes)
```bash
node scripts/bulk-import-recipes.js
```
- Large scale import with strategic search queries
- Organized by meal types and dietary preferences

### How Import Works

1. **Search Spoonacular**: Scripts use strategic search queries
2. **Filter by GD Guidelines**: Only recipes meeting carb/nutrition limits
3. **Prevent Duplicates**: Uses `spoonacularId` for deduplication
4. **Store in Firebase**: Saves complete recipe data with nutrition
5. **Rate Limiting**: Respects API limits with delays between batches

### Import Configuration

Each import script targets specific criteria:

```javascript
// Example search configuration
const SEARCH_QUERIES = [
  { query: 'chicken', maxCarbs: 40, minProtein: 20, count: 10 },
  { query: 'eggs', maxCarbs: 30, minProtein: 15, count: 10 },
  // ... more queries
];
```

### Monitoring Import Progress

Import scripts show real-time progress:
- Recipes found per search
- Import success/failure rates
- Current total recipe count
- Category breakdown

## Stage 2: Sync to Offline Files (Firebase → JSON)

### Why Sync is Needed
- Firebase requires internet connection
- Static files enable offline functionality
- Faster loading (no network requests)
- Better reliability

### Sync Script
```bash
node scripts/sync-all-recipes-admin.js
```

### What Sync Does

1. **Connects to Firebase Admin**: Uses admin credentials
2. **Fetches ALL recipes**: Gets complete recipe data
3. **Creates Export Object**: Structures data for offline use
4. **Writes JSON Files**:
   - `/data/production-recipes.json` (source file)
   - `/public/data/recipes.json` (app file)
   - `/public/data/recipes.min.json` (compressed)
5. **Updates Firebase**: Stores offline data in `offlineData` collection

### Sync Output Structure
```json
{
  "version": "1.0",
  "exportDate": "2025-07-11T...",
  "recipeCount": 397,
  "categoryBreakdown": {
    "breakfast": 90,
    "dinner": 218,
    "lunch": 56,
    "snack": 33
  },
  "recipes": [/* 397 recipe objects */],
  "source": "Firebase Production Database"
}
```

### File Locations After Sync
- `/data/production-recipes.json` - 1.86 MB (source)
- `/public/data/recipes.json` - 1.86 MB (app uses this)
- `/public/data/recipes.min.json` - 1.24 MB (compressed)

## Stage 3: Display in App (JSON → UI)

### How App Loads Recipes

1. **RecipeProvider Initialization**: 
   - Fetches `/data/production-recipes.json`
   - No Firebase or API calls
   - Pure static file loading

2. **LocalRecipeService**: 
   - Manages recipe data in memory
   - Provides search/filter functions
   - Caches data in localStorage

3. **Recipe Page**: 
   - Uses `useRecipes()` hook
   - Displays all recipes with filters
   - Shows offline indicator

### Key Files in App

#### `/src/providers/recipe-provider.tsx`
- Loads recipes from static JSON
- Initializes LocalRecipeService
- Provides recipe context to app

#### `/app/recipes/page.tsx`
- Main recipes page
- Shows recipe count and offline status
- All filtering/search works on local data

#### `/src/services/local-recipe-service.ts`
- In-memory recipe management
- Search and filter functions
- No external dependencies

## Complete Workflow Example

### Starting from 0 recipes to 400+ offline recipes:

```bash
# 1. Start development server
npm run dev

# 2. Import recipes (choose based on needs)
node scripts/import-100-comprehensive.js  # Import 100 diverse recipes
# OR
node scripts/bulk-import-recipes.js      # Import 200+ strategic recipes

# 3. Sync to offline files
node scripts/sync-all-recipes-admin.js

# 4. Test offline system
node scripts/test-offline-recipes.js

# 5. Commit and deploy
git add -A
git commit -m "Add [X] new recipes to offline system"
git push origin main
```

## Troubleshooting Common Issues

### Issue 1: Import Shows 0 Recipes Found
**Cause**: API rate limiting or connectivity issues
**Solution**: 
- Check API key in `.env.local`
- Reduce batch size in import script
- Add longer delays between requests

### Issue 2: Offline Files Show Wrong Recipe Count
**Cause**: Sync script ran before import completed
**Solution**:
```bash
# Re-sync after imports complete
node scripts/sync-all-recipes-admin.js
```

### Issue 3: Production Shows Different Count Than Local
**Cause**: Offline files not deployed or cached
**Solution**:
- Ensure files are committed to Git
- Check file sizes are correct (1.86MB for full data)
- Clear browser cache

### Issue 4: Recipes Page Shows Firebase Errors
**Cause**: App trying to load from Firebase instead of offline files
**Solution**:
- Verify RecipeProvider loads from `/data/production-recipes.json`
- Check console for "[OFFLINE]" log messages
- Ensure no Firebase imports in recipe components

## Verification Steps

### 1. Check Import Success
```bash
# Check Firebase count
curl -s http://localhost:3001/api/recipes/count

# Should show: {"count": 397}
```

### 2. Verify Sync Success
```bash
# Test offline files
node scripts/test-offline-recipes.js

# Should show: ✅ All 397 recipes available offline!
```

### 3. Confirm App Loading
- Open browser dev tools
- Go to /recipes page
- Check console for: "[OFFLINE] Loaded 397 recipes from static file"
- Verify no Firebase/API network requests

## File Structure Overview

```
/scripts/
├── import-recipe-simple.js      # Single recipe import
├── import-10-recipes.js         # Small batch import  
├── import-100-comprehensive.js  # Medium import
├── bulk-import-recipes.js       # Large strategic import
├── sync-all-recipes-admin.js    # Firebase → JSON sync
└── test-offline-recipes.js      # Verification script

/public/data/
├── production-recipes.json      # Main offline file (1.86MB)
├── recipes.json                 # App loads this
├── recipes.min.json            # Compressed version
└── recipes-[category].json     # Category-specific files

/src/
├── providers/recipe-provider.tsx    # Offline loading logic
├── services/local-recipe-service.ts # In-memory management
└── hooks/useRecipes.ts             # Recipe hooks
```

## Performance Considerations

### File Sizes
- Full dataset: 1.86 MB (397 recipes)
- Compressed: 1.24 MB
- Per category: 100-400 KB each

### Loading Strategy
- Load all recipes on initial page visit
- Cache in localStorage for subsequent visits
- No lazy loading needed (fast enough)

### Deployment
- Static files deploy with Vercel automatically
- No CDN configuration needed
- Files served from `/public/data/` path

## Scaling Considerations

### To reach 1000+ recipes:
1. Use bulk import with diverse search strategies
2. Monitor file sizes (may need chunking at 5MB+)
3. Consider implementing category-based loading
4. Add compression/gzipping for very large datasets

### API Usage Optimization:
- Batch imports in groups of 5-10 recipes
- Use 2-3 second delays between batches
- Implement exponential backoff for rate limits
- Cache results to avoid re-importing duplicates

## Security Notes

- API keys are server-side only (import scripts)
- No sensitive data in static JSON files
- Firebase rules prevent unauthorized access
- Offline files are public (recipes only, no user data)

## Maintenance

### Regular Tasks:
1. **Weekly**: Import new recipes to keep content fresh
2. **After imports**: Always run sync to update offline files
3. **Before major releases**: Run verification script
4. **Monthly**: Review and clean up old/low-quality recipes

### Monitoring:
- Track recipe count growth
- Monitor file sizes
- Check import success rates
- Verify offline functionality in production

This process has been tested and proven to work reliably for importing 397 recipes and making them available offline in the GD Meal Planner app.