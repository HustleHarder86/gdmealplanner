# Recipe Import Guide

This guide explains how to import new recipes from Spoonacular API into the Pregnancy Plate Planner app.

## Prerequisites

1. **Firebase Admin Credentials**: Ensure `FIREBASE_ADMIN_KEY` is set in your `.env.local` file
2. **Spoonacular API Key**: Ensure `SPOONACULAR_API_KEY` is set in your `.env.local` file
3. **Admin Access**: You must be logged in as an admin user

## Import Process

### 1. Using the Admin UI (Recommended)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin/recipes/import`

3. Use the search filters to find recipes:
   - **Query**: Search terms (e.g., "chicken", "salad")
   - **Max Carbs**: Maximum carbohydrates per serving
   - **Meal Type**: Breakfast, lunch, dinner, or snack
   - **Diet**: Vegetarian, vegan, gluten-free, etc.

4. Select recipes to import:
   - Click on recipes to select them
   - Use "Select All" to select all visible recipes
   - Already imported recipes show "In Library" and cannot be selected

5. Click "Import Selected" to import the recipes

6. The system will:
   - Import recipes to Firebase
   - Validate them for gestational diabetes compliance
   - Automatically update the offline data in Firebase
   - Show a success message with the count of imported recipes

### 2. Syncing to Local Files

After importing recipes through the UI, you need to sync them to local JSON files for deployment:

```bash
npm run sync-recipes
```

This script will:
- Fetch all recipes from Firebase
- Generate `recipes.json` and `recipes.min.json` in `/public/data/`
- Update `production-recipes.json` in `/data/`
- Show a breakdown of recipes by category

### 3. Deploying Updates

After syncing:

1. Commit the updated JSON files:
   ```bash
   git add public/data/recipes*.json data/production-recipes.json
   git commit -m "feat: Add new recipes to offline database"
   ```

2. Push to deploy:
   ```bash
   git push origin main
   ```

Vercel will automatically deploy the changes.

## Testing Import

To test importing a single recipe:

```bash
npx tsx scripts/test-single-import.ts
```

This will attempt to import one test recipe and verify the system is working.

## How It Works

1. **Search**: The admin UI searches Spoonacular for recipes matching your criteria
2. **Import**: Selected recipes are imported to Firebase with full nutritional data
3. **Validation**: Each recipe is scored for GD compliance (carb content, fiber, etc.)
4. **Offline Update**: Firebase offline data is automatically updated
5. **Sync**: The sync script downloads all recipes to static JSON files
6. **Deploy**: Static files are served to users with zero API calls

## Troubleshooting

### Import Fails
- Check your Spoonacular API key is valid
- Verify Firebase admin credentials are configured
- Check the browser console for specific errors

### Recipes Not Appearing Offline
- Run `npm run sync-recipes` after importing
- Commit and deploy the updated JSON files
- Clear browser cache if testing locally

### API Rate Limits
- The system imports in batches of 5 with delays
- If you hit rate limits, wait a few minutes and try again

## Architecture Notes

- **Firebase**: Stores the master recipe database
- **Offline Data**: Static JSON files for client-side access
- **No API Calls**: Regular users never hit Spoonacular API
- **Admin Only**: Only admins can import new recipes