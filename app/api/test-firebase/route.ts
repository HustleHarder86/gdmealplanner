import { NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";

export async function GET() {
  const results = {
    firebaseAdmin: "❌ Not initialized",
    firestore: "❌ Not connected",
    environment: {
      hasFirebaseAdminKey: !!process.env.FIREBASE_ADMIN_KEY,
      hasProjectId: !!process.env.project_id,
      hasPrivateKey: !!process.env.private_key,
      hasClientEmail: !!process.env.client_email,
      hasPrivateKeyId: !!process.env.private_key_id,
      hasClientId: !!process.env.client_id,
      hasSpoonacularKey: !!process.env.SPOONACULAR_API_KEY,
    },
    error: null as string | null,
  };

  try {
    // Test Firebase Admin initialization
    await initializeFirebaseAdmin();
    results.firebaseAdmin = "✅ Initialized";

    // Test Firestore connection
    const testCollection = adminDb().collection("_test");
    const testDoc = await testCollection.doc("connection-test").set({
      timestamp: new Date().toISOString(),
      test: true,
    });
    
    // Clean up test document
    await testCollection.doc("connection-test").delete();
    
    results.firestore = "✅ Connected and writable";
  } catch (error) {
    results.error = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json(results);
}