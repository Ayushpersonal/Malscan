import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p>Syncing secure session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated requests to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
