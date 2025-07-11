# Recipe Sync Guide

## Overview

This guide explains how recipe synchronization works in the GD Meal Planner application. The app maintains recipes in Firebase (source of truth) and syncs them to local JSON files for offline access.

## Current Status

- **Total Recipes in Firebase**: 284
- **Recipes in Offline Files**: 284 (after sync)
- **Categories**: 
  - Breakfast: 84 recipes
  - Dinner: 131 recipes  
  - Lunch: 49 recipes
  - Snack: 20 recipes

## Sync Methods

### 1. Admin UI Sync Button (Recommended)

The easiest way to sync recipes is through the Admin UI:

1. Navigate to `/admin/recipes`
2. Click the "Sync Offline Data" button
3. This will:
   - Fetch all recipes from Firebase
   - Update the Firebase offlineData collection
   - Update local JSON files:
     - `/data/production-recipes.json`
     - `/public/data/recipes.json`
     - `/public/data/recipes.min.json`

### 2. Command Line Sync

For development or automated syncing, use the command line:

```bash
# Sync all recipes using Firebase Admin SDK
node scripts/sync-all-recipes-admin.js
```

This script:
- Uses Firebase Admin SDK (no permission issues)
- Fetches ALL recipes from Firebase
- Updates all offline JSON files
- Shows detailed progress and statistics

### 3. API Endpoint

The sync can also be triggered via API:

```bash
curl -X POST http://localhost:3000/api/admin/sync-offline-data
```

## File Structure

```
/data/
  production-recipes.json    # Source file (1.35 MB)

/public/data/
  recipes.json              # Full version for app (1.35 MB)
  recipes.min.json          # Minified version (0.88 MB)
```

## Data Format

The synced JSON files contain:

```json
{
  "version": "1.0",
  "exportDate": "2025-07-11T...",
  "recipeCount": 284,
  "categoryBreakdown": {
    "breakfast": 84,
    "dinner": 131,
    "lunch": 49,
    "snack": 20
  },
  "mealTypeBreakdown": {
    "breakfast": 120,
    "lunch": 85,
    "dinner": 145,
    "snack": 75
  },
  "recipes": [
    {
      "id": "abc123",
      "title": "Recipe Name",
      "category": "breakfast",
      "ingredients": [...],
      "nutrition": {...},
      // ... other fields
    }
  ],
  "source": "Firebase Production Database"
}
```

## Troubleshooting

### Issue: Recipe count mismatch

If you see fewer recipes in the offline files than in Firebase:

1. Check Firebase directly:
   ```bash
   node scripts/debug-recipe-count.js
   ```

2. Force a full sync:
   ```bash
   node scripts/sync-all-recipes-admin.js
   ```

3. Verify the sync:
   ```bash
   # Check all counts
   echo "Firebase: $(node scripts/debug-recipe-count.js 2>/dev/null | grep 'Total recipes in Firebase:' | cut -d':' -f2 | xargs)"
   echo "Offline: $(node -e "console.log(require('./public/data/recipes.json').recipeCount)" 2>/dev/null)"
   ```

### Issue: Permission denied errors

If you get permission errors when syncing:

- Use the Admin SDK scripts (not client SDK)
- Ensure `FIREBASE_ADMIN_KEY` environment variable is set
- The admin key should be the full service account JSON

### Issue: Sync button not working

If the admin UI sync button fails:

1. Check browser console for errors
2. Verify you're logged in as an admin
3. Check the API response in Network tab
4. Try the command line sync as fallback

## Automated Sync

For production, consider setting up automated sync:

1. **GitHub Action** (example):
   ```yaml
   - name: Sync Recipes
     run: node scripts/sync-all-recipes-admin.js
     env:
       FIREBASE_ADMIN_KEY: ${{ secrets.FIREBASE_ADMIN_KEY }}
   ```

2. **Cron Job** on server:
   ```bash
   # Daily at 2 AM
   0 2 * * * cd /path/to/app && node scripts/sync-all-recipes-admin.js
   ```

3. **Vercel Cron** (serverless):
   - Create a cron route that calls the sync API
   - Configure in vercel.json

## Best Practices

1. **Always verify counts** after syncing
2. **Keep local files in git** for version control
3. **Run sync after bulk imports** to update offline data
4. **Monitor file sizes** - recipes.json should be ~1.35 MB
5. **Use minified version** in production for faster loads

## Development Workflow

When developing locally:

1. Import recipes to Firebase (if needed)
2. Run sync to update local files
3. Commit the updated JSON files
4. Deploy (Vercel will use committed files)

## Notes

- The app uses `LocalRecipeService` to read from offline files
- No API calls to Spoonacular are made by regular users
- Admins can still import new recipes from Spoonacular
- All recipe images are stored in Firebase Storage