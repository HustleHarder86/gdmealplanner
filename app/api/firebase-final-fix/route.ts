import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export async function GET() {
  try {
    const rawKey = process.env.FIREBASE_ADMIN_KEY;

    if (!rawKey) {
      return NextResponse.json({ error: "FIREBASE_ADMIN_KEY not found" });
    }

    // Extract values manually using a more flexible approach
    const extractField = (fieldName: string): string | null => {
      // Match the field with flexible spacing and quotes
      const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, "s");
      const match = rawKey.match(pattern);
      return match ? match[1] : null;
    };

    // Extract the private key with special handling for multiline
    const privateKeyPattern =
      /"private_key"\s*:\s*"(-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----)"/;
    const privateKeyMatch = rawKey.match(privateKeyPattern);
    const privateKey = privateKeyMatch ? privateKeyMatch[1] : null;

    const projectId = extractField("project_id");
    const clientEmail = extractField("client_email");
    const privateKeyId = extractField("private_key_id");
    const clientId = extractField("client_id");

    console.log("Extracted fields:", {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey,
      privateKeyLength: privateKey?.length,
    });

    if (!projectId || !clientEmail || !privateKey) {
      return NextResponse.json({
        error: "Missing required fields",
        found: {
          projectId: projectId || "NOT FOUND",
          clientEmail: clientEmail || "NOT FOUND",
          privateKey: privateKey
            ? `Found (${privateKey.length} chars)`
            : "NOT FOUND",
        },
      });
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId: projectId,
      });
    }

    // Test Firestore connection
    const db = getFirestore();
    const testDoc = await db.collection("test").doc("connection").get();

    return NextResponse.json({
      success: true,
      firebaseAdmin: "✅ Initialized",
      firestore: "✅ Connected",
      projectId: projectId,
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
