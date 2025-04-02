import React, { useState } from 'react';
import { fetchMetadata, processVideo } from '../services/api';
import './DownloadForm.css';

const DownloadForm = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('720p');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [downloadInfo, setDownloadInfo] = useState(null);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    // Reset states when URL changes
    setMetadata(null);
    setDownloadInfo(null);
    setError('');
  };

  const handleFetchMetadata = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetchMetadata(url);
      
      if (response.error) {
        setError(response.message);
      } else {
        setMetadata(response.metadata);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch video metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await processVideo(url, format, quality);
      
      if (response.error) {
        setError(response.message);
      } else {
        setDownloadInfo(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="download-form">
      <form onSubmit={handleFetchMetadata}>
        <div className="form-group">
          <label htmlFor="url">YouTube URL</label>
          <input
            type="text"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="form-control"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Video Info'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {metadata && (
        <div className="metadata-section">
          <h3>{metadata.title}</h3>
          <p>Duration: {Math.floor(metadata.lengthSeconds / 60)}:{(metadata.lengthSeconds % 60).toString().padStart(2, '0')}</p>
          <p>By: {metadata.author}</p>
          
          <form onSubmit={handleDownload}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="format">Format</label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="form-control"
                >
                  <option value="mp4">Video (MP4)</option>
                  <option value="mp3">Audio (MP3)</option>
                </select>
              </div>
              
              {format === 'mp4' && (
                <div className="form-group">
                  <label htmlFor="quality">Quality</label>
                  <select
                    id="quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="form-control"
                  >
                    {metadata.formats.video.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Download'}
            </button>
          </form>
        </div>
      )}
      
      {downloadInfo && (
        <div className="download-section">
          <h3>Your download is ready!</h3>
          <p>
            <a 
              href={`http://localhost:5000${downloadInfo.downloadUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="download-link"
            >
              Download {downloadInfo.title}.{downloadInfo.format}
            </a>
          </p>
          <p className="note">Note: This download link will expire in 24 hours.</p>
        </div>
      )}
    </div>
  );
};

export default DownloadForm;
