"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { GlucoseService } from '@/src/services/glucose/glucose-service';
import { GlucoseReading } from '@/src/types/glucose';
import { db } from '@/src/lib/firebase/client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function TestGlucosePage() {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [directTestResult, setDirectTestResult] = useState<string>('');

  // Load existing readings
  useEffect(() => {
    if (user) {
      loadReadings();
    }
  }, [user]);

  const loadReadings = async () => {
    if (!user) return;
    
    try {
      console.log('[TEST] Loading readings for user:', user.uid);
      const todayReadings = await GlucoseService.getTodayReadings(user.uid);
      setReadings(todayReadings);
      console.log('[TEST] Loaded readings:', todayReadings);
    } catch (error) {
      console.error('[TEST] Error loading readings:', error);
    }
  };

  const testSaveReading = async () => {
    if (!user) {
      setTestResult('❌ Not logged in');
      return;
    }

    setLoading(true);
    setTestResult('Testing...');

    try {
      // Create test reading
      const testReading: Omit<GlucoseReading, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        value: 95 + Math.floor(Math.random() * 30), // Random value 95-125
        unit: 'mg/dL',
        timestamp: new Date(),
        mealAssociation: 'fasting',
        notes: 'Test reading from debug page'
      };

      console.log('[TEST] Attempting to save:', testReading);
      
      const newId = await GlucoseService.createReading(testReading);
      
      console.log('[TEST] Successfully saved with ID:', newId);
      setTestResult(`✅ Success! Reading saved with ID: ${newId}`);
      
      // Reload readings
      await loadReadings();
      
    } catch (error) {
      console.error('[TEST] Save failed:', error);
      setTestResult(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFirestore = async () => {
    if (!user) {
      setDirectTestResult('❌ Not logged in');
      return;
    }

    setDirectTestResult('Testing direct Firestore save...');

    try {
      // Test direct Firestore save
      const docData = {
        userId: user.uid,
        value: 100,
        unit: 'mg/dL',
        timestamp: Timestamp.fromDate(new Date()),
        mealAssociation: 'fasting',
        notes: 'Direct Firestore test',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      console.log('[DIRECT TEST] Attempting direct Firestore save:', docData);
      
      const docRef = await addDoc(collection(db, 'glucoseReadings'), docData);
      
      console.log('[DIRECT TEST] Success! Document ID:', docRef.id);
      setDirectTestResult(`✅ Direct save successful! ID: ${docRef.id}`);
      
      // Reload readings
      await loadReadings();
      
    } catch (error) {
      console.error('[DIRECT TEST] Failed:', error);
      setDirectTestResult(`❌ Direct save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAPIEndpoint = async () => {
    if (!user) {
      setTestResult('❌ Not logged in');
      return;
    }

    setTestResult('Testing API endpoint...');

    try {
      const response = await fetch('/api/test-glucose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('[API TEST] Success:', data);
        setTestResult(`✅ API test successful! ID: ${data.id}`);
        await loadReadings();
      } else {
        console.error('[API TEST] Failed:', data);
        setTestResult(`❌ API test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('[API TEST] Error:', error);
      setTestResult(`❌ API test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteReading = async (id: string) => {
    try {
      await GlucoseService.deleteReading(id);
      console.log('[TEST] Deleted reading:', id);
      await loadReadings();
    } catch (error) {
      console.error('[TEST] Delete failed:', error);
      alert('Failed to delete reading');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Glucose Tracking Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        <ul className="space-y-1">
          <li>User: {user ? user.email : 'Not logged in'}</li>
          <li>User ID: {user ? user.uid : 'N/A'}</li>
          <li>Readings count: {readings.length}</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Save Operations</h2>
        <div className="space-y-4">
          {/* Test via GlucoseService */}
          <div>
            <button
              onClick={testSaveReading}
              disabled={loading || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test via GlucoseService'}
            </button>
            
            {testResult && (
              <div className={`mt-2 p-4 rounded ${
                testResult.includes('✅') ? 'bg-green-100' : 
                testResult.includes('❌') ? 'bg-red-100' : 
                'bg-gray-100'
              }`}>
                <pre className="text-sm">{testResult}</pre>
              </div>
            )}
          </div>

          {/* Test direct Firestore */}
          <div>
            <button
              onClick={testDirectFirestore}
              disabled={!user}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Test Direct Firestore Save
            </button>
            
            {directTestResult && (
              <div className={`mt-2 p-4 rounded ${
                directTestResult.includes('✅') ? 'bg-green-100' : 
                directTestResult.includes('❌') ? 'bg-red-100' : 
                'bg-gray-100'
              }`}>
                <pre className="text-sm">{directTestResult}</pre>
              </div>
            )}
          </div>

          {/* Test API endpoint */}
          <div>
            <button
              onClick={testAPIEndpoint}
              disabled={!user}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Test API Endpoint
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Readings</h2>
        {readings.length === 0 ? (
          <p className="text-gray-500">No readings yet</p>
        ) : (
          <div className="space-y-2">
            {readings.map((reading) => (
              <div key={reading.id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{reading.value} {reading.unit}</p>
                  <p className="text-sm text-gray-600">
                    {reading.mealAssociation || 'No meal'} - 
                    {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'No time'}
                  </p>
                  {reading.notes && (
                    <p className="text-sm text-gray-500">{reading.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => reading.id && deleteReading(reading.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Debug Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open browser console (F12)</li>
          <li>Try each test button in order</li>
          <li>Check console for detailed logs</li>
          <li>If all tests fail, check Firebase Console:</li>
          <li className="ml-4">→ Firestore Rules are properly configured</li>
          <li className="ml-4">→ Authentication is enabled</li>
          <li className="ml-4">→ Project settings are correct</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm font-semibold">Firebase Project Info:</p>
          <p className="text-xs mt-1">Project ID: gd-meal-planner</p>
          <p className="text-xs">Auth Domain: gd-meal-planner.firebaseapp.com</p>
        </div>
      </div>
    </div>
  );
}