import React, { useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ProtectedWrapper from '../components/ProtectedWrapper';

export const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfileData(data);
      } catch (err) {
        console.error('Failed to retrieve user profile details:', err);
        setError(err.message || 'Failed to retrieve profile analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="page-title">Operator Profile Node</h1>
        <p className="page-subtitle">Security credentials and real-time execution statistics</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <p className="error-message">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loader-container">
          <div className="loader-spinner"></div>
          <p>Retrieving session diagnostics...</p>
        </div>
      ) : (
        profileData && (
          <div className="profile-content-grid">
            {/* Operator Details */}
            <div className="profile-left-col">
              <ProtectedWrapper title="Credentials Authentication Details">
                <div className="profile-details-list">
                  <div className="profile-detail-item">
                    <span className="detail-label">OPERATOR NAME</span>
                    <span className="detail-value">{profileData.name}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">SECURE KEY EMAIL</span>
                    <span className="detail-value">{profileData.email}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">OPERATIONAL SINCE</span>
                    <span className="detail-value">{formatTimestamp(profileData.created_at)}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-label">SECURITY LEVEL</span>
                    <span className="detail-value security-badge">STANDARD KEY ADMINISTRATOR</span>
                  </div>
                </div>
                <button onClick={logout} className="action-btn logout-btn">
                  Terminate Access Session (Logout)
                </button>
              </ProtectedWrapper>
            </div>

            {/* Dynamic Analytics Stats Card */}
            <div className="profile-right-col">
              <ProtectedWrapper title="Live Session Analytics">
                <div className="analytics-card">
                  <div className="stat-card-glow"></div>
                  <div className="analytics-inner">
                    <span className="stat-icon">📊</span>
                    <p className="stat-label">TOTAL BINARY SCANS LOGGED</p>
                    <h2 className="stat-value count-up">{profileData.total_scans}</h2>
                    <p className="stat-desc">
                      The number of static heuristic mapping analyses executed under this session key.
                    </p>
                  </div>
                </div>
              </ProtectedWrapper>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Profile;
