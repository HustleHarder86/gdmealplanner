# MCP: Offline Recipe System Implementation

## Mission
Transform the Pregnancy Plate Planner into an offline-first application where API calls are only used for recipe imports, and all app functionality reads from static offline files.

## Success Criteria
1. All recipe reads come from static JSON files (no API calls)
2. Recipe updates happen through admin-only endpoints
3. App works completely offline after initial load
4. Zero Spoonacular API calls for normal users
5. Automated system for updating offline files

## Phase 1: Infrastructure Setup (Priority: HIGH)

### 1.1 Create Recipe Provider
**File**: `/src/providers/recipe-provider.tsx`
- React Context for global recipe state
- Load recipes once from static file
- Provide hooks: useRecipes(), useRecipe(id)
- Handle loading and error states
- Cache recipes in memory

### 1.2 Create Offline Update Service
**File**: `/src/services/offline-updater.ts`
- Fetch all recipes from Firebase
- Generate static JSON files
- Create compressed versions
- Maintain update timestamps
- Handle incremental updates

### 1.3 Build Admin Update API
**File**: `/app/api/admin/update-offline/route.ts`
- Protected endpoint (check admin auth)
- Trigger offline file generation
- Create automatic backups
- Return update statistics
- Log all operations

## Phase 2: Component Migration (Priority: HIGH)

### 2.1 Update Recipe Browser
**File**: `/app/recipes/page.tsx`
- Remove fetch('/api/recipes/list')
- Use RecipeProvider instead
- Keep all filtering logic
- Ensure search works offline

### 2.2 Update Meal Planner
**File**: `/app/meal-planner/page.tsx`
- Replace Firebase queries with LocalRecipeService
- Use offline recipes for selection
- Keep meal plan saves in Firebase
- Update recipe references

### 2.3 Update Recipe Details
**File**: `/app/recipes/[id]/page.tsx`
- Use LocalRecipeService.getRecipeById()
- Implement static generation
- Add 404 handling
- Optimize for SEO

### 2.4 Update Search Components
- Recipe search autocomplete
- Ingredient search
- Tag filtering
- All using offline data

## Phase 3: Admin System (Priority: MEDIUM)

### 3.1 Create Import Dashboard
**File**: `/app/admin/recipes/import/page.tsx`
- Show current recipe stats
- Import interface for Spoonacular
- Preview before importing
- Bulk operations support

### 3.2 Build Auto-Update System
**File**: `/app/api/admin/auto-import/route.ts`
- Cron job for checking new recipes
- Automatic offline file updates
- Email notifications
- Error handling and retries

### 3.3 Create Backup System
**File**: `/app/api/admin/backup/route.ts`
- Automatic backups before updates
- Version history
- Restore functionality
- Cleanup old backups

## Phase 4: Optimization (Priority: LOW)

### 4.1 Static Site Generation
- Pre-render all recipe pages
- Generate sitemap.xml
- Optimize meta tags
- Image optimization

### 4.2 Performance Enhancements
- Implement service worker
- Add offline indicators
- Progressive enhancement
- CDN configuration

## Implementation Order
1. Create RecipeProvider and integrate with one component
2. Build offline update service and test
3. Migrate all components systematically
4. Add admin tools
5. Optimize and deploy

## File Structure
```
/src/
  providers/
    recipe-provider.tsx      # Global recipe state
  services/
    offline-updater.ts       # Update offline files
    recipe-loader.ts         # Load recipes (existing)
  hooks/
    useRecipes.ts           # Recipe hooks

/app/
  api/
    admin/
      update-offline/       # Update static files
      import-recipes/       # Import from Spoonacular
      backup/              # Backup system
  admin/
    recipes/
      import/              # Import dashboard

/public/
  data/
    recipes.json           # Full recipe data
    recipes.min.json       # Compressed version
    metadata.json          # Update info
```

## Testing Requirements
1. Unit tests for offline-updater service
2. Integration tests for admin APIs
3. Component tests with mock recipe data
4. E2E tests for offline functionality
5. Performance benchmarks

## Deployment Notes
- Environment variables for admin auth
- Vercel configuration for static files
- CDN cache headers
- Monitoring setup

## Agent Instructions
When implementing this MCP:
1. Start with Phase 1.1 (RecipeProvider)
2. Test each component thoroughly
3. Maintain backward compatibility during migration
4. Create comprehensive documentation
5. Use TypeScript for type safety
6. Follow existing code patterns
7. Commit after each major component

Deploy this agent with the task: "Implement the Offline Recipe System according to the MCP_OFFLINE_RECIPE_SYSTEM.md plan, starting with Phase 1."