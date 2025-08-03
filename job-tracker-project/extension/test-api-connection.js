// Test script to verify API connection from Chrome extension
// Run this in the browser console to test the API

async function testExtensionAPI() {
  console.log('🧪 Testing Extension API Connection...');
  
  // Test 1: Login
  console.log('1. Testing login...');
  try {
    const loginResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'LOGIN',
        data: { email: 'testuser@example.com', password: 'testpass123' }
      }, resolve);
    });
    console.log('Login result:', loginResponse);
  } catch (error) {
    console.error('Login failed:', error);
  }
  
  // Test 2: Check auth
  console.log('2. Testing auth check...');
  try {
    const authResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'CHECK_AUTH' }, resolve);
    });
    console.log('Auth check result:', authResponse);
  } catch (error) {
    console.error('Auth check failed:', error);
  }
  
  // Test 3: Track a test job
  console.log('3. Testing job tracking...');
  try {
    const jobData = {
      title: 'Senior Software Engineer',
      company: 'Test Company',
      location: 'San Francisco, CA',
      description: 'Test job description',
      requirements: 'JavaScript, React, Node.js',
      jobType: 'full-time',
      sourceUrl: 'https://example.com/job/123',
      sourcePlatform: 'test'
    };
    
    const trackResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'TRACK_JOB',
        data: jobData
      }, resolve);
    });
    console.log('Job tracking result:', trackResponse);
  } catch (error) {
    console.error('Job tracking failed:', error);
  }
  
  // Test 4: Get stats
  console.log('4. Testing stats retrieval...');
  try {
    const statsResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'GET_STATS' }, resolve);
    });
    console.log('Stats result:', statsResponse);
  } catch (error) {
    console.error('Stats failed:', error);
  }
  
  console.log('🎉 API testing complete!');
}

// Run the test
testExtensionAPI();