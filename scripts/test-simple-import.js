#!/usr/bin/env node

const fetch = require("node-fetch");

async function testSimpleImport() {
  const baseUrl = "https://gdmealplanner.vercel.app";

  console.log("Testing simple import endpoint...\n");

  // First check if endpoint exists
  try {
    const checkResponse = await fetch(`${baseUrl}/api/recipes/import-simple`);
    if (checkResponse.status === 404) {
      console.log(
        "❌ Endpoint not deployed yet. Waiting for Vercel deployment...",
      );
      return;
    }

    const checkData = await checkResponse.json();
    console.log("✅ Endpoint available!");
    console.log(
      "Available queries:",
      JSON.stringify(checkData.availableQueries, null, 2),
    );
  } catch (error) {
    console.error("Error checking endpoint:", error.message);
    return;
  }

  // Test breakfast import
  console.log('\nTesting breakfast import with "eggs" query...');

  try {
    const response = await fetch(`${baseUrl}/api/recipes/import-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "breakfast",
        queryIndex: 0,
        count: 5,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("\n✅ Import successful!");
      console.log(`Query: "${data.import.query}"`);
      console.log(`Imported: ${data.import.imported} recipes`);
      console.log(`Rejected: ${data.import.rejected} recipes`);
      console.log(`Total library: ${data.library.total} recipes`);
      console.log("\nLibrary breakdown:");
      Object.entries(data.library.breakdown).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

      if (
        data.import.rejectedDetails &&
        data.import.rejectedDetails.length > 0
      ) {
        console.log("\nRejected recipes:");
        data.import.rejectedDetails.forEach((r) => {
          console.log(`  - ${r.title}: ${r.reason} (score: ${r.score})`);
        });
      }
    } else {
      console.log("❌ Import failed:", data.error);
    }
  } catch (error) {
    console.error("Error during import:", error.message);
  }
}

// Run the test
testSimpleImport().catch(console.error);
