#!/usr/bin/env node

async function testImportStatus() {
  const baseUrl = "https://gdmealplanner.vercel.app";

  console.log("🧪 Testing Recipe Import System\n");

  // 1. Test Firebase connection
  console.log("1️⃣ Testing Firebase connection...");
  try {
    const firebaseTest = await fetch(`${baseUrl}/api/test-firebase`);
    const firebaseResult = await firebaseTest.json();
    console.log("   Firebase Admin:", firebaseResult.firebaseAdmin);
    console.log("   Firestore:", firebaseResult.firestore);
    if (firebaseResult.error) {
      console.log("   ❌ Error:", firebaseResult.error);
    }
  } catch (error) {
    console.log("   ❌ Failed to test Firebase:", error);
  }

  // 2. Check current recipe status
  console.log("\n2️⃣ Checking current recipe library...");
  try {
    const statusResponse = await fetch(`${baseUrl}/api/recipes/import-batch`);
    const status = await statusResponse.json();

    if (status.library) {
      console.log(`   Total Recipes: ${status.library.total}`);
      console.log(`   Progress: ${status.library.percentComplete}% complete`);
      console.log("   Breakdown:");
      console.log(
        `     - Breakfast: ${status.library.breakdown.breakfast || 0}`,
      );
      console.log(`     - Lunch: ${status.library.breakdown.lunch || 0}`);
      console.log(`     - Dinner: ${status.library.breakdown.dinner || 0}`);
      console.log(`     - Snack: ${status.library.breakdown.snack || 0}`);
    } else if (status.error) {
      console.log("   ❌ Error:", status.error);
      if (status.details) console.log("   Details:", status.details);
    }
  } catch (error) {
    console.log("   ❌ Failed to check status:", error);
  }

  // 3. Test small import
  console.log("\n3️⃣ Testing import of 3 breakfast recipes...");
  try {
    const importResponse = await fetch(`${baseUrl}/api/recipes/import-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "breakfast",
        count: 3,
      }),
    });

    const result = await importResponse.json();

    if (result.success) {
      console.log("   ✅ Import successful!");
      console.log(`   Imported: ${result.import.imported} recipes`);
      console.log(`   Processed: ${result.import.processed} recipes`);
      console.log(`   Rejected: ${result.import.rejected} recipes`);
      console.log(`   New Total: ${result.library.total} recipes`);
    } else if (result.error) {
      console.log("   ❌ Import failed:", result.error);
      if (result.details) console.log("   Details:", result.details);
    }
  } catch (error) {
    console.log("   ❌ Failed to import:", error);
  }

  console.log("\n✅ Test complete!");
  console.log("\n📝 Next steps:");
  console.log("   1. Check Firebase Console > Firestore > recipes collection");
  console.log("   2. Use the web interface at /admin/import-recipes");
  console.log("   3. Import more recipes in larger batches (10-20 at a time)");
}

// Run the test
testImportStatus().catch(console.error);
