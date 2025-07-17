#!/usr/bin/env npx tsx
/**
 * Analyze recipe IDs to understand the duplicate issue
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function analyzeRecipeIds() {
  console.log("🔍 Analyzing recipe IDs...\n");

  try {
    // Initialize Firebase Admin
    await initializeFirebaseAdmin();

    // Fetch all recipes
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .get();

    console.log(`📊 Total documents: ${recipesSnapshot.size}`);

    // Analyze ID patterns
    const recipes: any[] = [];
    const idAnalysis = {
      hasSpoonacularId: 0,
      noSpoonacularId: 0,
      docIdIsSpoonacular: 0,
      docIdNotSpoonacular: 0,
      uniqueSpoonacularIds: new Set<string>(),
      duplicateSpoonacularIds: new Map<string, number>(),
    };

    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      const recipe = {
        docId: doc.id,
        spoonacularId: data.spoonacularId,
        title: data.title,
        category: data.category,
      };
      recipes.push(recipe);

      // Check spoonacularId field
      if (data.spoonacularId) {
        idAnalysis.hasSpoonacularId++;
        const spoonId = data.spoonacularId.toString();
        
        if (idAnalysis.uniqueSpoonacularIds.has(spoonId)) {
          idAnalysis.duplicateSpoonacularIds.set(
            spoonId, 
            (idAnalysis.duplicateSpoonacularIds.get(spoonId) || 1) + 1
          );
        } else {
          idAnalysis.uniqueSpoonacularIds.add(spoonId);
        }
      } else {
        idAnalysis.noSpoonacularId++;
      }

      // Check document ID pattern
      if (doc.id.startsWith("spoonacular-")) {
        idAnalysis.docIdIsSpoonacular++;
      } else {
        idAnalysis.docIdNotSpoonacular++;
      }
    });

    console.log("\n📊 ID Analysis:");
    console.log(`   Has spoonacularId field: ${idAnalysis.hasSpoonacularId}`);
    console.log(`   No spoonacularId field: ${idAnalysis.noSpoonacularId}`);
    console.log(`   Doc ID starts with 'spoonacular-': ${idAnalysis.docIdIsSpoonacular}`);
    console.log(`   Doc ID doesn't start with 'spoonacular-': ${idAnalysis.docIdNotSpoonacular}`);
    console.log(`   Unique spoonacular IDs: ${idAnalysis.uniqueSpoonacularIds.size}`);

    // Show recipes without spoonacularId
    if (idAnalysis.noSpoonacularId > 0) {
      console.log("\n📝 Recipes without spoonacularId field:");
      recipes
        .filter(r => !r.spoonacularId)
        .slice(0, 10)
        .forEach(r => {
          console.log(`   - ${r.docId}: ${r.title}`);
        });
    }

    // Find the actual duplicates
    console.log("\n🔍 Finding actual duplicates...");
    const seenIds = new Set<string>();
    const duplicates: string[] = [];

    recipes.forEach(recipe => {
      // Create a unique key from either spoonacularId or docId
      let uniqueKey = "";
      
      if (recipe.spoonacularId) {
        uniqueKey = `spoonacular-${recipe.spoonacularId}`;
      } else if (recipe.docId.startsWith("spoonacular-")) {
        uniqueKey = recipe.docId;
      } else {
        // For non-spoonacular recipes, use the docId as is
        uniqueKey = recipe.docId;
      }

      if (seenIds.has(uniqueKey)) {
        duplicates.push(recipe.docId);
        console.log(`   Duplicate found: ${recipe.title} (${recipe.docId})`);
      } else {
        seenIds.add(uniqueKey);
      }
    });

    console.log(`\n📊 Final Summary:`);
    console.log(`   Total documents: ${recipesSnapshot.size}`);
    console.log(`   Unique recipes: ${seenIds.size}`);
    console.log(`   Duplicates to remove: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicates.length} duplicate documents...`);
      
      // Delete in batches
      const batchSize = 10;
      for (let i = 0; i < duplicates.length; i += batchSize) {
        const batch = adminDb().batch();
        const batchDocs = duplicates.slice(i, i + batchSize);
        
        batchDocs.forEach(docId => {
          batch.delete(adminDb().collection("recipes").doc(docId));
        });
        
        await batch.commit();
        console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(duplicates.length / batchSize)}`);
      }
      
      console.log("\n✅ Duplicates removed!");
      
      // Verify final count
      const finalCount = await adminDb().collection("recipes").count().get();
      console.log(`\n📊 Final recipe count in Firebase: ${finalCount.data().count}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the analysis
analyzeRecipeIds();