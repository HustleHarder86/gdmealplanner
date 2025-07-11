#!/usr/bin/env node

/**
 * Firebase Admin Key Format Helper
 * 
 * This script helps format the Firebase Admin service account key
 * for use in the .env.local file.
 * 
 * Usage:
 * 1. Download your Firebase service account JSON from Firebase Console
 * 2. Run: node scripts/firebase-key-helper.js path/to/serviceAccount.json
 * 3. Copy the output to your .env.local file as FIREBASE_ADMIN_KEY
 */

const fs = require('fs');
const path = require('path');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Usage: node scripts/firebase-key-helper.js <path-to-service-account-json>');
  console.error('\nExample: node scripts/firebase-key-helper.js ~/Downloads/serviceAccount.json');
  process.exit(1);
}

const filePath = process.argv[2];

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

try {
  // Read and parse the service account file
  const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Verify it has required fields
  const requiredFields = ['project_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    console.error(`Error: Service account JSON is missing required fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  // Convert to properly escaped JSON string for .env.local
  const envValue = JSON.stringify(serviceAccount);
  
  console.log('\n✅ Successfully formatted Firebase Admin key!');
  console.log('\nAdd this to your .env.local file:');
  console.log('=====================================');
  console.log('FIREBASE_ADMIN_KEY=' + envValue);
  console.log('=====================================');
  
  // Optionally save to a file
  const outputPath = path.join(path.dirname(filePath), 'firebase-admin-key-formatted.txt');
  fs.writeFileSync(outputPath, 'FIREBASE_ADMIN_KEY=' + envValue);
  console.log(`\n📄 Also saved to: ${outputPath}`);
  console.log('\n⚠️  Remember to delete the formatted file after copying to .env.local!');
  
} catch (error) {
  console.error('Error processing service account file:', error.message);
  process.exit(1);
}