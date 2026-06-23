import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ProtectedWrapper from '../components/ProtectedWrapper';

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
      return d.toLocaleString();
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

  return (
    <div className="history-container">
      <div className="history-header">
        <h1 className="page-title">Scan Audit Logs</h1>
        <p className="page-subtitle">Historical records of scanned binaries and classification results</p>
      </div>

      {compareA && (
        <div className="compare-banner">
          <span className="compare-banner-icon">⇆</span>
          <span className="compare-banner-text font-mono">
            BASELINE SET: <strong>{compareA.filename}</strong> — Now click another row to run comparison
          </span>
          <button onClick={() => setCompareA(null)} className="compare-cancel-btn font-mono">
            ✕ CANCEL
          </button>
        </div>
      )}

      {isDbOffline && (
        <div className="warning-banner">
          <div className="warning-content">
            <span className="warning-icon">⚠️</span>
            <div>
              <h4 className="warning-title">Local History Database Offline</h4>
              <p className="warning-desc">Displaying Real-Time Isolation Mode. Scans run correctly using static heuristics but history logging is suspended.</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <p className="error-message">{error}</p>
        </div>
      )}

      <ProtectedWrapper title="Audit Records Database">
        {loading ? (
          <div className="loader-container-small">
            <div className="loader-spinner-small"></div>
            <p>Querying MongoDB logs...</p>
          </div>
        ) : isDbOffline || history.length === 0 ? (
          <div className="empty-history-state">
            <span className="empty-icon">📁</span>
            <h3>No Audit Records Available</h3>
            <p>
              {isDbOffline 
                ? 'History logs are unavailable because the cloud database is disconnected.' 
                : 'No files have been scanned yet. Return to the dashboard to scan your first executable.'}
            </p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Filename</th>
                  <th>SHA256 Hash</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const isMalicious = item.prediction.toLowerCase() === 'malware' || item.prediction === '1';
                  const isCompareA = compareA?.id === item.id;
                  return (
                    <tr key={item.id} className={isCompareA ? 'compare-a-selected-row' : ''}>
                      <td className="timestamp-col">{formatTimestamp(item.timestamp)}</td>
                      <td className="filename-col">{item.filename}</td>
                      <td className="hash-col">{item.sha256}</td>
                      <td>
                        <span className={`verdict-tag ${isMalicious ? 'malicious' : 'benign'}`}>
                          {isMalicious ? 'MALWARE' : 'BENIGN'}
                        </span>
                      </td>
                      <td className="confidence-col">{(item.confidence * 100).toFixed(2)}%</td>
                      <td className="actions-col">
                        <Link
                          to={`/scan/${item.id}`}
                          className="tbl-action-btn view-btn font-mono"
                          title="Deep threat cockpit"
                        >
                          🔍 ANALYZE
                        </Link>
                        <button
                          onClick={() => handleSelectForCompare(item)}
                          className={`tbl-action-btn compare-btn font-mono ${isCompareA ? 'compare-a-active' : ''}`}
                          title={compareA ? (isCompareA ? 'Deselect' : 'Compare with baseline') : 'Set as baseline for comparison'}
                        >
                          {isCompareA ? '✓ SET' : '⇆ COMPARE'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ProtectedWrapper>
    </div>
  );
};

export default History;
