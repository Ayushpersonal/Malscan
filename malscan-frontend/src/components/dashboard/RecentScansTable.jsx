import React from 'react';
import { Link } from 'react-router-dom';

export const RecentScansTable = ({ scans }) => {
  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch (e) {
      return isoString;
    }
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'critical':
        return 'risk-badge critical';
      case 'high':
        return 'risk-badge high';
      case 'medium':
        return 'risk-badge medium';
      case 'low':
      default:
        return 'risk-badge low';
    }
  };

  return (
    <div className="dashboard-card recent-scans-card">
      <div className="card-header-cyan">
        <h3 className="card-title font-mono">⚡ RECENT ANALYSIS DETECTIONS</h3>
      </div>
      <div className="card-body">
        {scans.length === 0 ? (
          <div className="empty-table-state font-mono">
            <p>No recent activity detected. Submit a binary for classification.</p>
          </div>
        ) : (
          <div className="recent-table-container">
            <table className="recent-table">
              <thead>
                <tr>
                  <th className="font-mono">Timestamp</th>
                  <th className="font-mono">Filename</th>
                  <th className="font-mono">Verdict</th>
                  <th className="font-mono">Confidence</th>
                  <th className="font-mono">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan, idx) => {
                  const isMalicious = scan.prediction.toLowerCase() === 'malware' || scan.prediction === '1';
                  return (
                    <tr key={idx}>
                      <td className="time-cell font-mono">{formatTimestamp(scan.scan_time)}</td>
                      <td className="file-cell font-mono">{scan.filename}</td>
                      <td>
                        <span className={`verdict-tag ${isMalicious ? 'malicious' : 'benign'}`}>
                          {isMalicious ? 'MALWARE' : 'BENIGN'}
                        </span>
                      </td>
                      <td className="conf-cell font-mono">{(scan.confidence * 100).toFixed(2)}%</td>
                      <td>
                        <span className={getRiskBadgeClass(scan.risk_level)}>
                          {scan.risk_level?.toUpperCase() || 'LOW'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentScansTable;
