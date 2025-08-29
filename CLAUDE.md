# Claude Code Development Guide - Pregnancy Plate Planner

This document provides guidance for Claude Code development on the Pregnancy Plate Planner project, featuring automated hooks and streamlined development workflows.

## 🔴 CRITICAL: Branch Management Policy

**ALL DEVELOPMENT MUST FOLLOW THIS WORKFLOW:**

1. **Create a Feature Branch**: 
   ```bash
   git checkout -b feature/[description]
   # Example: git checkout -b feature/glucose-tracking-implementation
   ```

2. **Make All Changes on the Feature Branch**:
   - Implement features
   - Test thoroughly
   - Use automated hooks for validation
   - Commit with descriptive messages

3. **Push to Feature Branch**:
   ```bash
   git push origin feature/[branch-name]
   ```

4. **Do NOT Merge to Main**:
   - Leave the branch for review and testing
   - Document the branch name in completion summary
   - Human will review, test, and merge when ready

**This policy ensures code quality and allows for proper testing before production deployment.**

## 🤖 Automated Hook System

**The project features 8 automated hooks that handle most development tasks automatically:**

### Available Hooks
1. **visual-regression-autofix** - Auto-fixes visual discrepancies during homepage development
2. **recipe-data-guardian** - Protects recipe data integrity and validates imports
3. **smart-conflict-resolver** - Automatically resolves merge conflicts and git issues
4. **build-error-remediation** - Auto-fixes common build errors and TypeScript issues
5. **e2e-self-healing** - Repairs failing end-to-end tests automatically
6. **test-driven-docs** - Generates and updates documentation from test results
7. **vercel-env-sync** - Synchronizes environment variables with Vercel deployment
8. **api-route-tester** - Automatically tests API routes and fixes common issues

### Using Hooks
```bash
# Check all hook status
./scripts/hooks/status.sh

# Run all hooks (handles most issues automatically)
./scripts/hooks/run-all-hooks.sh

# Run specific hook
./scripts/hooks/run-hook.sh [hook-name]
```

### Hook Benefits
- **Reduced manual work**: Most debugging and testing handled automatically
- **Faster development**: Issues caught and fixed before they become problems
- **Consistent quality**: Automated validation ensures code standards
- **Documentation sync**: Auto-generates docs from code and tests

## Project Overview

**Pregnancy Plate Planner** is a gestational diabetes meal planning application that helps expecting mothers manage their blood glucose through personalized meal plans, tracking, and education.

## Current Project Status

**Last Updated**: 2025-01-07

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

3. **Authentication System**
   - Firebase Auth integration with email/password
   - Login/signup pages with error handling
   - Password reset functionality
   - Admin role protection (whitelist-based)
   - Session persistence

4. **Homepage Implementation**
   - WordPress design replication at `/homepage-v2`
   - Responsive layout matching pregnancyplateplanner.com
   - Lead capture forms and CTAs
   - SEO optimization with proper metadata
   - Google Fonts integration (Poppins, Domine, Bitter)

5. **Automated Development Infrastructure**
   - 8 automated hooks for continuous quality assurance
   - Visual regression testing and auto-fixing
   - Build error remediation
   - Environment synchronization
   - Documentation generation

### 🏗️ Current Architecture

```
Spoonacular API → Admin Import → Firebase → Offline JSON → Users
                     ↓
                Admin Only
```

- **Admin Flow**: Admins can search and import recipes from Spoonacular
- **User Flow**: Users access pre-imported recipes with zero API calls
- **Data Storage**: Firebase for dynamic data, static JSON for offline use
- **Automated Quality**: Hooks handle testing, fixes, and validation

## Technology Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Context** for state management

### Backend
- **Firebase Firestore** for data storage
- **Firebase Auth** for authentication
- **Vercel** for hosting and deployment

### Development Tools
- **Automated Hooks** for quality assurance
- **ESLint & Prettier** for code formatting
- **TypeScript** for type checking
- **Visual regression testing** for UI consistency

