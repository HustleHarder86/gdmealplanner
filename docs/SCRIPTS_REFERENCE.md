# Recipe Scripts Reference Guide

This document provides a complete reference for all recipe-related scripts in the project.

## Import Scripts

### 1. `scripts/import-recipe-simple.js`
**Purpose**: Import a single test recipe
**Usage**: `node scripts/import-recipe-simple.js`
**Best For**: Testing the import system

```javascript
// Imports 1 specific recipe (ID: 782601)
// Good for verifying API connection and import flow
```

### 2. `scripts/import-10-recipes.js`
**Purpose**: Import 10 healthy recipes
**Usage**: `node scripts/import-10-recipes.js`
**Best For**: Small batch testing

```javascript
// Search criteria:
// - Query: "healthy"
// - Max carbs: 40g
// - Min protein: 15g
// - Count: 10 recipes
```

### 3. `scripts/import-100-comprehensive.js`
**Purpose**: Import ~100 diverse recipes using broad search terms
**Usage**: `node scripts/import-100-comprehensive.js`
**Best For**: Building recipe variety

```javascript
// Search strategy:
const COMPREHENSIVE_SEARCHES = [
  { query: 'eggs', maxCarbs: 30, minProtein: 10, count: 10 },
  { query: 'chicken', maxCarbs: 40, minProtein: 20, count: 10 },
  { query: 'beef', maxCarbs: 35, minProtein: 20, count: 10 },
  // ... more general terms
];
```

### 4. `scripts/bulk-import-recipes.js`
**Purpose**: Large-scale strategic import (200+ recipes)
**Usage**: `node scripts/bulk-import-recipes.js`
**Best For**: Building comprehensive recipe library

```javascript
// Strategic searches by meal type:
const SEARCH_QUERIES = [
  // Breakfast options
  { query: 'egg breakfast', maxCarbs: 30, type: 'breakfast', count: 30 },
  { query: 'oatmeal', maxCarbs: 35, type: 'breakfast', count: 15 },
  
  // Lunch options
  { query: 'chicken salad', maxCarbs: 40, type: 'lunch', count: 25 },
  
  // Dinner options
  { query: 'grilled salmon', maxCarbs: 30, type: 'dinner', count: 20 },
  
  // Snack options
  { query: 'hummus snack', maxCarbs: 20, type: 'snack', count: 15 }
];
```

### 5. `scripts/import-phase1-batch.js`
**Purpose**: Phase 1 import focusing on foundation recipes
**Usage**: `node scripts/import-phase1-batch.js`
**Best For**: Following the scaling plan

```javascript
// Focus areas:
// - Meal prep & batch cooking
// - Family-friendly dinners
// - Make-ahead options
// - Practical everyday meals
```

### 6. `scripts/import-remaining-51.js`
**Purpose**: Quick import to complete target numbers
**Usage**: `node scripts/import-remaining-51.js`
**Best For**: Filling gaps to reach specific counts

## Sync and Management Scripts

### 1. `scripts/sync-all-recipes-admin.js`
**Purpose**: Sync all recipes from Firebase to offline JSON files
**Usage**: `node scripts/sync-all-recipes-admin.js`
**Critical**: Run after every import session

```javascript
// What it does:
// 1. Connects to Firebase Admin
// 2. Fetches ALL recipes
// 3. Creates structured export
// 4. Writes to multiple JSON files:
//    - /data/production-recipes.json
//    - /public/data/recipes.json  
//    - /public/data/recipes.min.json
```

### 2. `scripts/debug-recipe-count.js`
**Purpose**: Debug recipe count discrepancies
**Usage**: `node scripts/debug-recipe-count.js`
**Best For**: Troubleshooting sync issues

```javascript
// Analyzes:
// - Total recipes in Firebase
// - Recipes with localImageUrl
// - Category breakdown
// - Comparison with offline files
```

### 3. `scripts/generate-paginated-recipes.js`
**Purpose**: Create smaller category-specific recipe files
**Usage**: `node scripts/generate-paginated-recipes.js`
**Best For**: Optimizing large datasets

```javascript
// Creates files:
// - recipes-breakfast.json
// - recipes-lunch.json  
// - recipes-dinner.json
// - recipes-snack.json
// - recipes-compact.json (reduced fields)
```

## Testing and Verification Scripts

### 1. `scripts/test-offline-recipes.js`
**Purpose**: Comprehensive offline system verification
**Usage**: `node scripts/test-offline-recipes.js`
**Run**: After every sync operation

