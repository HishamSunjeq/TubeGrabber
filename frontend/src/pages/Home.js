import React from 'react';
import DownloadForm from '../components/DownloadForm';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h2>Download YouTube Videos and Audio</h2>
        <p>
          Simply paste a YouTube URL, choose your format, and download your content.
        </p>
      </div>
      
      <DownloadForm />
      
      <div className="features-section">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>Video Downloads</h4>
            <p>Download videos in MP4 format with multiple quality options.</p>
          </div>
          
          <div className="feature-card">
            <h4>Audio Extraction</h4>
            <p>Extract audio in MP3 format from any YouTube video.</p>
          </div>
          
          <div className="feature-card">
            <h4>Fast Processing</h4>
            <p>Our servers process your request quickly and efficiently.</p>
          </div>
          
          <div className="feature-card">
            <h4>Simple Interface</h4>
            <p>Easy-to-use interface with minimal steps to download.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
