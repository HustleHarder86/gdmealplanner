# Vercel Private Key Setup Guide

## Common Issues with Private Keys in Vercel

The Firebase private key is very sensitive to formatting. Here are the most common issues and solutions:

### Issue 1: Escaped Newlines

**Problem**: Vercel might show your private key with `\n` instead of actual line breaks.

**Solution**: When adding the private key to Vercel:
1. Copy the private key from your service account JSON
2. In Vercel, paste it WITHOUT quotes
3. The key should look like this:
   ```
   -----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7W8jYR6n4KYTK
   ... (many lines) ...
   -----END PRIVATE KEY-----
   ```

### Issue 2: Extra Quotes

**Problem**: The private key has quotes around it.

**Solution**: Remove any surrounding quotes when pasting into Vercel.

### Issue 3: Single Line Format

**Problem**: The entire key is on one line with `\n` characters.

**Solution**: 
1. Copy the key to a text editor
2. Replace all `\n` with actual line breaks
3. Paste the multi-line version into Vercel

## How to Add Private Key to Vercel Correctly

1. **Get your service account JSON** from Firebase Console

2. **Extract the private key** - it's the value of the "private_key" field

3. **Format it properly**:
   - Should start with `-----BEGIN PRIVATE KEY-----`
   - Should have multiple lines (usually 25-30)
   - Should end with `-----END PRIVATE KEY-----`
   - NO quotes around it
   - NO escaped newlines (`\n`)

4. **In Vercel Environment Variables**:
   - Name: `private_key`
   - Value: Paste the formatted key
   - Use the "Plaintext" tab, not "JSON"

## Testing Your Setup

After adding the private key:

1. Visit: `https://your-app.vercel.app/api/debug-firebase`
2. Check the diagnostics:
   - `hasNewlines` should be `true`
   - `lineCount` should be > 20
   - `startsWithBegin` should be `true`
   - `endsWithEnd` should be `true`

## Alternative: Use Full Service Account JSON

If the individual fields are problematic, use the full JSON:

1. Copy your entire service account JSON
2. Add to Vercel as `FIREBASE_ADMIN_KEY`
3. This bypasses individual field issues