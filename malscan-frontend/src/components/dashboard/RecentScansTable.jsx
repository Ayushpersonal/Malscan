import React from 'react';
import { useNavigate } from 'react-router-dom';

export const RecentScansTable = ({ scans }) => {
  const navigate = useNavigate();

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="bg-surface-elevated border border-outline-variant rounded-lg overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center">
        <h4 className="font-title-md text-title-md text-primary">Live Scan Activity</h4>
        <button 
          onClick={() => navigate('/history')}
          className="text-primary-fixed-dim hover:underline text-label-code flex items-center gap-1 font-label-code text-[11px] select-none"
        >
          VIEW ALL HISTORY <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        {scans.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-mono text-body-md select-none">
            <p>No recent activity detected. Submit a binary for classification.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-surface-container font-label-code text-on-surface-variant text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Threat Level</th>
                <th className="px-6 py-4 font-mono">Source Hash</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-md text-on-surface">
              {scans.map((scan, idx) => {
                const isMalicious = scan.prediction?.toLowerCase() === 'malware' || scan.prediction === '1';
                return (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <span className={`material-symbols-outlined ${isMalicious ? 'text-status-malware' : 'text-primary-fixed-dim'}`}>
                        {isMalicious ? 'warning' : 'description'}
                      </span>
                      <span className="font-bold truncate max-w-[200px]">{scan.filename}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 border rounded-sm text-label-code text-[10px] select-none font-bold ${
                        isMalicious 
                          ? 'bg-status-malware/10 text-status-malware border-status-malware/20' 
                          : 'bg-status-benign/10 text-status-benign border-status-benign/20'
                      }`}>
                        {isMalicious ? 'MALWARE' : 'BENIGN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-label-code text-[12px] text-on-surface-variant">
                      <code>{scan.sha256 ? `${scan.sha256.slice(0, 8)}...` : 'N/A'}</code>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant text-body-md">
                      {formatTimestamp(scan.scan_time || scan.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/scan/${scan.id}`)}
                        className="p-1 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors flex items-center"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentScansTable;
