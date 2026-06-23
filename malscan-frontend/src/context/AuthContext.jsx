import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state on application load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('malscan_token');
      const storedUser = localStorage.getItem('malscan_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Attempt a live profile sync to verify token validity
        try {
          const profile = await api.getProfile();
          const syncedUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            created_at: profile.created_at,
          };
          setUser(syncedUser);
          localStorage.setItem('malscan_user', JSON.stringify(syncedUser));
        } catch (err) {
          console.error('Session validation failed. User profile sync error:', err);
          // If profile fetch fails (e.g. token expired), clear credentials
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const data = await api.login(email, password);
      const userPayload = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        created_at: data.user.created_at,
      };

      setToken(data.access_token);
      setUser(userPayload);

      localStorage.setItem('malscan_token', data.access_token);
      localStorage.setItem('malscan_user', JSON.stringify(userPayload));
      
      return userPayload;
    } catch (err) {
      console.error('Login action failed:', err);
      throw err;
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      await api.register(name, email, password);
      // Auto-login on registration success
      return await handleLogin(email, password);
    } catch (err) {
      console.error('Registration action failed:', err);
      throw err;
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('malscan_token');
    localStorage.removeItem('malscan_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
