# Claude Code Development Guide - Pregnancy Plate Planner

This document provides guidance for Claude Code agents working on the Pregnancy Plate Planner project. It includes agent definitions, development workflows, and important context for AI-assisted development.

## 🔴 CRITICAL: Branch Management Policy

**ALL SUBAGENTS MUST FOLLOW THIS WORKFLOW:**

1. **Create a Feature Branch**: 
   ```bash
   git checkout -b feature/[agent-name]-[task-description]
   # Example: git checkout -b feature/nutrition-tracking-implementation
   ```

2. **Make All Changes on the Feature Branch**:
   - Implement features
   - Test thoroughly
   - Commit with descriptive messages

3. **Push to Feature Branch**:
   ```bash
   git push origin feature/[branch-name]
   ```

4. **Do NOT Merge to Main**:
   - Leave the branch for review and testing
   - Document the branch name in your completion summary
   - The human will review, test, and merge when ready

5. **Branch Naming Convention**:
   - `feature/` prefix for new features
   - `fix/` prefix for bug fixes
   - Use kebab-case
   - Be descriptive but concise

**This policy ensures code quality and allows for proper testing before production deployment.**

## Project Overview

**Pregnancy Plate Planner** is a gestational diabetes meal planning application that helps expecting mothers manage their blood glucose through personalized meal plans, tracking, and education.

## Deployment Platform

**This project is deployed on Vercel**. All code must be compatible with Vercel's deployment environment:

### Vercel-Specific Requirements:

1. **Environment Variables**:
   - Use the exact names as configured in Vercel (e.g., `apiKey`, `authDomain`, `projectId`, not `NEXT_PUBLIC_FIREBASE_*`)
   - Firebase Admin credentials should be stored as JSON string in `FIREBASE_ADMIN_KEY`
   - Access via `process.env.variableName`

2. **Import Paths**:
   - Use proper import paths that resolve correctly in Vercel's build system
   - The `@/` alias maps to the project root, so use `@/src/...` for src directory imports
   - Avoid dynamic requires or imports that can't be statically analyzed

3. **API Routes**:
   - Use Next.js App Router API routes (`app/api/*/route.ts`)
   - Export named functions: `export async function GET()`, `export async function POST()`
   - Return `NextResponse` objects

4. **Build Compatibility**:
   - Ensure all TypeScript types are properly exported/imported
   - No Node.js-specific APIs in client components
   - Use `JSON.parse()` instead of `require()` for dynamic JSON loading

5. **File Structure**:
   - Follow Next.js 14 App Router conventions
   - Server Components by default, use `"use client"` directive when needed

## Development Commands

Always run these commands after making changes:

```bash
npm run lint
npm run format
npm run typecheck
npm run test
```

## Development Workflow Process

When working on any feature or task, follow this structured workflow:

1. **Planning Phase**: First think through the problem, read the codebase for relevant files, and write a plan to `tasks/todo.md`.
2. **Task Breakdown**: The plan should have a list of todo items that you can check off as you complete them.
3. **Verification**: Before you begin working, check in with me and I will verify the plan.
4. **Execution**: Then, begin working on the todo items, marking them as complete as you go.
5. **Progress Updates**: Please every step of the way just give me a high level explanation of what changes you made.
6. **Simplicity First**: Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. **Review**: Finally, add a review section to the `todo.md` file with a summary of the changes you made and any other relevant information.

This workflow ensures organized, transparent, and manageable development with clear communication at every step.

## WordPress Integration Context

This app will be deployed as a subdomain (app.pregnancyplateplanner.com) alongside the existing WordPress site. Key considerations:

1. **Authentication**: Plan for SSO with WordPress using JWT tokens
2. **Styling**: Match the WordPress theme (green, black, white color scheme)
3. **Navigation**: Seamless transitions between WordPress and Next.js
4. **User Data**: Sync between WordPress and Firebase
5. **Analytics**: Shared tracking across domains

See `INTEGRATION_STRATEGY.md` for detailed implementation plans.

## Current Project Status

**Last Updated**: 2025-07-08

### ✅ Completed Features

1. **Offline-First Recipe System**
   - 242 recipes successfully imported from Spoonacular API
   - All recipes stored in Firebase with complete nutritional data
   - Offline JSON export system for static serving
   - Zero API calls required for regular users
   - Local recipe service (`LocalRecipeService`) for client-side operations

