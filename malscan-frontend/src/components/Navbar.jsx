import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
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
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('malscan_token');
    localStorage.removeItem('malscan_user');
    window.location.href = '/';
  };

  const navItemClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-6 py-3 transition-colors duration-200 active:scale-[0.98] transition-transform duration-150 ${
      isActive 
        ? 'text-primary-fixed-dim font-bold border-r-2 border-primary-fixed-dim bg-surface-container-high' 
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
    }`;
  };

  return (
    <>
      {/* SideNavBar Shell */}
      <aside className="bg-surface-dim dark:bg-surface-dim h-full w-64 fixed left-0 top-0 border-r border-outline-variant dark:border-outline-variant flex flex-col py-margin-desktop z-[60]">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-fixed-dim rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-fixed font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          <div>
            <h1 className="text-title-md font-title-md font-bold text-primary dark:text-primary">MalScan</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-label-code">Threat Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={navItemClass('/dashboard')}>
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </Link>
              <Link to="/scan" className={navItemClass('/scan')}>
                <span className="material-symbols-outlined">upload_file</span>
                <span>Scan File</span>
              </Link>
              <Link to="/history" className={navItemClass('/history')}>
                <span className="material-symbols-outlined">history</span>
                <span>Scan History</span>
              </Link>
              <Link to="/profile" className={navItemClass('/profile')}>
                <span className="material-symbols-outlined">person</span>
                <span>Profile</span>
              </Link>
              <Link to="/antigravity" className={navItemClass('/antigravity')}>
                <span className="material-symbols-outlined">rocket_launch</span>
                <span>Antigravity Console</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={navItemClass('/login')}>
                <span className="material-symbols-outlined">login</span>
                <span>Login</span>
              </Link>
              <Link to="/register" className={navItemClass('/register')}>
                <span className="material-symbols-outlined">how_to_reg</span>
                <span>Register</span>
              </Link>
            </>
          )}
        </nav>

        <div className="mt-auto px-4 pt-4 border-t border-outline-variant space-y-2">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-code text-label-code">Settings</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-code text-label-code">Support</span>
          </a>
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-error-container hover:bg-error text-on-error-container hover:text-on-error font-bold rounded-lg transition-all"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* TopNavBar Shell */}
      <header className="flex justify-between items-center h-16 px-margin-desktop w-full ml-64 max-w-[calc(100%-16rem)] bg-surface-dim/80 dark:bg-surface-dim/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant dark:border-outline-variant">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary-fixed-dim">search</span>
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim transition-all" 
              placeholder="Search threats, hash, or file names..." 
              type="text" 
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button className="hover:text-primary transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-status-malware rounded-full border border-surface-dim"></span>
            </button>
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined">shield</span>
            </button>
            <button className="hover:text-primary transition-colors">
              <span className="material-symbols-outlined">sync</span>
            </button>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-body-md font-bold text-on-surface leading-none mb-1">{user ? user.name : 'Guest Operator'}</p>
              <p className={`text-[10px] flex items-center justify-end gap-1 ${isOnline ? 'text-status-benign' : 'text-status-malware'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-status-benign animate-pulse' : 'bg-status-malware'}`}></span>
                {checking ? 'CHECKING...' : isOnline ? 'SYSTEM SECURE' : 'BACKEND OFFLINE'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant overflow-hidden flex items-center justify-center font-bold text-primary font-mono uppercase">
              {user ? user.name.slice(0, 2) : 'GO'}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
