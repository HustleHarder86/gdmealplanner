# Vercel Environment Variables Setup

## Required Environment Variables

You need to add the following environment variables in your Vercel project settings:

### 1. Firebase Client SDK Variables (Public)
These are safe to expose in the browser and must be prefixed with `NEXT_PUBLIC_`:

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID

### 2. Keep Your Existing Variables
These are already working, so keep them as-is:

- `apiKey` - (keep this for backward compatibility)
- `authDomain` - (keep this for backward compatibility)
- `projectId` - (keep this for backward compatibility)
- `storageBucket` - (keep this for backward compatibility)
- `messagingSenderId` - (keep this for backward compatibility)
- `appId` - (keep this for backward compatibility)
- `FIREBASE_ADMIN_KEY` - Your Firebase Admin SDK key (JSON string)
- `SPOONACULAR_API_KEY` - Your Spoonacular API key

## How to Add in Vercel

1. Go to your project in Vercel Dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each `NEXT_PUBLIC_*` variable with the same values as your existing variables
5. Make sure all variables are available for all environments (Production, Preview, Development)
6. Save and redeploy

## Example Values

If your current `apiKey` variable has value `AIzaSyD...`, then:
- `NEXT_PUBLIC_FIREBASE_API_KEY` should also be `AIzaSyD...`

Do this for all 6 Firebase client variables.