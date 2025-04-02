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

// Get download status
export const getDownloadStatus = async (downloadId) => {
  try {
    const response = await api.get(`/download-status/${downloadId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Network error' };
  }
};

// Download file
export const downloadFile = async (downloadId) => {
  try {
    // This will trigger a file download in the browser
    window.location.href = `${API_URL}/download-file/${downloadId}`;
    return { error: false };
  } catch (error) {
    throw { error: true, message: 'Failed to download file' };
  }
};

// Cancel download
export const cancelDownload = async (downloadId) => {
  try {
    const response = await api.post(`/cancel-download/${downloadId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Network error' };
  }
};

// Get direct download URL (legacy method)
export const getDirectDownloadUrl = (url, format, quality, videoFormat, audioFormat) => {
  return `${API_URL}/direct-download`;
};

export default api;
