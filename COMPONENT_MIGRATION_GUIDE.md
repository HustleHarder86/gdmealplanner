# Component Migration Guide: API to LocalRecipeService

This guide shows how to update components from using API calls to using the LocalRecipeService for offline functionality.

## Step 1: Import LocalRecipeService

```typescript
import { LocalRecipeService } from "@/src/services/local-recipe-service";
```

## Step 2: Replace API Calls

### Before (API-based):

```typescript
const response = await fetch("/api/recipes/list");
const data = await response.json();
setRecipes(data.recipes || []);
```

### After (LocalRecipeService):

```typescript
// Initialize service (do this once, ideally in a provider)
await LocalRecipeService.initialize(recipeData);

// Get recipes
const recipes = LocalRecipeService.getAllRecipes();
setRecipes(recipes);
```

## Step 3: Use Specialized Methods

Instead of filtering manually, use LocalRecipeService methods:

### Search:

```typescript
// Before
const filtered = recipes.filter((r) =>
  r.title.toLowerCase().includes(searchTerm.toLowerCase()),
);

// After
const filtered = LocalRecipeService.searchRecipes(searchTerm);
```

### Quick Recipes:

```typescript
// Before
const quick = recipes.filter((r) => r.totalTime <= 30);

// After
const quick = LocalRecipeService.getQuickRecipes(30);
```

### Bedtime Snacks:

```typescript
// Before
const bedtime = recipes.filter(
  (r) =>
    r.category === "snack" &&
    r.nutrition.carbohydrates >= 14 &&
    r.nutrition.carbohydrates <= 16 &&
    r.nutrition.protein >= 5,
);

// After
const bedtime = LocalRecipeService.getBedtimeSnacks();
```

## Step 4: Initialize Service on App Start

Create a provider to initialize the service once:

```typescript
// app/providers/RecipeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react';
import { LocalRecipeService } from '@/src/services/local-recipe-service';

const RecipeContext = createContext<{
  isInitialized: boolean;
  recipeCount: number;
}>({
  isInitialized: false,
  recipeCount: 0
});

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    async function init() {
      try {
        // Try to load fresh data
        const response = await fetch('/api/recipes/export?format=json');
        if (response.ok) {
          const data = await response.json();
          await LocalRecipeService.initialize(data.recipes);
          LocalRecipeService.saveToLocalStorage();
        }
      } catch (error) {
        // Fall back to local storage
        await LocalRecipeService.initialize();
      }

      setRecipeCount(LocalRecipeService.getAllRecipes().length);
      setIsInitialized(true);
    }

    init();
  }, []);

  return (
    <RecipeContext.Provider value={{ isInitialized, recipeCount }}>
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipeContext);
```

## Step 5: Update Components

### Meal Planner Component:

```typescript
// Before
const response = await fetch("/api/recipes/list?category=breakfast");
const breakfastRecipes = response.json();

// After
const breakfastRecipes = LocalRecipeService.getRecipesByCategory("breakfast");
```

### Recipe Detail Page:

```typescript
// Before
const response = await fetch(`/api/recipes/${id}`);
const recipe = await response.json();

// After
const recipe = LocalRecipeService.getRecipeById(id);
```

## Step 6: Handle Offline State

Add offline indicators:

```typescript
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  setIsOnline(navigator.onLine);

  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Show indicator
{!isOnline && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
    You're offline - using cached recipes
  </div>
)}
```

## Components to Update

1. `/app/recipes/page.tsx` - Main recipe browser
2. `/app/recipes/[id]/page.tsx` - Recipe detail page
3. `/app/meal-planner/page.tsx` - Meal planning interface
4. `/components/RecipeSearch.tsx` - Recipe search component
5. `/components/MealPlanGenerator.tsx` - Already updated to use Firestore directly

## Testing the Migration

1. Build and run the app
2. Test with network disabled in DevTools
3. Verify all recipe features work offline
4. Check that search and filters work correctly
5. Ensure recipe details load properly

## Benefits

- **No API costs** - Eliminate Spoonacular API usage
- **Faster loading** - Local data loads instantly
- **Offline capable** - Works without internet
- **Better search** - Search includes tags and ingredients
- **Predictable performance** - No API rate limits
