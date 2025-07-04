# Meal Planning Agent - Implementation Plan

## Overview
Create a comprehensive meal planning system that generates 7-day meal plans following Halton Healthcare guidelines, with smart grocery lists and meal variety.

## Core Features

### 1. Meal Plan Generation
- **7-day meal plans** with 3 meals + 3 snacks per day
- **Daily targets**: ~180g carbs minimum
- **Meal spacing**: 4-6 hours between meals
- **Medical compliance**: All meals follow exact carb guidelines
  - Breakfast: 30g (25-35g range)
  - Lunch/Dinner: 45g (40-50g range)  
  - Snacks: 15-30g
  - Bedtime snack: 15g + protein

### 2. Smart Grocery List
- **Intelligent combining**: Merge duplicate ingredients across recipes
- **Quantity aggregation**: Sum up amounts (e.g., 3 recipes need chicken = total pounds)
- **Category organization**: Group by store sections (produce, dairy, proteins, etc.)
- **Smart units**: Convert and combine (e.g., 2 cups + 500ml = total amount)
- **Shopping mode**: Check off items as you shop

### 3. Meal Variety Algorithm
- **No repeat main proteins** within 3 days
- **Cuisine variety**: Mix different cuisine types throughout week
- **Cooking method variety**: Not all grilled/baked on same day
- **Breakfast rotation**: Different bases each day
- **Snack diversity**: Rotate between sweet/savory options
- **User preferences**: Honor dietary restrictions and dislikes

## Technical Implementation

### Data Models

```typescript
interface MealPlan {
  id: string
  userId: string
  startDate: Date
  endDate: Date
  days: DayPlan[]
  groceryList: GroceryList
  preferences: MealPlanPreferences
  createdAt: Date
}

interface DayPlan {
  date: Date
  meals: {
    breakfast: Recipe
    morningSnack: Recipe
    lunch: Recipe
    afternoonSnack: Recipe
    dinner: Recipe
    eveningSnack: Recipe // Must have 15g carbs + protein
  }
  totalCarbs: number
  nutritionSummary: NutritionSummary
}

interface GroceryList {
  id: string
  mealPlanId: string
  categories: GroceryCategory[]
  totalItems: number
  checkedItems: string[]
}

interface GroceryCategory {
  name: string // "Produce", "Dairy", "Proteins", etc.
  items: GroceryItem[]
}

interface GroceryItem {
  id: string
  name: string
  quantity: number
  unit: string
  fromRecipes: string[] // Recipe IDs using this item
  checked: boolean
}

interface MealPlanPreferences {
  avoidIngredients: string[]
  dietaryRestrictions: string[]
  cuisinePreferences: string[]
  cookingTimePreference: 'quick' | 'moderate' | 'any'
  servingsNeeded: number
}
```

### Algorithm Components

#### 1. Meal Selection Algorithm
```typescript
function selectMealsForWeek(preferences: MealPlanPreferences): DayPlan[] {
  // Track used recipes to ensure variety
  const usedRecipes = new Set<string>()
  const usedProteins = new Map<string, Date>() // Protein -> last used date
  const usedCuisines = new Map<string, number>() // Cuisine -> count
  
  // For each day:
  // 1. Select breakfast (rotate bases: eggs, oats, yogurt, etc.)
  // 2. Select lunch/dinner (ensure protein variety)
  // 3. Select snacks (mix sweet/savory)
  // 4. Validate daily carb total
  // 5. Ensure bedtime snack has protein
}
```

#### 2. Grocery Aggregation Algorithm
```typescript
function generateSmartGroceryList(mealPlan: MealPlan): GroceryList {
  // 1. Extract all ingredients from all recipes
  // 2. Normalize ingredient names (e.g., "chicken breast" = "boneless chicken breast")
  // 3. Convert units to common measurements
  // 4. Aggregate quantities
  // 5. Organize by store categories
  // 6. Sort by typical shopping route
}
```

#### 3. Variety Scoring System
```typescript
function calculateVarietyScore(mealPlan: MealPlan): number {
  // Score based on:
  // - Protein diversity (different proteins = higher score)
  // - Cuisine variety (mix of cuisines = higher score)
  // - Cooking method diversity
  // - Vegetable variety
  // - Color variety (eating the rainbow)
  // Return score 0-100
}
```

## UI Components Needed

### 1. Meal Plan Calendar View
- **Weekly grid** showing all meals
- **Drag-and-drop** to swap meals
- **Quick stats** per day (carbs, calories)
- **Visual indicators** for variety

### 2. Meal Plan Generator
- **Preferences form**
  - Dietary restrictions
  - Avoided ingredients
  - Number of servings
  - Cooking time preferences
- **Generate button** with loading state
- **Regenerate options** for specific days/meals

### 3. Smart Grocery List
- **Categorized view** (Produce, Dairy, etc.)
- **Check-off functionality**
- **Add custom items**
- **Share/export options** (text, email)
- **Store preference** (organize by your store's layout)

### 4. Meal Swap Interface
- **"Find alternatives" button** on each meal
- **Filter alternatives** by cooking time, ingredients
- **Nutrition comparison** when swapping
- **Maintain daily targets** when swapping

## Implementation Steps

### Phase 1: Core Algorithm (Week 1)
1. Create meal selection algorithm
2. Implement variety scoring
3. Build grocery aggregation logic
4. Create data models and types
5. Write comprehensive tests

### Phase 2: UI Components (Week 2)
1. Build meal plan calendar component
2. Create preferences form
3. Implement grocery list UI
4. Add meal swap functionality
5. Create loading/error states

### Phase 3: Integration & Polish (Week 3)
1. Connect to recipe service
2. Add local storage for offline access
3. Implement sharing features
4. Add print-friendly views
5. Performance optimization

## API Endpoints

```typescript
// Generate new meal plan
POST /api/meal-plans/generate
Body: { preferences: MealPlanPreferences, startDate: Date }
Response: { mealPlan: MealPlan }

// Get user's meal plans
GET /api/meal-plans
Response: { mealPlans: MealPlan[] }

// Update meal plan (swap meals)
PATCH /api/meal-plans/:id
Body: { dayIndex: number, mealType: string, newRecipeId: string }
Response: { updatedMealPlan: MealPlan }

// Update grocery list (check items)
PATCH /api/meal-plans/:id/grocery-list
Body: { itemId: string, checked: boolean }
Response: { success: boolean }
```

## Testing Strategy

### Unit Tests
- Meal selection algorithm with various preferences
- Variety scoring calculations
- Grocery aggregation logic
- Unit conversion utilities

### Integration Tests
- Full meal plan generation
- Grocery list generation from meal plan
- Meal swapping with constraint validation

### E2E Tests
- Complete flow: preferences -> generation -> grocery list
- Meal swapping and regeneration
- Grocery list checking and exporting

## Success Metrics
- All generated meals meet medical guidelines
- Variety score > 80 for all meal plans
- Grocery list aggregation reduces items by 30%+
- No protein repeats within 3 days
- User can generate plan in < 10 seconds

## Next Steps After Deployment
1. Add meal prep mode (batch cooking)
2. Integration with grocery delivery services
3. Leftover tracking and suggestions
4. Nutrition goal tracking
5. Family meal planning (multiple portions)