2. **Admin Recipe Management**
   - Complete admin dashboard at `/admin/recipes`
   - Spoonacular recipe import with search and bulk import
   - Recipe viewing, editing, and deletion
   - GD validation scoring for all recipes
   - Recipe categorization and filtering
   - Export functionality for offline data preparation

3. **Authentication System**
   - Firebase Auth integration with email/password
   - Login/signup pages with error handling
   - Password reset functionality
   - Admin role protection (whitelist-based)
   - Session persistence

4. **Core Recipe Features**
   - Recipe browsing with category filters
   - Individual recipe detail pages
   - Nutritional information display
   - Offline-capable recipe viewing
   - Image fallback system for broken Spoonacular images

### 🏗️ Current Architecture

```
Spoonacular API → Admin Import → Firebase → Offline JSON → Users
                     ↓
                Admin Only
```

- **Admin Flow**: Admins can search and import recipes from Spoonacular
- **User Flow**: Users access pre-imported recipes with zero API calls
- **Data Storage**: Firebase for dynamic data, static JSON for offline use
- **Image Handling**: Firebase Storage with fallback to Spoonacular URLs

## Claude Code Agents

Last Supervisor Update: 2025-07-08
The following agents are designed to build different parts of the application. Deploy them as needed based on current development priorities.

### 0. Supervisor Agent

**Status**: Completed ✅  
**Files**: `/scripts/supervisor/`, `/logs/`  
**Dependencies**: None - monitors all other agents

**Prompt**:

```
Create a Supervisor agent that monitors and validates the work of other Claude Code agents.

Tasks:
1. Monitor agent execution status through:
   - Log file analysis in /logs/agents/
   - Git commit history
   - File system changes
   - Test results
2. Validate each agent's work by checking:
   - Required files were created
   - No syntax errors (run linting)
   - Tests pass (if applicable)
   - Dependencies are installed
   - Configuration files are valid
3. Create detailed reports:
   - Success/failure status
   - Files created/modified
   - Issues encountered
   - Recommendations for fixes
4. Handle failures gracefully:
   - Log detailed error information
   - Suggest remediation steps
   - Flag for manual review if needed
5. Support parallel agent monitoring:
   - Track multiple agents simultaneously
   - Manage dependencies between agents
   - Prevent conflicts
6. Maintain agent status dashboard in CLAUDE.md

The Supervisor should update agent statuses in this file automatically.
```

### 1. Firebase Setup Agent

**Status**: Completed ✅
**Files**: `/firebase/`, `/src/lib/firebase/`  
**Dependencies**: None

**Prompt**:

```
Set up a complete Firebase project for a gestational diabetes meal planner app.

Tasks:
1. Create Firebase configuration files (firebase.json, .firebaserc)
2. Set up Firestore database with these collections:
   - users (profiles, settings, subscription status)
   - recipes (title, ingredients, nutrition, ratings)
   - mealPlans (user-specific weekly plans)
   - glucoseReadings (timestamp, value, meal tags)
   - nutritionLogs (daily tracking)
3. Create security rules that ensure users can only access their own data
4. Set up Firebase Auth configuration for email/password
5. Create Firebase Storage rules for recipe images
6. Initialize Firebase Functions structure for future use
7. Create TypeScript types for all Firestore documents
8. Set up Firebase initialization in Next.js with proper error handling

Ensure all Firebase SDK imports use modular syntax (v9+).
```

### 2. Recipe Scraper Agent

**Status**: Replaced by Admin Import System ✅
**Files**: `/scripts/scraper/`  
**Dependencies**: Firebase must be configured first

**Prompt**:

```
Build a Python-based recipe scraper for gestational diabetes-friendly recipes.

Tasks:
1. Create a modular scraper using BeautifulSoup4
2. Target these recipe sources:
   - diabetesfoodhub.org
   - gestationaldiabetes.co.uk/recipes
   - diabetic.org/recipes
3. Extract: title, ingredients, instructions, prep/cook time, servings
4. Calculate nutritional data with focus on:
   - Total carbohydrates per serving
   - Fiber content
   - Protein and fat
   - Estimated glycemic index
5. Validate that recipes meet GD guidelines (15-30g carbs per meal)
6. Store recipes in Firestore with proper categorization
7. Implement rate limiting and respectful scraping
8. Add image download and optimization
9. Create a manual review queue for quality control
10. Build command-line interface for running scraper

Output format should match the Recipe TypeScript interface.
```

