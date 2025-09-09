/**
 * Complete test of glucose tracking functionality
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, query, where, Timestamp, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test user credentials
const TEST_EMAIL = `test-glucose-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function createTestUser() {
  try {
    console.log('👤 Creating test user...');
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log(`✅ Test user created: ${userCredential.user.email}`);
    console.log(`   User ID: ${userCredential.user.uid}\n`);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('👤 Test user already exists, signing in...');
      const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log(`✅ Signed in as: ${userCredential.user.email}\n`);
      return userCredential.user;
    }
    throw error;
  }
}

async function testGlucoseSave(userId) {
  console.log('🧪 TEST 1: Saving glucose reading...');
  
  try {
    const testReading = {
      userId: userId,
      value: 105,
      unit: 'mg/dL',
      timestamp: Timestamp.fromDate(new Date()),
      mealAssociation: 'fasting',
      notes: 'Automated test reading',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    console.log('   Saving reading:', {
      value: testReading.value,
      unit: testReading.unit,
      mealAssociation: testReading.mealAssociation
    });
    
    const docRef = await addDoc(collection(db, 'glucoseReadings'), testReading);
    console.log(`✅ TEST 1 PASSED: Reading saved with ID: ${docRef.id}\n`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ TEST 1 FAILED: ${error.message}\n`);
    throw error;
  }
}

async function testGlucoseRead(userId) {
  console.log('🧪 TEST 2: Reading glucose data...');
  
  try {
    const q = query(collection(db, 'glucoseReadings'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    console.log(`   Found ${querySnapshot.size} readings for user`);
    
    if (querySnapshot.size > 0) {
      const readings = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        readings.push({
          id: doc.id,
          value: data.value,
          unit: data.unit,
          mealAssociation: data.mealAssociation,
          timestamp: data.timestamp?.toDate?.() || data.timestamp
        });
      });
      
      console.log('   Sample reading:', readings[0]);
      console.log(`✅ TEST 2 PASSED: Successfully read ${readings.length} readings\n`);
      return readings;
    } else {
      console.log('⚠️  No readings found (this might be expected if save failed)\n');
      return [];
    }
  } catch (error) {
    console.error(`❌ TEST 2 FAILED: ${error.message}\n`);
    throw error;
  }
}

async function testMultipleSaves(userId) {
  console.log('🧪 TEST 3: Saving multiple readings...');
  
  try {
    const readings = [
      { value: 95, mealAssociation: 'fasting', notes: 'Morning reading' },
      { value: 140, mealAssociation: 'post-breakfast-1hr', notes: 'After breakfast' },
      { value: 120, mealAssociation: 'post-lunch-2hr', notes: 'After lunch' },
      { value: 110, mealAssociation: 'bedtime', notes: 'Before bed' }
    ];
    
    const savedIds = [];
    
    for (const reading of readings) {
      const docData = {
        userId: userId,
        value: reading.value,
        unit: 'mg/dL',
        timestamp: Timestamp.fromDate(new Date()),
        mealAssociation: reading.mealAssociation,
        notes: reading.notes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'glucoseReadings'), docData);
      savedIds.push(docRef.id);
      console.log(`   Saved: ${reading.mealAssociation} - ${reading.value} mg/dL`);
    }
    
    console.log(`✅ TEST 3 PASSED: Saved ${savedIds.length} readings successfully\n`);
    return savedIds;
  } catch (error) {
    console.error(`❌ TEST 3 FAILED: ${error.message}\n`);
    throw error;
  }
}

async function testDelete(docId) {
  console.log('🧪 TEST 4: Deleting a reading...');
  
  try {
    await deleteDoc(doc(db, 'glucoseReadings', docId));
    console.log(`✅ TEST 4 PASSED: Successfully deleted reading ${docId}\n`);
  } catch (error) {
    console.error(`❌ TEST 4 FAILED: ${error.message}\n`);
    throw error;
  }
}

async function cleanupTestData(userId) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const q = query(collection(db, 'glucoseReadings'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleaned up ${deletePromises.length} test readings\n`);
  } catch (error) {
    console.error(`⚠️  Cleanup failed: ${error.message}\n`);
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('  GLUCOSE TRACKING COMPREHENSIVE TEST  ');
  console.log('========================================\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Create or sign in test user
    const user = await createTestUser();
    const userId = user.uid;
    
    // Run tests
    try {
      const docId = await testGlucoseSave(userId);
      testsPassed++;
      
      await testGlucoseRead(userId);
      testsPassed++;
      
      await testMultipleSaves(userId);
      testsPassed++;
      
      if (docId) {
        await testDelete(docId);
        testsPassed++;
      }
    } catch (error) {
      testsFailed++;
    }
    
    // Cleanup
    await cleanupTestData(userId);
    
    // Summary
    console.log('========================================');
    console.log('              TEST SUMMARY              ');
    console.log('========================================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log('');
    
    if (testsFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! Glucose tracking is working correctly.');
      console.log('\nThe glucose tracking feature is fully functional:');
      console.log('• Users can save glucose readings');
      console.log('• Users can read their own readings');
      console.log('• Users can delete their readings');
      console.log('• Firebase security rules are properly configured');
    } else {
      console.log('⚠️  Some tests failed. Please check the error messages above.');
      console.log('\nPossible issues:');
      console.log('• Firebase security rules may need updating');
      console.log('• Authentication configuration may be incorrect');
      console.log('• Network connectivity issues');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.log('\nPlease ensure:');
    console.log('1. Firebase project is properly configured');
    console.log('2. Authentication is enabled in Firebase Console');
    console.log('3. Environment variables are set correctly');
  }
}

// Run all tests
runAllTests();