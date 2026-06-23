import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  
  const { isAuthenticated, logout, user } = useContext(AuthContext);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.getHealth();
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      } finally {
        setChecking(false);
      }
    };

    checkConnection();
    // Poll connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">⚡</span> MALSCAN
        </Link>
        <span className="logo-tag">PE MALWARE CLASSIFIER</span>
      </div>
      
      <div className="nav-links">
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          Scanner
        </Link>
        
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
              History
            </Link>
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              Profile
            </Link>
            <button onClick={logout} className="nav-item nav-logout-btn">
              Logout ({user?.name || 'Session'})
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`nav-item ${location.pathname === '/login' ? 'active' : ''}`}>
              Login
            </Link>
            <Link to="/register" className={`nav-item ${location.pathname === '/register' ? 'active' : ''}`}>
              Register
            </Link>
          </>
        )}
      </div>

      <div className="connection-status">
        {checking ? (
          <span className="status-label checking">Checking...</span>
        ) : (
          <>
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span className={`status-label ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'BACKEND ONLINE' : 'BACKEND OFFLINE'}
            </span>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
