import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch video metadata
export const fetchMetadata = async (url) => {
  try {
    const response = await api.post('/fetch-metadata', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Network error' };
  }
};

// Process video download
export const processVideo = async (url, format = 'video', quality = '720p', videoFormat = 'mp4', audioFormat = 'mp3') => {
  try {
    const response = await api.post('/process', { 
      url, 
      format, 
      quality,
      videoFormat,
      audioFormat
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Network error' };
  }
};

// Direct download with progress tracking
export const directDownload = async (url, format, quality, videoFormat, audioFormat, onProgress) => {
  try {
    // Create a download link for GET requests
    const params = new URLSearchParams({
      url,
      format,
      quality,
      videoFormat,
      audioFormat
    });
    
    const downloadUrl = `${API_URL}/direct-download?${params.toString()}`;
    
    // Using XMLHttpRequest for better progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track download progress
      let startTime = Date.now();
      let lastLoaded = 0;
      let downloadSpeed = 0;
      
      xhr.open('GET', downloadUrl, true);
      xhr.responseType = 'blob';
      
      // Progress event
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          
          // Calculate download speed
          const currentTime = Date.now();
          const timeElapsed = (currentTime - startTime) / 1000; // in seconds
          
          if (timeElapsed > 0) {
            // Calculate speed in bytes per second
            downloadSpeed = (event.loaded - lastLoaded) / timeElapsed;
            
            // Reset for next calculation
            startTime = currentTime;
            lastLoaded = event.loaded;
          }
          
          if (onProgress) {
            onProgress({
              progress: percentComplete,
              loaded: event.loaded,
              total: event.total,
              speed: downloadSpeed
            });
          }
        }
      };
      
      // Download completed
      xhr.onload = () => {
        if (xhr.status === 200) {
          // Create a download link and click it
          const blob = xhr.response;
          const contentDisposition = xhr.getResponseHeader('Content-Disposition');
          
          // Extract filename from Content-Disposition header
          let filename = 'download';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch[1]) {
              filename = decodeURIComponent(filenameMatch[1]);
            }
          } else {
            // Fallback filename based on format
            filename = `download.${format === 'audio' ? audioFormat : videoFormat}`;
          }
          
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          resolve({ success: true, filename });
        } else {
          reject({ error: true, message: `Download failed with status ${xhr.status}` });
        }
      };
      
      // Error handling
      xhr.onerror = () => {
        reject({ error: true, message: 'Network error during download' });
      };
      
      xhr.send();
    });
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Download failed' };
  }
};

export default api;
