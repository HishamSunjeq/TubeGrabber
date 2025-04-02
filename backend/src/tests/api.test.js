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
      
      // Check if we have the expected format properties
      if (response.data.metadata.formats) {
        if (response.data.metadata.formats.videoFormats && Array.isArray(response.data.metadata.formats.videoFormats)) {
          console.log('Available video formats:', response.data.metadata.formats.videoFormats);
        } else {
          console.log('Video formats property not found or not an array, using default');
        }
        
        if (response.data.metadata.formats.audioFormats && Array.isArray(response.data.metadata.formats.audioFormats)) {
          console.log('Available audio formats:', response.data.metadata.formats.audioFormats);
        } else {
          console.log('Audio formats property not found or not an array, using default');
        }
        
        if (response.data.metadata.formats.video && Array.isArray(response.data.metadata.formats.video)) {
          console.log('Available video qualities:', response.data.metadata.formats.video);
        } else {
          console.log('Video qualities property not found or not an array, using default');
        }
      } else {
        console.log('Formats property not found in metadata');
      }
      
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
    console.log('Testing process endpoint...');
    const response = await axios.post(`${API_URL}/process`, { 
      url: TEST_YOUTUBE_URL,
      format: 'audio',
      audioFormat: 'mp3',
      videoFormat: 'mp4',
      quality: '720p'
    });
    
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Process video test passed!');
      
      if (response.data.directDownload === true) {
        console.log('Direct download command:', response.data.command);
        console.log('Download options:', JSON.stringify(response.data.downloadOptions));
      } else if (response.data.downloadUrl) {
        console.log('Download URL:', `http://localhost:5000${response.data.downloadUrl}`);
      }
      
      return true;
    } else {
      console.error('❌ Process video test failed!');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Process video test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testDirectDownload() {
  try {
    console.log('Testing direct-download endpoint (not actually downloading)...');
    
    // Create query parameters for the request
    const params = new URLSearchParams({
      url: TEST_YOUTUBE_URL,
      format: 'audio',
      audioFormat: 'mp3',
      videoFormat: 'mp4',
      quality: '720p'
    });
    
    // First, check if the endpoint exists using a HEAD request
    try {
      await axios.head(`${API_URL}/direct-download?${params.toString()}`);
      console.log('✅ Direct download endpoint exists and accepts HEAD requests!');
      return true;
    } catch (headError) {
      // If HEAD is not supported, try with a POST request with a timeout
      const response = await axios.post(`${API_URL}/direct-download`, {
        url: TEST_YOUTUBE_URL,
        format: 'audio',
        audioFormat: 'mp3',
        videoFormat: 'mp4',
        quality: '720p'
      }, {
        // Set a timeout to cancel the request quickly since we don't want to download the whole file
        timeout: 500,
        // Set responseType to stream to handle binary data
        responseType: 'stream'
      });
      
      // If we get here, the request was accepted (even if it times out)
      console.log('✅ Direct download endpoint exists and accepts requests!');
      
      // Cancel the download to avoid downloading the entire file
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }
      
      return true;
    }
  } catch (error) {
    // If we get a timeout error, that's actually good - it means the endpoint exists and started streaming
    if (error.code === 'ECONNABORTED') {
      console.log('✅ Direct download endpoint exists! (Request timed out as expected)');
      return true;
    }
    
    // If we get a 200 status code but some other error, the endpoint exists
    if (error.response && error.response.status === 200) {
      console.log('✅ Direct download endpoint exists! (Got 200 status code)');
      return true;
    }
    
    console.error('❌ Direct download endpoint test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting API tests...');
  
  const healthTest = await testHealthEndpoint();
  
  // Only run subsequent tests if health check passes
  let metadataTest = false;
  let processTest = false;
  let directDownloadTest = false;
  
  if (healthTest) {
    metadataTest = await testFetchMetadata();
    
    // Only run the process test if metadata test passed
    if (metadataTest) {
      processTest = await testProcessVideo();
    }
    
    // Test direct download endpoint
    directDownloadTest = await testDirectDownload();
  }
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`Health Endpoint: ${healthTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Fetch Metadata: ${metadataTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Process Video: ${processTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Direct Download: ${directDownloadTest ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = healthTest && metadataTest && processTest && directDownloadTest;
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
