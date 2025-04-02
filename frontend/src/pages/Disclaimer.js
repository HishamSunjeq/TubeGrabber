import React from 'react';
import './Disclaimer.css';

const Disclaimer = () => {
  return (
    <div className="disclaimer-page">
      <h2>Legal Disclaimer</h2>
      
      <div className="disclaimer-content">
        <h3>Terms of Use</h3>
        <p>
          YTClipDownloader is a tool designed for personal use only. By using this service, you agree to the following terms:
        </p>
        
        <ul>
          <li>
            <strong>Personal Use Only:</strong> This tool is intended for personal, non-commercial use. You should only download content that you have the right to download.
          </li>
          <li>
            <strong>Copyright Compliance:</strong> Downloading copyrighted content without permission may violate YouTube's Terms of Service and copyright laws.
          </li>
          <li>
            <strong>Permitted Content:</strong> You should only download content that is:
            <ul>
              <li>Created by you</li>
              <li>Licensed under Creative Commons</li>
              <li>In the public domain</li>
              <li>Explicitly permitted for download by the content creator</li>
            </ul>
          </li>
          <li>
            <strong>No Liability:</strong> We are not responsible for how you use this tool or any consequences that may arise from your use of it.
          </li>
        </ul>
        
        <h3>DMCA Compliance</h3>
        <p>
          We respect the intellectual property rights of others and expect our users to do the same. If you believe that your copyrighted work has been used in a way that constitutes copyright infringement, please contact us immediately.
        </p>
        
        <h3>Privacy</h3>
        <p>
          We do not store any information about the videos you download or the URLs you enter. All downloads are processed temporarily and deleted within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default Disclaimer;
