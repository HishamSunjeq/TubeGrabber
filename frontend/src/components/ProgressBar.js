import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ progress, fileSize, downloadedSize, downloadSpeed }) => {
  // Format file size to human-readable format
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="progress-stats">
        {fileSize > 0 && (
          <span className="progress-size">
            {formatSize(downloadedSize)} / {formatSize(fileSize)} ({progress}%)
          </span>
        )}
        {downloadSpeed > 0 && (
          <span className="progress-speed">
            {formatSize(downloadSpeed)}/s
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
