# Firebase Admin Setup for Vercel

## Getting Your Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the downloaded JSON file

## Adding to Vercel Environment Variables

### Method 1: Full Service Account JSON (Recommended)

1. Open the downloaded JSON file
2. Copy the entire content
3. In Vercel Dashboard:
   - Go to Settings → Environment Variables
   - Add new variable:
     - Name: `FIREBASE_ADMIN_KEY`
     - Value: Paste the entire JSON content
     - Environment: Production, Preview, Development

### Method 2: Individual Variables

If you prefer not to store the full JSON, extract these fields from your service account JSON:

1. `projectId` - Already set in Vercel
2. Add these new variables:
   - `FIREBASE_PRIVATE_KEY`: The private_key field (include the quotes and newlines)
   - `FIREBASE_CLIENT_EMAIL`: The client_email field

## Important Notes

- The private key contains `\n` characters - these must be preserved
- In Vercel, you can paste the private key directly with newlines
- Make sure there are no extra spaces or quotes around the JSON

## Troubleshooting

If you get authentication errors:

1. **Check JSON validity**: Make sure the FIREBASE_ADMIN_KEY is valid JSON
2. **Check escaping**: Private key newlines should be actual newlines or `\n`
3. **Verify project ID**: Ensure the project_id in service account matches your Firebase project

## Example Service Account Structure

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "000000000000000000000",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
```