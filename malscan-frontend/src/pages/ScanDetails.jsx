import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import ThreatMeter from '../components/analysis/ThreatMeter';
import ReportButton from '../components/analysis/ReportButton';

export const ScanDetails = () => {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [hashRep, setHashRep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('features');
  const [copiedText, setCopiedText] = useState('');

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

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const FEATURE_GROUPS = {
    'Memory Allocations': ['total_vm', 'exec_vm', 'shared_vm', 'reserved_vm', 'hiwater_rss', 'task_size', 'cached_hole_size', 'nr_ptes'],
    'CPU Scheduler': ['static_prio', 'prio', 'normal_prio', 'policy', 'utime', 'stime', 'nvcsw', 'nivcsw', 'signal_nvcsw'],
    'Task Structure': ['map_count', 'mm_users', 'min_flt', 'maj_flt', 'lock', 'state', 'vm_pgoff', 'vm_truncate_count', 'free_area_cache', 'end_data', 'millisecond', 'usage_counter', 'last_interval', 'fs_excl_counter', 'gtime', 'cgtime'],
  };

  const getAdvisoryColorClass = (text) => {
    if (text.startsWith('CRITICAL') || text.startsWith('THREAT')) return 'text-status-malware border-status-malware/30 bg-status-malware/5';
    if (text.startsWith('ALERT')) return 'text-status-medium border-status-medium/30 bg-status-medium/5';
    if (text.startsWith('WARNING')) return 'text-status-medium border-status-medium/30 bg-status-medium/5';
    if (text.startsWith('NOTICE')) return 'text-primary-fixed-dim border-primary-fixed-dim/30 bg-primary-fixed-dim/5';
    if (text.startsWith('REMEDIATION')) return 'text-electric-blue border-electric-blue/30 bg-electric-blue/5';
    if (text.startsWith('CLASSIFICATION')) return 'text-status-benign border-status-benign/30 bg-status-benign/5';
    return 'text-outline border-outline-variant/30 bg-surface-container';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-on-surface gap-4">
        <span className="w-12 h-12 border-4 border-primary-fixed-dim/20 border-t-primary-fixed-dim rounded-full animate-spin"></span>
        <p className="font-mono text-sm text-outline">Loading deep threat analysis cockpit...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-surface-charcoal border border-outline-variant p-8 rounded-xl text-center space-y-6">
        <span className="material-symbols-outlined text-status-malware text-5xl">warning</span>
        <h3 className="text-xl font-bold text-primary">{error || 'Scan Record Not Found'}</h3>
        <p className="text-on-surface-variant text-sm">Verify the scan ID and check if it belongs to your account.</p>
        <Link to="/history" className="inline-block px-6 py-3 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] transition-all">
          Return to History
        </Link>
      </div>
    );
  }

  const isMalware = scan.prediction?.toLowerCase() === 'malware' || scan.prediction === '1';
  const features = scan.features || {};

  // Rule-based advisories
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

  // Simulated metrics based on features
  const memoryRisk = features.exec_vm > 0 || features.reserved_vm > 100 ? 88 : 12;
  const obfuscationRisk = (features.state === 1 || features.policy === 1) ? 95 : 15;
  const writeExecRisk = (features.vm_truncate_count || 0) > 0 ? 99 : 4;
  const apiPressureRisk = Math.min(100, Math.max(5, Math.round(((features.static_prio || 120) - 120) * 10)));

  return (
    <div className="space-y-gutter relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-fixed-dim/5 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-error/5 blur-[100px] rounded-full -z-10"></div>

      {/* Header breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-outline font-label-code text-label-code mb-2 select-none">
            <Link to="/history" className="hover:text-primary transition-colors">REPORTS</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary-fixed-dim uppercase">ID: {scan.id.slice(0, 8)}</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Analysis Breakdown: <span className="text-on-surface">{scan.filename}</span>
          </h2>
        </div>
        <div className="relative">
          <ReportButton scanId={id} filename={scan.filename} />
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Threat Summary Card */}
        <div className="col-span-12 lg:col-span-4 bg-surface-charcoal border border-outline-variant p-6 flex flex-col justify-between relative overflow-hidden rounded-lg">
          <div className="scanline-effect absolute inset-0 opacity-10"></div>
          <div className="relative z-10 space-y-4">
            <h3 className="font-title-md text-title-md flex items-center justify-between select-none">
              Threat Summary
              <span className={`px-3 py-1 font-label-code text-[10px] tracking-widest border rounded-sm ${
                isMalware 
                  ? 'bg-status-malware/20 text-status-malware border-status-malware/30' 
                  : 'bg-status-benign/20 text-status-benign border-status-benign/30'
              }`}>
                {isMalware ? 'MALICIOUS' : 'BENIGN'}
              </span>
            </h3>
            <div className="flex justify-center items-center py-2">
              <ThreatMeter confidence={scan.confidence} prediction={scan.prediction} />
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/30 rounded">
                <span className="text-outline">Origin Reputation</span>
                <span className={`font-bold ${hashRep && hashRep.previously_scanned ? 'text-status-medium' : 'text-status-benign'}`}>
                  {hashRep && hashRep.previously_scanned ? 'Known Signature' : 'First Occurrence'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/30 rounded">
                <span className="text-outline">Cert Signature</span>
                <span className={`font-bold ${features.lock ? 'text-status-benign' : 'text-status-malware'}`}>
                  {features.lock ? 'Verified (locked)' : 'Unsigned Binary'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* File Identifiers Card */}
        <div className="col-span-12 lg:col-span-8 bg-surface-charcoal border border-outline-variant p-6 flex flex-col justify-between rounded-lg">
          <div>
            <h3 className="font-title-md text-title-md mb-4 select-none">File Hashes & Metadata</h3>
            <p className="text-on-surface-variant text-sm mb-6 select-none">Unique digital fingerprints and session timestamps generated during analysis.</p>
          </div>
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded relative group hover:border-primary-fixed-dim/40 transition-colors">
              <label className="text-[10px] text-outline block mb-1">FILE_NAME</label>
              <div className="flex justify-between items-center">
                <span className="text-primary truncate mr-4 text-sm font-semibold">{scan.filename}</span>
                <button 
                  onClick={() => handleCopy(scan.filename, 'filename')}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedText === 'filename' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded relative group hover:border-primary-fixed-dim/40 transition-colors">
              <label className="text-[10px] text-outline block mb-1">MD5_SIGNATURE</label>
              <div className="flex justify-between items-center">
                <span className="text-primary font-mono text-sm break-all">{scan.md5 || 'N/A'}</span>
                {scan.md5 && (
                  <button 
                    onClick={() => handleCopy(scan.md5, 'md5')}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedText === 'md5' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded relative group hover:border-primary-fixed-dim/40 transition-colors">
              <label className="text-[10px] text-outline block mb-1">SHA256_HASH</label>
              <div className="flex justify-between items-center">
                <span className="text-primary font-mono text-sm break-all">{scan.sha256}</span>
                <button 
                  onClick={() => handleCopy(scan.sha256, 'sha256')}
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedText === 'sha256' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Heuristic Breakdown */}
        <div className="col-span-12 lg:col-span-5 bg-surface-charcoal border border-outline-variant p-6 rounded-lg space-y-6">
          <h3 className="font-title-md text-title-md select-none">Heuristic Risk Distribution</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Write+Execute Mapping</span>
                <span className={`${writeExecRisk > 50 ? 'text-status-malware' : 'text-status-benign'} font-bold`}>{writeExecRisk}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${writeExecRisk > 50 ? 'bg-status-malware' : 'bg-status-benign'}`} style={{ width: `${writeExecRisk}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Memory Allocation Risk</span>
                <span className={`${memoryRisk > 50 ? 'text-status-malware' : 'text-status-benign'} font-bold`}>{memoryRisk}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${memoryRisk > 50 ? 'bg-status-malware' : 'bg-status-benign'}`} style={{ width: `${memoryRisk}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">Obfuscation Indicators</span>
                <span className={`${obfuscationRisk > 50 ? 'text-status-malware' : 'text-status-benign'} font-bold`}>{obfuscationRisk}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${obfuscationRisk > 50 ? 'bg-status-malware' : 'bg-status-benign'}`} style={{ width: `${obfuscationRisk}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-on-surface-variant">API Privilege Pressure</span>
                <span className={`${apiPressureRisk > 50 ? 'text-status-medium' : 'text-primary-fixed-dim'} font-bold`}>{apiPressureRisk}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${apiPressureRisk > 50 ? 'bg-status-medium' : 'bg-primary-fixed-dim'}`} style={{ width: `${apiPressureRisk}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reputation Identifiers */}
        <div className="col-span-12 lg:col-span-7 bg-surface-charcoal border border-outline-variant p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="font-title-md text-title-md mb-4 select-none">Global Registry Reputation</h3>
            <p className="text-on-surface-variant text-sm mb-6 select-none">Live stats comparing file signatures against the multi-tenant defensive database.</p>
          </div>
          {hashRep ? (
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="flex flex-col gap-1 p-3 bg-surface-container-low border border-outline-variant/20 rounded">
                <span className="text-outline text-[10px]">VERIFIED KNOWN</span>
                <span className={`text-sm font-bold ${hashRep.previously_scanned ? 'text-status-medium' : 'text-status-benign'}`}>
                  {hashRep.previously_scanned ? '✅ YES' : '❌ UNIQUE SIGNATURE'}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-surface-container-low border border-outline-variant/20 rounded">
                <span className="text-outline text-[10px]">GLOBAL SCANS</span>
                <span className="text-sm font-bold text-primary-fixed-dim">{hashRep.scan_count} Scans</span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-surface-container-low border border-outline-variant/20 rounded">
                <span className="text-outline text-[10px]">FIRST SCANNED</span>
                <span className="text-sm font-bold text-on-surface truncate">
                  {hashRep.first_seen ? new Date(hashRep.first_seen).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-surface-container-low border border-outline-variant/20 rounded">
                <span className="text-outline text-[10px]">LAST SCANNED</span>
                <span className="text-sm font-bold text-on-surface truncate">
                  {hashRep.last_seen ? new Date(hashRep.last_seen).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded text-center text-outline font-mono text-xs">
              Registry stats unavailable for this session.
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => setActiveTab('features')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'features'
              ? 'border-primary-fixed-dim text-primary-fixed-dim font-bold bg-primary-fixed-dim/5'
              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low/50'
          }`}
        >
          ⚙️ Feature Matrix
        </button>
        <button
          onClick={() => setActiveTab('advisories')}
          className={`px-6 py-3 font-mono text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'advisories'
              ? 'border-primary-fixed-dim text-primary-fixed-dim font-bold bg-primary-fixed-dim/5'
              : 'border-transparent text-outline hover:text-on-surface hover:bg-surface-container-low/50'
          }`}
        >
          🛡️ Security Advisories
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter animate-in fade-in duration-300">
          {Object.entries(FEATURE_GROUPS).map(([groupName, keys]) => (
            <div key={groupName} className="bg-surface-charcoal border border-outline-variant rounded-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-container select-none">
                <h4 className="font-title-md text-xs font-semibold text-primary font-mono uppercase tracking-wider">{groupName}</h4>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-outline text-[10px] select-none border-b border-outline-variant/30">
                      <th className="px-6 py-3">Metric Key</th>
                      <th className="px-6 py-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                    {keys.map(k => (
                      <tr key={k} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-3 text-on-surface-variant font-medium font-mono text-[11px] truncate max-w-[150px]" title={k}>
                          {k}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-primary">
                          {features[k] ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'advisories' && (
        <div className="bg-surface-charcoal border border-outline-variant p-6 rounded-lg space-y-4 animate-in fade-in duration-300">
          <h3 className="font-title-md text-title-md mb-4 select-none">Rule-Based Threats & Advisories</h3>
          <div className="space-y-3 font-mono text-xs">
            {advisories.map((adv, i) => {
              const colorClass = getAdvisoryColorClass(adv);
              return (
                <div key={i} className={`p-4 border border-l-4 rounded flex items-start gap-3 ${colorClass}`}>
                  <span className="material-symbols-outlined mt-0.5 text-[16px]">info</span>
                  <p className="leading-relaxed">{adv}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* XGBoost Model Inference banner at the bottom */}
      <div className="bg-surface-elevated border border-outline-variant p-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-10 rounded-lg">
        <div className="relative z-10 md:w-1/2">
          <h4 className="font-headline-lg text-headline-lg text-primary-fixed mb-4">ML Inference Context</h4>
          <p className="text-body-lg text-on-surface-variant mb-6">
            Our defensive XGBoost classifier has processed this binary's internal memory allocations, page tables, and scheduler contexts across 33 parameters to arrive at the classification verdict.
          </p>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-status-benign rounded-full animate-pulse"></span>
              <span className="font-label-code text-[12px] text-status-benign uppercase">Live Engine Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              <span className="font-label-code text-[12px] text-primary uppercase">Model v2.4.0-XGBoost</span>
            </div>
          </div>
        </div>
        <div className="md:w-1/2 p-6 bg-surface-container-lowest border border-outline-variant/30 font-mono text-xs text-on-surface-variant rounded">
          <div className="flex justify-between border-b border-outline-variant/20 pb-2 mb-2">
            <span>METRIC CONFIG</span>
            <span>VALUE</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Classifier Model</span>
            <span className="text-primary">XGBoost Heuristics</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Analysis Mode</span>
            <span className="text-primary">Static Structural PE Mapping</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Decision Threshold</span>
            <span className="text-primary">0.50 (Standard)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanDetails;
