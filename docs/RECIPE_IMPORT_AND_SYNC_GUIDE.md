# Recipe Import and Sync Guide

## Overview

This guide documents the recipe import and offline sync system for the Pregnancy Plate Planner app. The system allows you to import recipes from Spoonacular API and sync them to offline storage through the admin UI.

## Current Status (as of commit 7fea37cd)

- **Total Recipes**: 242 (before your recent import of 11)
- **Expected Total**: 253 recipes (after importing 11 new ones)
- **Last Known Export**: July 8, 2025

## How to Import and Sync Recipes

### Method 1: Through the Admin UI (Recommended)

#### Step 1: Import Recipes
1. Go to `https://gdmealplanner.vercel.app/admin/recipes/import`
2. Use the search filters:
   - Query: Search terms (e.g., "chicken", "salad")
   - Max Carbs: Maximum carbohydrates per serving
   - Meal Type: Breakfast, lunch, dinner, or snack
   - Diet: Vegetarian, vegan, gluten-free, etc.
3. Select recipes to import (blue ones marked "In Library" are already imported)
4. Click "Import Selected"

#### Step 2: Sync to Offline Storage
After successful import, you'll see:
- A success message showing how many recipes were imported
- A blue **"Sync Offline Data"** button

Click this button to:
- Update the Firebase offline storage with all recipes
- Make the recipes available for meal planning
- See the total recipe count

#### Alternative: Sync from Recipe Library
You can also sync at any time from the main recipes page:
1. Go to `https://gdmealplanner.vercel.app/admin/recipes`
2. Click the blue **"Sync Offline Data"** button in the top toolbar

### Method 2: Using Terminal (If Needed)

If you need to sync recipes locally:

```bash
# Navigate to project directory
cd /home/amy/dev/gdmealplanner

# Run the sync script
npm run sync-recipes
```

**Note**: This requires Firebase Admin credentials in your `.env.local` file.

## System Architecture

### Data Flow
```
Spoonacular API → Admin Import → Firebase → Offline Storage → Users
                     ↓                           ↓
                Admin Only              Automatic Update
```

### Key Components

1. **Admin Import Page** (`/admin/recipes/import`)
   - Searches Spoonacular API
   - Imports selected recipes to Firebase
   - Shows sync button after import

2. **Bulk Import API** (`/api/admin/recipes/bulk-import`)
   - Processes recipes in batches of 5
   - Validates for GD compliance
   - Auto-updates Firebase offline data

3. **Sync API** (`/api/admin/sync-offline-data`)
   - Fetches all recipes from Firebase
   - Updates offline storage
   - Returns total count and breakdown

4. **Offline Storage**
   - Firebase collection: `offlineData/recipes`
   - Static files: `/public/data/recipes.json`
   - No API calls needed for users

## Recent Changes Made

### Fixed Issues
1. ✅ Removed broken POST endpoint call in import page
2. ✅ Fixed ESLint errors (unescaped quotes, React hooks)
3. ✅ Fixed TypeScript errors (proper typing)
4. ✅ Fixed dynamic route errors for Vercel
5. ✅ Fixed AuthProvider error

### New Features Added
1. ✅ Sync button on import page (appears after successful import)
2. ✅ Sync button on recipe library page
3. ✅ API endpoint for syncing offline data
4. ✅ Visual feedback with loading states and success messages

## Files Modified

- `/app/admin/recipes/import/page.tsx` - Added sync functionality
- `/app/admin/recipes/page.tsx` - Added sync button
- `/app/api/admin/sync-offline-data/route.ts` - New sync endpoint
- `/scripts/sync-offline-recipes.ts` - Local sync script
- Various files for ESLint and TypeScript fixes

## Troubleshooting

### If Import Fails
- Check Spoonacular API key is valid in Vercel
- Verify Firebase admin credentials are configured
- Check browser console for errors

### If Sync Fails
- Ensure you're logged in as admin
- Check Firebase connection
- Try refreshing the page and syncing again

### Verifying Success
- Check the recipe count shown after sync
- Visit `/admin/recipes` to see total recipes
- The count should match what's shown in the sync success message

## Next Steps

1. After syncing, the recipes are available in Firebase offline storage
2. For local development, run `npm run sync-recipes` to download to JSON files
3. Commit and push any local JSON updates if needed

## Important Notes

- Only admins can import and sync recipes
- Regular users access pre-imported recipes with zero API calls
- The system maintains 242+ recipes for meal planning
- All recipes are validated for gestational diabetes compliance