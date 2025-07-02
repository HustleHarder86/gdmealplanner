# Firebase Console Setup Guide

Follow these steps to create and configure your Firebase project:

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Project name: `pregnancy-plate-planner` (or your preferred name)
4. Accept the terms and click **Continue**
5. **Disable Google Analytics** for now (you can enable later)
6. Click **Create Project**

## 2. Enable Authentication

1. In the Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on Email/Password
   - Toggle **Enable**
   - Toggle **Email link (passwordless sign-in)** OFF
   - Click **Save**

## 3. Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your region (choose closest to your users)
5. Click **Create**

## 4. Set Up Firebase Storage

1. Click **Storage** in the left sidebar
2. Click **Get started**
3. Choose **Start in production mode**
4. Select same region as Firestore
5. Click **Done**

## 5. Get Your Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps**
4. Click **Web icon** (</>) to add a web app
5. App nickname: `Pregnancy Plate Planner Web`
6. Check **"Also set up Firebase Hosting"**
7. Click **Register app**
8. Copy the configuration object

## 6. Update Your .env.local

Replace the values in your `.env.local` file with your Firebase config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 7. Deploy Security Rules

Install Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
firebase init
# Select: Firestore, Storage, Functions, Hosting
# Use existing project
# Accept default file names
# Choose "out" as public directory for Next.js
# Configure as single-page app: No
# Set up automatic builds: No
```

Update `.firebaserc` with your project ID:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 8. Enable Firestore Indexes

Deploy the indexes:
```bash
firebase deploy --only firestore:indexes
```

## 9. Test Your Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. Try creating an account at `/auth/signup`

4. Check Firebase Console:
   - **Authentication** → Users tab (should see your new user)
   - **Firestore Database** → Data tab (should see user document)

## Common Issues

### "Firebase: Error (auth/configuration-not-found)"
- Make sure all environment variables are correctly set in `.env.local`
- Restart your dev server after changing `.env.local`

### "Missing or insufficient permissions"
- Deploy your Firestore rules: `firebase deploy --only firestore:rules`
- Check that rules allow authenticated users to read/write their own data

### "The email address is badly formatted"
- Ensure you're entering a valid email format
- Check for extra spaces

## Next Steps

1. ✅ Authentication is now working
2. ✅ Users can sign up with pregnancy profiles
3. ✅ Protected routes are secured
4. Next: Deploy Recipe Scraper Agent to populate recipe database
5. Then: Build meal planning features

## Production Checklist

Before going live:
- [ ] Enable Firebase App Check
- [ ] Review and tighten security rules
- [ ] Enable Google Analytics
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure custom domain in Firebase Hosting
- [ ] Set up backup policies
- [ ] Enable Firebase Authentication email templates customization