## Development Workflow

### 1. Standard Development Process
```bash
# Start development
npm run dev

# Make changes (hooks auto-validate)
# Commit changes
git add .
git commit -m "descriptive message"

# Hooks run automatically on commit
# Push when ready
git push origin feature/[branch-name]
```

### 2. Development Commands
```bash
npm run lint          # ESLint checks
npm run format        # Prettier formatting
npm run typecheck     # TypeScript validation  
npm run build         # Production build test
```

### 3. Hook-Assisted Development
- Hooks run automatically during development
- Most issues caught and fixed before manual intervention
- Visual changes auto-validated against design targets
- Documentation updated automatically

## Documentation Structure

Organized documentation is maintained in:

```
/docs/
├── architecture/
│   ├── system-design.md      # Overall system architecture
│   └── recipe-system.md      # Recipe system documentation
├── guides/
│   └── development.md        # Setup and debugging guide
└── features/
    └── homepage.md          # Homepage implementation guide
```

## Next Steps - Priority Features

### 🎯 Priority 1: Core User Features
1. **Meal Planning Algorithm** - Generate personalized 7-day meal plans
2. **Glucose Tracking** - Blood glucose entry, visualization, and insights
3. **Nutrition Tracking** - Daily nutrition logging integrated with meal plans

### 🎯 Priority 2: Enhanced User Experience
1. **Recipe Browser** - Enhanced search, filtering, and favorites
2. **Educational Content** - GD education articles and interactive guides
3. **PWA Features** - Offline capability and mobile optimization

## Important Guidelines

### Medical Considerations
- Always refer to `MEDICAL_GUIDELINES.md` for medical requirements
- Never provide medical advice
- Include disclaimers about consulting healthcare providers
- Support both mg/dL and mmol/L glucose units
- Follow ADA guidelines for GD carbohydrate recommendations

### Development Best Practices
- Use automated hooks for quality assurance
- Follow TypeScript strict mode
- Implement offline-first design patterns
- Ensure mobile-responsive layouts
- Maintain accessibility standards (WCAG 2.1 AA)

### Deployment
- **Platform**: Vercel with automatic deployments
- **Environment**: All variables configured in Vercel dashboard
- **Process**: Push to main triggers automatic deployment
- **Quality**: Hooks validate before deployment

## Troubleshooting

### Common Issues
1. **Build Errors**: Use `build-error-remediation` hook
2. **Visual Issues**: Use `visual-regression-autofix` hook
3. **Recipe Data**: Use `recipe-data-guardian` hook
4. **Git Conflicts**: Use `smart-conflict-resolver` hook
5. **Test Failures**: Use `e2e-self-healing` hook

### Getting Help
1. Check hook logs in `.claude/logs/`
2. Run `./scripts/hooks/status.sh` for system status
3. Review relevant documentation in `/docs`
4. Check recent commits for breaking changes

## WordPress Integration Context

This app will be deployed as a subdomain (app.pregnancyplateplanner.com) alongside the existing WordPress site:

1. **Authentication**: Plan for SSO with WordPress using JWT tokens
2. **Styling**: Match WordPress theme (green, black, white color scheme)
3. **Navigation**: Seamless transitions between WordPress and Next.js
4. **User Data**: Sync between WordPress and Firebase
5. **Analytics**: Shared tracking across domains

## Summary

This project leverages automated hooks to minimize manual development overhead while maintaining high code quality. The focus is on implementing core features (meal planning, glucose tracking, nutrition tracking) that provide real value to users managing gestational diabetes.

**Key Benefits of Current Setup:**
- Automated quality assurance through hooks
- Offline-first architecture for performance
- Clean, organized documentation structure
- Streamlined development workflow
- Production-ready deployment pipeline

For detailed implementation guidance, refer to the documentation in `/docs/` and leverage the automated hooks system for continuous quality assurance.