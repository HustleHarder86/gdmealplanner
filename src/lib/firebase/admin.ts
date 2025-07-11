import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import type { ServiceAccount } from "firebase-admin/app";

// Initialize Firebase Admin SDK
const initializeAdmin = () => {
  if (getApps().length === 0) {
    // Check for service account credentials
    const serviceAccountKey = process.env.FIREBASE_ADMIN_KEY;

    if (serviceAccountKey) {
      // Initialize with service account (production)
      try {
        // Parse the JSON properly
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        // Verify required fields exist
        if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
          throw new Error(
            `Firebase Admin initialization failed - missing required fields: projectId=${!!serviceAccount.project_id}, clientEmail=${!!serviceAccount.client_email}, privateKey=${!!serviceAccount.private_key}`,
          );
        }

        // Initialize with the parsed service account
        initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
          }),
          projectId: serviceAccount.project_id,
          storageBucket: `${serviceAccount.project_id}.appspot.com`,
        });
        console.log("Firebase Admin initialized with service account");
      } catch (error) {
        console.error("Failed to parse Firebase service account:", error);
        console.error(
          "First 100 chars of key:",
          serviceAccountKey.substring(0, 100),
        );
        throw new Error(
          "Firebase Admin initialization failed - invalid service account JSON",
        );
      }
    } else {
      // Try to construct service account from individual environment variables
      const projectId = process.env.project_id;
      const privateKey = process.env.private_key;
      const clientEmail = process.env.client_email;
      const privateKeyId = process.env.private_key_id;
      const clientId = process.env.client_id;

      if (projectId && privateKey && clientEmail) {
        try {
          // Handle various private key formats
          let formattedPrivateKey = privateKey;

          // Remove surrounding quotes if present
          if (
            formattedPrivateKey.startsWith('"') &&
            formattedPrivateKey.endsWith('"')
          ) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1);
          }
          if (
            formattedPrivateKey.startsWith("'") &&
            formattedPrivateKey.endsWith("'")
          ) {
            formattedPrivateKey = formattedPrivateKey.slice(1, -1);
          }

          // Handle different newline formats
          if (!formattedPrivateKey.includes("\n")) {
            // No actual newlines, check for escaped ones
            if (formattedPrivateKey.includes("\\n")) {
              // Replace escaped newlines with actual newlines
              formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
            } else if (formattedPrivateKey.includes("\\\\n")) {
              // Handle double-escaped newlines
              formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");
            }
          }

          // Ensure proper formatting
          if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
            throw new Error("Private key missing BEGIN marker");
          }
          if (!formattedPrivateKey.includes("-----END PRIVATE KEY-----")) {
            throw new Error("Private key missing END marker");
          }

          // Log diagnostic info (safely)
          console.log("Private key format check:", {
            hasNewlines: formattedPrivateKey.includes("\n"),
            lineCount: formattedPrivateKey.split("\n").length,
            startsCorrectly: formattedPrivateKey.startsWith("-----BEGIN"),
            endsCorrectly: formattedPrivateKey.includes("-----END"),
          });

          // Build the service account object with required fields
          const serviceAccount = {
            projectId: projectId,
            privateKey: formattedPrivateKey,
            clientEmail: clientEmail,
          };

          initializeApp({
            credential: cert(serviceAccount),
            projectId: projectId,
            storageBucket: `${projectId}.appspot.com`,
          });
          console.log("Firebase Admin initialized with individual credentials");
        } catch (error) {
          console.error(
            "Failed to initialize with individual credentials:",
            error,
          );
          if (error instanceof Error) {
            throw new Error(
              `Firebase Admin initialization failed: ${error.message}`,
            );
          }
          throw new Error("Firebase Admin initialization failed");
        }
      } else {
        throw new Error(
          "Firebase Admin credentials not configured. Please provide either FIREBASE_ADMIN_KEY or individual credentials (project_id, private_key, client_email)",
        );
      }
    }
  }
};

// Export the initialize function
export const initializeFirebaseAdmin = initializeAdmin;

// Lazy initialization of admin services
let _adminDb: ReturnType<typeof getFirestore> | null = null;
let _adminAuth: ReturnType<typeof getAuth> | null = null;
let _adminStorage: ReturnType<typeof getStorage> | null = null;

export const adminDb = () => {
  if (!_adminDb) {
    initializeAdmin();
    _adminDb = getFirestore();
  }
  return _adminDb;
};

export const adminAuth = () => {
  if (!_adminAuth) {
    initializeAdmin();
    _adminAuth = getAuth();
  }
  return _adminAuth;
};

export const adminStorage = () => {
  if (!_adminStorage) {
    initializeAdmin();
    _adminStorage = getStorage();
  }
  return _adminStorage;
};

// Helper function to verify admin is initialized
export const verifyAdminInitialized = () => {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return true;
}; // Force redeploy: Sat Jul  5 20:18:17 EDT 2025
