import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import ProtectedWrapper from '../components/ProtectedWrapper';

const COMPARE_LABELS = {
  task_size: 'Image Size',
  total_vm: 'Total VM Pages',
  exec_vm: 'Exec VM Pages',
  shared_vm: 'Shared VM Pages',
  reserved_vm: 'Reserved VM Pages',
  map_count: 'Mapped Areas',
  hiwater_rss: 'Peak RSS',
  static_prio: 'Static Priority',
  prio: 'Dynamic Priority',
  nivcsw: 'Involuntary CSW',
  nvcsw: 'Voluntary CSW',
  vm_truncate_count: 'W+X Sections',
  min_flt: 'Minor Faults',
  maj_flt: 'Major Faults',
  lock: 'Digital Signature',
  state: 'Task State',
  policy: 'Scheduling Policy',
  utime: 'User CPU Time',
  stime: 'System CPU Time',
  nr_ptes: 'Page Table Entries',
};

const getDeltaColor = (delta, direction) => {
  if (delta === 0) return '#8E919A';
  if (direction === 'increase') return '#FF1744';
  return '#00E676';
};

const formatPctChange = (pct) => {
  if (pct === null || pct === undefined) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
};

export const ScanComparison = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preA = params.get('a') || '';
  const preB = params.get('b') || '';

  const [scanA, setScanA] = useState(preA);
  const [scanB, setScanB] = useState(preB);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load history for the scan picker
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
      setError('Please select two different scans. Comparing a scan to itself is not meaningful.');
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
    const isMalware = scan?.prediction === 'malware' || scan?.prediction === '1';
    return (
      <span className="comp-verdict-badge font-mono"
        style={{ color: isMalware ? '#FF1744' : '#00E676' }}>
        {isMalware ? '☣️ MALWARE' : '🛡️ BENIGN'}
      </span>
    );
  };

  return (
    <div className="comparison-page">
      <div className="scan-details-header">
        <Link to="/history" className="back-link">← Back to History</Link>
        <h1 className="page-title">Binary Structural Comparison Engine</h1>
        <p className="page-subtitle font-mono">Delta-diff two scan records across 20 feature dimensions</p>
      </div>

      {/* Scan Picker */}
      <ProtectedWrapper title="Select Scan Records to Compare">
        <div className="comparison-picker-grid">
          <div className="comparison-picker-item">
            <label className="picker-label font-mono">SCAN A (Baseline)</label>
            <select
              value={scanA}
              onChange={e => setScanA(e.target.value)}
              className="picker-select font-mono"
            >
              <option value="">— Select Scan A —</option>
              {history.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.prediction?.toUpperCase()}] {s.filename} — {s.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="comparison-divider font-mono">⇆</div>

          <div className="comparison-picker-item">
            <label className="picker-label font-mono">SCAN B (Comparison)</label>
            <select
              value={scanB}
              onChange={e => setScanB(e.target.value)}
              className="picker-select font-mono"
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

        {error && <div className="report-error font-mono mt-4">❌ {error}</div>}

        <button
          onClick={() => runComparison(scanA, scanB)}
          disabled={loading || !scanA || !scanB}
          className="action-btn compare-submit-btn font-mono"
        >
          {loading ? (
            <span className="report-btn-loading">
              <span className="btn-spinner"></span> COMPUTING DELTA...
            </span>
          ) : '⚡ RUN STRUCTURAL COMPARISON'}
        </button>
      </ProtectedWrapper>

      {/* Results */}
      {result && (
        <>
          {/* Metadata row */}
          <div className="comparison-meta-row">
            {[result.scan_a, result.scan_b].map((scan, idx) => (
              <ProtectedWrapper key={idx} title={`SCAN ${idx === 0 ? 'A' : 'B'}: ${scan.filename}`}>
                <div className="comp-meta-grid font-mono">
                  <div className="comp-meta-item">
                    <span className="detail-label">VERDICT</span>
                    {verdictBadge(scan)}
                  </div>
                  <div className="comp-meta-item">
                    <span className="detail-label">CONFIDENCE</span>
                    <span className="detail-value">{(scan.confidence * 100).toFixed(2)}%</span>
                  </div>
                  <div className="comp-meta-item">
                    <span className="detail-label">SHA256</span>
                    <span className="detail-value hash" style={{ fontSize: '0.65rem' }}>
                      {scan.sha256?.slice(0, 32)}...
                    </span>
                  </div>
                  <div className="comp-meta-item">
                    <span className="detail-label">TIMESTAMP</span>
                    <span className="detail-value" style={{ fontSize: '0.75rem' }}>
                      {new Date(scan.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </ProtectedWrapper>
            ))}
          </div>

          {/* Delta Table */}
          <ProtectedWrapper title="Feature Delta Map — Scan B vs Scan A">
            <table className="features-table full-width delta-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Scan A</th>
                  <th>Scan B</th>
                  <th>Δ Delta</th>
                  <th>% Change</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.delta_map).map(([key, d]) => {
                  const color = getDeltaColor(d.delta, d.direction);
                  return (
                    <tr key={key}>
                      <td className="feature-key">{COMPARE_LABELS[key] || key}</td>
                      <td className="feature-val">{d.scan_a}</td>
                      <td className="feature-val">{d.scan_b}</td>
                      <td className="feature-val" style={{ color, fontWeight: 700 }}>
                        {d.delta > 0 ? '+' : ''}{d.delta}
                      </td>
                      <td className="feature-val" style={{ color }}>
                        {formatPctChange(d.percent_change)}
                      </td>
                      <td className="feature-val">
                        <span className="direction-badge font-mono" style={{
                          color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.7rem'
                        }}>
                          {d.direction === 'increase' ? '▲' : d.direction === 'decrease' ? '▼' : '—'} {d.direction}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ProtectedWrapper>
        </>
      )}
    </div>
  );
};

export default ScanComparison;
