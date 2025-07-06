# Task: Fix Firebase Private Key Decoding Error

## Problem Analysis
The Firebase Admin SDK is initializing but failing to connect to Firestore with error:
- `error:1E08010C:DECODER routines::unsupported`
- This occurs when trying to make any Firestore queries
- Firebase Admin shows as "Initialized" but Firestore shows "Not connected"

## Root Cause
The private key in Vercel environment variables is likely:
1. Missing proper newline characters
2. Has escaped newlines that aren't being properly converted
3. Has extra quotes or formatting issues

## Debugging Plan

### Phase 1: Diagnose Private Key Format
- [ ] Create a diagnostic endpoint to check private key format
- [ ] Log the first/last few characters of the private key (safely)
- [ ] Check for common formatting issues

### Phase 2: Fix Private Key Handling
- [ ] Update the private key processing to handle multiple formats
- [ ] Add better error handling for key parsing
- [ ] Support both escaped and unescaped newlines

### Phase 3: Test and Verify
- [ ] Test the updated initialization
- [ ] Verify Firestore connection works
- [ ] Confirm recipe import functionality

## Implementation Steps

1. **Create Diagnostic Endpoint** - Check private key format without exposing it
2. **Update Firebase Admin Initialization** - Handle various private key formats
3. **Add Fallback Methods** - Try multiple parsing approaches
4. **Test Connection** - Verify Firestore queries work
5. **Deploy and Test** - Confirm import functionality works

## Expected Outcome
- Firebase Admin connects successfully to Firestore
- Recipe import functionality works
- Clear error messages if configuration issues persist