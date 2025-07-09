# Nutrition Tracking Feature Implementation Plan

## Overview
Build comprehensive nutrition tracking features integrated with meal plans for gestational diabetes management.

## Todo List

### 1. Data Models & Types
- [ ] Create nutrition tracking types (`src/types/nutrition.ts`)
  - [ ] Define FoodEntry interface (meal plan item, custom food, quick snack)
  - [ ] Define DailyNutritionLog interface
  - [ ] Define NutritionGoals interface based on MEDICAL_GUIDELINES.md
  - [ ] Define QuickFood interface for common snacks
  - [ ] Define WaterIntake tracking type

### 2. Firebase Integration
- [ ] Create Firestore collections structure
  - [ ] nutritionLogs collection with daily entries
  - [ ] quickFoods collection for user's frequent items
  - [ ] waterIntake subcollection
- [ ] Set up security rules for user-specific access
- [ ] Create nutrition service for CRUD operations

### 3. Core Services
- [ ] Create NutritionService (`src/services/nutrition/nutrition-service.ts`)
  - [ ] Log food from meal plan with automatic nutrition data
  - [ ] Add custom food entries with manual nutrition input
  - [ ] Calculate daily totals and distribution
  - [ ] Track adherence to meal plan
- [ ] Create NutritionCalculator utilities
  - [ ] Calculate macros per meal based on portions
  - [ ] Distribute carbs across day per medical guidelines
  - [ ] Track micronutrients important for pregnancy

### 4. UI Components - Food Logging
- [ ] Create FoodLogger component (`src/components/nutrition/FoodLogger.tsx`)
  - [ ] Quick add from active meal plan
  - [ ] Manual food entry form
  - [ ] Portion size adjustment slider
  - [ ] Copy yesterday's meals feature
- [ ] Create QuickFoodsList component
  - [ ] Display frequent items with one-tap logging
  - [ ] Edit/delete quick foods
  - [ ] Auto-suggest based on time of day

### 5. UI Components - Daily Dashboard
- [ ] Create DailyNutritionDashboard (`src/components/nutrition/DailyNutritionDashboard.tsx`)
  - [ ] Progress rings for carbs, protein, fat, fiber
  - [ ] Carb distribution chart across meals
  - [ ] Meal plan adherence score
  - [ ] Water intake tracker
- [ ] Create NutritionGoalsDisplay component
  - [ ] Show targets vs actual for each macro
  - [ ] Visual indicators for on-track/off-track
  - [ ] Time-based reminders for meals/snacks

### 6. UI Components - Analytics & Reports
- [ ] Create NutritionTrends component
  - [ ] Weekly/monthly macro trends
  - [ ] Fiber intake tracking
  - [ ] Micronutrient summary
- [ ] Create HealthcareReport generator
  - [ ] Export nutrition logs as PDF
  - [ ] Include glucose correlation data
  - [ ] Format for healthcare provider review

### 7. Integration Features
- [ ] Integrate with existing meal plan system
  - [ ] Auto-populate nutrition when logging from meal plan
  - [ ] Track deviations from planned meals
  - [ ] Suggest adjustments based on actual intake
- [ ] Connect with glucose tracking
  - [ ] Show nutrition context with glucose readings
  - [ ] Identify food-glucose correlations

### 8. Mobile Optimization
- [ ] Create mobile-optimized logging interface
  - [ ] Swipe gestures for quick actions
  - [ ] Large touch targets for easy input
  - [ ] Offline capability with sync

### 9. Educational Integration
- [ ] Add contextual nutrition tips
  - [ ] Explain carb distribution importance
  - [ ] Highlight fiber benefits for glucose control
  - [ ] Show micronutrient education

### 10. Testing & Validation
- [ ] Unit tests for nutrition calculations
- [ ] Integration tests for meal plan logging
- [ ] Validate against medical guidelines
- [ ] Test offline functionality

## Implementation Order
1. Start with types and data models
2. Set up Firebase integration
3. Build core nutrition service
4. Create food logging UI
5. Implement daily dashboard
6. Add analytics and reports
7. Integrate with existing features
8. Optimize for mobile
9. Add educational content
10. Complete testing

## Key Medical Guidelines to Follow
- Daily carbs: 175-200g (minimum 175g)
- Breakfast: 30g carbs
- Lunch/Dinner: 45g carbs each
- Snacks: 15-30g carbs
- Bedtime snack: 15g carbs + protein
- Fiber: 25-30g daily
- Track iron, calcium, folate, vitamin D for pregnancy

## Success Metrics
- Easy meal plan integration (< 3 taps to log)
- Accurate nutrition calculations
- Clear visual feedback on targets
- Healthcare provider-friendly reports
- High user engagement with daily logging

---

# Automated Recipe Import Plan

