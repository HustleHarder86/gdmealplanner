# Accessing Recipe Data from the Deployed Application

## Production URL
The application is deployed at: **https://gdmealplanner.vercel.app**

## Available API Endpoints

All API endpoints are publicly accessible without authentication:

### 1. List All Recipes
**Endpoint:** `GET /api/recipes/list`

Returns all recipes in the database with basic information.

**Example Response:**
```json
{
  "success": true,
  "recipes": [
    {
      "id": "spoonacular-1018582",
      "title": "Delicious Mango Pineapple Smoothie",
      "description": "...",
      "category": "breakfast",
      "nutrition": {
        "carbohydrates": 20,
        "protein": 8,
        "fat": 9,
        // ... more nutrition data
      },
      "carbChoices": 1,
      // ... more fields
    }
  ],
  "count": 242,
  "totalInDatabase": 242
}
```

### 2. Get Recipe Count
**Endpoint:** `GET /api/recipes/count`

Returns the total count of recipes, optionally broken down by category.

### 3. Get Individual Recipe
**Endpoint:** `GET /api/recipes/[id]`

Returns detailed information for a specific recipe.

**Example:** `GET /api/recipes/spoonacular-1018582`

### 4. Export All Recipes (if available)
**Endpoint:** `GET /api/recipes/export?format=json`

Downloads all recipes as a JSON file with complete data.

## Recipe Data Statistics

Based on the current production data:
- **Total Recipes:** 242
- **By Category:**
  - Breakfast: 81 recipes
  - Lunch: 41 recipes  
  - Dinner: 105 recipes
  - Snack: 15 recipes

- **Nutrition Information:**
  - All recipes have nutrition data
  - Average carbohydrates: 29.3g
  - Carb range: 1g - 70g
  - GD-compliant recipes (15-45g carbs): 142 (58.7%)

## Recipe Data Structure

Each recipe contains:
- `id`: Unique identifier (e.g., "spoonacular-1018582")
- `title`: Recipe name
- `description`: Brief description
- `category`: Meal type (breakfast, lunch, dinner, snack)
- `prepTime`, `cookTime`, `totalTime`: In minutes
- `servings`: Number of servings
- `ingredients`: Array of ingredient objects with name, amount, unit
- `instructions`: Array of step-by-step instructions
- `nutrition`: Object with calories, macros, and micronutrients
- `carbChoices`: Carb exchange value for diabetes management
- `tags`: Array of tags (e.g., "vegetarian", "gluten-free", "quick")
- `imageUrl`: Spoonacular image URL
- `sourceUrl`: Original recipe source
- `gdValidation`: Gestational diabetes compliance scoring

## Example Usage

### Fetch all recipes using JavaScript:
```javascript
const response = await fetch('https://gdmealplanner.vercel.app/api/recipes/list');
const data = await response.json();
console.log(`Found ${data.count} recipes`);
```

### Fetch all recipes using curl:
```bash
curl https://gdmealplanner.vercel.app/api/recipes/list
```

### Download recipes using the provided script:
```bash
node scripts/download-production-recipes.js
```

This will save all recipes to `scripts/production-recipes/` organized by category.

## Notes

1. The API is publicly accessible - no authentication required
2. All recipes are from Spoonacular API
3. Recipes have been validated for gestational diabetes compliance
4. The alternate domain `https://app.pregnancyplateplanner.com` is not currently accessible
5. The Vercel deployment automatically updates when changes are pushed to the main branch