### 3. Next.js Foundation Agent

**Status**: Completed ✅
**Files**: `/src/`, `/public/`, root config files  
**Dependencies**: None

**Prompt**:

```
Create a Next.js 14 application with TypeScript and Tailwind CSS for the Pregnancy Plate Planner.

Tasks:
1. Initialize Next.js with App Router and TypeScript
2. Configure Tailwind CSS with a pregnancy-friendly color palette
3. Set up the following route structure:
   - / (landing page)
   - /auth/login, /auth/signup, /auth/forgot-password
   - /dashboard (protected)
   - /meal-planner (protected)
   - /recipes (protected)
   - /tracking/glucose (protected)
   - /tracking/nutrition (protected)
   - /profile (protected)
   - /education
4. Create base layout with responsive navigation
5. Implement loading and error boundaries
6. Set up global styles and Tailwind configuration
7. Create SEO metadata for all pages
8. Configure PWA manifest and service worker
9. Set up environment variable structure
10. Create reusable UI components: Button, Card, Input, Modal

Use modern React patterns (Server Components where appropriate).
```

### 4. Authentication Flow Agent

**Status**: Completed ✅
**Files**: `/src/app/auth/`, `/src/components/auth/`, `/src/hooks/`  
**Dependencies**: Firebase Setup Agent, Next.js Foundation Agent

**Prompt**:

```
Implement complete authentication flow with Firebase Auth in Next.js.

Tasks:
1. Create login page with email/password
2. Create signup page with:
   - Email/password fields
   - Pregnancy profile form (due date, height, pre-pregnancy weight)
   - Terms acceptance checkbox
3. Implement password reset flow
4. Create AuthContext with user state management
5. Build ProtectedRoute wrapper component
6. Add session persistence options
7. Implement proper error handling and user feedback
8. Create useAuth custom hook
9. Add loading states during auth operations
10. Set up user profile creation in Firestore on first signup
11. Implement logout functionality
12. Add "Remember me" functionality

Ensure GDPR compliance with clear data usage disclosure.
```

### 5. Meal Planning Algorithm Agent

**Status**: Not Started  
**Files**: `/src/lib/meal-planning/`, `/src/app/meal-planner/`  
**Dependencies**: Recipe data must exist in Firestore

**Prompt**:

```
Build the core meal planning algorithm for gestational diabetes management.

Tasks:
1. Create algorithm that generates 7-day meal plans with:
   - 3 main meals (30-45g carbs each)
   - 3 snacks (15-20g carbs each)
   - Balanced protein and healthy fats
2. Implement user preference filtering:
   - Dietary restrictions (vegetarian, vegan, gluten-free)
   - Allergies
   - Disliked ingredients
3. Ensure nutritional targets:
   - 175g minimum carbs daily
   - Adequate fiber (25-30g)
   - Prenatal nutrition requirements
4. Create meal swap functionality
5. Build shopping list generator
6. Implement meal plan saving and loading
7. Add portion size calculations based on user profile
8. Create printable meal plan view
9. Build meal prep mode that groups similar ingredients
10. Add favorite meals feature

Focus on variety and practicality for pregnant users.
```

### 6. Glucose Tracking Agent

**Status**: Not Started  
**Files**: `/src/app/tracking/glucose/`, `/src/components/tracking/`  
**Dependencies**: Firebase and authentication must be working

**Prompt**:

```
Implement comprehensive blood glucose tracking system.

Tasks:
1. Create glucose entry form with:
   - Reading value (mg/dL and mmol/L support)
   - Timestamp
   - Meal association (pre/post breakfast, lunch, dinner, snack)
   - Notes field
2. Build data visualization:
   - Daily glucose curve chart
   - Weekly trends
   - Time-in-range statistics
   - Pattern identification
3. Implement quick entry methods
4. Add reminder notifications setup
5. Create data export for healthcare providers:
   - PDF reports
   - CSV export
   - Printable logbook format
6. Build insights engine:
   - Identify problem times
   - Food correlation analysis
   - Success pattern recognition
7. Add target range customization
8. Implement data validation and error handling
9. Create mobile-optimized entry interface

Use Chart.js or Recharts for visualizations.
```

### 7. UI Component Library Agent

**Status**: Failed ❌
**Files**: `/src/components/ui/`  
**Dependencies**: Next.js Foundation must exist

