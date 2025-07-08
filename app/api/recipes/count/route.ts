import { NextResponse } from "next/server";
import { adminDb } from "@/src/lib/firebase/admin";

export async function GET() {
  try {
    const db = adminDb();
    const recipesCollection = db.collection("recipes");
    const snapshot = await recipesCollection.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting recipes:", error);
    // Return 0 if Firestore is not connected
    return NextResponse.json({
      count: 0,
      error: "Unable to connect to database",
    });
  }
}
