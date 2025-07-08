#!/usr/bin/env node

// Test Firebase Admin configuration
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

console.log("Testing Firebase Admin Configuration...\n");

try {
  // Load environment variables
  require("dotenv").config({ path: ".env.local" });

  const adminKey = process.env.FIREBASE_ADMIN_KEY;

  if (!adminKey || adminKey === "paste_your_entire_service_account_json_here") {
    console.error("❌ FIREBASE_ADMIN_KEY not configured in .env.local");
    console.log("\nPlease follow these steps:");
    console.log("1. Download service account key from Firebase Console");
    console.log("2. Run: node scripts/format-firebase-key.js <path-to-json>");
    console.log("3. Copy the output to .env.local");
    process.exit(1);
  }

  // Parse the key
  const serviceAccount = JSON.parse(adminKey);

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  console.log("✅ Firebase Admin initialized successfully!");
  console.log(`Project ID: ${serviceAccount.project_id}`);
  console.log(`Client Email: ${serviceAccount.client_email}`);

  // Test Firestore connection
  const db = getFirestore();
  console.log("\nTesting Firestore connection...");

  db.collection("recipes")
    .limit(1)
    .get()
    .then((snapshot) => {
      console.log(`✅ Firestore connected! Found ${snapshot.size} recipe(s)`);
      console.log("\n🎉 Firebase Admin is properly configured!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Firestore connection failed:", error.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
