# Debugging Recipe System Issues

This document covers all the issues we encountered and how to fix them, so you don't have to debug again.

## Common Issues and Solutions

### 1. Firebase Admin Key Issues

**Symptoms**: 
- "No Firebase App '[DEFAULT]' has been created"
- "Invalid PEM formatted message"
- Import/sync scripts fail with Firebase errors

**Root Causes**:
- Missing `NEXT_PUBLIC_` prefixes for client-side Firebase config
- Incorrectly formatted Firebase Admin private key
- JSON parsing issues with escaped newlines

**Solutions**:

#### Fix Client Firebase Config
Add these to `.env.local` with `NEXT_PUBLIC_` prefix:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Fix Admin Key Format
Use the helper script:
```bash
node scripts/firebase-key-helper.js path/to/serviceAccount.json
```

#### Update admin.ts to use JSON.parse()
```typescript
// In src/lib/firebase/admin.ts
const serviceAccount = JSON.parse(serviceAccountKey);
```

### 2. Recipe Count Mismatches

**Symptoms**:
- Firebase shows 397 recipes
- Static files show only 20-242 recipes
- Production displays different count than expected

**Root Causes**:
- Sync script not run after imports
- Loading from wrong JSON file
- Files truncated during Git operations
- Cached old data in deployment

**Debugging Steps**:

#### Check Current Counts
```bash
# Firebase count (via API)
curl -s http://localhost:3001/api/recipes/count

# Local file count
node scripts/test-offline-recipes.js

# Manual count
grep -o '"id"' public/data/production-recipes.json | wc -l
```

#### Identify Which File App Loads
Check `src/providers/recipe-provider.tsx` line ~54:
```typescript
const response = await fetch("/data/production-recipes.json");
```

#### Fix Recipe Count Mismatch
```bash
# 1. Re-sync from Firebase
node scripts/sync-all-recipes-admin.js

# 2. Verify file integrity
node scripts/test-offline-recipes.js

# 3. Check file sizes
ls -lah public/data/recipes*.json
# Should see ~1.86MB files for 397 recipes
```

### 3. TypeScript Build Errors

**Symptoms**:
- Vercel deployment fails with "Property 'X' does not exist on type 'Recipe'"
- Local build succeeds but production fails

**Root Cause**: Code references properties not defined in Recipe type

**Solution Example**:
```typescript
// ❌ This caused error:
if (recipe.mealTypes && Array.isArray(recipe.mealTypes)) {
  // mealTypes doesn't exist in Recipe type
}

// ✅ Fixed version:
// Use existing properties like recipe.category instead
```

**Prevention**: Always check `src/types/recipe.ts` before using recipe properties

### 4. Static File Loading Issues

**Symptoms**:
- App shows loading forever
- Console errors about failed to fetch JSON
- Empty recipe list despite files existing

**Root Causes**:
- Wrong file path in RecipeProvider
- Invalid JSON syntax in static files
- Files not properly deployed

**Debugging Process**:

#### 1. Check File Accessibility
Visit in browser:
- `http://localhost:3001/data/production-recipes.json`
- `https://your-app.vercel.app/data/production-recipes.json`

#### 2. Validate JSON Syntax
```bash
# Check if JSON is valid
node -e "JSON.parse(require('fs').readFileSync('public/data/production-recipes.json', 'utf8')); console.log('Valid JSON')"
```

#### 3. Check RecipeProvider Configuration
Ensure it loads from correct path:
```typescript
// In src/providers/recipe-provider.tsx
const response = await fetch("/data/production-recipes.json");
```

### 5. Import Scripts Hanging or Failing

**Symptoms**:
- Scripts timeout after 2 minutes
- Very few recipes found despite API having many
- Rate limiting errors

**Root Causes**:
- Overly restrictive search parameters
- API rate limits hit
- Network connectivity issues

**Solutions**:

#### Adjust Search Parameters
```javascript
// ❌ Too restrictive (finds 0 recipes):
{ query: 'meal prep breakfast egg', maxCarbs: 30, minProtein: 15 }

// ✅ Better (finds many recipes):
{ query: 'eggs', maxCarbs: 30, minProtein: 10 }
```

