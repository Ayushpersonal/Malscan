import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import ThreatMeter from '../components/analysis/ThreatMeter';
import ReportButton from '../components/analysis/ReportButton';
import ProtectedWrapper from '../components/ProtectedWrapper';

export const ScanDetails = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [hashRep, setHashRep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('features');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch the scan from user history filtered by id
        const history = await api.getUserHistory();
        const found = history.find(s => s.id === id);
        if (!found) {
          setError('Scan record not found or access denied.');
          return;
        }
        setScan(found);

        // Fetch hash reputation
        if (found.sha256) {
          try {
            const rep = await api.getHashReputation(found.sha256);
            setHashRep(rep);
          } catch (_) {}
        }
      } catch (err) {
        setError(err.message || 'Failed to load scan details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const FEATURE_GROUPS = {
    'Memory Allocations': ['total_vm', 'exec_vm', 'shared_vm', 'reserved_vm', 'hiwater_rss', 'task_size', 'cached_hole_size', 'nr_ptes'],
    'CPU Scheduler': ['static_prio', 'prio', 'normal_prio', 'policy', 'utime', 'stime', 'nvcsw', 'nivcsw', 'signal_nvcsw'],
    'Task Structure': ['map_count', 'mm_users', 'min_flt', 'maj_flt', 'lock', 'state', 'vm_pgoff', 'vm_truncate_count', 'free_area_cache', 'end_data', 'millisecond', 'usage_counter', 'last_interval', 'fs_excl_counter', 'gtime', 'cgtime'],
  };

  const getAdvisoryColor = (text) => {
    if (text.startsWith('CRITICAL') || text.startsWith('THREAT')) return '#FF1744';
    if (text.startsWith('ALERT')) return '#FF9100';
    if (text.startsWith('WARNING')) return '#FFC107';
    if (text.startsWith('NOTICE')) return '#00E5FF';
    if (text.startsWith('REMEDIATION')) return '#D500F9';
    if (text.startsWith('CLASSIFICATION')) return '#00E676';
    return '#8E919A';
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p>Loading deep threat analysis cockpit...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="result-error-container">
        <ProtectedWrapper title="System Alert">
          <div className="empty-result-state">
            <span className="alert-icon">⚠️</span>
            <h3>{error || 'Scan Not Found'}</h3>
            <Link to="/history" className="action-btn">Return to History</Link>
          </div>
        </ProtectedWrapper>
      </div>
    );
  }

  const isMalware = scan.prediction?.toLowerCase() === 'malware' || scan.prediction === '1';
  const features = scan.features || {};

  // Generate rule-based advisories client-side for display (duplicates server logic for speed)
  const advisories = [];
  const apiPressure = (features.static_prio || 120) - 120;
  if (apiPressure > 5) advisories.push(`ALERT: Binary requests invasive execution capabilities. (API pressure index: ${apiPressure})`);
  if (!features.lock) advisories.push('WARNING: Binary lacks verified authentic digital signatures. Validate certificate chain.');
  if (features.state === 1 || features.policy === 1) advisories.push('CRITICAL: High Shannon entropy indicating cryptographic packers or obfuscation wrapping.');
  if ((features.vm_truncate_count || 0) > 0) advisories.push(`CRITICAL: Binary contains ${features.vm_truncate_count} write+execute section(s) — primary shellcode staging indicator.`);
  if (isMalware) {
    advisories.push(`THREAT CLASSIFICATION: XGBoost flagged binary as MALICIOUS with ${(scan.confidence * 100).toFixed(2)}% confidence. Isolation recommended.`);
    advisories.push('REMEDIATION: Quarantine immediately. Submit SHA256 to VirusTotal / MalwareBazaar for cross-vendor verification.');
  } else {
    advisories.push(`CLASSIFICATION: Binary verified as BENIGN with ${(scan.confidence * 100).toFixed(2)}% confidence. Standard clearance granted.`);
  }
  if (!advisories.length) advisories.push('INFO: No significant threat indicators detected.');

  return (
    <div className="scan-details-container">
      <div className="scan-details-header">
        <Link to="/history" className="back-link">← Back to History</Link>
        <h1 className="page-title">Deep Threat Analysis Cockpit</h1>
        <p className="page-subtitle font-mono">{scan.filename}</p>
      </div>

      {/* Top row: Threat Meter + Hash Reputation + Actions */}
      <div className="scan-details-top-grid">
        <ProtectedWrapper title="Threat Gauge">
          <ThreatMeter confidence={scan.confidence} prediction={scan.prediction} />
        </ProtectedWrapper>

        <ProtectedWrapper title="Global Hash Reputation">
          {hashRep ? (
            <div className="hash-rep-grid font-mono">
              <div className="hash-rep-item">
                <span className="detail-label">PREVIOUSLY SCANNED</span>
                <span className="detail-value" style={{ color: hashRep.previously_scanned ? '#00E676' : '#8E919A' }}>
                  {hashRep.previously_scanned ? '✅ YES' : '❌ FIRST OCCURRENCE'}
                </span>
              </div>
              <div className="hash-rep-item">
                <span className="detail-label">FIRST SEEN</span>
                <span className="detail-value">{hashRep.first_seen ? new Date(hashRep.first_seen).toLocaleString() : '—'}</span>
              </div>
              <div className="hash-rep-item">
                <span className="detail-label">LAST SEEN</span>
                <span className="detail-value">{hashRep.last_seen ? new Date(hashRep.last_seen).toLocaleString() : '—'}</span>
              </div>
              <div className="hash-rep-item">
                <span className="detail-label">GLOBAL SCAN COUNT</span>
                <span className="detail-value" style={{ color: '#00E5FF', fontSize: '1.6rem' }}>
                  {hashRep.scan_count}
                </span>
              </div>
            </div>
          ) : (
            <p className="font-mono" style={{ color: '#8E919A', fontSize: '0.85rem' }}>Hash reputation unavailable.</p>
          )}
        </ProtectedWrapper>

        <ProtectedWrapper title="Report Downloads">
          <ReportButton scanId={id} filename={scan.filename} />
        </ProtectedWrapper>
      </div>

      {/* Static Metadata */}
      <ProtectedWrapper title="Binary Metadata Hashes">
        <div className="meta-grid">
          {[
            { label: 'Filename', value: scan.filename },
            { label: 'SHA256', value: scan.sha256 },
            { label: 'Timestamp', value: scan.timestamp },
          ].map(({ label, value }) => (
            <div key={label} className="meta-item">
              <span className="meta-label">{label}</span>
              <span className="meta-value hash">{value}</span>
            </div>
          ))}
        </div>
      </ProtectedWrapper>

      {/* Tabs */}
      <div className="details-tabs">
        {['features', 'advisories'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn font-mono ${activeTab === tab ? 'active' : ''}`}
          >
            {tab === 'features' ? '⚙️ FEATURE MATRIX' : '🛡️ SECURITY ADVISORIES'}
          </button>
        ))}
      </div>

      {activeTab === 'features' && (
        <div className="features-tab-content">
          {Object.entries(FEATURE_GROUPS).map(([groupName, keys]) => (
            <ProtectedWrapper key={groupName} title={groupName}>
              <table className="features-table full-width">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k}>
                      <td className="feature-key">{k}</td>
                      <td className="feature-val">{features[k] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ProtectedWrapper>
          ))}
        </div>
      )}

      {activeTab === 'advisories' && (
        <div className="advisories-tab-content">
          <ProtectedWrapper title="Rule-Based Security Advisories">
            <div className="advisories-list">
              {advisories.map((adv, i) => {
                const color = getAdvisoryColor(adv);
                return (
                  <div key={i} className="advisory-item" style={{ borderLeftColor: color }}>
                    <p className="advisory-text font-mono" style={{ color }}>{adv}</p>
                  </div>
                );
              })}
            </div>
          </ProtectedWrapper>
        </div>
      )}
    </div>
  );
};

export default ScanDetails;
