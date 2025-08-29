# Pregnancy Plate Planner

A comprehensive gestational diabetes meal planning application for expecting mothers, featuring automated development workflows and offline-first architecture.

🌐 **Live Site**: [https://pregnancyplateplanner.com](https://pregnancyplateplanner.com)  
🔧 **Homepage Demo**: [http://localhost:3002/homepage-v2](http://localhost:3002/homepage-v2)

## 🚀 Current Status: Production-Ready Core System

✅ **Offline-first architecture** with 242 pre-validated recipes  
✅ **Homepage implementation** matching WordPress design  
✅ **Automated development hooks** for quality assurance  
✅ **Admin recipe management** system  
✅ **Authentication system** with Firebase  

## Key Features

### 🏠 Homepage
- Exact WordPress design replication at `/homepage-v2`
- Responsive layout with proper SEO metadata
- Lead capture forms and conversion optimization
- Google Fonts integration (Poppins, Domine, Bitter)

### 🍽️ Recipe System
- **242 gestational diabetes-friendly recipes** available offline
- **Zero API calls** for regular users (performance optimized)
- **Admin dashboard** for recipe management and imports
- **Spoonacular integration** for recipe imports (admin-only)

### 🔐 Authentication
- Firebase Auth with email/password
- Admin role protection and user management
- Password reset and session persistence

### 🤖 Automated Development
- **8 automated hooks** for continuous quality assurance
- **Visual regression testing** and auto-fixing
- **Build error remediation** and conflict resolution
- **Documentation generation** from code and tests

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Vercel with automatic deployments
- **Development**: Automated hooks for quality assurance

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit homepage
open http://localhost:3002/homepage-v2
```

## Development Workflow

### Using Automated Hooks
```bash
# Check system status
./scripts/hooks/status.sh

# Run all quality checks
./scripts/hooks/run-all-hooks.sh

# Fix specific issues
./scripts/hooks/run-hook.sh [hook-name]
```

### Available Hooks
- `visual-regression-autofix` - Auto-fixes homepage visual issues
- `recipe-data-guardian` - Validates recipe data integrity  
- `smart-conflict-resolver` - Resolves git conflicts
- `build-error-remediation` - Fixes build and TypeScript errors
- `e2e-self-healing` - Repairs failing tests
- `test-driven-docs` - Updates documentation automatically
- `vercel-env-sync` - Syncs environment variables
- `api-route-tester` - Tests API endpoints

### Development Commands
```bash
npm run lint          # ESLint checks
npm run format        # Prettier formatting  
npm run typecheck     # TypeScript validation
npm run build         # Production build
```

## Project Architecture

### Data Flow
```
Spoonacular API → Admin Import → Firebase → Offline JSON → Users
                     ↓
                Admin Only
```

### File Structure
```
/
├── app/                    # Next.js 14 App Router
│   ├── homepage-v2/       # WordPress homepage replica
│   ├── admin/recipes/     # Recipe management dashboard
│   └── api/              # API routes
├── docs/                  # Organized documentation  
│   ├── architecture/     # System design docs
│   ├── guides/          # Development guides
│   └── features/        # Feature documentation
├── .claude/hooks/        # Automated development hooks
└── src/                  # Source code
    ├── services/        # Business logic
    └── types/          # TypeScript definitions
```

## Environment Setup

Create `.env.local` with:

```bash
# Firebase Configuration (Vercel naming)
apiKey=your_firebase_api_key
authDomain=your_project.firebaseapp.com  
projectId=your_project_id
storageBucket=your_project.appspot.com
messagingSenderId=your_sender_id
appId=your_app_id

# Firebase Admin (JSON string)
FIREBASE_ADMIN_KEY={"type":"service_account",...}

# Spoonacular API (Admin only)
SPOONACULAR_API_KEY=your_spoonacular_key

# Admin Access
ADMIN_EMAIL_WHITELIST=admin@example.com
```

## Documentation

Comprehensive documentation available in `/docs`:

- **Architecture**: System design and recipe system overview
- **Development Guide**: Setup, debugging, and hook usage  
- **Homepage Guide**: Implementation details and maintenance

## Next Steps

### 🎯 Priority Features
1. **Meal Planning Algorithm** - Generate personalized 7-day meal plans
2. **Glucose Tracking** - Blood glucose monitoring and insights  
3. **Nutrition Tracking** - Daily nutrition logging and analysis

### 🔄 Development Benefits
- **Automated quality assurance** via hooks system
- **Instant visual validation** during development
- **Zero-downtime deployments** with Vercel
- **Clean, organized codebase** with minimal documentation debt

## WordPress Integration

This Next.js app integrates with the existing WordPress site at pregnancyplateplanner.com:

- **Subdomain deployment** (app.pregnancyplateplanner.com)  
- **Shared styling** and brand consistency
- **SSO integration** planned for user accounts
- **Seamless navigation** between WordPress and app

## Medical Disclaimer

This application is designed to support, not replace, professional medical advice. Always consult with your healthcare provider for medical decisions related to gestational diabetes management.

## License

Proprietary software. All rights reserved.

---

**Built with automated quality assurance and offline-first performance for expecting mothers managing gestational diabetes.**