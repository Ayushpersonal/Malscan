import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [error, setError] = useState('');
  const [compareA, setCompareA] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getUserHistory();
        setHistory(data);
        setIsDbOffline(false);
      } catch (err) {
        console.error('History fetch failed:', err);
        if (err.status === 503 || err.status === 0) {
          setIsDbOffline(true);
        } else {
          setError(err.message || 'Failed to retrieve scan history logs.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString();
    } catch (e) {
      return isoString;
    }
  };

  const handleSelectForCompare = (item) => {
    if (!compareA) {
      setCompareA(item);
    } else if (compareA.id === item.id) {
      setCompareA(null);
    } else {
      navigate(`/compare?a=${compareA.id}&b=${item.id}`);
      setCompareA(null);
    }
  };

  const totalScans = history.length;
  const malwareCount = history.filter(s => s.prediction?.toLowerCase() === 'malware' || s.prediction === '1').length;
  const cleanPercentage = totalScans > 0 ? (((totalScans - malwareCount) / totalScans) * 100).toFixed(1) : '100';

  return (
    <div className="space-y-gutter pb-12 text-on-surface">
      {/* Header section */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Scan History</h2>
          <p className="text-on-surface-variant mt-1">Reviewing {totalScans} processed intelligence units</p>
        </div>
        <div className="flex gap-3 font-mono">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg text-body-md select-none">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filters
          </button>
        </div>
      </div>

      {compareA && (
        <div className="p-4 bg-primary/10 border border-primary-fixed-dim rounded-lg flex items-center justify-between text-primary font-mono text-[13px]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">swap_horiz</span>
            <span>BASELINE SET: <strong>{compareA.filename}</strong> — Click the "COMPARE" button on another file to run diff</span>
          </div>
          <button onClick={() => setCompareA(null)} className="text-on-surface-variant hover:text-primary">
            ✕ CANCEL
          </button>
        </div>
      )}

      {isDbOffline && (
        <div className="bg-status-medium/10 border border-status-medium/30 p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-status-medium">warning</span>
          <div>
            <h4 className="font-semibold text-status-medium uppercase text-xs tracking-wider">Local History Database Offline</h4>
            <p className="text-[11px] text-on-surface-variant">Displaying Isolation logs only. History recording is currently offline.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error-container/10 border border-error/30 text-error p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p className="text-body-md">{error}</p>
        </div>
      )}

      {/* Summary Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter select-none">
        <div className="bg-surface-elevated border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <span className="text-label-code text-[11px] text-on-surface-variant uppercase tracking-wider font-label-code">Total Scans</span>
          <p className="text-headline-lg font-bold mt-2 text-primary">{totalScans}</p>
          <div className="mt-4 flex items-center text-status-benign text-[11px] font-mono">
            <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
            Active database tracking
          </div>
        </div>
        <div className="bg-surface-elevated border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <span className="text-label-code text-[11px] text-on-surface-variant uppercase tracking-wider font-label-code">Malware Detected</span>
          <p className="text-headline-lg font-bold mt-2 text-status-malware">{malwareCount}</p>
          <div className="mt-4 flex items-center text-status-malware text-[11px] font-mono">
            <span className="material-symbols-outlined text-[16px] mr-1">warning</span>
            Threat incidents flag
          </div>
        </div>
        <div className="bg-surface-elevated border border-outline-variant p-6 rounded-xl md:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <span className="text-label-code text-[11px] text-on-surface-variant uppercase tracking-wider font-label-code">Clean Clearance Rate</span>
            <p className="text-headline-lg font-bold mt-2 text-status-benign">{cleanPercentage}%</p>
            <p className="text-body-md text-on-surface-variant mt-2 max-w-[280px]">Real-time cloud analysis engine performing at peak capacity.</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] text-primary">analytics</span>
          </div>
        </div>
      </div>

      {/* List of cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-surface-charcoal h-24 rounded-xl border border-outline-variant"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-surface-elevated border border-outline-variant rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-[64px] text-primary-fixed-dim mb-4">folder_open</span>
          <h3 className="font-title-md text-title-md font-bold mb-2">No Audit Records Available</h3>
          <p className="text-on-surface-variant max-w-sm mb-6 text-body-md">
            {isDbOffline 
              ? 'History logs are unavailable because the cloud database is disconnected.' 
              : 'No files have been scanned yet. Return to the dashboard to scan your first executable.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isMalicious = item.prediction?.toLowerCase() === 'malware' || item.prediction === '1';
            const isCompareA = compareA?.id === item.id;
            return (
              <div 
                key={item.id} 
                className={`group bg-surface-charcoal border hover:border-primary-fixed-dim transition-all duration-300 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden ${
                  isCompareA ? 'border-primary-fixed-dim' : 'border-outline-variant'
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMalicious ? 'bg-status-malware' : 'bg-status-benign'}`}></div>
                
                <div className="flex-shrink-0 w-12 h-12 bg-surface-container-high rounded-lg flex items-center justify-center">
                  <span className={`material-symbols-outlined ${isMalicious ? 'text-status-malware' : 'text-status-benign'}`}>
                    {isMalicious ? 'dangerous' : 'verified_user'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-on-surface truncate font-mono text-[15px]">{item.filename}</h4>
                  <p className="font-label-code text-[11px] text-on-surface-variant font-mono">SHA256: {item.sha256 ? `${item.sha256.slice(0, 16)}...` : 'N/A'}</p>
                </div>
                
                <div className="flex flex-col text-left min-w-[120px]">
                  <span className="text-[10px] font-label-code text-on-surface-variant uppercase font-mono">Prediction</span>
                  <span className={`font-bold text-[13px] ${isMalicious ? 'text-status-malware' : 'text-status-benign'}`}>
                    {isMalicious ? 'Malicious' : 'Clean / Benign'}
                  </span>
                </div>
                
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-label-code text-on-surface-variant uppercase font-mono">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isMalicious ? 'bg-status-malware' : 'bg-status-benign'}`}
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-label-code text-on-surface text-[12px] font-mono">{(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="flex flex-col min-w-[150px]">
                  <span className="text-[10px] font-label-code text-on-surface-variant uppercase font-mono">Analyzed At</span>
                  <span className="text-on-surface-variant text-[12px] font-mono">{formatTimestamp(item.timestamp)}</span>
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleSelectForCompare(item)}
                    className={`px-3 py-1.5 border rounded font-mono text-[11px] font-bold select-none ${
                      isCompareA 
                        ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim border-primary-fixed-dim' 
                        : 'border-outline-variant text-on-surface-variant hover:border-primary-fixed-dim hover:text-primary'
                    }`}
                  >
                    {isCompareA ? '✓ SET' : '⇆ COMPARE'}
                  </button>
                  <button 
                    onClick={() => navigate(`/scan/${item.id}`)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined font-semibold">chevron_right</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
