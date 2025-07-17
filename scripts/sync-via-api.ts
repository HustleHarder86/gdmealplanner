#!/usr/bin/env npx tsx
/**
 * Sync recipes via API endpoint
 * This uses the same endpoint as the admin UI
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function syncViaAPI() {
  console.log("🔄 Syncing recipes via API...\n");

  try {
    // Call the sync API endpoint
    console.log("📡 Calling sync API endpoint...");
    const response = await fetch("http://localhost:3000/api/admin/sync-offline-data", {
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

    // Now download the synced data to local JSON files
    console.log("\n📥 Downloading synced data to local files...");
    
    const offlineDataResponse = await fetch("http://localhost:3000/api/recipes/offline-data");
    if (!offlineDataResponse.ok) {
      throw new Error(`Failed to fetch offline data: ${offlineDataResponse.status}`);
    }

    const offlineData = await offlineDataResponse.json();
    
    // Ensure directories exist
    const publicDataDir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }

    // Write the updated JSON files
    const fullJsonPath = path.join(publicDataDir, "recipes.json");
    fs.writeFileSync(fullJsonPath, JSON.stringify(offlineData.data, null, 2));
    console.log(`✅ Written recipes.json`);

    // Write minified version
    const minJsonPath = path.join(publicDataDir, "recipes.min.json");
    fs.writeFileSync(minJsonPath, JSON.stringify(offlineData.data));
    console.log(`✅ Written recipes.min.json`);

    // Show file sizes
    const fullSize = fs.statSync(fullJsonPath).size;
    const minSize = fs.statSync(minJsonPath).size;
    console.log(`\n📏 File sizes:`);
    console.log(`   recipes.json: ${(fullSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   recipes.min.json: ${(minSize / 1024 / 1024).toFixed(2)} MB`);

    console.log("\n✅ Sync completed successfully!");
    console.log("🎉 The 49 new recipes are now available in the offline library!");

  } catch (error) {
    console.error("\n❌ Error syncing recipes:", error);
    
    // If local API fails, suggest using the production endpoint
    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 Local server not running. You can:");
      console.log("   1. Start the dev server: npm run dev");
      console.log("   2. Or use the production sync at: https://gdmealplanner.vercel.app/admin/recipes");
      console.log("      and click the 'Sync Offline Data' button");
    }
  }
}

// Run the sync
syncViaAPI();