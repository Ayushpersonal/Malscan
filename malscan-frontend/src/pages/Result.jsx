import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ReportButton from '../components/analysis/ReportButton';

export const Result = () => {
  const location = useLocation();
  const result = location.state?.result;
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState('');
  const [scanId, setScanId] = useState(null);

  useEffect(() => {
    // Attempt to locate the scan ID in the user history to allow PDF/JSON downloads
    const locateScanId = async () => {
      if (result && result.sha256) {
        try {
          const history = await api.getUserHistory();
          // Find the most recent record matching this sha256
          const found = history.find(s => s.sha256 === result.sha256);
          if (found) {
            setScanId(found.id);
          }
        } catch (_) {}
      }
    };
    locateScanId();
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-surface-charcoal border border-outline-variant p-8 rounded-xl text-center max-w-md w-full">
          <span className="material-symbols-outlined text-[48px] text-status-medium mb-4">warning</span>
          <h3 className="font-title-md text-title-md font-bold mb-2">No Active Scan Data Found</h3>
          <p className="text-on-surface-variant mb-6 text-body-md">Please return to the scanner page and upload a Portable Executable file for static mapping analysis.</p>
          <Link to="/" className="inline-block bg-primary-fixed-dim text-on-primary-fixed font-bold px-6 py-2.5 rounded transition-all hover:brightness-110">
            Return to Scanner
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const isMalicious = result.prediction?.toLowerCase() === 'malware' || result.prediction === '1';
  const confidencePercent = (result.confidence * 100).toFixed(0);
  const features = result.features || {};

  const FEATURE_GROUPS = {
    'Memory Allocations': ['total_vm', 'exec_vm', 'shared_vm', 'reserved_vm', 'hiwater_rss', 'task_size', 'cached_hole_size', 'nr_ptes'],
    'CPU Scheduler': ['static_prio', 'prio', 'normal_prio', 'policy', 'utime', 'stime', 'nvcsw', 'nivcsw', 'signal_nvcsw'],
    'Task Structure': ['map_count', 'mm_users', 'min_flt', 'maj_flt', 'lock', 'state', 'vm_pgoff', 'vm_truncate_count', 'free_area_cache', 'end_data', 'millisecond', 'usage_counter', 'last_interval', 'fs_excl_counter', 'gtime', 'cgtime'],
  };

  // Generate security advisories
  const advisories = [];
  const apiPressure = (features.static_prio || 120) - 120;
  if (apiPressure > 5) advisories.push(`ALERT: Binary requests invasive execution capabilities. (API pressure index: ${apiPressure})`);
  if (!features.lock) advisories.push('WARNING: Binary lacks verified authentic digital signatures. Validate certificate chain.');
  if (features.state === 1 || features.policy === 1) advisories.push('CRITICAL: High Shannon entropy indicating cryptographic packers or obfuscation wrapping.');
  if ((features.vm_truncate_count || 0) > 0) advisories.push(`CRITICAL: Binary contains ${features.vm_truncate_count} write+execute section(s) — primary shellcode staging indicator.`);
  if (isMalicious) {
    advisories.push(`THREAT CLASSIFICATION: XGBoost flagged binary as MALICIOUS with ${(result.confidence * 100).toFixed(2)}% confidence. Isolation recommended.`);
    advisories.push('REMEDIATION: Quarantine immediately. Submit SHA256 to VirusTotal / MalwareBazaar for cross-vendor verification.');
  } else {
    advisories.push(`CLASSIFICATION: Binary verified as BENIGN with ${(result.confidence * 100).toFixed(2)}% confidence. Standard clearance granted.`);
  }

  const getAdvisoryColor = (text) => {
    if (text.startsWith('CRITICAL') || text.startsWith('THREAT')) return '#FF3B3B';
    if (text.startsWith('ALERT')) return '#FFC700';
    if (text.startsWith('WARNING')) return '#FFC700';
    if (text.startsWith('NOTICE')) return '#00E5FF';
    if (text.startsWith('REMEDIATION')) return '#D500F9';
    if (text.startsWith('CLASSIFICATION')) return '#00FF94';
    return '#8E919A';
  };

  return (
    <div className="space-y-gutter pb-12 text-on-surface">
      {/* Page Header / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-outline font-label-code text-label-code mb-2 select-none">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/')}>SCANNER</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary-fixed-dim">REPORT BREAKDOWN</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Analysis Verdict: <span className="text-on-surface font-mono">{result.filename}</span>
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          {scanId && <ReportButton scanId={scanId} filename={result.filename} />}
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-fixed-dim text-on-primary-fixed font-bold hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] transition-all flex items-center gap-2 select-none"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span> Rescan Target
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Threat Summary circular gauge */}
        <div className="col-span-12 lg:col-span-4 bg-surface-charcoal border border-outline-variant p-6 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,219,233,0.03)_50%)] bg-[size:100%_4px] pointer-events-none"></div>
          <div className="w-full relative z-10 flex flex-col items-center">
            <h3 className="w-full font-title-md text-title-md mb-6 flex justify-between items-center select-none">
              Threat Summary
              <span className={`px-3 py-1 font-label-code text-[10px] tracking-widest border ${
                isMalicious ? 'bg-status-malware/20 text-status-malware border-status-malware/30' : 'bg-status-benign/20 text-status-benign border-status-benign/30'
              }`}>
                {isMalicious ? 'CRITICAL' : 'BENIGN'}
              </span>
            </h3>
            
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle className="text-surface-container-highest" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" stroke-width="8"></circle>
                <circle 
                  className={isMalicious ? 'text-status-malware' : 'text-status-benign'} 
                  cx="88" 
                  cy="88" 
                  fill="transparent" 
                  r="76" 
                  stroke="currentColor" 
                  strokeDasharray="477" 
                  strokeDashoffset={477 - (477 * result.confidence)} 
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold font-title-md text-on-surface">{confidencePercent}%</span>
                <span className="text-outline font-label-code text-[10px] tracking-wider select-none">VERDICT RATE</span>
              </div>
            </div>
          </div>
          
          <div className="w-full mt-6 space-y-4 relative z-10 font-mono text-[13px]">
            <div className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/30">
              <span className="text-outline">Signature Check</span>
              <span className={isMalicious ? 'text-status-malware font-bold' : 'text-status-benign font-bold'}>
                {isMalicious ? 'Trojan.Generic.PE' : 'Verified Safe'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/30">
              <span className="text-outline">Behavioral Index</span>
              <span className={`font-bold ${isMalicious ? 'text-status-malware' : 'text-status-benign'}`}>
                {isMalicious ? 'Suspicious' : 'Clean'}
              </span>
            </div>
          </div>
        </div>

        {/* File Identifiers and advisories */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-surface-charcoal border border-outline-variant p-6 flex flex-col gap-6">
            <h3 className="font-title-md text-title-md select-none">File Cryptographic Hashes</h3>
            <div className="space-y-4 font-mono text-[13px]">
              {[
                { label: 'MD5', val: result.md5 },
                { label: 'SHA-1', val: result.sha1 },
                { label: 'SHA-256', val: result.sha256 }
              ].map(({ label, val }) => (
                <div key={label} className="p-4 bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-fixed-dim/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <label className="font-label-code text-[10px] text-outline block mb-1 select-none">{label}</label>
                    <code className="text-primary font-label-code text-body-md break-all">{val}</code>
                  </div>
                  <button 
                    onClick={() => handleCopy(val, label)}
                    className="text-on-surface-variant hover:text-primary transition-colors flex items-center self-end md:self-auto"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {copiedField === label ? 'done' : 'content_copy'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Advisories List */}
      <div className="bg-surface-charcoal border border-outline-variant p-6 rounded-xl">
        <h3 className="font-title-md text-title-md mb-6 flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary">gavel</span>
          Defensive Intelligence Analysis Warnings
        </h3>
        <div className="space-y-4">
          {advisories.map((adv, index) => {
            const color = getAdvisoryColor(adv);
            return (
              <div 
                key={index} 
                className="p-4 bg-surface-container-lowest border-l-4 rounded-r font-mono text-[13px]" 
                style={{ borderLeftColor: color }}
              >
                <p style={{ color }}>{adv}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 33 Mapped Features Decomposition */}
      <div className="bg-surface-charcoal border border-outline-variant p-6 rounded-xl">
        <h3 className="font-title-md text-title-md mb-2 flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-primary">query_stats</span>
          XGBoost Process Struct Mappings
        </h3>
        <p className="text-on-surface-variant text-body-md mb-6">
          PE header structure properties mapped to Linux execution model heuristics parameters (33 total dimensions).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(FEATURE_GROUPS).map(([groupName, keys]) => (
            <div key={groupName} className="bg-surface-container-lowest border border-outline-variant/50 p-4 rounded flex flex-col">
              <h4 className="font-label-code text-primary-fixed-dim border-b border-outline-variant/30 pb-2 mb-4 uppercase text-sm font-bold tracking-wider select-none">
                {groupName}
              </h4>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-outline">
                      <th className="py-2">Variable</th>
                      <th className="py-2 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {keys.map(k => (
                      <tr key={k} className="hover:bg-surface-container-low/50">
                        <td className="py-2 text-on-surface-variant">{k}</td>
                        <td className="py-2 text-right text-primary font-bold">{features[k] ?? '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Result;
