import React, { useState, useEffect } from 'react';
import './DownloadForm.css';
import { fetchMetadata, processVideo } from '../services/api';
import DownloadManager from './DownloadManager';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const DownloadForm = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [format, setFormat] = useState('video');
  const [quality, setQuality] = useState('720p');
  const [videoFormat, setVideoFormat] = useState('mp4');
  const [audioFormat, setAudioFormat] = useState('mp3');

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    // Reset states when URL changes
    setMetadata(null);
    setDownloadId(null);
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
      
      // Start the download process
      const response = await processVideo(url, format, quality, videoFormat, audioFormat);
      
      if (response.error) {
        setError(response.message);
      } else {
        // Set the download ID for tracking
        setDownloadId(response.downloadId);
      }
    } catch (err) {
      setError(err.message || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset to go back to selection
  const handleReset = () => {
    // Keep the metadata but clear the download ID
    setDownloadId(null);
    setError('');
  };
  
  return (
    <div className="download-form">
      <div className="form-header">
        <h2>YouTube Downloader</h2>
      </div>
      
      <form onSubmit={handleFetchMetadata}>
        <div className="url-input-container">
          <div className="form-group">
            <label htmlFor="url">YouTube URL</label>
            <div className="input-with-button">
              <input
                type="text"
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=... or https://music.youtube.com/playlist?list=..."
                className="form-control"
              />
              <button 
                type="submit" 
                className="btn btn-primary fetch-btn"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Go'}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {metadata && !downloadId && (
        <div className="metadata-section">
          <h3>{metadata.title}</h3>
          
          {metadata.isPlaylist ? (
            <div className="playlist-metadata">
              <p>Playlist • {metadata.playlistCount || 'Unknown'} videos</p>
              <p>By: {metadata.author}</p>
            </div>
          ) : (
            <>
              <p>Duration: {Math.floor(metadata.lengthSeconds / 60)}:{(metadata.lengthSeconds % 60).toString().padStart(2, '0')}</p>
              <p>By: {metadata.author}</p>
            </>
          )}
          
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
                <>
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
                </>
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
            </div>
            
            {metadata.isPlaylist && (
              <div className="playlist-notice">
                <p>
                  <strong>Note:</strong> This will download all videos in the playlist to a folder named after the playlist.
                </p>
              </div>
            )}
            
            <button 
              type="submit" 
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? 'Processing...' : metadata.isPlaylist ? 'Download Playlist' : 'Download Video'}
            </button>
          </form>
        </div>
      )}
      
      {downloadId && (
        <DownloadManager 
          downloadId={downloadId} 
          onReset={handleReset} 
        />
      )}
    </div>
  );
};

export default DownloadForm;
