#!/usr/bin/env npx tsx
/**
 * Verify recipe count in Firebase
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function verifyRecipeCount() {
  console.log("🔍 Verifying recipe count in Firebase...\n");

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();
    
    // Method 1: Get all recipes without ordering
    console.log("Method 1: Getting all recipes without ordering...");
    const allRecipesSnapshot = await adminDb()
      .collection("recipes")
      .get();
    
    console.log(`   Total documents: ${allRecipesSnapshot.size}`);
    
    // Method 2: Count by category
    console.log("\nMethod 2: Counting by category...");
    const categories = ["breakfast", "lunch", "dinner", "snack"];
    let totalByCategory = 0;
    
    for (const category of categories) {
      const categorySnapshot = await adminDb()
        .collection("recipes")
        .where("category", "==", category)
        .get();
      console.log(`   ${category}: ${categorySnapshot.size}`);
      totalByCategory += categorySnapshot.size;
    }
    
    // Check for uncategorized
    const uncategorizedSnapshot = await adminDb()
      .collection("recipes")
      .where("category", "==", null)
      .get();
    if (uncategorizedSnapshot.size > 0) {
      console.log(`   uncategorized: ${uncategorizedSnapshot.size}`);
      totalByCategory += uncategorizedSnapshot.size;
    }
    
    console.log(`   Total by category: ${totalByCategory}`);
    
    // Method 3: Get recently added recipes
    console.log("\nMethod 3: Recent recipes (last 100)...");
    const recentSnapshot = await adminDb()
      .collection("recipes")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    
    console.log(`   Recent recipes: ${recentSnapshot.size}`);
    
    // Show some recent recipe titles
    console.log("\n📝 Sample of recent recipes:");
    let count = 0;
    recentSnapshot.forEach((doc) => {
      if (count < 5) {
        const data = doc.data();
        console.log(`   - ${data.title} (${data.category})`);
        count++;
      }
    });
    
    // Method 4: Check for recipes without createdAt
    console.log("\nMethod 4: Checking for recipes without createdAt field...");
    const noCreatedAtSnapshot = await adminDb()
      .collection("recipes")
      .get();
    
    let withCreatedAt = 0;
    let withoutCreatedAt = 0;
    
    noCreatedAtSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        withCreatedAt++;
      } else {
        withoutCreatedAt++;
      }
    });
    
    console.log(`   With createdAt: ${withCreatedAt}`);
    console.log(`   Without createdAt: ${withoutCreatedAt}`);
    
    // Final summary
    console.log("\n📊 Summary:");
    console.log(`   Total recipes in database: ${allRecipesSnapshot.size}`);
    console.log(`   Expected after import: 489 (440 + 49)`);
    console.log(`   Difference: ${489 - allRecipesSnapshot.size}`);
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run verification
verifyRecipeCount();