# Offline Migration Guide

This guide explains how to make the Pregnancy Plate Planner app work completely offline without the Spoonacular API.

## Current Status

The app now has:

- ✅ 242 recipes imported from Spoonacular
- ✅ Complete recipe data stored in Firebase
- ✅ Image download system to Firebase Storage
- ✅ Backup and export capabilities
- ✅ Local recipe service for offline use

## Steps to Go Fully Offline

### 1. Download All Recipe Images

First, ensure all recipe images are downloaded to Firebase Storage:

```bash
# Check download status
GET /api/recipes/download-images

# Download all images (in batches)
POST /api/recipes/download-all-images
```

### 2. Create a Complete Backup

Create a backup of all recipe data:

```bash
# Create backup
POST /api/recipes/backup-all

# List available backups
GET /api/recipes/backup-all
```

### 3. Export Recipe Data

Export all recipes as JSON for offline use:

```bash
# Export all recipes
GET /api/recipes/export?format=json

# Export by category
GET /api/recipes/export?format=json&category=breakfast
```

### 4. Prepare Offline Data

Prepare optimized offline data structure:

```bash
# Prepare offline data
POST /api/recipes/prepare-offline

# Check offline readiness
GET /api/recipes/prepare-offline
```

## Using the Local Recipe Service

The `LocalRecipeService` can replace all API calls:

```typescript
import { LocalRecipeService } from "@/src/services/local-recipe-service";

// Initialize with exported data
const recipeData = await fetch("/data/recipes.json").then((r) => r.json());
await LocalRecipeService.initialize(recipeData.recipes);

// Use the service
const allRecipes = LocalRecipeService.getAllRecipes();
const breakfastRecipes = LocalRecipeService.getRecipesByCategory("breakfast");
const recipe = LocalRecipeService.getRecipeById("spoonacular-123");
```

## Removing Spoonacular Dependencies

Once all data is backed up and images are downloaded:

1. Remove Spoonacular client and services:
   - `/src/services/spoonacular/`
   - Environment variable: `SPOONACULAR_API_KEY`

2. Update components to use `LocalRecipeService` instead of API calls

3. Serve recipe data from:
   - Static JSON files (fastest)
   - Firebase (online backup)
   - Local storage (offline cache)

## Data Structure

Each recipe contains:

- Complete nutritional information
- All ingredients with amounts
- Step-by-step instructions
- GD validation data
- Local image URLs (Firebase Storage)
- Original source information

## Benefits of Going Offline

1. **No API costs** - No more Spoonacular API limits
2. **Faster loading** - Local data loads instantly
3. **Always available** - Works without internet
4. **Full control** - Modify recipes as needed
5. **Privacy** - No external API calls

## Verification Checklist

Before removing the API:

- [ ] All 242+ recipes have complete data
- [ ] All images downloaded to Firebase Storage
- [ ] Backup created and verified
- [ ] Offline data prepared
- [ ] Local recipe service tested
- [ ] Components updated to use local data
