import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import RecentScansTable from '../components/dashboard/RecentScansTable';
import ThreatDistributionChart from '../components/dashboard/ThreatDistributionChart';
import ScanTrendChart from '../components/dashboard/ScanTrendChart';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import QuickActions from '../components/dashboard/QuickActions';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trends, setTrends] = useState(null);
  const [distribution, setDistribution] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Parallel endpoint queries
      const [statsData, recentData, trendsData, distData] = await Promise.all([
        api.getDashboardStats(),
        api.getRecentScans(),
        api.getScanTrends(),
        api.getThreatDistribution(),
      ]);

      setStats(statsData);
      setRecent(recentData);
      setTrends(trendsData);
      setDistribution(distData);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'Failed to query threat intelligence database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const hasData = stats && stats.total_scans > 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">SOC Analytics & Threat Intelligence</h1>
        <p className="page-subtitle">Multi-tenant threat telemetry tracking and classifier performance maps</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <p className="error-message">{error}</p>
        </div>
      )}

      {loading ? (
        /* High-tech Pulse Skeletons */
        <div className="skeleton-container pulse-animation">
          <div className="skeleton-stats-grid">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
          <div className="skeleton-charts-grid">
            <div className="skeleton-chart-box"></div>
            <div className="skeleton-chart-box"></div>
          </div>
          <div className="skeleton-table-box"></div>
        </div>
      ) : !hasData ? (
        /* Zero Telemetry State */
        <div className="empty-dashboard-container font-mono">
          <span className="empty-dashboard-icon">📡</span>
          <h2>NO TELEMETRY DATA CAPTURED YET</h2>
          <p>Scan your first binary target to generate threat distribution maps and analytical charts.</p>
          <button onClick={() => window.location.href = '/'} className="action-btn">
            Launch Static Classifier
          </button>
        </div>
      ) : (
        /* Loaded Telemetry Layout */
        <div className="dashboard-content">
          {/* 1. Stats Counter Row */}
          <div className="stats-row-grid">
            <StatsCard 
              title="TOTAL TARGETS SCANNED" 
              value={stats.total_scans} 
              icon="⚡" 
              type="total"
              description="Overall binaries analyzed"
            />
            <StatsCard 
              title="MALICIOUS VERDICTS" 
              value={stats.malware_count} 
              icon="☣️" 
              type="malware"
              description={`${distribution?.malware_percentage?.toFixed(1) || 0}% ratio detected`}
            />
            <StatsCard 
              title="BENIGN VERDICTS" 
              value={stats.benign_count} 
              icon="🛡️" 
              type="benign"
              description={`${distribution?.benign_percentage?.toFixed(1) || 0}% ratio cleared`}
            />
            <StatsCard 
              title="AVERAGE SCAN CONFIDENCE" 
              value={`${(stats.average_confidence * 100).toFixed(1)}%`} 
              icon="📊" 
              type="confidence"
              description="XGBoost model confidence rate"
            />
          </div>

          {/* 2. Visual Graphs Matrix */}
          <div className="dashboard-charts-grid">
            <ScanTrendChart trends={trends} />
            <ThreatDistributionChart data={distribution} />
            <RiskDistributionChart distribution={stats.risk_distribution} />
            <QuickActions />
          </div>

          {/* 3. Recent Detections List */}
          <div className="dashboard-table-row">
            <RecentScansTable scans={recent} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
