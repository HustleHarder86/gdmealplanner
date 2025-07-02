import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

// Example function - onCreate trigger for new users
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  
  // Create initial user document in Firestore
  await admin.firestore().collection("users").doc(uid).set({
    email: email || "",
    displayName: displayName || "",
    subscriptionStatus: "free",
    settings: {
      targetGlucoseRange: {
        min: 70,
        max: 140,
      },
      mealReminders: true,
      glucoseReminders: true,
      notificationPreferences: {
        email: true,
        push: true,
      },
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  functions.logger.info("New user created", { uid, email });
});

// Example function - Calculate recipe nutrition aggregates
export const updateRecipeStats = functions.firestore
  .document("recipes/{recipeId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if ratings have changed
    if (JSON.stringify(newData.ratings) !== JSON.stringify(previousData.ratings)) {
      const ratings = newData.ratings || [];
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + r.value, 0) / ratings.length
        : 0;
      
      await change.after.ref.update({
        averageRating,
        totalRatings: ratings.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

// Example function - Scheduled function to clean up old temporary files
export const cleanupTempStorage = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: "temp/" });
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const deletePromises = files
      .filter((file) => {
        const createdTime = new Date(file.metadata.timeCreated).getTime();
        return createdTime < twentyFourHoursAgo;
      })
      .map((file) => file.delete());
    
    await Promise.all(deletePromises);
    
    functions.logger.info(`Deleted ${deletePromises.length} temporary files`);
  });