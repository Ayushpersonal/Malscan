import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
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
    <div className="space-y-gutter pb-12 text-on-surface">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Security Overview</h2>
          <p className="text-on-surface-variant mt-1">Real-time threat monitoring and defensive analysis</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/')}
            className="bg-primary-container text-on-primary-container px-6 py-3 font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,219,233,0.2)] font-mono select-none"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            RUN NEW THREAT SCAN
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/10 border border-error/30 text-error p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p className="text-body-md">{error}</p>
        </div>
      )}

      {loading ? (
        /* High-tech Pulse Skeletons */
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-surface-elevated border border-outline-variant h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-surface-elevated border border-outline-variant h-72 rounded-lg"></div>
            <div className="lg:col-span-4 bg-surface-elevated border border-outline-variant h-72 rounded-lg"></div>
          </div>
          <div className="bg-surface-elevated border border-outline-variant h-64 rounded-lg"></div>
        </div>
      ) : !hasData ? (
        /* Zero Telemetry State */
        <div className="bg-surface-elevated border border-outline-variant rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <span className="material-symbols-outlined text-[64px] text-primary-fixed-dim mb-4 select-none">sensors_off</span>
          <h3 className="font-title-md text-title-md font-bold mb-2">NO TELEMETRY DATA CAPTURED YET</h3>
          <p className="text-on-surface-variant max-w-sm mb-6 text-body-md">Scan your first binary target to generate threat distribution maps and analytical charts.</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-primary-fixed-dim text-on-primary-fixed font-bold px-8 py-3 rounded hover:brightness-110 active:scale-95 transition-all shadow-md select-none"
          >
            Launch Static Classifier
          </button>
        </div>
      ) : (
        /* Loaded Telemetry Layout */
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* 1. Stats Counter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total Scans" 
              value={stats.total_scans} 
              icon="analytics" 
              type="total"
              description="Overall targets analyzed"
            />
            <StatsCard 
              title="Malware Detected" 
              value={stats.malware_count} 
              icon="dangerous" 
              type="malware"
              description={`${distribution?.malware_percentage?.toFixed(1) || 0}% ratio detected`}
            />
            <StatsCard 
              title="Benign Files" 
              value={stats.benign_count} 
              icon="verified_user" 
              type="benign"
              description={`${distribution?.benign_percentage?.toFixed(1) || 0}% ratio cleared`}
            />
            <StatsCard 
              title="Average Confidence" 
              value={`${(stats.average_confidence * 100).toFixed(0)}%`} 
              icon="query_stats" 
              type="confidence"
              description="XGBoost confidence rate"
            />
          </div>

          {/* 2. Visual Graphs Matrix */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-surface-elevated border border-outline-variant p-6 rounded-lg">
              <h4 className="font-title-md text-title-md text-primary mb-1 select-none">Scan Volume Trend</h4>
              <p className="text-body-md text-on-surface-variant mb-6 select-none">Weekly throughput of intelligence processing</p>
              <div className="h-64">
                <ScanTrendChart trends={trends} />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 bg-surface-elevated border border-outline-variant p-6 rounded-lg flex flex-col">
              <h4 className="font-title-md text-title-md text-primary mb-1 select-none">Threat Ratio</h4>
              <p className="text-body-md text-on-surface-variant mb-6 select-none">Distribution of file classifications</p>
              <div className="flex-1 flex items-center justify-center h-48">
                <ThreatDistributionChart data={distribution} />
              </div>
            </div>
          </div>

          {/* 3. Risk charts & actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-elevated border border-outline-variant p-6 rounded-lg">
              <h4 className="font-title-md text-title-md text-primary mb-4 select-none">Risk Distribution</h4>
              <RiskDistributionChart distribution={stats.risk_distribution} />
            </div>
            <div className="bg-surface-elevated border border-outline-variant p-6 rounded-lg">
              <h4 className="font-title-md text-title-md text-primary mb-4 select-none">Quick Actions</h4>
              <QuickActions />
            </div>
          </div>

          {/* 4. Recent D Detections List */}
          <div className="w-full">
            <RecentScansTable scans={recent} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
