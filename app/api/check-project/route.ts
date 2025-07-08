import { NextResponse } from "next/server";

export async function GET() {
  // Check which project ID we're using
  const fromFirebaseAdminKey = process.env.FIREBASE_ADMIN_KEY
    ? (() => {
        try {
          const parsed = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
          return parsed.project_id;
        } catch {
          return "Error parsing FIREBASE_ADMIN_KEY";
        }
      })()
    : null;

  const results = {
    projectIdFromEnv: process.env.project_id,
    projectIdFromAdminKey: fromFirebaseAdminKey,
    firestoreEnableUrl: fromFirebaseAdminKey
      ? `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${fromFirebaseAdminKey}`
      : `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${process.env.project_id}`,
  };

  return NextResponse.json(results);
}
