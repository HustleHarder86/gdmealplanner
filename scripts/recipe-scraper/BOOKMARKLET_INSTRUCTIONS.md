# Recipe Importer Bookmarklet - Instructions

This bookmarklet allows you to manually import recipes from any recipe website directly into your Pregnancy Plate Planner app.

## Setup Instructions

### 1. Create the Bookmarklet

1. Copy the code from `recipe-importer-bookmarklet.js`
2. Open your browser's bookmark manager
3. Create a new bookmark with these details:
   - **Name**: "Import Recipe to GD App"
   - **URL**: Paste the entire bookmarklet code (starts with `javascript:`)

### 2. Start Your Local Server

Make sure your Next.js app is running locally:
```bash
cd /home/amy/dev/gdmealplanner
npm run dev
```

The app should be accessible at `http://localhost:3000`

## How to Use

### 1. Find a Recipe
- Visit any recipe website (AllRecipes, Food Network, EatingWell, etc.)
- Navigate to a specific recipe page
- Make sure the page has loaded completely

### 2. Run the Bookmarklet
- Click the "Import Recipe to GD App" bookmark you created
- The importer will open as an overlay on the current page

### 3. Review the Extracted Data
The bookmarklet will automatically:
- Extract recipe title, ingredients, instructions, and nutrition data
- Validate that the recipe meets GD requirements (10-50g carbs, 5g+ protein, 2g+ fiber)
- Show you a preview with nutritional analysis

### 4. Import or Cancel
- **Green "Import Recipe" button**: Recipe meets GD requirements and can be imported
- **Gray "Cannot Import" button**: Recipe doesn't meet requirements (too many/few carbs, etc.)
- **Cancel button**: Close without importing

### 5. Confirmation
- If successful, you'll see "Recipe imported successfully!"
- The recipe will be automatically saved to the appropriate category in your app
- A log entry will be created for tracking

## What Gets Extracted

The bookmarklet looks for structured data (JSON-LD) on recipe pages and extracts:

- **Basic Info**: Title, description, prep/cook times, servings
- **Ingredients**: Parsed into amount, unit, and item
- **Instructions**: Step-by-step cooking directions
- **Nutrition**: Calories, carbs, protein, fiber, fat, sugar
- **Category**: Automatically determined (breakfast, lunch, dinner, snacks)

## GD Validation Rules

Recipes must meet these requirements to be imported:

- **Carbohydrates**: 10-50g per serving
- **Protein**: Minimum 5g per serving  
- **Fiber**: Minimum 2g per serving
- **Time**: Maximum 60 minutes total time

## Supported Websites

The bookmarklet works best on sites that use structured data (schema.org), including:

- AllRecipes
- Food Network
- EatingWell
- Taste of Home
- BBC Good Food
- Serious Eats
- Many food blogs

## Troubleshooting

### "No recipe data found"
- The website doesn't use structured data
- Try a different recipe site
- Some sites require scrolling to load data

### "Doesn't meet GD requirements"
- Check the carb content (should be 10-50g)
- Look for recipes with more fiber and protein
- Consider modifying the recipe before importing

### Import fails
- Make sure your local server is running at `http://localhost:3000`
- Check the browser console for error messages
- Verify the API endpoint is accessible

## File Locations

After importing, recipes are saved to:
- `data/recipes/breakfast.json`
- `data/recipes/lunch.json` 
- `data/recipes/dinner.json`
- `data/recipes/snacks.json`

Import logs are saved to:
- `logs/recipe-imports.log`

## Tips for Best Results

1. **Choose GD-appropriate recipes**: Look for recipes that already mention diabetes, low-carb, or balanced nutrition
2. **Check nutrition labels**: Many recipe sites show nutrition info - verify carbs are in the 15-45g range
3. **Use trusted sources**: Established recipe sites usually have better structured data
4. **Review before importing**: Always check the extracted data makes sense before importing

## Next Steps

After importing recipes:
1. Review them in your app at `http://localhost:3000/recipes`
2. Add them to meal plans
3. Rate and review them after trying
4. Share feedback on recipe accuracy

Happy recipe collecting! 🍳