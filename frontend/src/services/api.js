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
export const processVideo = async (url, format = 'mp4', quality = '720p') => {
  try {
    const response = await api.post('/process', { url, format, quality });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: true, message: 'Network error' };
  }
};

export default api;
