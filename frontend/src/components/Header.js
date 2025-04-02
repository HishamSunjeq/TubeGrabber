import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">
          <Link to="/">
            <h1>YTClipDownloader</h1>
          </Link>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/disclaimer">Disclaimer</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
