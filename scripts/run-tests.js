#!/usr/bin/env node

/**
 * Automated Test Runner for GD Meal Planner
 * Tests all features systematically and reports results
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test utilities
async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers,
        body: data 
      }));
    }).on('error', reject);
  });
}

async function testEndpoint(name, path, checks = []) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`URL: ${BASE_URL}${path}`);
  
  try {
    const response = await fetchPage(path);
    const result = {
      name,
      path,
      status: response.status,
      passed: true,
      errors: []
    };
    
    // Check status code
    if (response.status !== 200) {
      result.passed = false;
      result.errors.push(`Expected status 200, got ${response.status}`);
    }
    
    // Run custom checks
    for (const check of checks) {
      try {
        const checkResult = check(response);
        if (!checkResult.passed) {
          result.passed = false;
          result.errors.push(checkResult.error);
        }
      } catch (e) {
        result.passed = false;
        result.errors.push(`Check failed: ${e.message}`);
      }
    }
    
    // Report result
    if (result.passed) {
      console.log(`${colors.green}✅ PASS${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset}`);
      result.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    TEST_RESULTS.push(result);
    return result;
    
  } catch (error) {
    const result = {
      name,
      path,
      status: 0,
      passed: false,
      errors: [`Network error: ${error.message}`]
    };
    
    console.log(`${colors.red}❌ FAIL - Network Error${colors.reset}`);
    console.log(`   - ${error.message}`);
    
    TEST_RESULTS.push(result);
    return result;
  }
}

// Custom check functions
const contains = (text) => (response) => {
  const found = response.body.includes(text);
  return {
    passed: found,
    error: `Expected page to contain "${text}"`
  };
};

const hasElement = (selector) => (response) => {
  // Simple check for common HTML patterns
  const patterns = {
    'nav': /<nav[\s>]/,
    'footer': /<footer[\s>]/,
    'button': /<button[\s>]/,
    'form': /<form[\s>]/
  };
  
  const found = patterns[selector] ? patterns[selector].test(response.body) : response.body.includes(selector);
  return {
    passed: found,
    error: `Expected page to contain element: ${selector}`
  };
};

const hasContentType = (type) => (response) => {
  const contentType = response.headers['content-type'] || '';
  const matches = contentType.includes(type);
  return {
    passed: matches,
    error: `Expected content-type to include "${type}", got "${contentType}"`
  };
};

// Run all tests
async function runAllTests() {
  console.log(`${colors.blue}====================================`);
  console.log(`GD Meal Planner - Automated Testing`);
  console.log(`====================================`);
  console.log(`Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  // Test public pages
  console.log(`${colors.yellow}\n📄 Testing Public Pages${colors.reset}`);
  
  await testEndpoint('Home Page', '/', [
    contains('Pregnancy Plate Planner'),
    contains('Manage gestational diabetes'),
    hasElement('nav'),
    hasContentType('text/html')
  ]);
  
  await testEndpoint('Recipes Page', '/recipes', [
    contains('recipe'),
    hasContentType('text/html')
  ]);
  
  await testEndpoint('Education Page', '/education', [
    hasContentType('text/html')
  ]);
  
  // Test auth pages
  console.log(`${colors.yellow}\n🔐 Testing Authentication Pages${colors.reset}`);
  
  await testEndpoint('Login Page', '/login', [
    contains('login'),
    hasElement('form'),
    hasContentType('text/html')
  ]);
  
  await testEndpoint('Signup Page', '/signup', [
    contains('sign'),
    hasElement('form'),
    hasContentType('text/html')
  ]);
  
  // Test protected pages (should redirect or show login)
  console.log(`${colors.yellow}\n🔒 Testing Protected Pages${colors.reset}`);
  
  await testEndpoint('Meal Planner', '/meal-planner', [
    hasContentType('text/html')
  ]);
  
  await testEndpoint('Glucose Tracking', '/tracking/glucose', [
    hasContentType('text/html')
  ]);
  
  await testEndpoint('Admin Dashboard', '/admin', [
    hasContentType('text/html')
  ]);
  
  // Test API endpoints
  console.log(`${colors.yellow}\n🔌 Testing API Endpoints${colors.reset}`);
  
  await testEndpoint('Recipe Count API', '/api/recipes/count', [
    hasContentType('application/json')
  ]);
  
  // Generate summary
  console.log(`${colors.blue}\n====================================`);
  console.log(`Test Summary`);
  console.log(`====================================${colors.reset}`);
  
  const passed = TEST_RESULTS.filter(r => r.passed).length;
  const failed = TEST_RESULTS.filter(r => !r.passed).length;
  const total = TEST_RESULTS.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  
  if (failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    TEST_RESULTS.filter(r => !r.passed).forEach(result => {
      console.log(`\n- ${result.name} (${result.path})`);
      result.errors.forEach(err => console.log(`  ${err}`));
    });
  }
  
  // Save detailed results
  const fs = require('fs');
  const reportPath = 'test-results-automated.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: { total, passed, failed },
    results: TEST_RESULTS
  }, null, 2));
  
  console.log(`\n${colors.blue}Detailed results saved to: ${reportPath}${colors.reset}`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
http.get(BASE_URL, (res) => {
  runAllTests();
}).on('error', (err) => {
  console.error(`${colors.red}Error: Server not running at ${BASE_URL}${colors.reset}`);
  console.error('Please start the development server with: npm run dev');
  process.exit(1);
});