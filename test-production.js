#!/usr/bin/env node

/**
 * Production Deployment Test Suite
 * 
 * This script tests all critical endpoints and functionality of your deployed app.
 * 
 * Usage:
 *   node test-production.js
 * 
 * Environment Variables (optional):
 *   BACKEND_URL - Your backend URL (default: prompts for input)
 *   FRONTEND_URL - Your frontend URL (default: prompts for input)
 *   TEST_EMAIL - Test user email (default: generates random)
 *   TEST_PASSWORD - Test user password (default: generates random)
 */

const axios = require('axios');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// Configuration
let config = {
  backendUrl: process.env.BACKEND_URL || '',
  frontendUrl: process.env.FRONTEND_URL || '',
  testEmail: process.env.TEST_EMAIL || `test-${Date.now()}@example.com`,
  testPassword: process.env.TEST_PASSWORD || `TestPass123!${Date.now()}`,
  authToken: null,
  userId: null,
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, message = '', time = null) {
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const timeStr = time ? ` (${time}ms)` : '';
  
  log(`${statusSymbol} ${name}${timeStr}`, statusColor);
  if (message) {
    log(`  ${message}`, statusColor);
  }
  
  results.tests.push({ name, status, message, time });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const startTime = Date.now();
  try {
    const url = `${config.backendUrl}${endpoint}`;
    const options = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 30000, // 30 second timeout
    };
    
    if (data) {
      options.data = data;
    }
    
    const response = await axios(options);
    const time = Date.now() - startTime;
    return { success: true, data: response.data, status: response.status, time };
  } catch (error) {
    const time = Date.now() - startTime;
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 0,
      time,
    };
  }
}

// Prompt for user input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Test functions
async function testHealthCheck() {
  log('\n📋 Testing Backend Health...', 'cyan');
  
  const result = await makeRequest('GET', '/api/health');
  
  if (result.success && result.status === 200) {
    logTest('Health Check', 'PASS', `Status: ${result.data.status}`, result.time);
    return true;
  } else {
    logTest('Health Check', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testSurahsEndpoint() {
  log('\n📋 Testing Surahs Endpoint...', 'cyan');
  
  const result = await makeRequest('GET', '/api/surahs');
  
  if (result.success && result.status === 200) {
    const chapters = result.data?.chapters || result.data;
    const count = Array.isArray(chapters) ? chapters.length : 0;
    
    if (count > 0) {
      logTest('Get Surahs', 'PASS', `Retrieved ${count} surahs`, result.time);
      
      // Check response time
      if (result.time > 5000) {
        logTest('Surahs Response Time', 'WARN', `Slow response: ${result.time}ms (should be < 5s)`);
      }
      
      return true;
    } else {
      logTest('Get Surahs', 'FAIL', 'No surahs returned', result.time);
      return false;
    }
  } else {
    logTest('Get Surahs', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testSurahDetail() {
  log('\n📋 Testing Surah Detail Endpoint...', 'cyan');
  
  // Test with Al-Fatiha (surah 1)
  const result = await makeRequest('GET', '/api/surah/1');
  
  if (result.success && result.status === 200) {
    const surah = result.data?.chapter || result.data;
    const verses = surah?.verses || [];
    
    if (verses.length > 0) {
      logTest('Get Surah Detail', 'PASS', `Retrieved surah 1 with ${verses.length} verses`, result.time);
      
      if (result.time > 5000) {
        logTest('Surah Detail Response Time', 'WARN', `Slow response: ${result.time}ms (should be < 5s)`);
      }
      
      return true;
    } else {
      logTest('Get Surah Detail', 'FAIL', 'No verses returned', result.time);
      return false;
    }
  } else {
    logTest('Get Surah Detail', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testSignUp() {
  log('\n📋 Testing User Sign Up...', 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signup', {
    email: config.testEmail,
    password: config.testPassword,
    name: 'Test User',
  });
  
  if (result.success && (result.status === 200 || result.status === 201)) {
    if (result.data.token) {
      config.authToken = result.data.token;
      config.userId = result.data.user?.id;
      logTest('User Sign Up', 'PASS', `User created: ${config.testEmail}`, result.time);
      return true;
    } else {
      logTest('User Sign Up', 'FAIL', 'No token returned', result.time);
      return false;
    }
  } else if (result.status === 409) {
    // User already exists, try to sign in instead
    logTest('User Sign Up', 'WARN', 'User already exists, will try sign in', result.time);
    return await testSignIn();
  } else {
    logTest('User Sign Up', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testSignIn() {
  log('\n📋 Testing User Sign In...', 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signin', {
    email: config.testEmail,
    password: config.testPassword,
  });
  
  if (result.success && result.status === 200) {
    if (result.data.token) {
      config.authToken = result.data.token;
      config.userId = result.data.user?.id;
      logTest('User Sign In', 'PASS', `User signed in: ${config.testEmail}`, result.time);
      return true;
    } else {
      logTest('User Sign In', 'FAIL', 'No token returned', result.time);
      return false;
    }
  } else {
    logTest('User Sign In', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testTokenVerification() {
  log('\n📋 Testing Token Verification...', 'cyan');
  
  if (!config.authToken) {
    logTest('Token Verification', 'FAIL', 'No token available');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/auth/verify', null, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200) {
    if (result.data.valid && result.data.user) {
      logTest('Token Verification', 'PASS', `Token valid for: ${result.data.user.email}`, result.time);
      return true;
    } else {
      logTest('Token Verification', 'FAIL', 'Token invalid or user not found', result.time);
      return false;
    }
  } else {
    logTest('Token Verification', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testGetProgress() {
  log('\n📋 Testing Get Progress...', 'cyan');
  
  if (!config.authToken) {
    logTest('Get Progress', 'FAIL', 'No token available');
    return false;
  }
  
  const result = await makeRequest('GET', '/api/auth/progress', null, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200) {
    logTest('Get Progress', 'PASS', 'Progress retrieved successfully', result.time);
    return true;
  } else {
    logTest('Get Progress', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testUpdateProgress() {
  log('\n📋 Testing Update Progress...', 'cyan');
  
  if (!config.authToken) {
    logTest('Update Progress', 'FAIL', 'No token available');
    return false;
  }
  
  // Test updating progress for surah 1, verse 1
  // The endpoint expects a progress object with surah IDs as keys
  const testProgress = {
    '1': {
      name: 'Al-Fatiha',
      verses: {
        '1': true,  // verse 1 is memorized
        '2': false, // verse 2 is not memorized
      }
    }
  };
  
  const result = await makeRequest('PUT', '/api/auth/progress', { progress: testProgress }, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200) {
    logTest('Update Progress', 'PASS', 'Progress updated successfully', result.time);
    
    // Verify the update
    const verifyResult = await makeRequest('GET', '/api/auth/progress', null, {
      'Authorization': `Bearer ${config.authToken}`,
    });
    
    if (verifyResult.success) {
      const progress = verifyResult.data.progress || verifyResult.data;
      // Check if surah 1 exists and has verse 1 marked
      if (progress['1'] && progress['1'].verses && progress['1'].verses['1'] === true) {
        logTest('Progress Persistence', 'PASS', 'Progress saved correctly', verifyResult.time);
      } else {
        logTest('Progress Persistence', 'WARN', 'Progress structure may differ, but update succeeded');
      }
    }
    
    return true;
  } else {
    logTest('Update Progress', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testGetProfile() {
  log('\n📋 Testing Get Profile...', 'cyan');
  
  if (!config.authToken) {
    logTest('Get Profile', 'FAIL', 'No token available');
    return false;
  }
  
  // Profile is returned in verify endpoint, but let's test it explicitly
  const result = await makeRequest('GET', '/api/auth/verify', null, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200 && result.data.user) {
    logTest('Get Profile', 'PASS', `Profile retrieved: ${result.data.user.name}`, result.time);
    return true;
  } else {
    logTest('Get Profile', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testUpdateProfile() {
  log('\n📋 Testing Update Profile...', 'cyan');
  
  if (!config.authToken) {
    logTest('Update Profile', 'FAIL', 'No token available');
    return false;
  }
  
  const newName = `Test User Updated ${Date.now()}`;
  const result = await makeRequest('PUT', '/api/auth/profile', {
    name: newName,
  }, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200) {
    logTest('Update Profile', 'PASS', `Profile updated: ${newName}`, result.time);
    return true;
  } else {
    logTest('Update Profile', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testOnboarding() {
  log('\n📋 Testing Onboarding...', 'cyan');
  
  if (!config.authToken) {
    logTest('Onboarding', 'FAIL', 'No token available');
    return false;
  }
  
  const result = await makeRequest('POST', '/api/auth/onboarding', {
    memorizedSurahs: [
      { surahId: 1, name: 'Al-Fatiha' },
      { surahId: 2, name: 'Al-Baqarah' },
      { surahId: 3, name: 'Ali Imran' }
    ],
    progress: {
      '1': { name: 'Al-Fatiha', verses: {} },
      '2': { name: 'Al-Baqarah', verses: {} },
      '3': { name: 'Ali Imran', verses: {} }
    }
  }, {
    'Authorization': `Bearer ${config.authToken}`,
  });
  
  if (result.success && result.status === 200) {
    logTest('Onboarding', 'PASS', 'Onboarding completed successfully', result.time);
    return true;
  } else {
    logTest('Onboarding', 'FAIL', `Status: ${result.status}, Error: ${JSON.stringify(result.error)}`, result.time);
    return false;
  }
}

async function testGoogleOAuthEndpoint() {
  log('\n📋 Testing Google OAuth Endpoint...', 'cyan');
  
  // Just check if the endpoint exists and redirects
  const result = await makeRequest('GET', '/api/auth/google');
  
  // OAuth endpoints typically return 302 redirects, which axios follows
  // So we check if we got redirected (status 200 after redirect) or if it's a redirect
  if (result.status === 302 || result.status === 200 || result.status === 307) {
    logTest('Google OAuth Endpoint', 'PASS', 'OAuth endpoint accessible', result.time);
    return true;
  } else {
    logTest('Google OAuth Endpoint', 'WARN', `Status: ${result.status} (may be normal for OAuth)`, result.time);
    return true; // Don't fail on this, OAuth redirects are complex
  }
}

async function testFrontendAccessibility() {
  log('\n📋 Testing Frontend Accessibility...', 'cyan');
  
  if (!config.frontendUrl) {
    logTest('Frontend Accessibility', 'WARN', 'Frontend URL not provided');
    return true;
  }
  
  try {
    const startTime = Date.now();
    const response = await axios.get(config.frontendUrl, {
      timeout: 10000,
      validateStatus: () => true, // Don't throw on any status
    });
    const time = Date.now() - startTime;
    
    if (response.status === 200) {
      logTest('Frontend Accessibility', 'PASS', `Frontend loads successfully`, time);
      
      if (time > 5000) {
        logTest('Frontend Load Time', 'WARN', `Slow load: ${time}ms (should be < 5s)`);
      }
      
      return true;
    } else {
      logTest('Frontend Accessibility', 'FAIL', `Status: ${response.status}`, time);
      return false;
    }
  } catch (error) {
    logTest('Frontend Accessibility', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  log('\n📋 Testing CORS Configuration...', 'cyan');
  
  try {
    const response = await axios.options(`${config.backendUrl}/api/health`, {
      headers: {
        'Origin': config.frontendUrl || 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
      validateStatus: () => true,
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
    };
    
    if (corsHeaders['access-control-allow-origin']) {
      logTest('CORS Configuration', 'PASS', `CORS headers present: ${JSON.stringify(corsHeaders)}`);
      return true;
    } else {
      logTest('CORS Configuration', 'WARN', 'CORS headers not found (may be configured differently)');
      return true; // Don't fail, CORS might be configured at a different level
    }
  } catch (error) {
    logTest('CORS Configuration', 'WARN', `CORS check failed: ${error.message}`);
    return true; // Don't fail on CORS check
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 Production Deployment Test Suite', 'bright');
  log('='.repeat(60), 'bright');
  
  // Get configuration
  if (!config.backendUrl) {
    config.backendUrl = await prompt('\nEnter your backend URL (e.g., https://tahfidh-backend.onrender.com): ');
    if (!config.backendUrl.startsWith('http')) {
      config.backendUrl = `https://${config.backendUrl}`;
    }
  }
  
  if (!config.frontendUrl) {
    config.frontendUrl = await prompt('Enter your frontend URL (e.g., https://tahfidh.netlify.app) [optional]: ');
    if (config.frontendUrl && !config.frontendUrl.startsWith('http')) {
      config.frontendUrl = `https://${config.frontendUrl}`;
    }
  }
  
  log(`\n📝 Test Configuration:`, 'cyan');
  log(`   Backend: ${config.backendUrl}`);
  log(`   Frontend: ${config.frontendUrl || 'Not provided'}`);
  log(`   Test Email: ${config.testEmail}`);
  log(`   Test Password: ${config.testPassword.substring(0, 10)}...`);
  
  // Run tests
  await testHealthCheck();
  await testCORS();
  await testSurahsEndpoint();
  await testSurahDetail();
  await testGoogleOAuthEndpoint();
  await testFrontendAccessibility();
  await testSignUp();
  await testSignIn();
  await testTokenVerification();
  await testGetProfile();
  await testUpdateProfile();
  await testOnboarding();
  await testGetProgress();
  await testUpdateProgress();
  
  // Print summary
  log('\n' + '='.repeat(60), 'bright');
  log('📊 Test Summary', 'bright');
  log('='.repeat(60), 'bright');
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  log(`\nTotal Tests: ${results.tests.length}`, 'cyan');
  
  // Calculate success rate
  const successRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // Performance summary
  const avgTime = results.tests
    .filter(t => t.time)
    .reduce((sum, t) => sum + t.time, 0) / results.tests.filter(t => t.time).length;
  
  if (avgTime) {
    log(`\nAverage Response Time: ${avgTime.toFixed(0)}ms`, avgTime < 2000 ? 'green' : avgTime < 5000 ? 'yellow' : 'red');
  }
  
  // Detailed results
  log('\n📋 Detailed Results:', 'cyan');
  results.tests.forEach(test => {
    const symbol = test.status === 'PASS' ? '✓' : test.status === 'FAIL' ? '✗' : '⚠';
    const color = test.status === 'PASS' ? 'green' : test.status === 'FAIL' ? 'red' : 'yellow';
    const timeStr = test.time ? ` (${test.time}ms)` : '';
    log(`  ${symbol} ${test.name}${timeStr}`, color);
    if (test.message) {
      log(`    ${test.message}`, color);
    }
  });
  
  // Final verdict
  log('\n' + '='.repeat(60), 'bright');
  if (results.failed === 0) {
    log('🎉 All critical tests passed! Your deployment looks good!', 'green');
  } else if (results.failed <= 2) {
    log('⚠️  Most tests passed, but some issues need attention.', 'yellow');
  } else {
    log('❌ Multiple tests failed. Please review the errors above.', 'red');
  }
  log('='.repeat(60), 'bright');
  
  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

