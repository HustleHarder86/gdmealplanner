# Pregnancy Plate Planner

A comprehensive gestational diabetes meal planning application for expecting mothers, providing personalized meal plans, blood glucose tracking, and nutritional guidance.

🌐 **Live Site**: [https://pregnancyplateplanner.com](https://pregnancyplateplanner.com)

## 🚀 Current Status: Offline-First Architecture

The application has been successfully migrated to an offline-first architecture with 242 pre-validated recipes. Regular users experience zero API calls, ensuring fast, reliable access to meal planning resources.

## Overview

Pregnancy Plate Planner helps expecting mothers with gestational diabetes manage their condition through:

- Personalized meal planning with carbohydrate counting
- Blood glucose tracking and pattern analysis
- Gestational diabetes-friendly recipe library
- Educational resources and nutritional guidance
- Healthcare provider report generation

**Note**: This Next.js application is designed to integrate with the existing WordPress site at pregnancyplateplanner.com as a subdomain (app.pregnancyplateplanner.com). See `INTEGRATION_STRATEGY.md` for details.

## Features

### ✅ Implemented Features

- **Offline Recipe System**: 242 pre-validated GD-friendly recipes available without API calls
- **Admin Recipe Management**: Complete admin dashboard for recipe import and management
- **Authentication System**: Firebase Auth with email/password and admin role protection
- **Recipe Browsing**: Category-based filtering with nutritional information display
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 🚧 In Development

- **Smart Meal Planning**: 12-week rotation meal plans following GD guidelines
- **Glucose Tracking**: Blood glucose monitoring with pattern analysis
- **Nutrition Dashboard**: Daily macro/micronutrient tracking
- **Educational Hub**: GD management guides and resources

### Technical Architecture

- **Offline-First Design**: Static recipe data with Firebase fallback
- **Zero API Calls**: Pre-imported recipes eliminate runtime API dependencies
- **Admin-Only Imports**: Spoonacular API access restricted to administrators
- **Progressive Web App**: Ready for offline support implementation
- **Secure Authentication**: Firebase Auth with role-based access

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Database**: Cloud Firestore
- **Hosting**: Vercel / Firebase Hosting
- **Payment**: Stripe (Phase 2)
- **Analytics**: Firebase Analytics
- **Monitoring**: Sentry

## Project Structure

```
gdmealplanner/
├── app/                    # Next.js 14 App Router
│   ├── admin/             # Admin dashboard and tools
│   │   ├── recipes/       # Recipe management
│   │   └── import-recipes/ # Spoonacular import interface
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-only endpoints
│   │   └── recipes/       # Recipe data endpoints
│   ├── login/             # Authentication pages
│   ├── meal-planner/      # Meal planning interface
│   └── recipes/           # Recipe browsing
├── src/                   # Source code
│   ├── services/          # Service layer
│   │   └── local-recipe-service.ts # Offline recipe service
│   ├── lib/firebase/      # Firebase configuration
│   └── types/             # TypeScript definitions
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase CLI installed globally
- Python 3.8+ (for recipe scraper)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gdmealplanner.git
cd gdmealplanner
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure Firebase:

```bash
firebase init
# Select: Firestore, Functions, Storage, Hosting
```

5. Run development server:

```bash
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```
# Firebase Client Configuration (Vercel format)
apiKey=
authDomain=
projectId=
storageBucket=
messagingSenderId=
appId=

# Firebase Admin Configuration
FIREBASE_ADMIN_KEY= # Full service account JSON as string

# Spoonacular API Configuration (Admin use only)
SPOONACULAR_API_KEY=

# Admin Whitelist
ADMIN_EMAIL_WHITELIST=email1@example.com,email2@example.com
```

See `.env.example` for a complete list of environment variables.

## Development Workflow

### Running Tests

```bash
npm run test
npm run test:e2e
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

### Building for Production

```bash
npm run build
npm run start
```

### Recipe Scraper

```bash
cd scripts/scraper
python scraper.py --source diabetes-recipes.com --limit 50
```

## Firebase Security Rules

Basic Firestore rules are in `firebase/firestore.rules`. Key principles:

- Users can only read/write their own data
- Recipes are publicly readable
- Admin functions require custom claims

## Deployment

### Vercel Deployment (Production)

The app is configured for automatic deployment on Vercel:

1. **Environment Setup**: Configure all environment variables in Vercel dashboard
2. **Automatic Deployment**: Push to `main` branch triggers deployment
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

## Roadmap

### Phase 1: Core Features (Current)

- ✅ Offline recipe system
- ✅ Admin recipe management
- ✅ Authentication system
- ✅ Recipe browsing

### Phase 2: User Features (Next)

- 🚧 Meal planning algorithm
- 🚧 Glucose tracking
- 🚧 Nutrition tracking
- 🚧 Educational content
- 🚧 PWA implementation

### Phase 3: Premium Features

- 📅 Subscription system (Stripe)
- 📅 Advanced analytics
- 📅 Dietitian support
- 📅 WordPress integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Medical Disclaimer

This app is designed to support, not replace, the relationship between patients and healthcare providers. Always consult with your healthcare team for medical advice.

## License

This project is proprietary software. All rights reserved.

## Contact

- Website: [pregnancyplateplanner.com](https://pregnancyplateplanner.com)
- Email: support@pregnancyplateplanner.com
- Issues: [GitHub Issues](https://github.com/yourusername/gdmealplanner/issues)
