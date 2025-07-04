# Implementation Plan - Medical Guidelines Integration

## Overview

This document outlines how we will integrate the comprehensive medical guidelines from Halton Healthcare into the Pregnancy Plate Planner application.

## Immediate Actions

### 1. Recipe Validation Update

- Update recipe validation to match exact medical guidelines:
  - Breakfast: 30g carbs (2 choices)
  - Lunch/Dinner: 45g carbs (3 choices)
  - Snacks: 15-30g carbs (1-2 choices)
  - Bedtime snack: Must include 15g carbs + protein
- Add portion size information based on 15g carb portions
- Validate all 360 recipes against these standards

### 2. Meal Planning Algorithm Enhancement

- Implement daily carb distribution:
  - Total: ~180g carbs/day minimum
  - 3 meals + 3 snacks pattern
  - Never skip meals rule
  - 4-6 hour spacing between meals
- Add plate method visualization:
  - 1/2 plate: non-starchy vegetables
  - 1/4 plate: protein
  - 1/4 plate: grains/starches
- Morning sensitivity adjustment option

### 3. Glucose Tracking Features

- Implement official tracking format:
  - Fasting (before breakfast)
  - 2 hours after breakfast
  - 2 hours after lunch
  - 2 hours after dinner
  - Comments section for context
- Add target ranges:
  - Fasting: <5.3 mmol/L
  - 1 hour post-meal: <7.8 mmol/L
  - 2 hours post-meal: <6.7 mmol/L
- Create daily record sheets matching medical format

### 4. Smart Grocery List Enhancement

- Group by food categories from guidelines
- Include portion size references
- Add carb counting helpers
- Highlight protein sources for bedtime snacks

### 5. Education Content Creation

- Understanding GD section with medical accuracy
- Carbohydrate portion visual guide
- Nutrition label reading tutorial
- Restaurant meal navigation guide
- Morning glucose management tips

## Technical Implementation

### Database Schema Updates

```typescript
// Update Recipe type
interface Recipe {
  // existing fields...
  carbChoices: number; // carbs / 15
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "bedtime-snack";
  plateProportion?: {
    vegetables: number; // percentage
    protein: number;
    starch: number;
  };
}

// New GlucoseReading type
interface GlucoseReading {
  userId: string;
  timestamp: Date;
  value: number;
  unit: "mmol/L" | "mg/dL";
  readingType:
    | "fasting"
    | "1hr-post-breakfast"
    | "2hr-post-breakfast"
    | "2hr-post-lunch"
    | "2hr-post-dinner"
    | "other";
  mealAssociation?: string; // meal ID if applicable
  comments?: string;
  withinTarget: boolean;
}
```

### UI Components Needed

1. **Carb Choice Calculator**: Visual portion guide
2. **Plate Builder**: Interactive meal composition tool
3. **Daily Record Sheet**: Printable glucose log format
4. **Target Range Indicator**: Visual feedback for readings
5. **Meal Timing Reminder**: Notification system

### Validation Rules

```typescript
const mealValidation = {
  breakfast: {
    minCarbs: 25,
    maxCarbs: 35,
    targetCarbs: 30,
  },
  lunch: {
    minCarbs: 40,
    maxCarbs: 50,
    targetCarbs: 45,
  },
  dinner: {
    minCarbs: 40,
    maxCarbs: 50,
    targetCarbs: 45,
  },
  snack: {
    minCarbs: 15,
    maxCarbs: 30,
    targetCarbs: 15,
  },
  bedtimeSnack: {
    minCarbs: 15,
    maxCarbs: 15,
    requiresProtein: true,
  },
};
```

## Priority Order

1. **Phase 1** (Immediate):
   - Update recipe validation
   - Create carb choice calculator
   - Add medical disclaimers

2. **Phase 2** (Next Sprint):
   - Build glucose tracking with targets
   - Implement daily record format
   - Create meal timing system

3. **Phase 3** (Following Sprint):
   - Complete education content
   - Add plate method visualizer
   - Implement smart notifications

## Testing Requirements

- Validate all recipes meet guidelines
- Test glucose tracking accuracy
- Verify carb calculations
- Check accessibility of visual guides
- Ensure medical disclaimer visibility

## Compliance Checklist

- [ ] All carb recommendations match guidelines exactly
- [ ] Blood glucose targets clearly displayed
- [ ] Portion sizes use 15g = 1 choice system
- [ ] Bedtime snack protein requirement enforced
- [ ] Morning sensitivity options available
- [ ] Medical disclaimer on all pages
- [ ] Healthcare provider consultation reminders
- [ ] Printable formats match medical sheets

## Next Steps

1. Update recipe validation logic immediately
2. Create visual mockups for new components
3. Plan user testing with target audience
4. Coordinate with medical advisors for review
