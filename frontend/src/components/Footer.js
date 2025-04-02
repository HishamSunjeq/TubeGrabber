import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          &copy; {new Date().getFullYear()} YTClipDownloader. For personal use only.
        </p>
        <p className="disclaimer-text">
          Downloading copyrighted content may violate YouTube's Terms of Service.
          Only download content that you have the right to download.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
