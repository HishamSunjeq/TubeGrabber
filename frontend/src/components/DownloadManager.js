import React, { useState, useEffect } from 'react';
import { getDownloadStatus, downloadFile, cancelDownload } from '../services/api';
import './DownloadManager.css';

const DownloadManager = ({ downloadId, onComplete }) => {
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [error, setError] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);

  // Start polling for download status when component mounts
  useEffect(() => {
    if (!downloadId) return;

    // Function to fetch download status
    const fetchStatus = async () => {
      try {
        const response = await getDownloadStatus(downloadId);
        if (response.error) {
          setError(response.message);
          clearInterval(pollingInterval);
        } else {
          setDownloadStatus(response.download);
          
          // If download is completed or failed, stop polling
          if (['completed', 'failed', 'cancelled'].includes(response.download.status)) {
            clearInterval(pollingInterval);
            if (response.download.status === 'completed' && onComplete) {
              onComplete(response.download);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to get download status');
        clearInterval(pollingInterval);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling interval (every 1 second)
    const interval = setInterval(fetchStatus, 1000);
    setPollingInterval(interval);

    // Clean up interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [downloadId, onComplete]);

  // Handle download button click
  const handleDownload = () => {
    if (!downloadStatus || downloadStatus.status !== 'completed') return;
    
    // Create a download link
    const downloadUrl = `http://localhost:5000/api/download-file/${downloadId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadStatus.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle cancel button click
  const handleCancel = async () => {
    if (!downloadStatus || ['completed', 'failed', 'cancelled'].includes(downloadStatus.status)) return;
    
    try {
      const response = await cancelDownload(downloadId);
      if (response.error) {
        setError(response.message);
      } else {
        // Update status locally to avoid waiting for next poll
        setDownloadStatus({
          ...downloadStatus,
          status: 'cancelled'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel download');
    }
  };

  // If no download ID or status, show nothing
  if (!downloadId || !downloadStatus) {
    return null;
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Get status text and color
  const getStatusInfo = () => {
    switch (downloadStatus.status) {
      case 'queued':
        return { text: 'Queued', color: '#f39c12' };
      case 'downloading':
        return { text: 'Downloading', color: '#3498db' };
      case 'completed':
        return { text: 'Completed', color: '#2ecc71' };
      case 'failed':
        return { text: 'Failed', color: '#e74c3c' };
      case 'cancelled':
        return { text: 'Cancelled', color: '#95a5a6' };
      default:
        return { text: 'Unknown', color: '#7f8c8d' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="download-manager">
      <h3>Download Status</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="download-info">
        <p className="file-name">{downloadStatus.title}</p>
        <p className="file-format">Format: {downloadStatus.format === 'audio' ? 'Audio' : 'Video'} ({downloadStatus.format === 'audio' ? downloadStatus.audioFormat : `${downloadStatus.quality} ${downloadStatus.videoFormat}`})</p>
        
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className="status-value" style={{ color: statusInfo.color }}>{statusInfo.text}</span>
        </div>
        
        {downloadStatus.status === 'downloading' && (
          <>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ width: `${downloadStatus.progress || 0}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {downloadStatus.progress || 0}% - 
              {downloadStatus.downloadedBytes && downloadStatus.totalBytes ? 
                ` ${formatFileSize(downloadStatus.downloadedBytes)} of ${formatFileSize(downloadStatus.totalBytes)}` : 
                ' Calculating...'}
            </div>
          </>
        )}
        
        {downloadStatus.status === 'failed' && downloadStatus.error && (
          <div className="error-details">
            Error: {downloadStatus.error}
          </div>
        )}
        
        <div className="action-buttons">
          {downloadStatus.status === 'completed' && (
            <button 
              className="download-button"
              onClick={handleDownload}
            >
              Download Now
            </button>
          )}
          
          {['queued', 'downloading'].includes(downloadStatus.status) && (
            <button 
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadManager;
