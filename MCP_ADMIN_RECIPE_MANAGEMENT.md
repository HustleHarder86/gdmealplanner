# MCP: Admin Recipe Management System

## Mission
Create a comprehensive admin system for managing recipe imports from Spoonacular and updating the offline recipe files, maintaining the workflow: Spoonacular → Firebase → Offline Files → Users.

## Success Criteria
1. Admin dashboard for searching and importing recipes from Spoonacular
2. Bulk import capabilities with preview
3. Automatic offline file updates after imports
4. Import history and statistics
5. Protected admin-only access
6. Maintains existing Spoonacular import functionality

## Architecture Flow
```
Admin Dashboard → Spoonacular API → Preview/Validate → Firebase → Update Offline Files → Users
```

## Phase 1: Admin Dashboard UI (Priority: HIGH)

### 1.1 Create Admin Layout
**File**: `/app/admin/layout.tsx`
- Admin-specific navigation
- Authentication check
- Sidebar with admin tools
- Consistent admin styling

### 1.2 Recipe Import Dashboard
**File**: `/app/admin/recipes/import/page.tsx`
- Search interface for Spoonacular recipes
- Filter by:
  - Meal type (breakfast, lunch, dinner, snack)
  - Max carbs (for GD compliance)
  - Cooking time
  - Dietary restrictions
- Results grid with preview cards
- Bulk selection capabilities
- Import progress tracking

### 1.3 Recipe Preview Modal
**Component**: `/components/admin/RecipePreviewModal.tsx`
- Full recipe details
- Nutrition information
- GD compliance check
- Ability to edit before importing
- Accept/Reject buttons

### 1.4 Import History Page
**File**: `/app/admin/recipes/history/page.tsx`
- List of all import sessions
- Statistics per import
- Success/failure counts
- Ability to view imported recipes
- Rollback capabilities

## Phase 2: Enhanced Import APIs (Priority: HIGH)

### 2.1 Bulk Import Endpoint
**File**: `/app/api/admin/recipes/bulk-import/route.ts`
- Accept array of Spoonacular recipe IDs
- Validate GD compliance
- Check for duplicates
- Batch processing with progress
- Return detailed results

### 2.2 Recipe Search Proxy
**File**: `/app/api/admin/recipes/search-spoonacular/route.ts`
- Proxy Spoonacular search with admin auth
- Add GD-specific filters
- Cache search results
- Return enriched data

### 2.3 Import Status Endpoint
**File**: `/app/api/admin/recipes/import-status/route.ts`
- Real-time import progress
- WebSocket or polling support
- Detailed error reporting
- Queue management

## Phase 3: Automated Workflows (Priority: MEDIUM)

### 3.1 Post-Import Automation
**File**: `/src/services/admin/post-import-workflow.ts`
- Automatically update offline files after import
- Create backup before update
- Validate imported recipes
- Send notifications
- Update statistics

### 3.2 Recipe Enrichment Service
**File**: `/src/services/admin/recipe-enrichment.ts`
- Add GD-specific metadata
- Calculate carb choices
- Validate nutrition data
- Tag recipes appropriately
- Generate meal suggestions

### 3.3 Duplicate Detection
**File**: `/src/services/admin/duplicate-detector.ts`
- Check for existing recipes
- Fuzzy matching on titles
- Ingredient comparison
- Suggest merge/skip/replace

## Phase 4: Admin Tools & Analytics (Priority: LOW)

### 4.1 Recipe Analytics Dashboard
**File**: `/app/admin/recipes/analytics/page.tsx`
- Total recipes by category
- GD compliance statistics
- Popular recipes
- Import trends
- User engagement metrics

### 4.2 Bulk Operations
**File**: `/app/admin/recipes/bulk-ops/page.tsx`
- Mass update categories
- Bulk delete
- Export subsets
- Re-validate nutrition
- Fix data issues

### 4.3 Recipe Editor
**File**: `/app/admin/recipes/edit/[id]/page.tsx`
- Edit existing recipes
- Update nutrition info
- Fix import errors
- Add custom recipes
- Preview changes

## Implementation Details

### Admin Authentication
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check Firebase Auth
    // Verify admin email
    // Redirect if not authorized
  }
}
```

### Import Flow Component
```typescript
// components/admin/ImportFlow.tsx
1. Search Spoonacular
2. Select recipes
3. Preview & validate
4. Confirm import
5. Show progress
6. Update offline files
7. Show success summary
```

### Bulk Import Process
```typescript
// services/admin/bulk-importer.ts
export async function bulkImport(recipeIds: string[]) {
  // 1. Fetch from Spoonacular in batches
  // 2. Validate each recipe
  // 3. Check duplicates
  // 4. Import to Firebase
  // 5. Update offline files
  // 6. Return results
}
```

## File Structure
```
/app/
  admin/
    layout.tsx              # Admin layout
    page.tsx               # Admin dashboard
    recipes/
      import/              # Import dashboard
        page.tsx
      history/             # Import history
        page.tsx
      analytics/           # Analytics
        page.tsx
      edit/               # Recipe editor
        [id]/
          page.tsx

/components/
  admin/
    RecipePreviewModal.tsx
    ImportProgress.tsx
    RecipeSearchForm.tsx
    BulkActions.tsx

/src/
  services/
    admin/
      post-import-workflow.ts
      recipe-enrichment.ts
      duplicate-detector.ts
      bulk-importer.ts
```

## Security Requirements
1. Firebase Auth required
2. Admin email whitelist
3. Rate limiting on imports
4. Audit logging
5. CSRF protection

## UI/UX Requirements
1. Clean, professional admin interface
2. Real-time progress indicators
3. Clear error messages
4. Bulk selection tools
5. Responsive design
6. Keyboard shortcuts

## Testing Requirements
1. Unit tests for import logic
2. Integration tests for workflows
3. E2E tests for admin flows
4. Load testing for bulk imports
5. Security testing

## Performance Targets
- Search results in <2 seconds
- Import 100 recipes in <30 seconds
- Offline file update in <10 seconds
- Dashboard load in <1 second

## Agent Instructions
When implementing this MCP:
1. Start with the basic admin layout and authentication
2. Build the import dashboard with search functionality
3. Implement preview and validation
4. Add bulk import capabilities
5. Create the automated workflows
6. Test thoroughly with real Spoonacular data
7. Ensure backward compatibility with existing import tools
8. Document all admin features

Begin with Phase 1 (Admin Dashboard UI) and ensure each component is fully functional before moving to the next phase.