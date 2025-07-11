# Local Development Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project created (free tier is fine)
- Spoonacular API key (optional, only for recipe import)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the `.env.local` file if you haven't already
2. Update with your actual credentials:

### Firebase Client Configuration

Get these from Firebase Console > Project Settings > General:

```env
# For local development, use the non-prefixed version
apiKey=your_actual_firebase_api_key
authDomain=your-project.firebaseapp.com
projectId=your-project-id
storageBucket=your-project.appspot.com
messagingSenderId=123456789
appId=1:123456789:web:abcdef
```

### Firebase Admin Configuration

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the ENTIRE JSON content and paste it as the value:

```env
FIREBASE_ADMIN_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### Spoonacular API (Optional)

Only needed if you want to test recipe import features:

```env
SPOONACULAR_API_KEY=your_actual_api_key_here
```

## Step 3: Set Up Firebase

### 3.1 Enable Authentication

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable Email/Password provider
4. Save

### 3.2 Set Up Firestore

1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Start in test mode (for development)
4. Choose your region
5. Create

### 3.3 Set Up Storage (Optional)

1. Go to Firebase Console > Storage
2. Click "Get started"
3. Start in test mode
4. Choose your region
5. Done

## Step 4: Configure Admin Access

To access admin features, you need to whitelist your email:

1. Create a new file at `src/lib/admin-whitelist.ts`:

```typescript
export const ADMIN_EMAILS = [
  'your-email@example.com',  // Add your email here
];
```

2. Or update the existing whitelist if it exists

## Step 5: Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 6: Test Core Features

### 1. Test Recipe Browsing (No Auth Required)
- Visit `/recipes`
- Should see 242 pre-loaded recipes
- Test filtering by category
- Click on recipes to see details

### 2. Test Authentication
- Visit `/signup` to create an account
- Use the email you whitelisted for admin access
- Verify you can login at `/login`

### 3. Test Admin Features
- Visit `/admin` (must be logged in with whitelisted email)
- Check recipe management at `/admin/recipes`
- Test recipe import at `/admin/recipes/import`

### 4. Test Meal Planning
- Visit `/meal-planner` (must be logged in)
- Generate a new meal plan
- Test meal swapping
- View shopping list

### 5. Test Glucose Tracking
- Visit `/tracking/glucose` (must be logged in)
- Add a glucose reading
- View the chart
- Check history and reports

## Troubleshooting

### Firebase Connection Issues

If you see Firebase errors:
1. Double-check all environment variables are correct
2. Ensure you've enabled the required Firebase services
3. Check Firebase Console for any security rule issues

### Recipe Loading Issues

If recipes don't load:
1. Check that `/public/data/recipes.json` exists
2. Clear browser cache and localStorage
3. Check browser console for errors

### Admin Access Issues

If you can't access admin features:
1. Ensure your email is in the admin whitelist
2. Log out and log back in after updating whitelist
3. Check that you're using the whitelisted email

### Build Errors

If you encounter TypeScript or build errors:
```bash
npm run typecheck  # Check for type errors
npm run lint       # Check for linting issues
npm run format     # Auto-fix formatting
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run sync-recipes` - Sync recipes from Firebase to local JSON

## Testing Checklist

- [ ] Can view recipes without login
- [ ] Can create account and login
- [ ] Can access admin panel (if whitelisted)
- [ ] Can generate meal plans
- [ ] Can track glucose readings
- [ ] Offline recipe viewing works
- [ ] All pages load without errors

## Need Help?

1. Check browser console for errors
2. Review `.env.local` configuration
3. Ensure Firebase services are enabled
4. Check network tab for failed requests