#### Handle Rate Limits
```javascript
// Add delays between API calls
await new Promise(resolve => setTimeout(resolve, 3000));
```

#### Use Broader Search Strategy
```javascript
// Instead of specific terms:
'batch cooking chicken breast'

// Use general terms:
'chicken'
```

### 6. Deployment Issues

**Symptoms**:
- Local works but production doesn't
- File sizes wrong in deployment
- Git secrets detected

**Solutions**:

#### Large File Issues
```bash
# Check file sizes before commit
ls -lah public/data/*.json

# Files >1MB might need special handling
# Consider using Git LFS for very large files
```

#### Secrets in Code
- Never commit actual API keys or Firebase credentials
- Use helper scripts that read from separate files
- Add `.env.local` and credential files to `.gitignore`

#### Vercel Build Limits
- Check Vercel logs for specific error messages
- Ensure all TypeScript types are properly defined
- Verify all imports resolve correctly

### 7. Offline Loading Not Working

**Symptoms**:
- App still tries to connect to Firebase
- Network errors in console
- Recipes don't load when offline

**Root Cause**: App falling back to Firebase instead of using static files

**Fix Process**:

#### 1. Ensure Pure Offline Loading
```typescript
// In RecipeProvider, confirm this line exists:
console.log(`[OFFLINE] Loaded ${loadedRecipes.length} recipes from static file`);

// Should NOT see Firebase connection attempts
```

#### 2. Remove Firebase Imports
Check these files have no Firebase imports:
- `app/recipes/page.tsx`
- `src/providers/recipe-provider.tsx`
- `src/hooks/useRecipes.ts`

#### 3. Verify Network Tab
- Open dev tools → Network tab
- Go to /recipes page
- Should only see one request: `/data/production-recipes.json`
- No Firebase or API requests

## Prevention Checklist

### Before Importing Recipes:
- [ ] Verify API key works: `node scripts/import-recipe-simple.js`
- [ ] Check Firebase connection
- [ ] Ensure development server running on port 3001

### After Importing Recipes:
- [ ] Run sync script: `node scripts/sync-all-recipes-admin.js`
- [ ] Verify offline files: `node scripts/test-offline-recipes.js`
- [ ] Check file sizes match expectations
- [ ] Test recipes page loads correctly

### Before Deploying:
- [ ] Run TypeScript check: `npm run typecheck`
- [ ] Test build: `npm run build`
- [ ] Verify no secrets in code
- [ ] Check file sizes under reasonable limits

### After Deploying:
- [ ] Check production recipe count
- [ ] Verify offline functionality
- [ ] Monitor for any console errors

## Emergency Recovery

### If Production is Broken:

#### Quick Fix - Revert to Known Good State
```bash
# 1. Check last working commit
git log --oneline -10

# 2. Revert to working commit
git revert [commit-hash]
git push origin main
```

#### Full Recovery - Rebuild Offline System
```bash
# 1. Re-sync from Firebase
node scripts/sync-all-recipes-admin.js

# 2. Verify locally
node scripts/test-offline-recipes.js

# 3. Test local recipes page
# Go to http://localhost:3001/recipes

# 4. If working, deploy
git add -A
git commit -m "fix: Rebuild offline recipe system"
git push origin main
```

### If All Recipes Lost:

#### Re-import Everything
```bash
# 1. Import core recipes
node scripts/import-100-comprehensive.js

# 2. Sync to offline
node scripts/sync-all-recipes-admin.js

# 3. Verify and deploy
node scripts/test-offline-recipes.js
git add -A && git commit -m "restore: Re-import all recipes" && git push
```

## Monitoring and Maintenance

### Regular Health Checks:
```bash
# Weekly recipe system check
node scripts/test-offline-recipes.js

# Should output:
# ✅ All 397 recipes available offline!
# ✅ The app will work without any internet connection.
```

### Performance Monitoring:
- Recipe page load time should be <2 seconds
- Static file sizes should remain reasonable (<5MB total)
- No Firebase/API calls on recipes page

### Content Management:
- Import new recipes monthly
- Remove low-quality or inappropriate recipes
- Keep recipe count balanced across categories

This debugging guide captures all the issues we encountered and their solutions, ensuring smooth recipe system operations going forward.