**Prompt**:

```
Build a comprehensive UI component library for the meal planner app.

Tasks:
1. Create these components with Tailwind CSS:
   - RecipeCard (image, title, carbs, cook time, rating)
   - MealPlanCard (meal type, recipe info, swap button)
   - GlucoseChart (responsive line chart)
   - NutritionRing (circular progress indicators)
   - DatePicker (pregnancy-safe date ranges)
   - FoodSearch (autocomplete with nutritional preview)
   - MealLogger (photo upload, quick add)
2. Implement drag-and-drop for meal planning
3. Create loading skeletons for all components
4. Build accessible form components
5. Add animation with Framer Motion
6. Create responsive navigation with mobile drawer
7. Build notification/toast system
8. Implement modal system
9. Create print-specific styles
10. Add dark mode support (optional toggle)

Ensure all components are accessible (WCAG 2.1 AA).
```

### 8. Nutrition Tracking Agent

**Status**: Not Started  
**Files**: `/src/app/tracking/nutrition/`  
**Dependencies**: Meal planning system must exist

**Prompt**:

```
Build nutrition tracking features integrated with meal plans.

Tasks:
1. Create nutrition logging interface:
   - Log meals from plan
   - Add custom foods
   - Barcode scanning placeholder
   - Portion size adjustment
2. Build nutrition database integration
3. Create daily summary dashboard:
   - Macro breakdown (carbs, protein, fat)
   - Micronutrients important for pregnancy
   - Hydration tracking
   - Prenatal vitamin reminder
4. Implement weekly/monthly reports
5. Add nutrition goals customization
6. Create visual feedback system
7. Build comparison with recommendations
8. Add quick-add frequent foods
9. Implement meal photo diary
10. Create nutrition education tooltips

Focus on pregnancy-specific nutrients: folate, iron, calcium, DHA.
```

### 9. Recipe Browser Agent

**Status**: Not Started  
**Files**: `/src/app/recipes/`  
**Dependencies**: Recipes must exist in database

**Prompt**:

```
Create an intuitive recipe browsing and management system.

Tasks:
1. Build recipe grid/list view with:
   - Filter by meal type
   - Filter by cooking time
   - Filter by carb range
   - Ingredient search
   - Dietary restriction filters
2. Create detailed recipe view:
   - Ingredients with scaling
   - Step-by-step instructions
   - Nutritional breakdown
   - User ratings and reviews
   - Print view
3. Implement recipe favoriting system
4. Add recipe collections (e.g., "Quick Breakfasts")
5. Build recipe rating and review system
6. Create "Cook Mode" with step timer
7. Add shopping list integration
8. Implement recipe sharing
9. Build related recipes suggestions
10. Add cooking tips for GD management

Include batch cooking and meal prep indicators.
```

### 10. Educational Content Agent

**Status**: Not Started  
**Files**: `/src/app/education/`  
**Dependencies**: Basic app structure must exist

**Prompt**:

```
Create educational content system for gestational diabetes.

Tasks:
1. Build article management system:
   - Markdown-based content
   - Category organization
   - Search functionality
2. Create these initial articles:
   - "Understanding Gestational Diabetes"
   - "Carb Counting Basics"
   - "Safe Exercise During GD Pregnancy"
   - "Reading Food Labels"
   - "Managing Morning Glucose Spikes"
3. Implement video tutorial section
4. Create interactive guides:
   - Portion size visual guide
   - Glycemic index explainer
   - Meal timing optimizer
5. Build FAQ section
6. Add expert verification badges
7. Create printable handouts
8. Implement content bookmarking
9. Add progress tracking for education
10. Build quiz/knowledge check system

Content should be medically accurate but accessible.
```

### 11. Stripe Integration Agent

**Status**: Not Started (Phase 2)  
**Files**: `/src/app/api/stripe/`, `/src/app/subscription/`  
**Dependencies**: Complete app functionality

**Prompt**:

```
Implement Stripe subscription system for premium features.

Tasks:
1. Set up Stripe Customer Portal integration
2. Create subscription tiers:
   - Free: Limited features
   - Premium ($9.99/mo): Full access
   - Premium+ ($14.99/mo): Includes dietitian support
3. Implement checkout flow
4. Build subscription management page
5. Create webhook handlers for:
   - Payment success/failure
   - Subscription updates
   - Cancellations
6. Implement feature gating based on tier
7. Add free trial (14 days)
8. Create upgrade/downgrade flows
9. Build invoice history
10. Implement usage-based limits for free tier

Handle edge cases like payment failures gracefully.
```

