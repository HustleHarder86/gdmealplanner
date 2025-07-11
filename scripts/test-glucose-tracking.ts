/**
 * Script to test glucose tracking with sample data
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { GlucoseService } from "../src/services/glucose/glucose-service";
import { MealAssociation } from "../src/types/glucose";
import { subDays, setHours, setMinutes } from "date-fns";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Sample data generator
const generateSampleData = (userId: string, days: number = 7) => {
  const readings = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = subDays(today, dayOffset);

    // Fasting reading
    readings.push({
      userId,
      value: 85 + Math.random() * 15, // 85-100 mg/dL
      unit: "mg/dL" as const,
      timestamp: setMinutes(setHours(date, 7), 0),
      mealAssociation: "fasting" as MealAssociation,
      notes: "Before breakfast",
    });

    // Post-breakfast
    readings.push({
      userId,
      value: 120 + Math.random() * 30, // 120-150 mg/dL
      unit: "mg/dL" as const,
      timestamp: setMinutes(setHours(date, 9), 30),
      mealAssociation: "post-breakfast-2hr" as MealAssociation,
      notes: "After eggs and toast",
    });

    // Post-lunch
    readings.push({
      userId,
      value: 115 + Math.random() * 25, // 115-140 mg/dL
      unit: "mg/dL" as const,
      timestamp: setMinutes(setHours(date, 14), 0),
      mealAssociation: "post-lunch-2hr" as MealAssociation,
      notes: "After salad with chicken",
    });

    // Post-dinner
    readings.push({
      userId,
      value: 118 + Math.random() * 27, // 118-145 mg/dL
      unit: "mg/dL" as const,
      timestamp: setMinutes(setHours(date, 19), 30),
      mealAssociation: "post-dinner-2hr" as MealAssociation,
      notes: "After balanced meal",
    });

    // Bedtime
    readings.push({
      userId,
      value: 95 + Math.random() * 20, // 95-115 mg/dL
      unit: "mg/dL" as const,
      timestamp: setMinutes(setHours(date, 22), 0),
      mealAssociation: "bedtime" as MealAssociation,
      notes: "Before bed",
    });
  }

  return readings;
};

// Main function
const testGlucoseTracking = async () => {
  try {
    console.log("Testing glucose tracking with sample data...\n");

    // Sign in with test user
    const email = "test@example.com"; // Replace with your test user
    const password = "testpassword"; // Replace with your test password

    console.log("Signing in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    console.log(`Signed in as user: ${userId}\n`);

    // Generate sample data
    console.log("Generating sample data for 7 days...");
    const sampleReadings = generateSampleData(userId, 7);
    console.log(`Generated ${sampleReadings.length} readings\n`);

    // Import sample data
    console.log("Importing sample data...");
    await GlucoseService.bulkImportReadings(sampleReadings);
    console.log("Sample data imported successfully!\n");

    // Test retrieving data
    console.log("Testing data retrieval...");
    
    // Get today's readings
    const todayReadings = await GlucoseService.getTodayReadings(userId);
    console.log(`Today's readings: ${todayReadings.length} entries`);

    // Get week statistics
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    const stats = await GlucoseService.calculateStatistics(
      userId,
      startDate,
      endDate,
      "mg/dL"
    );
    console.log("\nWeek statistics:");
    console.log(`- Average: ${stats.average.toFixed(1)} mg/dL`);
    console.log(`- Time in range: ${stats.timeInRange.toFixed(1)}%`);
    console.log(`- Total readings: ${stats.readingsCount}`);
    console.log(`- High readings: ${stats.highReadings}`);
    console.log(`- Low readings: ${stats.lowReadings}`);

    // Identify patterns
    const patterns = await GlucoseService.identifyPatterns(userId, 7);
    console.log(`\nIdentified ${patterns.length} patterns`);
    patterns.forEach((pattern) => {
      console.log(`- ${pattern.type} pattern at ${pattern.mealAssociation}: ${pattern.recommendation}`);
    });

    console.log("\n✅ Glucose tracking test completed successfully!");
    console.log("You can now visit the glucose tracking page to see the data.");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit();
  }
};

// Run the test
testGlucoseTracking();