import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const COMPARE_LABELS = {
  task_size: 'Image Size (bytes)',
  total_vm: 'Total VM Pages',
  exec_vm: 'Exec VM Pages',
  shared_vm: 'Shared VM Pages',
  reserved_vm: 'Reserved VM Pages',
  map_count: 'Mapped Areas',
  hiwater_rss: 'Peak RSS',
  static_prio: 'Static Priority',
  prio: 'Dynamic Priority',
  nivcsw: 'Involuntary Context Switches',
  nvcsw: 'Voluntary Context Switches',
  vm_truncate_count: 'W+X Sections',
  min_flt: 'Minor Faults',
  maj_flt: 'Major Faults',
  lock: 'Digital Signature (lock)',
  state: 'Task State',
  policy: 'Scheduling Policy',
  utime: 'User CPU Time',
  stime: 'System CPU Time',
  nr_ptes: 'Page Table Entries',
};

const getDeltaColor = (delta, direction) => {
  if (delta === 0) return '#8E919A';
  if (direction === 'increase') return '#FF3B3B'; // malware-indicator
  return '#00FF94'; // benign-indicator
};

const formatPctChange = (pct) => {
  if (pct === null || pct === undefined) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
};

export const ScanComparison = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const preA = params.get('a') || '';
  const preB = params.get('b') || '';

  const [scanA, setScanA] = useState(preA);
  const [scanB, setScanB] = useState(preB);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getUserHistory().then(setHistory).catch(() => {});
    if (preA && preB) {
      runComparison(preA, preB);
    }
  }, []);

  const runComparison = async (a, b) => {
    if (!a || !b) {
      setError('Select two different scan records to compare.');
      return;
    }
    if (a === b) {
      setError('Select two different scans. Comparing a scan to itself is not supported.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.compareScansDelta(a, b);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Comparison failed. Ensure both scan IDs belong to your account.');
    } finally {
      setLoading(false);
    }
  };

  const verdictBadge = (scan) => {
    const isMalware = scan?.prediction?.toLowerCase() === 'malware' || scan?.prediction === '1';
    return (
      <span className={`px-2 py-0.5 border rounded-sm font-label-code text-[10px] select-none font-bold ${
        isMalware 
          ? 'bg-status-malware/10 text-status-malware border-status-malware/20' 
          : 'bg-status-benign/10 text-status-benign border-status-benign/20'
      }`}>
        {isMalware ? '☣️ MALWARE' : '🛡️ BENIGN'}
      </span>
    );
  };

  return (
    <div className="space-y-gutter pb-12 relative text-on-surface">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed-dim/5 blur-[120px] rounded-full -z-10"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-outline font-label-code text-label-code mb-2 select-none">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/history')}>HISTORY</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary-fixed-dim">STRUCTURAL DELTA DIFF</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Binary Structural Comparison Engine</h2>
          <p className="text-on-surface-variant font-mono text-xs mt-1">Delta-diff scan records across 20 diagnostic metrics</p>
        </div>
      </div>

      {/* Selectors card */}
      <div className="bg-surface-charcoal border border-outline-variant p-6 rounded-lg space-y-6">
        <h3 className="font-title-md text-title-md text-primary select-none font-semibold">Select Scans to Compare</h3>
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          <div className="md:col-span-5 flex flex-col gap-2">
            <label className="font-label-code text-[10px] text-outline font-mono select-none">SCAN A (Baseline)</label>
            <select
              value={scanA}
              onChange={e => setScanA(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-xs font-mono text-primary focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim w-full"
            >
              <option value="">— Select Scan A —</option>
              {history.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.prediction?.toUpperCase()}] {s.filename} — {s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 text-center font-mono text-outline text-lg select-none">⇆</div>

          <div className="md:col-span-5 flex flex-col gap-2">
            <label className="font-label-code text-[10px] text-outline font-mono select-none">SCAN B (Comparison)</label>
            <select
              value={scanB}
              onChange={e => setScanB(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-xs font-mono text-primary focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim w-full"
            >
              <option value="">— Select Scan B —</option>
              {history.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.prediction?.toUpperCase()}] {s.filename} — {s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-error-container/10 border border-error/30 text-error p-3 rounded font-mono text-[13px]">
            ❌ {error}
          </div>
        )}

        <button
          onClick={() => runComparison(scanA, scanB)}
          disabled={loading || !scanA || !scanB}
          className="w-full bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-title-md py-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] transition-all font-mono font-semibold"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-on-primary-fixed/20 border-t-on-primary-fixed rounded-full animate-spin"></span>
              <span>COMPUTING DELTA...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">analytics</span>
              <span>RUN STRUCTURAL COMPARISON</span>
            </>
          )}
        </button>
      </div>

      {/* Results details */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[result.scan_a, result.scan_b].map((scan, idx) => (
              <div key={idx} className="bg-surface-charcoal border border-outline-variant p-6 rounded-lg flex flex-col gap-4">
                <h4 className="font-title-md text-xs font-bold font-mono text-primary border-b border-outline-variant/30 pb-2 truncate">
                  SCAN {idx === 0 ? 'A (Baseline)' : 'B (Comparison)'}: {scan.filename}
                </h4>
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-outline text-[10px]">VERDICT</span>
                    <span>{verdictBadge(scan)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-outline text-[10px]">CONFIDENCE</span>
                    <span className="text-on-surface font-bold text-sm">{(scan.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-outline text-[10px]">SHA256 SIGNATURE</span>
                    <span className="text-on-surface break-all text-[11px]">{scan.sha256?.slice(0, 24)}...</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-outline text-[10px]">TIMESTAMP</span>
                    <span className="text-on-surface">{new Date(scan.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delta comparison table */}
          <div className="bg-surface-charcoal border border-outline-variant rounded-lg overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-container select-none">
              <h4 className="font-title-md text-xs font-semibold text-primary font-mono uppercase tracking-wider">Feature Delta Matrix — Scan B vs Scan A</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-surface-container-low text-outline text-[10px] uppercase tracking-wider select-none border-b border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4">Feature Metric</th>
                    <th className="px-6 py-4 text-right">Scan A (Base)</th>
                    <th className="px-6 py-4 text-right">Scan B (Comp)</th>
                    <th className="px-6 py-4 text-right">Δ Delta</th>
                    <th className="px-6 py-4 text-right">% Change</th>
                    <th className="px-6 py-4 text-center">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                  {Object.entries(result.delta_map).map(([key, d]) => {
                    const color = getDeltaColor(d.delta, d.direction);
                    return (
                      <tr key={key} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface-variant font-sans text-sm">
                          {COMPARE_LABELS[key] || key}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">{d.scan_a}</td>
                        <td className="px-6 py-4 text-right font-bold text-primary">{d.scan_b}</td>
                        <td className="px-6 py-4 text-right font-bold text-sm font-mono" style={{ color }}>
                          {d.delta > 0 ? '+' : ''}{d.delta}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-sm font-mono" style={{ color }}>
                          {formatPctChange(d.percent_change)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span 
                            className="px-2 py-0.5 border rounded-sm font-bold text-[10px] select-none uppercase tracking-wider animate-in fade-in" 
                            style={{ color, borderColor: color + '30', backgroundColor: color + '10' }}
                          >
                            {d.direction === 'increase' ? '▲ Increase' : d.direction === 'decrease' ? '▼ Decrease' : '— Stable'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanComparison;
