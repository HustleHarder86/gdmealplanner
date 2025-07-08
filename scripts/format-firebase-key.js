#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("Firebase Admin Key Formatter\n");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(
    "Usage: node format-firebase-key.js <path-to-service-account-json>",
  );
  console.log(
    "\nThis will output the formatted key to add to your .env.local file",
  );
  process.exit(1);
}

const jsonPath = args[0];

try {
  // Read the JSON file
  const jsonContent = fs.readFileSync(jsonPath, "utf8");

  // Parse to validate it's valid JSON
  const parsed = JSON.parse(jsonContent);

  // Check required fields
  const requiredFields = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
  ];
  const missingFields = requiredFields.filter((field) => !parsed[field]);

  if (missingFields.length > 0) {
    console.error("❌ Missing required fields:", missingFields.join(", "));
    process.exit(1);
  }

  // Convert to single line
  const singleLine = JSON.stringify(parsed);

  console.log("✅ Valid service account JSON detected");
  console.log(`Project ID: ${parsed.project_id}`);
  console.log(`Client Email: ${parsed.client_email}`);
  console.log("\n📋 Copy this line to your .env.local file:\n");
  console.log(`FIREBASE_ADMIN_KEY=${singleLine}`);
  console.log("\n✨ Done! Paste the above line into your .env.local file");
} catch (error) {
  console.error("❌ Error:", error.message);
  if (error.code === "ENOENT") {
    console.error("File not found:", jsonPath);
  } else if (error instanceof SyntaxError) {
    console.error("Invalid JSON file");
  }
  process.exit(1);
}
