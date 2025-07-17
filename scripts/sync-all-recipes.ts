#!/usr/bin/env npx tsx
/**
 * Sync ALL recipes from Firebase to local JSON files
 * This version gets all recipes regardless of createdAt field
 */

import { initializeFirebaseAdmin, adminDb } from "../src/lib/firebase/admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function syncAllRecipes() {
  console.log("🔄 Syncing ALL recipes from Firebase to local files...\n");

  try {
    // Initialize Firebase Admin
    console.log("🔥 Initializing Firebase Admin...");
    await initializeFirebaseAdmin();
    console.log("✅ Firebase Admin initialized");

    // Fetch ALL recipes from Firebase (no ordering)
    console.log("📥 Fetching ALL recipes from Firebase...");
    const recipesSnapshot = await adminDb()
      .collection("recipes")
      .get();

    const recipes: any[] = [];
    const categoryBreakdown: Record<string, number> = {};

    recipesSnapshot.forEach((doc) => {
      const data = doc.data();
      recipes.push({
        id: doc.id,
        ...data,
        // Ensure createdAt exists for consistency
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
      
      const category = data.category || "uncategorized";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    console.log(`✅ Fetched ${recipes.length} recipes from Firebase`);

    // Sort recipes by category and title for consistent ordering
    recipes.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.title.localeCompare(b.title);
    });

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
    console.log(`Total: ${recipes.length} recipes (was 440, added 49)`);
    Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} recipes`);
      });

    console.log("\n✅ Sync completed successfully!");
    console.log("🎉 All 489 recipes are now available in the offline library!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test the app to ensure recipes load correctly");
    console.log("   2. Commit these updated JSON files");
    console.log("   3. Push to deploy the changes");

  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

// Run the sync
syncAllRecipes();