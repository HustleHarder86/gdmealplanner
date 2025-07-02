# Firebase Setup Guide for Gestational Diabetes Meal Planner

## Project Structure

The Firebase configuration has been set up with the following structure:

```
/
├── firebase.json           # Firebase project configuration
├── .firebaserc            # Firebase project aliases
├── firestore.rules        # Security rules for Firestore
├── firestore.indexes.json # Composite indexes for Firestore
├── storage.rules          # Security rules for Storage
├── functions/             # Firebase Functions
│   ├── src/
│   │   └── index.ts      # Cloud Functions entry point
│   ├── package.json
│   └── tsconfig.json
└── src/
    ├── lib/
    │   ├── firebase.ts          # Firebase initialization
    │   ├── firebase-auth.ts     # Authentication helpers
    │   ├── firebase-helpers.ts  # Firestore helpers
    │   └── firebase-storage.ts  # Storage helpers
    ├── types/
    │   └── firebase.ts          # TypeScript types
    └── contexts/
        └── AuthContext.tsx      # React Auth Context

```

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enable Google Analytics (optional)

### 2. Enable Firebase Services

In your Firebase project:

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode (we have security rules)
   - Choose your preferred location

3. **Storage**
   - Go to Storage
   - Click "Get started"
   - Start in production mode (we have security rules)

4. **Functions** (optional)
   - Requires the Blaze (pay-as-you-go) plan
   - Go to Functions
   - Click "Get started"

### 3. Get Your Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app with a nickname
5. Copy the configuration object

### 4. Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase configuration values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 5. Update Project ID

Update the `.firebaserc` file with your project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 6. Deploy Firebase Rules and Functions

Install Firebase CLI if you haven't already:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

Deploy Firestore rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Deploy Storage rules:

```bash
firebase deploy --only storage:rules
```

Deploy Functions (optional, requires Blaze plan):

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 7. Initialize the App in Your Next.js Project

The Firebase SDK is already configured in `/src/lib/firebase.ts`. To use it in your app:

1. Wrap your app with the AuthProvider:

```tsx
// app/layout.tsx or pages/_app.tsx
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

2. Use Firebase in your components:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { signInWithEmail } from '@/lib/firebase-auth';

function LoginComponent() {
  const { firebaseUser, userData } = useAuth();
  
  // Your component logic
}
```

## Firebase Emulators (Development)

To use Firebase emulators for local development:

1. Set up emulators:

```bash
firebase init emulators
```

2. Select the emulators you want to use (Firestore, Auth, Storage, Functions)

3. Start emulators:

```bash
firebase emulators:start
```

4. Set the environment variable in `.env.local`:

```
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
```

## Database Collections

The following collections are configured:

1. **users** - User profiles and settings
2. **recipes** - Recipe data with nutrition information
3. **mealPlans** - Weekly meal plans for users
4. **glucoseReadings** - Blood glucose measurements
5. **nutritionLogs** - Daily nutrition tracking

## Security Rules

Security rules ensure:
- Users can only access their own data
- Public recipes are accessible to all authenticated users
- Proper validation for all document fields
- Image uploads are restricted to authenticated users

## Cloud Functions

Three example functions are included:
1. **onUserCreated** - Creates user profile when account is created
2. **updateRecipeStats** - Calculates recipe ratings
3. **cleanupTempStorage** - Scheduled cleanup of temporary files

## Next Steps

1. Install necessary npm packages in your Next.js project:

```bash
npm install firebase
```

2. Start building your components using the provided helpers
3. Customize the security rules as needed
4. Add more Cloud Functions for backend logic
5. Set up Firebase Hosting if you want to deploy there