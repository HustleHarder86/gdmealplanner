#!/usr/bin/env npx tsx
/**
 * Find ALL duplicate recipes in Firebase by checking various ID fields
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function findAllDuplicates() {
  console.log("🔍 Finding ALL duplicate recipes in Firebase...\n");

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Fetch all recipes
    console.log("📥 Fetching all recipes from Firebase...");
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .get();

    console.log(`📊 Total documents: ${recipesSnapshot.size}`);

    // Track recipes by different ID types
    const bySpoonacularId = new Map<string, any[]>();
    const byDocId = new Map<string, any[]>();
    const byTitle = new Map<string, any[]>();

    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      const recipe = {
        docId: doc.id,
        spoonacularId: data.spoonacularId,
        title: data.title,
        category: data.category,
      };

      // Group by spoonacular ID
      if (data.spoonacularId) {
        const key = data.spoonacularId.toString();
        if (!bySpoonacularId.has(key)) {
          bySpoonacularId.set(key, []);
        }
        bySpoonacularId.get(key)!.push(recipe);
      }

      // Check if doc.id contains spoonacular ID
      if (doc.id.startsWith("spoonacular-")) {
        const spoonId = doc.id.replace("spoonacular-", "");
        const key = spoonId;
        if (!byDocId.has(key)) {
          byDocId.set(key, []);
        }
        byDocId.get(key)!.push(recipe);
      }

      // Group by title (to catch any title duplicates)
      const titleKey = data.title.toLowerCase().trim();
      if (!byTitle.has(titleKey)) {
        byTitle.set(titleKey, []);
      }
      byTitle.get(titleKey)!.push(recipe);
    });

    // Find duplicates by spoonacular ID
    console.log("\n🔍 Checking for duplicates by spoonacularId field:");
    let duplicatesBySpoonId = 0;
    const toDelete: string[] = [];
    
    bySpoonacularId.forEach((recipes, spoonId) => {
      if (recipes.length > 1) {
        duplicatesBySpoonId++;
        console.log(`\n   ${spoonId}: ${recipes.length} documents`);
        console.log(`   Title: ${recipes[0].title}`);
        recipes.forEach((r, index) => {
          console.log(`   ${index + 1}. Doc ID: ${r.docId}`);
          if (index > 0) {
            toDelete.push(r.docId);
          }
        });
      }
    });

    // Check for mismatched IDs
    console.log("\n🔍 Checking for recipes with same content but different IDs:");
    
    // Find recipes that might be duplicates based on document ID pattern
    const spoonacularIds = new Set<string>();
    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Extract spoonacular ID from various sources
      if (data.spoonacularId) {
        spoonacularIds.add(data.spoonacularId.toString());
      }
      if (doc.id.startsWith("spoonacular-")) {
        spoonacularIds.add(doc.id.replace("spoonacular-", ""));
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total documents: ${recipesSnapshot.size}`);
    console.log(`   Unique spoonacular IDs: ${spoonacularIds.size}`);
    console.log(`   Duplicates by spoonacularId: ${duplicatesBySpoonId}`);
    console.log(`   Documents to delete: ${toDelete.length}`);

    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} duplicate documents...`);
      
      // Delete in batches
      const batchSize = 10;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = adminDb().batch();
        const batchDocs = toDelete.slice(i, i + batchSize);
        
        batchDocs.forEach(docId => {
          batch.delete(adminDb().collection("recipes").doc(docId));
        });
        
        await batch.commit();
        console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toDelete.length / batchSize)}`);
      }
      
      console.log("\n✅ Duplicates removed!");
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the script
findAllDuplicates();