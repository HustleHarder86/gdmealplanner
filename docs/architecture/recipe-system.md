# Recipe System Architecture

## Overview

The Pregnancy Plate Planner uses an offline-first recipe system designed for optimal performance and user experience. This document consolidates all recipe system documentation.

## System Architecture

```
Spoonacular API → Admin Import → Firebase → Offline JSON → Users
                     ↓
                Admin Only
```

## Key Components

### 1. Offline Recipe Service
- LocalRecipeService handles all client-side recipe operations
- Zero API calls for regular users
- Recipe data served from static JSON files

### 2. Admin Recipe Management
- Spoonacular API integration for importing recipes
- Recipe validation and GD compliance scoring
- Batch import capabilities
- Manual recipe editing and approval

### 3. Data Flow
1. **Admin Import**: Recipes imported from Spoonacular via admin interface
2. **Firebase Storage**: All recipes stored in Firestore for admin management
3. **Offline Export**: Regular exports to static JSON files
4. **User Access**: Users consume recipes from static files (no API calls)

## Recipe Data Structure

Recipes follow the TypeScript Recipe interface with:
- Basic info (title, description, category, tags)
- Timing (prep, cook, total time)
- Ingredients with measurements
- Step-by-step instructions
- Complete nutrition data
- GD validation scoring
- User engagement metrics

## GD Validation

All recipes are scored for gestational diabetes compliance:
- Carbohydrate content per serving
- Fiber content
- Glycemic index considerations
- Meal timing appropriateness
- Overall nutritional balance

## Implementation Status

✅ **Completed Features:**
- Offline recipe system (242 recipes imported)
- Admin dashboard for recipe management
- Spoonacular API integration
- Recipe validation and scoring
- Static JSON export system

🔄 **In Progress:**
- Recipe categorization improvements
- Enhanced search capabilities
- User favorite recipes
- Recipe rating system

## Scripts Reference

### Import Scripts
- `scripts/import-recipes-simple.js` - Basic recipe import
- `scripts/import-from-spoonacular.js` - Full Spoonacular integration
- `scripts/export-offline-data.js` - Generate static files

### Admin Scripts
- Admin dashboard accessible at `/admin/recipes`
- Bulk import with category filtering
- Recipe editing and approval workflow

## Technical Details

### Firebase Integration
- Recipes stored in `recipes` collection
- Admin permissions via Firebase Auth
- Real-time updates during imports

### Offline Performance
- Static JSON files served via CDN
- Lazy loading for recipe details
- Client-side search and filtering

### Future Enhancements
- Recipe recommendation engine
- Meal plan integration
- Shopping list generation
- User-generated recipes

---

*This document consolidates information from multiple recipe implementation guides into a single comprehensive reference.*