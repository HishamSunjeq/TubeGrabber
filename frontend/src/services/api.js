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

// Get direct download URL
export const getDirectDownloadUrl = (url, format, quality, videoFormat, audioFormat) => {
  return `${API_URL}/direct-download`;
};

export default api;
