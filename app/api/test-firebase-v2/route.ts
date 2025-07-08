import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export async function GET() {
  try {
    const serviceAccountKey = process.env.FIREBASE_ADMIN_KEY;

    if (!serviceAccountKey) {
      return NextResponse.json({ error: "FIREBASE_ADMIN_KEY not found" });
    }

    // Log what we received
    console.log(
      "Raw key first 100 chars:",
      serviceAccountKey.substring(0, 100),
    );

    // Try to clean and parse the key
    let cleanedKey = serviceAccountKey.trim();

    // Check if the entire JSON is escaped
    if (cleanedKey.includes("\\n") || cleanedKey.includes('\\"')) {
      console.log("Found escaped characters, cleaning...");

      // Replace all escaped characters
      cleanedKey = cleanedKey
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }

    // Remove outer quotes if present
    if (
      (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) ||
      (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))
    ) {
      cleanedKey = cleanedKey.slice(1, -1);
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(cleanedKey);
    } catch (parseError) {
      // If parsing still fails, try one more approach
      console.log("Initial parse failed, trying alternative approach...");

      // Sometimes Vercel double-escapes things
      const doubleUnescaped = cleanedKey
        .replace(/\\\\n/g, "\n")
        .replace(/\\\\"/g, '"');

      serviceAccount = JSON.parse(doubleUnescaped);
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    // Test Firestore connection
    const db = getFirestore();
    const testDoc = await db.collection("test").doc("connection").get();

    return NextResponse.json({
      success: true,
      firebaseAdmin: "✅ Initialized",
      firestore: "✅ Connected",
      projectId: serviceAccount.project_id,
      testDocExists: testDoc.exists,
    });
  } catch (error) {
    console.error("Firebase test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
