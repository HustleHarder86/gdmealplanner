# Vercel Firebase Admin Setup Guide

## Important: Vercel Environment Variable Format

Vercel's dashboard doesn't support multi-line environment variables. Your Firebase Admin service account JSON must be entered as a single line.

### Required Format

Your `FIREBASE_ADMIN_KEY` should be:
1. **One continuous line** (no line breaks)
2. **Valid JSON** with escaped newlines in the private key
3. **No outer quotes** around the entire JSON

### Example Structure (with placeholder values):

```
{"type":"service_account","project_id":"your-project-id","private_key_id":"your-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR\nPRIVATE\nKEY\nLINES\nHERE\n-----END PRIVATE KEY-----","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

### How to Format Your Key

1. Take your Firebase service account JSON
2. Remove all formatting (make it one line)
3. Ensure newlines in the private key are represented as `\n`
4. Remove any spaces after colons and commas

### Setting in Vercel

1. Go to your project's Environment Variables in Vercel
2. Add/Edit `FIREBASE_ADMIN_KEY`
3. Paste the single-line JSON
4. Save and redeploy

### Alternative: Use Vercel CLI

For better handling of the JSON:

```bash
vercel env add FIREBASE_ADMIN_KEY production
```

The CLI handles multi-line input better than the web dashboard.

## Troubleshooting

If you see errors about:
- "Bad control character" - Your JSON has real newlines instead of \n
- "Invalid JSON" - Check for extra quotes or invalid escaping
- "PERMISSION_DENIED" - Enable Firestore API in Google Cloud Console

Test your setup at: `/api/test-firebase`