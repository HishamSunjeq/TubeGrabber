const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api';
const TEST_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up

// Test functions
async function testHealthEndpoint() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get('http://localhost:5000/health');
    if (response.status === 200 && response.data.status === 'OK') {
      console.log('✅ Health endpoint test passed!');
      return true;
    } else {
      console.error('❌ Health endpoint test failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
    return false;
  }
}

async function testFetchMetadata() {
  try {
    console.log('Testing fetch-metadata endpoint...');
    const response = await axios.post(`${API_URL}/fetch-metadata`, { url: TEST_YOUTUBE_URL });
    
    if (response.status === 200 && !response.data.error && response.data.metadata) {
      console.log('✅ Fetch metadata test passed!');
      console.log('Video title:', response.data.metadata.title);
      console.log('Video duration:', response.data.metadata.lengthSeconds, 'seconds');
      console.log('Available formats:', response.data.metadata.formats);
      return true;
    } else {
      console.error('❌ Fetch metadata test failed!');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Fetch metadata test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testProcessVideo() {
  try {
    console.log('Testing process endpoint (MP3)...');
    const response = await axios.post(`${API_URL}/process`, { 
      url: TEST_YOUTUBE_URL,
      format: 'mp3'
    });
    
    if (response.status === 200 && !response.data.error && response.data.downloadUrl) {
      console.log('✅ Process video (MP3) test passed!');
      console.log('Download URL:', `http://localhost:5000${response.data.downloadUrl}`);
      return true;
    } else {
      console.error('❌ Process video (MP3) test failed!');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Process video (MP3) test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting API tests...');
  
  const healthTest = await testHealthEndpoint();
  const metadataTest = await testFetchMetadata();
  
  // Only run the process test if metadata test passed
  let processTest = false;
  if (metadataTest) {
    processTest = await testProcessVideo();
  }
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`Health Endpoint: ${healthTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Fetch Metadata: ${metadataTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Process Video: ${processTest ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = healthTest && metadataTest && processTest;
  console.log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Run the tests
runTests()
  .then(result => {
    console.log(`\nTests completed ${result ? 'successfully' : 'with failures'}.`);
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