## Overview
Automate the import of 200 additional recipes from Spoonacular API, validate them for gestational diabetes compliance, and update the local offline database.

## Current Status
- ✅ Existing import system already in place
- ✅ 242 recipes currently imported
- ✅ Quality validation system functional
- ✅ Export to offline JSON working

## Implementation Plan

### Phase 1: Create Automated Import Script

**Goal**: Build a script that automatically imports 200 recipes distributed across meal categories

**Tasks**:
- [ ] Create `scripts/auto-import-recipes.ts` script
- [ ] Distribute 200 recipes across categories:
  - Breakfast: 50 recipes (25%)
  - Lunch: 50 recipes (25%)
  - Dinner: 50 recipes (25%)
  - Snacks: 50 recipes (25%)
- [ ] Use existing RecipeImportScheduler
- [ ] Apply all import strategies for variety
- [ ] Handle API rate limiting (100 calls/day free tier)

### Phase 2: Import Execution

**Goal**: Run the import process with quality validation

**Tasks**:
- [ ] Check Spoonacular API key is configured
- [ ] Run imports in batches to avoid rate limits
- [ ] Validate each recipe for GD compliance (30+ score)
- [ ] Skip duplicates using existing deduplicator
- [ ] Store in Firebase with proper categorization
- [ ] Log import statistics and any failures

### Phase 3: Export to Local Database

**Goal**: Update offline JSON files with new recipes

**Tasks**:
- [ ] Use `/api/recipes/prepare-offline` endpoint
- [ ] Generate new production-recipes.json file
- [ ] Update category-specific JSON files
- [ ] Create backup of previous data
- [ ] Verify JSON file integrity

### Phase 4: Update Local Service

**Goal**: Ensure LocalRecipeService uses new data

**Tasks**:
- [ ] Clear browser localStorage to force refresh
- [ ] Test LocalRecipeService loads new recipes
- [ ] Verify recipe counts match import
- [ ] Test search and filter functionality
- [ ] Confirm offline operation

### Phase 5: Validation

**Goal**: Ensure all imported recipes meet GD guidelines

**Tasks**:
- [ ] Run validation report on all recipes
- [ ] Check carb distribution:
  - Breakfast: 15-45g carbs
  - Lunch/Dinner: 30-60g carbs
  - Snacks: 15-30g carbs
- [ ] Verify protein content adequate
- [ ] Confirm fiber levels appropriate
- [ ] Generate compliance report

## Technical Implementation Details

### 1. Auto Import Script Structure
```typescript
// scripts/auto-import-recipes.ts
- Initialize Firebase Admin
- Create RecipeImportScheduler instance
- Define import configuration:
  - categories with counts
  - strategy rotation
  - batch sizes for rate limiting
- Execute imports with progress tracking
- Generate summary report
```

### 2. API Rate Limit Management
- Free tier: 100 calls/day
- Import in batches of 20-25 recipes
- Add delays between batches
- Save progress to resume if interrupted
- Consider running over multiple days if needed

### 3. Quality Thresholds
- Minimum score: 30/100 (current default)
- Consider raising to 40/100 for better quality
- Focus on recipes with:
  - Clear nutritional data
  - Reasonable cooking times (<60 min)
  - Common ingredients

### 4. Export Process
- First export to Firebase offline collection
- Then generate JSON files
- Create timestamped backups
- Update data/production-recipes.json
- Clear CDN cache if applicable

## Execution Timeline

**Day 1**: 
- Create auto-import script
- Test with small batch (10 recipes)
- Verify validation working

**Day 2-3**: 
- Run full import (may span multiple days due to rate limits)
- Monitor for errors
- Adjust strategies if needed

**Day 4**: 
- Export to offline JSON
- Update local database
- Run validation tests
- Deploy updated data

## Considerations

1. **API Costs**: Stay within free tier limits or consider paid plan
2. **Storage**: ~200 recipes will add ~2-3MB to JSON files
3. **Performance**: LocalRecipeService handles 400+ recipes well
4. **Variety**: Use multiple search strategies to ensure diverse recipes
5. **Backup**: Keep current data backed up before import

## Success Criteria

- [ ] 200 new recipes imported successfully
- [ ] All recipes score 30+ on GD validation
- [ ] Proper distribution across meal categories
- [ ] Offline JSON files updated and functional
- [ ] LocalRecipeService loads all recipes
- [ ] No duplicate recipes
- [ ] Meal planner can use new recipes

## Risk Mitigation

1. **API Failures**: Save progress, resume capability
2. **Bad Data**: Strict validation, manual review of outliers
3. **Duplicates**: Existing deduplicator should catch these
4. **Storage Issues**: Monitor Firebase usage, optimize if needed
5. **Performance**: Test with full dataset before deploying