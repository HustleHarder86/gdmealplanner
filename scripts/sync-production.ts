#!/usr/bin/env npx tsx
/**
 * Sync recipes from production Vercel deployment
 */

import * as fs from "fs";
import * as path from "path";

async function syncFromProduction() {
  console.log("🔄 Syncing recipes from production...\n");

  try {
    // Use the production Vercel URL
    const productionUrl = "https://gdmealplanner.vercel.app";
    
    console.log("📡 Calling production sync API endpoint...");
    const response = await fetch(`${productionUrl}/api/admin/sync-offline-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Sync API response:", result.message);
    console.log(`📊 Total recipes synced: ${result.recipeCount}`);
    
    if (result.categoryBreakdown) {
      console.log("\n📂 Category breakdown:");
      Object.entries(result.categoryBreakdown).forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    }

    // Now download the synced data
    console.log("\n📥 Downloading synced data from production...");
    
    const dataResponse = await fetch(`${productionUrl}/data/recipes.json`);
    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch recipe data: ${dataResponse.status}`);
    }

    const recipeData = await dataResponse.json();
    
    // Ensure directories exist
    const publicDataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Write the updated JSON files
    const fullJsonPath = path.join(publicDataDir, "recipes.json");
    fs.writeFileSync(fullJsonPath, JSON.stringify(recipeData, null, 2));
    console.log(`✅ Written recipes.json`);

    // Write minified version
    const minJsonPath = path.join(publicDataDir, "recipes.min.json");
    fs.writeFileSync(minJsonPath, JSON.stringify(recipeData));
    console.log(`✅ Written recipes.min.json`);

    // Show results
    console.log(`\n📊 Updated recipe count: ${recipeData.recipeCount}`);
    console.log("📂 Category breakdown:");
    Object.entries(recipeData.categoryBreakdown).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    // Show file sizes
    const fullSize = fs.statSync(fullJsonPath).size;
    const minSize = fs.statSync(minJsonPath).size;
    console.log(`\n📏 File sizes:`);
    console.log(`   recipes.json: ${(fullSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   recipes.min.json: ${(minSize / 1024 / 1024).toFixed(2)} MB`);

    console.log("\n✅ Sync completed successfully!");
    console.log("🎉 The 49 new recipes are now available in the offline library!");
    console.log("\n📝 Next steps:");
    console.log("   1. Commit these updated JSON files");
    console.log("   2. Push to deploy the changes");

  } catch (error) {
    console.error("\n❌ Error syncing recipes:", error);
    console.log("\n💡 Alternative: Go to https://gdmealplanner.vercel.app/admin/recipes");
    console.log("   and click the 'Sync Offline Data' button manually");
  }
}

// Run the sync
syncFromProduction();