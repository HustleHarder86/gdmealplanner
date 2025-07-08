import { NextResponse } from "next/server";
import { initializeFirebaseAdmin, adminDb } from "@/src/lib/firebase/admin";

export async function GET() {
  try {
    await initializeFirebaseAdmin();
    const db = adminDb();

    // Get all recipes
    const recipesSnapshot = await db.collection("recipes").get();

    const recipes = recipesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Also check importSessions to see what was imported
    const sessionsSnapshot = await db
      .collection("importSessions")
      .orderBy("startTime", "desc")
      .limit(5)
      .get();

    const sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      recipesCount: recipes.length,
      recipes: recipes.slice(0, 5), // First 5 recipes
      recentImportSessions: sessions,
      collections: {
        recipes: recipesSnapshot.size,
        importSessions: sessionsSnapshot.size,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to debug recipes",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
