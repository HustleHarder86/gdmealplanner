#!/usr/bin/env node

const https = require('https');

const BASE_URL = 'http://localhost:3000/api/recipes';

// Helper function to make requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPIs() {
  console.log('Testing Offline Migration APIs...\n');

  try {
    // 1. Check existing backups
    console.log('1. Checking existing backups...');
    const backups = await makeRequest('/backup-all');
    console.log('Result:', JSON.stringify(backups, null, 2));
    console.log('---\n');

    // 2. Check offline readiness
    console.log('2. Checking offline readiness...');
    const offlineStatus = await makeRequest('/prepare-offline');
    console.log('Result:', JSON.stringify(offlineStatus, null, 2));
    console.log('---\n');

    // 3. Export recipes (just get summary)
    console.log('3. Testing export endpoint...');
    const exportSummary = await makeRequest('/export?format=summary');
    console.log('Result:', JSON.stringify(exportSummary, null, 2));
    console.log('---\n');

    console.log('✅ All API endpoints are accessible!');
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('\nMake sure the Next.js development server is running with: npm run dev');
  }
}

// Run the tests
testAPIs();