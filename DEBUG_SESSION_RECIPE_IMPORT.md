# Recipe Import System Debug Session - July 5, 2025

## Overview

We built a recipe import system using the Spoonacular API to create a local recipe library for the gestational diabetes meal planner app. The goal is to build up a recipe database so the end users won't need API access.

## Current Status

### ✅ Completed

- Recipe import system built and deployed on Vercel
- Firebase Admin SDK initializes successfully with `FIREBASE_ADMIN_KEY`
- All TypeScript and build errors resolved
- Environment variables properly configured in Vercel
- Diagnostic endpoints created for troubleshooting

### ❌ Remaining Issue

- Firestore connection fails with: `7 PERMISSION_DENIED: Cloud Firestore API has not been used in project gd-meal-planner before or it is disabled`

## Technical Details

### Environment Setup

- **Deployment**: Vercel (https://gdmealplanner.vercel.app)
- **Database**: Firebase Firestore
- **API**: Spoonacular for recipe data
- **Project ID**: gd-meal-planner

### Key Environment Variables in Vercel

1. `FIREBASE_ADMIN_KEY` - Full service account JSON (working!)
2. `SPOONACULAR_API_KEY` - For recipe API access
3. Individual Firebase fields (as backup):
   - `project_id`
   - `private_key` (without quotes!)
   - `client_email`
   - `private_key_id`
   - `client_id`

## Issues Fixed During Session

### 1. Import Path Errors

- **Problem**: Module not found errors
- **Solution**: Changed all imports from `@/services/` to `@/src/services/`

### 2. TypeScript Type Errors

- **Problem**: Type mismatches in Recipe interface
- **Solutions**:
  - Fixed `ImportReport` property access: `report.summary.recipesImported`
  - Changed `carbs` to `carbohydrates` in Recipe interface
  - Added `carbChoices` calculation
  - Fixed ingredient types

### 3. Firebase Initialization at Build Time

- **Problem**: Firebase Admin was initializing during build
- **Solution**: Made initialization lazy with getter functions

### 4. Private Key Decoding Error

- **Problem**: `error:1E08010C:DECODER routines::unsupported`
- **Solution**:
  - Removed quotes from private_key in Vercel
  - Added full service account JSON as `FIREBASE_ADMIN_KEY`
  - Enhanced private key formatting logic

## Diagnostic Endpoints

1. **Test Firebase Connection**
   - URL: https://gdmealplanner.vercel.app/api/test-firebase
   - Shows: Firebase Admin status, Firestore connection, environment vars

2. **Debug Private Key Format**
   - URL: https://gdmealplanner.vercel.app/api/debug-firebase
   - Shows: Private key format diagnostics without exposing sensitive data

3. **Check Project ID**
   - URL: https://gdmealplanner.vercel.app/api/check-project
   - Shows: Project ID and correct Firestore enable URL

4. **Import Recipes UI**
   - URL: https://gdmealplanner.vercel.app/admin/import-recipes
   - Function: Web interface for managing recipe imports

## Next Steps to Complete Setup

1. **Enable Firestore API**
   - Go to: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=gd-meal-planner
   - Click "Enable API"

2. **Enable Firebase Admin SDK API**
   - Go to: https://console.developers.google.com/apis/api/firebase.googleapis.com/overview?project=gd-meal-planner
   - Click "Enable API"

3. **Wait for Propagation**
   - Wait 2-3 minutes after enabling APIs

4. **Test Connection**
   - Visit: https://gdmealplanner.vercel.app/api/test-firebase
   - Should show: `"firestore": "✅ Connected and writable"`

5. **Start Importing Recipes**
   - Visit: https://gdmealplanner.vercel.app/admin/import-recipes
   - Configure import settings
   - Start building recipe library

## Recipe Import Features

### Filtering Criteria (Per MEDICAL_GUIDELINES.md)

- **Breakfast**: 30g carbs max
- **Lunch/Dinner**: 45g carbs max
- **Snacks**: 15-20g carbs
- Validates all recipes meet GD requirements
- Filters for balanced protein and fiber

### Import Options

- Batch sizes: 10, 25, 50, 100 recipes
- Filter by meal type
- Automated deduplication
- Progress tracking
- Error reporting

## Key Code Files

1. **Firebase Admin Setup**: `/src/lib/firebase/admin.ts`
   - Handles both full JSON and individual env vars
   - Enhanced private key formatting
   - Lazy initialization

2. **Import API Endpoint**: `/app/api/recipes/import-batch/route.ts`
   - Handles recipe fetching from Spoonacular
   - Validates GD compliance
   - Saves to Firestore

3. **Import UI**: `/app/admin/import-recipes/page.tsx`
   - No authentication required (per user request)
   - Real-time import progress
   - Error display

4. **Recipe Model**: `/src/models/recipe.ts`
   - Firestore integration
   - Batch operations
   - Type definitions

## Testing Commands

```bash
# Test minimal import (1 recipe)
curl -X POST https://gdmealplanner.vercel.app/api/recipes/import-batch \
  -H "Content-Type: application/json" \
  -d '{"numberOfRecipes": 1, "mealTypes": ["breakfast"], "maxCarbs": 30}'

# Check recipe count
curl https://gdmealplanner.vercel.app/api/recipes/count

# Test Firebase connection
curl https://gdmealplanner.vercel.app/api/test-firebase
```

## Important Notes

- User wants to build library before launching app
- End customers will never use Spoonacular API directly
- All recipes must meet gestational diabetes requirements
- Using Vercel's built-in environment variable storage
- No authentication on import pages (development use only)

## Error Resolution Summary

| Error                     | Solution                              |
| ------------------------- | ------------------------------------- |
| Module not found          | Change imports to @/src/              |
| Type errors               | Update interfaces to match            |
| Private key decoder error | Remove quotes, use FIREBASE_ADMIN_KEY |
| Permission denied         | Enable Firestore & Firebase APIs      |

## Resume Point

Once Firestore and Firebase Admin SDK APIs are enabled in Google Cloud Console, the system should be fully functional. Test with the diagnostic endpoints and then begin importing recipes to build the library.
