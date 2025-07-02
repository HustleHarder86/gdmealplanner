# Pregnancy Plate Planner

A comprehensive gestational diabetes meal planning application for expecting mothers, providing personalized meal plans, blood glucose tracking, and nutritional guidance.

🌐 **Live Site**: [https://pregnancyplateplanner.com](https://pregnancyplateplanner.com)

## Overview

Pregnancy Plate Planner helps expecting mothers with gestational diabetes manage their condition through:
- Personalized meal planning with carbohydrate counting
- Blood glucose tracking and pattern analysis
- Gestational diabetes-friendly recipe library
- Educational resources and nutritional guidance
- Healthcare provider report generation

**Note**: This Next.js application is designed to integrate with the existing WordPress site at pregnancyplateplanner.com as a subdomain (app.pregnancyplateplanner.com). See `INTEGRATION_STRATEGY.md` for details.

## Features

### Core Functionality
- **Smart Meal Planning**: AI-powered weekly meal plans following gestational diabetes guidelines (30-40% carbs, balanced proteins/fats)
- **Recipe Library**: 500+ curated recipes with detailed nutritional information and glycemic index ratings
- **Glucose Tracking**: Comprehensive blood glucose monitoring with pre/post-meal tracking
- **Nutrition Dashboard**: Daily macro/micronutrient tracking with visual progress indicators
- **Educational Hub**: Expert-reviewed articles, videos, and guides on managing gestational diabetes

### Technical Features
- Progressive Web App with offline support
- Real-time data synchronization
- Mobile-responsive design
- Secure authentication and data encryption
- Export functionality for healthcare providers

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
│   ├── (protected)/       # Protected routes with navigation
│   ├── auth/              # Authentication pages
│   ├── education/         # Public educational content
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   ├── ui/                # Core UI components
│   └── Navigation.tsx     # Main navigation component
├── lib/                   # Utility functions
│   └── env.ts            # Environment variable config
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
├── scripts/              # Utility scripts
│   └── scraper/          # Recipe scraping tools (future)
└── firebase/             # Firebase configuration (future)
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
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_PROJECT_ID=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
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

### Vercel (Recommended)
```bash
vercel --prod
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## Subscription Tiers

- **Free Tier**: 7-day meal plans, basic tracking, 10 saved recipes
- **Premium ($9.99/mo)**: Unlimited meal plans, advanced analytics, meal prep mode, unlimited recipes
- **Premium+ ($14.99/mo)**: All Premium features + grocery delivery integration, dietitian chat support

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