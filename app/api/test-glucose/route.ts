import { NextResponse } from "next/server";
import { db } from "@/src/lib/firebase/client";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Create a test glucose reading
    const testReading = {
      userId: userId,
      value: 95 + Math.floor(Math.random() * 30), // Random value 95-125
      unit: "mg/dL",
      timestamp: Timestamp.fromDate(new Date()),
      mealAssociation: "fasting",
      notes: "Test reading from API endpoint",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log("[API] Attempting to save glucose reading:", testReading);

    // Try to save to Firestore
    const docRef = await addDoc(collection(db, "glucoseReadings"), testReading);
    
    console.log("[API] Successfully saved glucose reading with ID:", docRef.id);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      reading: {
        ...testReading,
        timestamp: testReading.timestamp.toDate().toISOString(),
        createdAt: testReading.createdAt.toDate().toISOString(),
        updatedAt: testReading.updatedAt.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error saving glucose reading:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to save glucose reading",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Test glucose API endpoint",
    usage: "POST with { userId: 'your-user-id' } to create a test reading"
  });
}