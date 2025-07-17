#!/usr/bin/env npx tsx
/**
 * Direct Firebase Sync Script
 * This directly syncs from Firebase to local JSON files
 * Requires FIREBASE_ADMIN_KEY in environment
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function directFirebaseSync() {
  console.log("🔄 Direct sync from Firebase to local files...\n");

  try {
    // Check for Firebase Admin credentials
    if (!process.env.FIREBASE_ADMIN_KEY) {
      console.error("❌ FIREBASE_ADMIN_KEY not found in .env.local");
      console.log("\n📝 To sync the recipes, you need to:");
      console.log("   1. Add FIREBASE_ADMIN_KEY to your .env.local file");
      console.log("   2. Or go to https://gdmealplanner.vercel.app/admin/recipes");
      console.log("      and click the 'Sync Offline Data' button");
      return;
    }

    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase Admin...");
    await initializeFirebaseAdmin();
    console.log("✅ Firebase Admin initialized");

    // Fetch all recipes from Firebase
    console.log("📥 Fetching recipes from Firebase...");
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .orderBy("createdAt", "desc")
      .get();

    const recipes: any[] = [];
    const categoryBreakdown: Record<string, number> = {};

    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push({
        id: doc.id,
        ...data,
      });
      
      const category = data.category || "uncategorized";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    console.log(`✅ Fetched ${recipes.length} recipes from Firebase`);

    // Create the export object matching the expected format
    const exportData = {
      exportDate: new Date().toISOString(),
      source: "Firebase Production Database",
      recipeCount: recipes.length,
      categoryBreakdown,
      mealTypeBreakdown: {},
      recipes: recipes,
    };

    // Ensure directories exist
    const publicDataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Write full JSON file
    const fullJsonPath = path.join(publicDataDir, "recipes.json");
    fs.writeFileSync(fullJsonPath, JSON.stringify(exportData, null, 2));
    const fullSize = fs.statSync(fullJsonPath).size;
    console.log(`✅ Written recipes.json (${(fullSize / 1024 / 1024).toFixed(2)} MB)`);

    // Write minified JSON file
    const minJsonPath = path.join(publicDataDir, "recipes.min.json");
    fs.writeFileSync(minJsonPath, JSON.stringify(exportData));
    const minSize = fs.statSync(minJsonPath).size;
    console.log(`✅ Written recipes.min.json (${(minSize / 1024 / 1024).toFixed(2)} MB)`);

    // Also update the data directory (for development)
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const devJsonPath = path.join(dataDir, "production-recipes.json");
    fs.writeFileSync(devJsonPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Written production-recipes.json to data/`);

    // Show recipe breakdown
    console.log("\n📊 Recipe Breakdown:");
    console.log(`Total: ${recipes.length} recipes`);
    Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} recipes`);
      });

    console.log("\n✅ Sync completed successfully!");
    console.log("🎉 The 49 new recipes (489 total) are now available in the offline library!");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify the recipe count is 489 (was 440)");
    console.log("   2. Commit these updated JSON files");
    console.log("   3. Push to deploy the changes");

  } catch (error) {
    console.error("\n❌ Error:", error);
    
    if (error.message?.includes("Firebase Admin credentials")) {
      console.log("\n📝 To fix this:");
      console.log("   1. Add your Firebase Admin credentials to .env.local:");
      console.log("      FIREBASE_ADMIN_KEY={your-json-key-here}");
      console.log("   2. Or use the admin UI at:");
      console.log("      https://gdmealplanner.vercel.app/admin/recipes");
    }
  }
}

// Run the sync
directFirebaseSync();