### 12. Testing Suite Agent

**Status**: Not Started  
**Files**: `/tests/`, `/__tests__/`  
**Dependencies**: Core features must be implemented

**Prompt**:

```
Create comprehensive testing suite for the application.

Tasks:
1. Set up Jest and React Testing Library
2. Write unit tests for:
   - Meal planning algorithm
   - Nutrition calculations
   - Authentication flows
   - Data validation
3. Create integration tests for:
   - User signup flow
   - Meal plan generation
   - Glucose tracking
4. Set up Cypress for E2E tests:
   - Critical user journeys
   - Payment flows
   - Data export
5. Implement visual regression tests
6. Create performance benchmarks
7. Add accessibility testing
8. Set up CI/CD test automation
9. Create test data factories
10. Document testing strategies

Aim for 80% code coverage on critical paths.
```

## Development Best Practices

1. **Component Structure**: Use composition over inheritance
2. **State Management**: Use React Context for global state, local state for components
3. **Error Handling**: Always implement error boundaries and user-friendly error messages
4. **Performance**: Implement lazy loading, optimize images, use React.memo wisely
5. **Security**: Never expose sensitive data, validate all inputs, use Firebase Security Rules
6. **Accessibility**: Test with screen readers, ensure keyboard navigation, proper ARIA labels
7. **Mobile First**: Design for mobile devices primarily, enhance for desktop

## Important Medical Considerations

- Never provide medical advice
- Always include disclaimers about consulting healthcare providers
- Ensure glucose tracking allows for different measurement units (mg/dL and mmol/L)
- Default carb recommendations should align with ADA guidelines for GD
- Include warnings about ketone testing if carbs are too low

## Medical Guidelines Reference

**IMPORTANT**: Always refer to `/home/amy/dev/gdmealplanner/MEDICAL_GUIDELINES.md` when implementing any medical-related features, including:

- Carbohydrate counting and meal planning
- Blood glucose target ranges
- Portion sizes and food choices
- Daily nutrition requirements
- Glucose monitoring schedules

The MEDICAL_GUIDELINES.md file contains official Halton Healthcare guidelines that must be followed exactly for all medical aspects of the application.

## Git Workflow

1. Create feature branches: `feature/agent-name-task`
2. Commit frequently with descriptive messages
3. Run tests before committing
4. Keep commits focused and atomic
5. Update this file when agents complete tasks

## Deployment Notes

### Vercel Deployment

This project is deployed on Vercel. All agents must ensure their code is Vercel-compatible:

**Pre-deployment Checklist:**

1. Test the build locally: `npm run build`
2. Ensure all imports resolve correctly
3. Verify environment variable names match Vercel configuration
4. Check that all TypeScript types are properly exported
5. Test API routes with proper error handling

**Deployment Process:**

```bash
git add .
git commit -m "descriptive message"
git push origin main
# Vercel automatically deploys from main branch
```

**Environment Variables in Vercel:**

- `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` (Firebase client)
- `FIREBASE_ADMIN_KEY` (Firebase admin - full JSON as string)
- `SPOONACULAR_API_KEY` (Spoonacular API)
- Any additional secrets should follow Vercel naming conventions

**Common Vercel Issues to Avoid:**

- Don't use `fs`, `path`, or other Node.js modules in client components
- Don't use dynamic `require()` statements
- Ensure all API routes return proper `NextResponse` objects
- Use static imports for better tree-shaking
- Keep API route files under 50MB (including dependencies)

**Production Considerations:**

- Enable Firebase App Check for production
- Set up monitoring with Vercel Analytics
- Configure proper CORS policies for API routes
- Implement rate limiting on API routes
- Set up automated backups for Firestore
- Use Vercel Edge Functions for better performance where applicable

## Next Steps - Phase 2 Implementation

### Priority 1: Core User Features

