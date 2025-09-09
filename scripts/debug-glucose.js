/**
 * Debug script to test glucose tracking directly
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, Timestamp, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  projectId: firebaseConfig.projectId,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testGlucoseTracking() {
  try {
    // Test with a known test user (you'll need to replace with actual credentials)
    const email = 'test@example.com'; // Replace with actual test email
    const password = 'testpassword'; // Replace with actual test password
    
    console.log('\n1. Attempting to sign in...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Signed in successfully as:', userCredential.user.email);
      console.log('   User ID:', userCredential.user.uid);
      
      const userId = userCredential.user.uid;
      
      // Create a test glucose reading
      console.log('\n2. Creating test glucose reading...');
      const testReading = {
        userId: userId,
        value: 105,
        unit: 'mg/dL',
        timestamp: Timestamp.fromDate(new Date()),
        mealAssociation: 'fasting',
        notes: 'Debug test reading',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      console.log('   Test reading data:', testReading);
      
      const docRef = await addDoc(collection(db, 'glucoseReadings'), testReading);
      console.log('✅ Successfully created reading with ID:', docRef.id);
      
      // Try to retrieve the reading
      console.log('\n3. Retrieving readings for user...');
      const q = query(collection(db, 'glucoseReadings'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log(`✅ Found ${querySnapshot.size} readings for this user`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - Reading ${doc.id}:`, {
          value: data.value,
          unit: data.unit,
          timestamp: data.timestamp?.toDate?.() || data.timestamp,
          mealAssociation: data.mealAssociation,
        });
      });
      
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.log('\nTo test this script, you need to:');
      console.log('1. Create a test user in Firebase Console');
      console.log('2. Update the email and password variables in this script');
      console.log('3. Make sure your Firebase project allows email/password authentication');
      
      // Try without authentication (will fail if rules require auth)
      console.log('\n4. Attempting to read without authentication (will likely fail)...');
      try {
        const q = query(collection(db, 'glucoseReadings'));
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} readings`);
      } catch (noAuthError) {
        console.error('❌ Cannot read without authentication:', noAuthError.message);
        console.log('This is expected if your Firestore rules require authentication.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGlucoseTracking();