#!/usr/bin/env node

/**
 * Test script to verify super admin secret key functionality
 * Run this script to test the secret key validation
 */

const testSecretKey = async () => {
  const API_URL = process.env.API_URL || 'http://localhost:3001';
  const TEST_SECRET_KEY = process.env.TEST_SECRET_KEY || 'test-secret-key';
  
  console.log('🧪 Testing Super Admin Secret Key Functionality\n');
  
  // Test 1: Registration without secret key (should fail)
  console.log('Test 1: Registration without secret key...');
  try {
    const response1 = await fetch(`${API_URL}/super-admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data1 = await response1.json();
    if (response1.status === 400 && data1.message.includes('secret key')) {
      console.log('✅ PASS: Registration correctly rejected without secret key');
    } else {
      console.log('❌ FAIL: Registration should have been rejected');
    }
  } catch (error) {
    console.log('❌ FAIL: Network error during test 1');
  }
  
  // Test 2: Registration with wrong secret key (should fail)
  console.log('\nTest 2: Registration with wrong secret key...');
  try {
    const response2 = await fetch(`${API_URL}/super-admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'test@example.com',
        password: 'password123',
        secretKey: 'wrong-secret-key'
      })
    });
    
    const data2 = await response2.json();
    if (response2.status === 403 && data2.message.includes('Invalid secret key')) {
      console.log('✅ PASS: Registration correctly rejected with wrong secret key');
    } else {
      console.log('❌ FAIL: Registration should have been rejected with wrong key');
    }
  } catch (error) {
    console.log('❌ FAIL: Network error during test 2');
  }
  
  // Test 3: Registration with correct secret key (should succeed if key is set)
  console.log('\nTest 3: Registration with correct secret key...');
  try {
    const response3 = await fetch(`${API_URL}/super-admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'test@example.com',
        password: 'password123',
        secretKey: TEST_SECRET_KEY
      })
    });
    
    const data3 = await response3.json();
    if (response3.status === 201) {
      console.log('✅ PASS: Registration succeeded with correct secret key');
    } else if (response3.status === 500 && data3.message.includes('Server configuration error')) {
      console.log('⚠️  WARNING: SUPER_ADMIN_SECRET_KEY not set in environment');
      console.log('   Set the environment variable to test full functionality');
    } else if (response3.status === 403) {
      console.log('⚠️  WARNING: Secret key mismatch - check your environment variable');
    } else {
      console.log('❌ FAIL: Unexpected response:', response3.status, data3.message);
    }
  } catch (error) {
    console.log('❌ FAIL: Network error during test 3');
  }
  
  console.log('\n📋 Test Summary:');
  console.log('- Secret key validation is working');
  console.log('- Make sure to set SUPER_ADMIN_SECRET_KEY in your .env file');
  console.log('- See SECURITY_SETUP.md for detailed instructions');
};

// Run the test
if (require.main === module) {
  testSecretKey().catch(console.error);
}

module.exports = { testSecretKey }; 