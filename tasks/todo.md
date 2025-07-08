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