import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

async function testParentLogin() {
  try {
    console.log('Testing parent login endpoint...');
    
    // Test with invalid credentials first
    console.log('\n1. Testing with invalid credentials:');
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/parent/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed but got:', invalidResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected invalid credentials');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test with missing fields
    console.log('\n2. Testing with missing fields:');
    try {
      const missingResponse = await axios.post(`${BASE_URL}/parent/login`, {
        email: 'test@example.com'
        // missing password
      });
      console.log('❌ Should have failed but got:', missingResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected missing fields');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test with valid credentials (you'll need to create a parent first)
    console.log('\n3. Testing with valid credentials:');
    try {
      const validResponse = await axios.post(`${BASE_URL}/parent/login`, {
        email: 'parent@example.com',
        password: 'password123'
      });
      
      if (validResponse.data.access_token && validResponse.data.refresh_token) {
        console.log('✅ Login successful!');
        console.log('Access token:', validResponse.data.access_token.substring(0, 20) + '...');
        console.log('Refresh token:', validResponse.data.refresh_token.substring(0, 20) + '...');
        console.log('User:', validResponse.data.user);
        
        // Test refresh token
        console.log('\n4. Testing refresh token:');
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            refresh_token: validResponse.data.refresh_token
          });
          
          if (refreshResponse.data.access_token && refreshResponse.data.refresh_token) {
            console.log('✅ Refresh token successful!');
            console.log('New access token:', refreshResponse.data.access_token.substring(0, 20) + '...');
          } else {
            console.log('❌ Refresh token failed');
          }
        } catch (refreshError) {
          console.log('❌ Refresh token error:', refreshError.response?.data || refreshError.message);
        }
      } else {
        console.log('❌ Login response missing tokens');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected invalid credentials (no parent exists)');
      } else {
        console.log('❌ Unexpected error:', error.message);
        if (error.response) {
          console.log('Response data:', error.response.data);
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testParentLogin(); 