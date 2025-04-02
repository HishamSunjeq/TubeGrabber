import React, { useState, useEffect } from 'react';
import './DownloadForm.css';
import { fetchMetadata, processVideo, getDirectDownloadUrl } from '../services/api';
import ProgressBar from './ProgressBar';

const DownloadForm = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [format, setFormat] = useState('video');
  const [quality, setQuality] = useState('720p');
  const [videoFormat, setVideoFormat] = useState('mp4');
  const [audioFormat, setAudioFormat] = useState('mp3');

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
      setError('');
      setLoading(true);
      
      // Get video info first to determine filename
      const videoInfo = await processVideo(url, format, quality, videoFormat, audioFormat);
      
      if (videoInfo.error) {
        setError(videoInfo.message);
        setLoading(false);
        return;
      }
      
      // Set download info for display
      setDownloadInfo(videoInfo);
      
      // Create a direct download link with query parameters
      const params = new URLSearchParams({
        url,
        format,
        quality,
        videoFormat,
        audioFormat
      });
      
      // Create the download URL
      const downloadUrl = `http://localhost:5000/api/direct-download?${params.toString()}`;
      
      // Create a hidden anchor element to trigger download without navigating away
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${videoInfo.title}.${format === 'video' ? videoFormat : audioFormat}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setLoading(false);
      
    } catch (err) {
      setError(err.message || 'Failed to process video');
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
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
              
              {format === 'video' && (
                <div className="form-group">
                  <label htmlFor="videoFormat">Video Format</label>
                  <select
                    id="videoFormat"
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value)}
                    className="form-control"
                  >
                    {metadata?.formats?.videoFormats?.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {format === 'audio' && (
                <div className="form-group">
                  <label htmlFor="audioFormat">Audio Format</label>
                  <select
                    id="audioFormat"
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="form-control"
                  >
                    {metadata?.formats?.audioFormats?.map((format) => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {format === 'video' && (
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
              href={`http://localhost:5000/api/direct-download?${new URLSearchParams({
                url,
                format,
                quality,
                videoFormat,
                audioFormat
              }).toString()}`}
              download={`${downloadInfo.title}.${format === 'video' ? videoFormat : audioFormat}`}
              className="download-link"
            >
              Download {downloadInfo.title}.{format === 'video' ? videoFormat : audioFormat}
            </a>
          </p>
          <p className="note">Note: This download link will expire in 24 hours.</p>
        </div>
      )}
    </div>
  );
};

export default DownloadForm;
