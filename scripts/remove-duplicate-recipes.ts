#!/usr/bin/env npx tsx
/**
 * Remove duplicate recipes from the database
 * Keeps the first occurrence of each recipe
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function removeDuplicateRecipes() {
  console.log("🧹 Starting duplicate recipe cleanup...\n");

  try {
    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase Admin...");
    await initializeFirebaseAdmin();
    console.log("✅ Firebase Admin initialized");

    // Fetch all recipes
    console.log("\n📥 Fetching all recipes from Firebase...");
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .get();

    console.log(`📊 Total documents in database: ${recipesSnapshot.size}`);

    // Find duplicates
    const seenIds = new Set<string>();
    const duplicatesToDelete: string[] = [];
    const recipesById = new Map<string, any[]>();

    // Group recipes by their spoonacular ID
    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      const spoonacularId = data.spoonacularId || doc.id;
      
      if (!recipesById.has(spoonacularId)) {
        recipesById.set(spoonacularId, []);
      }
      recipesById.get(spoonacularId)!.push({
        docId: doc.id,
        data: data,
        createdAt: data.createdAt
      });
    });

    // Identify which documents to delete
    console.log("\n🔍 Identifying duplicates...");
    let duplicateCount = 0;
    
    recipesById.forEach((recipes, spoonacularId) => {
      if (recipes.length > 1) {
        duplicateCount++;
        console.log(`\n   Found ${recipes.length} copies of: ${recipes[0].data.title}`);
        console.log(`   Spoonacular ID: ${spoonacularId}`);
        
        // Sort by createdAt (keep the oldest) or by docId if no createdAt
        recipes.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return a.createdAt._seconds - b.createdAt._seconds;
          }
          return a.docId.localeCompare(b.docId);
        });
        
        // Keep the first one, delete the rest
        console.log(`   Keeping: ${recipes[0].docId}`);
        for (let i = 1; i < recipes.length; i++) {
          console.log(`   Deleting: ${recipes[i].docId}`);
          duplicatesToDelete.push(recipes[i].docId);
        }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total unique recipes: ${recipesById.size}`);
    console.log(`   Duplicate recipes found: ${duplicateCount}`);
    console.log(`   Documents to delete: ${duplicatesToDelete.length}`);

    if (duplicatesToDelete.length === 0) {
      console.log("\n✅ No duplicates found! Database is clean.");
      return;
    }

    // Delete duplicates
    console.log(`\n🗑️  Deleting ${duplicatesToDelete.length} duplicate documents...`);
    
    // Delete in batches of 10
    const batchSize = 10;
    for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
      const batch = adminDb().batch();
      const batchDocs = duplicatesToDelete.slice(i, i + batchSize);
      
      batchDocs.forEach(docId => {
        batch.delete(adminDb().collection("recipes").doc(docId));
      });
      
      await batch.commit();
      console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(duplicatesToDelete.length / batchSize)}`);
    }

    console.log("\n✅ Duplicates removed successfully!");

    // Verify final count
    const finalSnapshot = await adminDb()
      .collection("recipes")
      .count()
      .get();
    
    console.log(`\n📊 Final recipe count: ${finalSnapshot.data().count}`);
    console.log("   This should now match what you see in the app (455)");

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the cleanup
removeDuplicateRecipes();