1. **Meal Planning Algorithm (Agent #5)**
   - Implement 12-week rotation system
   - Generate personalized meal plans following GD guidelines
   - Shopping list generation
   - Meal swap functionality

2. **Glucose Tracking (Agent #6)**
   - Blood glucose entry and tracking
   - Data visualization with charts
   - Pattern analysis and insights
   - Healthcare provider reports

3. **Nutrition Tracking (Agent #8)**
   - Integration with meal plans
   - Daily macro/micronutrient tracking
   - Progress visualization
   - Prenatal vitamin reminders

### Priority 2: User Experience

1. **UI Component Library (Agent #7)**
   - Complete component set with Tailwind
   - Mobile-responsive design
   - Drag-and-drop meal planning
   - Print-friendly layouts

2. **Educational Content (Agent #10)**
   - GD education articles
   - Interactive guides
   - Video tutorials
   - Knowledge checks

### Priority 3: Production Readiness

1. **Testing Suite (Agent #12)**
   - Unit tests for algorithms
   - Integration tests
   - E2E tests with Cypress
   - Performance benchmarks

2. **WordPress Integration**
   - SSO implementation
   - Shared styling
   - User data sync
   - Analytics integration

3. **Performance Optimization**
   - Implement PWA features
   - Service worker for offline
   - Image optimization
   - Code splitting

### Priority 4: Monetization (Phase 3)

1. **Stripe Integration (Agent #11)**
   - Subscription tiers
   - Payment processing
   - Customer portal
   - Usage limits for free tier

## Immediate Next Steps

1. **Complete Meal Planning Algorithm** - This is the core feature users need
2. **Implement Glucose Tracking** - Essential for GD management
3. **Add PWA Support** - Enable offline functionality
4. **Create Production Deployment Guide** - Document deployment process
5. **Set Up Monitoring** - Error tracking and analytics

Remember: The goal is to create a tool that genuinely helps expecting mothers manage gestational diabetes safely and effectively.

## Priority 1 Agent Definitions - Ready for Deployment

### 5. Meal Planning Algorithm Agent

**Status**: Ready to Deploy  
**Files**: `/src/lib/meal-planning/`, `/app/meal-planner/`  
**Dependencies**: Offline recipe system (completed)

**Prompt**:

```
Build the core meal planning algorithm for gestational diabetes management using the offline recipe system.

Tasks:
1. Create algorithm that generates 7-day meal plans with:
   - 3 main meals (breakfast: 25-35g, lunch/dinner: 40-50g carbs)
   - 3 snacks (15-30g carbs each)
   - Bedtime snack (14-16g carbs + protein)
   - Total daily carbs: 175-200g
2. Use LocalRecipeService to select recipes from offline data
3. Implement user preference filtering:
   - Dietary restrictions (vegetarian, vegan, gluten-free, dairy-free)
   - Allergies (nuts, shellfish, eggs, etc.)
   - Disliked ingredients
   - Cooking time preferences
4. Ensure nutritional balance:
   - Adequate protein (25-30% of calories)
   - Healthy fats (30-35% of calories)
   - High fiber (25-30g daily)
   - Prenatal nutrition requirements
5. Create meal plan variations:
   - Avoid repeating meals too often
   - Balance cooking complexity throughout week
   - Consider meal prep opportunities
6. Build meal plan management:
   - Save/load meal plans to Firebase
   - Regenerate individual days
   - Swap meals functionality
   - Copy plans between weeks
7. Generate shopping lists:
   - Aggregate ingredients
   - Group by store section
   - Account for quantities
   - Handle pantry staples
8. Add meal prep guidance:
   - Identify prep-ahead opportunities
   - Batch cooking suggestions
   - Storage instructions
9. Create printable/shareable formats:
   - PDF meal plan with recipes
   - Shopping list export
   - Share via email/message
10. Track meal plan performance:
    - User ratings
    - Glucose impact tracking
    - Favorite meal patterns

Use the existing RecipeProvider and LocalRecipeService for all recipe data.
Reference MEDICAL_GUIDELINES.md for carb targets and meal timing.
```

### 6. Glucose Tracking Agent

**Status**: Ready to Deploy  
**Files**: `/app/tracking/glucose/`, `/src/components/glucose/`  
**Dependencies**: Firebase and authentication (completed)

**Prompt**:

```
Implement comprehensive blood glucose tracking system for gestational diabetes management.

Tasks:
1. Create glucose entry form with:
   - Reading value (mg/dL and mmol/L support)
   - Toggle between units with conversion
   - Timestamp (default to now)
   - Meal association:
     * Fasting/wake up
     * Pre-breakfast, 1hr post, 2hr post
     * Pre-lunch, 1hr post, 2hr post
     * Pre-dinner, 1hr post, 2hr post
     * Pre-snack, post-snack
     * Bedtime
     * Middle of night
   - Notes field for context
   - Quick entry buttons for common times
2. Build data visualization dashboard:
   - Daily glucose curve chart
   - Color coding for target ranges:
     * Fasting: <95 mg/dL (<5.3 mmol/L)
     * 1hr post: <140 mg/dL (<7.8 mmol/L)
     * 2hr post: <120 mg/dL (<6.7 mmol/L)
   - Weekly trend view
   - Monthly overview calendar
   - Time-in-range statistics
   - Pattern identification (highs/lows by meal)
3. Implement quick entry methods:
   - Voice input support
   - Recent readings quick-copy
   - Bulk entry for missed readings
   - CSV import capability
4. Add reminder system:
   - Customizable reminder times
   - Push notifications (PWA)
   - Missed reading alerts
   - Pre-meal reminders
5. Create comprehensive reports:
   - PDF export for healthcare providers
   - Include all readings with timestamps
   - Statistical summary
   - Graphs and trends
   - Notes and context
   - Printable logbook format
6. Build insights engine:
   - Identify problem patterns
   - Correlate with meals (if logged)
   - Success rate by meal type
   - Weekly improvement tracking
   - Personalized recommendations
7. Add data management:
   - Edit past entries
   - Delete incorrect readings
   - Bulk operations
   - Data backup/restore
8. Implement target customization:
   - Allow provider-specific targets
   - Different targets by meal
   - Adjustment over pregnancy
9. Create mobile-optimized interface:
   - Large touch targets
   - Swipe gestures
   - Offline capability
   - Quick access from home
10. Add integrations:
    - Export to Apple Health/Google Fit
    - Share with family/care team
    - Sync with meal plans

Store all data in Firebase with user ID isolation.
Use Chart.js or Recharts for visualizations.
Reference MEDICAL_GUIDELINES.md for target ranges.
```

### 7. Nutrition Tracking Agent

**Status**: Ready to Deploy  
**Files**: `/app/tracking/nutrition/`, `/src/components/nutrition/`  
**Dependencies**: Meal planning and Firebase (completed)

**Prompt**:

```
Build nutrition tracking features integrated with meal plans and focused on GD management.

Tasks:
1. Create food logging interface:
   - Log meals from active meal plan (one-click)
   - Search and add custom foods
   - Modify portion sizes
   - Quick-add frequent foods
   - Barcode scanning placeholder
   - Photo meal diary option
   - Copy previous day's meals
2. Build comprehensive food database:
   - Use offline recipe data
   - Add common foods database
   - Custom food creation
   - Save favorite combinations
   - Restaurant meal estimates
3. Create daily tracking dashboard:
   - Carbohydrate tracking vs targets:
     * Per meal targets
     * Daily total (175-200g)
     * Distribution timing
   - Macro breakdown:
     * Carbs (40-45%)
     * Protein (25-30%)
     * Fat (30-35%)
   - Fiber intake (target: 25-30g)
   - Key micronutrients:
     * Folate (600mcg)
     * Iron (27mg)
     * Calcium (1000mg)
     * DHA (200mg)
     * Vitamin D
   - Hydration tracking
   - Prenatal vitamin checkbox
4. Implement meal timing tracking:
   - Log actual meal times
   - Compare to recommended schedule
   - Track spacing between meals
   - Overnight fasting duration
5. Build analytics and insights:
   - Weekly nutrition summary
   - Trends over time
   - Achievement badges
   - Areas for improvement
   - Correlation with glucose (if tracked)
6. Create visual feedback:
   - Progress rings/bars
   - Traffic light system
   - Daily score/rating
   - Streak tracking
   - Celebration animations
7. Add meal plan adherence:
   - Track % followed
   - Log substitutions
   - Rate meals
   - Note challenges
8. Implement quick actions:
   - Common snack buttons
   - Water intake counter
   - Meal skip/delay logging
   - Emergency snack logging
9. Create reports and exports:
   - Weekly summary PDF
   - Healthcare provider report
   - CSV data export
   - Integration with glucose data
10. Build education integration:
    - Contextual tips
    - Nutrition facts
    - GD-specific guidance
    - Link to education content

Store all data in Firebase per user.
Integrate with LocalRecipeService for nutrition data.
Reference MEDICAL_GUIDELINES.md for nutrition targets.
```

EOF < /dev/null
