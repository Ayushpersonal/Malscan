import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('malscan_token');
    localStorage.removeItem('malscan_user');
    window.location.href = '/';
  };

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono">
        <div className="w-10 h-10 border-4 border-primary-fixed-dim/10 border-t-primary-fixed-dim rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant">Retrieving session diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-gutter pb-12 text-on-surface">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Security Analyst Profile</h2>
          <p className="text-on-surface-variant mt-1">Real-time analyst workspace configurations and node authorization</p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/10 border border-error/30 text-error p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p className="text-body-md">{error}</p>
        </div>
      )}

      {profileData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Left Column: User Info Card & Certifications */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-elevated border border-outline-variant rounded-xl overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-electric-blue/20 to-primary-container/20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated to-transparent"></div>
              </div>
              <div className="px-6 pb-6 -mt-12 relative z-10 text-center">
                <div className="w-24 h-24 rounded-2xl mx-auto border-4 border-surface-elevated overflow-hidden mb-4 shadow-xl bg-surface-container-highest flex items-center justify-center text-4xl text-primary font-bold font-mono uppercase">
                  {profileData.name?.slice(0, 2)}
                </div>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">{profileData.name}</h3>
                <p className="text-on-surface-variant font-label-code text-xs font-mono">{profileData.email}</p>
                <div className="mt-4 flex justify-center gap-2 font-mono">
                  <span className="px-3 py-1 bg-primary-fixed-dim/10 text-primary-fixed-dim rounded-full text-[10px] border border-primary-fixed-dim/20 font-bold">ADMIN</span>
                  <span className="px-3 py-1 bg-teal-accent/10 text-teal-accent rounded-full text-[10px] border border-teal-accent/20 font-bold">SOC-OPS</span>
                </div>
              </div>
            </div>

            {/* Certifications Status */}
            <div className="bg-surface-elevated border border-outline-variant rounded-xl p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-primary-fixed-dim font-mono text-sm select-none">
                <span className="material-symbols-outlined">verified</span>
                Certification Status
              </h4>
              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">CISSP Professional</span>
                  <span className="text-status-benign font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">GIAC Mal. Analysis</span>
                  <span className="text-status-benign font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Active Threat Scans</span>
                  <span className="text-primary-fixed-dim font-bold">{profileData.total_scans} RUNS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Account Settings & Security Controls */}
          <div className="lg:col-span-2 space-y-gutter">
            {/* Account Settings */}
            <div className="bg-surface-elevated border border-outline-variant rounded-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-title-md font-title-md text-on-surface font-bold">Account Settings</h4>
                <button className="text-primary-fixed-dim font-bold hover:underline transition-all font-mono text-[13px]">Save Changes</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-label-code text-on-surface-variant uppercase text-[11px] font-mono">Full Name</label>
                  <input 
                    className="w-full bg-background border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim focus:outline-none transition-all text-on-surface font-body-md" 
                    type="text" 
                    value={profileData.name} 
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-code text-on-surface-variant uppercase text-[11px] font-mono">Email Address</label>
                  <input 
                    className="w-full bg-background border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim focus:outline-none transition-all text-on-surface font-body-md" 
                    type="email" 
                    value={profileData.email} 
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-code text-on-surface-variant uppercase text-[11px] font-mono">Designation</label>
                  <input 
                    className="w-full bg-background border border-outline-variant rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-fixed-dim focus:border-primary-fixed-dim focus:outline-none transition-all text-on-surface font-body-md" 
                    type="text" 
                    value="Lead Threat Analyst" 
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-code text-on-surface-variant uppercase text-[11px] font-mono">Employee ID</label>
                  <input 
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-on-surface-variant font-label-code cursor-not-allowed font-mono" 
                    disabled 
                    type="text" 
                    value={`MS-${profileData.id ? profileData.id.slice(0, 4).toUpperCase() : '7742'}-INT`} 
                  />
                </div>
              </div>
            </div>

            {/* Security Controls */}
            <div className="bg-surface-elevated border border-outline-variant rounded-xl p-8">
              <h4 className="text-title-md font-title-md text-on-surface mb-6 font-bold">Security &amp; Authentication</h4>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-fixed-dim/20 rounded flex items-center justify-center text-primary-fixed-dim">
                      <span className="material-symbols-outlined">shield</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Two-Factor Authentication (MFA)</p>
                      <p className="text-[11px] text-on-surface-variant font-mono">Recommended: Authenticator App enabled</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer select-none">
                    <div className="w-11 h-6 bg-status-benign rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:translate-x-full transition-all"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg border border-outline-variant">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-electric-blue/20 rounded flex items-center justify-center text-electric-blue">
                      <span className="material-symbols-outlined">key</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">Hardware Security Key</p>
                      <p className="text-[11px] text-on-surface-variant font-mono">Yubikey or Titan Security Keys</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors font-bold font-mono text-[11px]">CONFIGURE</button>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-4 font-mono">
                  <button 
                    onClick={handleLogout}
                    className="flex-1 px-6 py-3 border border-status-malware text-status-malware font-bold rounded-lg hover:bg-status-malware/10 transition-all text-center text-xs"
                  >
                    Reset Password / Revoke Key
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex-1 px-6 py-3 border border-outline-variant text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-high transition-all text-center text-xs"
                  >
                    Logout of All Devices
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
