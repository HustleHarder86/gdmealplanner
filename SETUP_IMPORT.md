# Recipe Import Setup Guide

## Prerequisites

Before testing the import functionality, you need to configure your API keys in `.env.local`.

### 1. Copy your Vercel environment variables locally

Since your API keys are stored in Vercel, you need to copy them to `.env.local`:

```bash
# Edit .env.local and add:
SPOONACULAR_API_KEY=your_actual_api_key_here

# Firebase Client Config (from Vercel)
apiKey=your_value_from_vercel
authDomain=your_value_from_vercel
projectId=your_value_from_vercel
storageBucket=your_value_from_vercel
messagingSenderId=your_value_from_vercel
appId=your_value_from_vercel

# Firebase Admin Key (service account JSON)
FIREBASE_ADMIN_KEY={"type":"service_account",...entire JSON...}
```

### 2. Get your Firebase Admin Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the entire JSON content
6. Paste it as the value of `FIREBASE_ADMIN_KEY` in `.env.local`

## Testing Import Functionality

### Option 1: Using the Web Interface (Easiest)

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open your browser:
   ```
   http://localhost:3000/admin/import-recipes
   ```

3. You'll see:
   - Current library status
   - Import controls
   - Real-time results

### Option 2: Using the Test Script

1. Make sure the dev server is running:
   ```bash
   npm run dev
   ```

2. In another terminal, run:
   ```bash
   ./test-import-now.sh
   ```

### Option 3: Using curl directly

```bash
# Check status
curl http://localhost:3000/api/recipes/import-batch

# Import 5 breakfast recipes
curl -X POST http://localhost:3000/api/recipes/import-batch \
  -H "Content-Type: application/json" \
  -d '{
    "category": "breakfast",
    "count": 5
  }'
```

## Import Strategy

The system will import recipes matching gestational diabetes guidelines:
- **Breakfast**: Max 30g carbs
- **Lunch/Dinner**: Max 45g carbs
- **Snacks**: 15-20g carbs

## Troubleshooting

### "Spoonacular API key not configured"
- Make sure `SPOONACULAR_API_KEY` is in `.env.local`

### "Failed to initialize Firebase Admin"
- Make sure `FIREBASE_ADMIN_KEY` contains the complete service account JSON
- The JSON should start with `{"type":"service_account"...`

### "Import failed"
- Check the console for detailed error messages
- Verify your Spoonacular API quota hasn't been exceeded

## Next Steps

Once testing locally works:
1. Deploy to Vercel: `git push`
2. Use the production URL: `https://your-app.vercel.app/admin/import-recipes`
3. Import recipes in batches until you reach 600 total