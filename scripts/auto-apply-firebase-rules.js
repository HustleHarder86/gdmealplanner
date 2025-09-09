/**
 * Automatically apply Firebase security rules
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Parse the service account key
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gd-meal-planner'
  });
}

async function applyFirestoreRules() {
  try {
    console.log('📋 Applying Firestore Security Rules...\n');
    
    // Read the rules file
    const rulesPath = path.join(__dirname, '..', 'firebase-rules.txt');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    // Note: The Admin SDK doesn't directly support updating security rules
    // We need to use the Firebase CLI or REST API for this
    console.log('⚠️  Note: Security rules must be applied via Firebase Console or CLI\n');
    
    // However, we can test if we can access Firestore with admin privileges
    console.log('🔍 Testing Firestore Admin Access...');
    const db = admin.firestore();
    
    // Try to read from glucoseReadings collection
    const snapshot = await db.collection('glucoseReadings').limit(1).get();
    console.log(`✅ Admin access confirmed. Found ${snapshot.size} existing glucose readings.\n`);
    
    // Create a test document to verify write access
    console.log('📝 Creating test glucose reading with admin privileges...');
    const testDoc = {
      userId: 'test-admin-user',
      value: 100,
      unit: 'mg/dL',
      timestamp: admin.firestore.Timestamp.now(),
      mealAssociation: 'fasting',
      notes: 'Admin test - can be deleted',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };
    
    const docRef = await db.collection('glucoseReadings').add(testDoc);
    console.log(`✅ Test document created with ID: ${docRef.id}\n`);
    
    // Clean up test document
    await docRef.delete();
    console.log('🧹 Test document cleaned up.\n');
    
    // Check if rules need to be updated
    console.log('📋 MANUAL STEP REQUIRED:');
    console.log('========================');
    console.log('Please apply the security rules manually:');
    console.log('1. Go to: https://console.firebase.google.com/project/gd-meal-planner/firestore/rules');
    console.log('2. Replace the existing rules with the content from firebase-rules.txt');
    console.log('3. Click "Publish" to apply the changes\n');
    
    console.log('The rules ensure:');
    console.log('✓ Users can only read/write their own glucose readings');
    console.log('✓ Authentication is required for all operations');
    console.log('✓ Proper validation of required fields\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'permission-denied') {
      console.log('\n⚠️  This might mean the current rules are too restrictive.');
      console.log('Please update the rules manually in Firebase Console.');
    }
    return false;
  }
}

// Install Firebase CLI globally if needed
async function installFirebaseCLI() {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    console.log('🔧 Checking for Firebase CLI...');
    await execPromise('firebase --version');
    console.log('✅ Firebase CLI is installed\n');
    return true;
  } catch (error) {
    console.log('📦 Firebase CLI not found. Installing...');
    try {
      await execPromise('npm install -g firebase-tools');
      console.log('✅ Firebase CLI installed successfully\n');
      return true;
    } catch (installError) {
      console.log('⚠️  Could not install Firebase CLI automatically.');
      console.log('Please install manually: npm install -g firebase-tools\n');
      return false;
    }
  }
}

// Try to apply rules using Firebase CLI
async function applyRulesViaCLI() {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    // First, create a firestore.rules file
    const rulesPath = path.join(__dirname, '..', 'firebase-rules.txt');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    const firestoreRulesPath = path.join(__dirname, '..', 'firestore.rules');
    
    fs.writeFileSync(firestoreRulesPath, rulesContent);
    console.log('📄 Created firestore.rules file\n');
    
    // Check if firebase.json exists
    const firebaseJsonPath = path.join(__dirname, '..', 'firebase.json');
    if (!fs.existsSync(firebaseJsonPath)) {
      console.log('📝 Creating firebase.json configuration...');
      const firebaseConfig = {
        firestore: {
          rules: "firestore.rules"
        }
      };
      fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
      console.log('✅ Created firebase.json\n');
    }
    
    console.log('🚀 Attempting to deploy rules via Firebase CLI...');
    console.log('Note: This requires you to be logged in to Firebase CLI\n');
    
    const { stdout, stderr } = await execPromise('firebase deploy --only firestore:rules --project gd-meal-planner');
    console.log('✅ Rules deployed successfully!');
    console.log(stdout);
    return true;
  } catch (error) {
    console.log('⚠️  Could not deploy rules automatically.');
    console.log('Error:', error.message);
    console.log('\nPlease deploy manually using:');
    console.log('1. firebase login (if not already logged in)');
    console.log('2. firebase deploy --only firestore:rules --project gd-meal-planner\n');
    return false;
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('  FIREBASE RULES AUTO-APPLICATION TOOL  ');
  console.log('========================================\n');
  
  // Test admin access
  const adminSuccess = await applyFirestoreRules();
  
  if (adminSuccess) {
    // Try to install Firebase CLI and apply rules
    const cliInstalled = await installFirebaseCLI();
    if (cliInstalled) {
      await applyRulesViaCLI();
    }
  }
  
  console.log('\n✅ Setup process complete!');
  console.log('Next step: Test glucose tracking at http://localhost:3000/test-glucose');
}

main().catch(console.error);