```javascript
// Tests:
// ✅ File existence and sizes
// ✅ Recipe count accuracy
// ✅ JSON structure validity
// ✅ Category distribution
// ✅ Recipe data completeness
```

### 2. `scripts/verify-setup.js`
**Purpose**: Verify local development environment
**Usage**: `node scripts/verify-setup.js`
**Best For**: Initial setup validation

### 3. `scripts/test-spoonacular-api.ts`
**Purpose**: Test Spoonacular API connection
**Usage**: `npx ts-node scripts/test-spoonacular-api.ts`
**Best For**: API troubleshooting

## Utility Scripts

### 1. `scripts/firebase-key-helper.js`
**Purpose**: Format Firebase service account key for .env.local
**Usage**: `node scripts/firebase-key-helper.js path/to/serviceAccount.json`
**Best For**: Setting up Firebase Admin credentials

### 2. `scripts/run-tests.js`
**Purpose**: Run automated test suite
**Usage**: `node scripts/run-tests.js`
**Best For**: CI/CD validation

## Script Configuration

### Environment Variables Required:
```env
# Spoonacular API
SPOONACULAR_API_KEY=your_key_here

# Firebase Admin (JSON string)
FIREBASE_ADMIN_KEY={"type":"service_account",...}

# Firebase Client (with NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Common Configuration Options:

#### API Rate Limiting:
```javascript
const CONFIG = {
  batchSize: 5,              // Recipes per batch
  delayBetweenBatches: 3000, // 3 seconds between batches
  targetRecipes: 100         // Total to import
};
```

#### Search Parameters:
```javascript
const searchConfig = {
  query: 'chicken',
  maxCarbs: 40,       // GD guideline compliance
  minProtein: 20,     // Nutritional requirements  
  count: 10           // Number to fetch
};
```

## Recommended Workflows

### 1. Initial Setup (0 → 400 recipes):
```bash
# 1. Test connection
node scripts/import-recipe-simple.js

# 2. Small batch test
node scripts/import-10-recipes.js

# 3. Large import
node scripts/bulk-import-recipes.js

# 4. Sync to offline
node scripts/sync-all-recipes-admin.js

# 5. Verify system
node scripts/test-offline-recipes.js
```

### 2. Regular Maintenance (add 50-100 recipes):
```bash
# 1. Import new recipes
node scripts/import-100-comprehensive.js

# 2. Sync to offline
node scripts/sync-all-recipes-admin.js

# 3. Test and deploy
node scripts/test-offline-recipes.js
git add -A && git commit -m "Add new recipes" && git push
```

### 3. Troubleshooting Workflow:
```bash
# 1. Check environment
node scripts/verify-setup.js

# 2. Test API connection  
node scripts/test-spoonacular-api.ts

# 3. Debug counts
node scripts/debug-recipe-count.js

# 4. Verify offline files
node scripts/test-offline-recipes.js
```

## Script Output Examples

### Successful Import:
```
✅ Successfully imported: 47 recipes
⏭️  Skipped (duplicates): 3 recipes  
❌ Failed: 0 recipes
📈 Recipe count: 350 → 397 (+47)
```

### Successful Sync:
```
📊 Found 397 recipes in Firebase
✅ Saved to: /public/data/recipes.json (1.86 MB)
🎉 Successfully synced ALL 397 recipes to offline files!
```

### Verification Success:
```
✅ All 397 recipes are available offline!
✅ The app will work without any internet connection.
```

## Error Handling

### Common Exit Codes:
- `0`: Success
- `1`: Configuration error (missing API key, etc.)
- `2`: Network/API error
- `3`: File system error
- `4`: Data validation error

### Error Recovery:
Most scripts include automatic retry logic and graceful error handling. Check console output for specific error messages and solutions.

## Performance Notes

### API Usage:
- Spoonacular has daily limits (150-500 calls depending on plan)
- Each recipe import uses 1 API call
- Search operations also count toward limits

### File Sizes:
- ~397 recipes = 1.86 MB JSON file
- Minified version = 1.24 MB
- Category files = 100-400 KB each

### Execution Times:
- Single recipe: <5 seconds
- 10 recipes: ~30 seconds
- 100 recipes: ~5-10 minutes
- Full sync: ~5-15 seconds

This reference covers all scripts you'll need for managing the recipe system from import to offline deployment.