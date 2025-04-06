import React, { useState, useEffect } from 'react';
import './DownloadSettings.css';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const DownloadSettings = () => {
  const [downloadPath, setDownloadPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showSettings, setShowSettings] = useState(false);

  // Fetch current download path on component mount
  useEffect(() => {
    fetchDownloadPath();
  }, []);

  // Fetch the current download path from the backend
  const fetchDownloadPath = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/download-path`);
      if (response.data.success) {
        setDownloadPath(response.data.downloadPath);
      }
    } catch (error) {
      console.error('Error fetching download path:', error);
      setMessage({
        text: 'Failed to load download path',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle directory selection
  const handleDirectorySelect = async () => {
    try {
      // Create a temporary file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true; // Allow directory selection
      input.directory = true; // Non-standard attribute for Firefox
      
      // When a file/directory is selected
      input.onchange = async (e) => {
        if (e.target.files.length > 0) {
          // Get the path of the selected directory
          // This will give us the path of the first file in the directory
          // We need to extract just the directory path from it
          const filePath = e.target.files[0].path;
          const directoryPath = filePath.substring(0, filePath.lastIndexOf('\\'));
          
          setDownloadPath(directoryPath);
          // Clear any previous messages
          setMessage({ text: '', type: '' });
        }
      };
      
      // Trigger the file input click
      input.click();
    } catch (error) {
      console.error('Error selecting directory:', error);
      setMessage({
        text: 'Failed to select directory',
        type: 'error'
      });
    }
  };

  // Open the download folder
  const handleOpenFolder = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/open-download-folder`);
      
      if (!response.data.success) {
        setMessage({ 
          text: response.data.message || 'Failed to open download folder',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error opening download folder:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to open download folder',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save the download path
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage({ text: '', type: '' });

      const response = await axios.post(`${API_URL}/download-path`, { downloadPath });
      
      if (response.data.success) {
        setMessage({ 
          text: 'Download path saved successfully',
          type: 'success'
        });
      } else {
        setMessage({ 
          text: response.data.message || 'Failed to save download path',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving download path:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Failed to save download path',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="download-settings">
      <div className="settings-header">
        <button 
          className="settings-toggle" 
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
        <button 
          className="locate-folder-btn" 
          onClick={handleOpenFolder}
          disabled={isLoading}
          title="Open download folder"
        >
          📂 Locate Downloads
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>Download Settings</h3>
          
          <div className="setting-group">
            <label>Download Location:</label>
            <div className="path-input-container">
              <input
                type="text"
                value={downloadPath}
                className="download-path-input"
                placeholder="Select download path"
                disabled={isLoading}
                readOnly
              />
              <button 
                onClick={handleDirectorySelect}
                disabled={isLoading}
                className="browse-btn"
              >
                Browse
              </button>
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="save-btn"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadSettings;
