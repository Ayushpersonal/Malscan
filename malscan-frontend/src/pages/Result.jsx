import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import ProtectedWrapper from '../components/ProtectedWrapper';

export const Result = () => {
  const location = useLocation();
  const result = location.state?.result;
  const [copiedField, setCopiedField] = useState('');

  if (!result) {
    return (
      <div className="result-error-container">
        <ProtectedWrapper title="System Alert">
          <div className="empty-result-state">
            <span className="alert-icon">⚠️</span>
            <h3>No Active Scan Data Found</h3>
            <p>Please return to the dashboard and upload a Portable Executable file for static mapping analysis.</p>
            <Link to="/" className="action-btn">Return to Dashboard</Link>
          </div>
        </ProtectedWrapper>
      </div>
    );
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const isMalicious = result.prediction.toLowerCase() === 'malware' || result.prediction === '1';
  const confidencePercent = (result.confidence * 100).toFixed(2);

  const features = result.features || {};
  
  const memoryFeatures = {
    'total_vm (Total Virtual Memory Pages)': features.total_vm,
    'exec_vm (Executable Pages)': features.exec_vm,
    'shared_vm (Shared Memory Pages)': features.shared_vm,
    'reserved_vm (Reserved Pages)': features.reserved_vm,
    'hiwater_rss (Peak Resident Set Size)': features.hiwater_rss,
    'task_size (Virtual Space Size)': features.task_size,
    'cached_hole_size (Address Space Hole)': features.cached_hole_size,
    'nr_ptes (Page Table Entries Count)': features.nr_ptes,
  };

  const schedulerFeatures = {
    'static_prio (Static Priority)': features.static_prio,
    'prio (Dynamic Priority)': features.prio,
    'normal_prio (Normal Base Priority)': features.normal_prio,
    'policy (Scheduling Policy)': features.policy,
    'utime (User Mode CPU Time)': features.utime,
    'stime (System Mode CPU Time)': features.stime,
    'nvcsw (Voluntary Context Switches)': features.nvcsw,
    'nivcsw (Involuntary Context Switches)': features.nivcsw,
    'signal_nvcsw (Cumulative Signal Switch)': features.signal_nvcsw,
  };

  const taskStructFeatures = {
    'map_count (Mapped Memory Areas)': features.map_count,
    'mm_users (Active Virtual Machine Users)': features.mm_users,
    'min_flt (Minor Page Faults)': features.min_flt,
    'maj_flt (Major Page Faults)': features.maj_flt,
    'lock (Read-Write Locks)': features.lock,
    'state (Task Execution State)': features.state,
    'vm_pgoff (Offset of mapped area)': features.vm_pgoff,
    'vm_truncate_count (vma truncate count)': features.vm_truncate_count,
    'free_area_cache (Free area cache pointer)': features.free_area_cache,
    'end_data (Address of data end)': features.end_data,
    'millisecond (Scanning Timing Offset)': features.millisecond,
    'usage_counter (Task struct usage)': features.usage_counter,
    'last_interval (Thrashing threshold time)': features.last_interval,
    'fs_excl_counter (File system locks)': features.fs_excl_counter,
    'gtime (Guest CPU execution time)': features.gtime,
    'cgtime (Cumulative Guest CPU time)': features.cgtime,
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <Link to="/" className="back-link">&larr; Return to Scanner</Link>
        <h1 className="page-title">Analysis Threat Report</h1>
      </div>

      {/* Target Binary Info */}
      <ProtectedWrapper title="Static Metadata Hashes">
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">File Target Name</span>
            <span className="meta-value filename">{result.filename}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">SHA256 Signature</span>
            <div className="hash-value-container">
              <span className="meta-value hash">{result.sha256}</span>
              <button 
                onClick={() => handleCopy(result.sha256, 'sha256')} 
                className="copy-btn"
              >
                {copiedField === 'sha256' ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-label">SHA1 Signature</span>
            <div className="hash-value-container">
              <span className="meta-value hash">{result.sha1}</span>
              <button 
                onClick={() => handleCopy(result.sha1, 'sha1')} 
                className="copy-btn"
              >
                {copiedField === 'sha1' ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
          <div className="meta-item">
            <span className="meta-label">MD5 Signature</span>
            <div className="hash-value-container">
              <span className="meta-value hash">{result.md5}</span>
              <button 
                onClick={() => handleCopy(result.md5, 'md5')} 
                className="copy-btn"
              >
                {copiedField === 'md5' ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        </div>
      </ProtectedWrapper>

      {/* Verdict Flag Banner */}
      <div className={`verdict-banner-card ${isMalicious ? 'malicious' : 'benign'}`}>
        <div className="verdict-banner-content">
          <div className="verdict-badge-box">
            <span className="verdict-icon">{isMalicious ? '☣️' : '🛡️'}</span>
            <div>
              <p className="verdict-sub">MALWARE CLASSIFIER RESPONSE</p>
              <h2 className="verdict-main">
                {isMalicious ? 'RISK DETECTED / PE SUSPICIOUS' : 'BENIGN / TRUSTED EXECUTABLE'}
              </h2>
            </div>
          </div>
          <div className="confidence-box">
            <p className="confidence-label">MODEL CONFIDENCE</p>
            <h3 className="confidence-value">{confidencePercent}%</h3>
          </div>
        </div>
      </div>

      {/* 33-column mapped process variables */}
      <ProtectedWrapper title="XGBoost Process Struct Feature Inputs (33 Mapped Parameters)">
        <p className="section-instruction">
          The following parameters represent static PE metrics mathematically converted into the standard process scheduler and virtual memory metrics expected by the classification model:
        </p>

        <div className="features-grid">
          {/* Column 1: Memory */}
          <div className="features-column">
            <h3 className="column-title memory">Memory Allocations</h3>
            <table className="features-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(memoryFeatures).map(([key, val]) => (
                  <tr key={key}>
                    <td className="feature-key">{key}</td>
                    <td className="feature-val">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Column 2: CPU Scheduler */}
          <div className="features-column">
            <h3 className="column-title scheduler">CPU Scheduler Heuristics</h3>
            <table className="features-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(schedulerFeatures).map(([key, val]) => (
                  <tr key={key}>
                    <td className="feature-key">{key}</td>
                    <td className="feature-val">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 3: Full Width Task struct variables */}
        <div className="features-column-full">
          <h3 className="column-title task-struct">General Task Control Variables</h3>
          <table className="features-table full-width">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Value</th>
                <th>Variable</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(Object.entries(taskStructFeatures).length / 2) }).map((_, idx) => {
                const entries = Object.entries(taskStructFeatures);
                const item1 = entries[idx * 2];
                const item2 = entries[idx * 2 + 1];
                return (
                  <tr key={idx}>
                    <td className="feature-key">{item1[0]}</td>
                    <td className="feature-val">{item1[1]}</td>
                    {item2 ? (
                      <>
                        <td className="feature-key">{item2[0]}</td>
                        <td className="feature-val">{item2[1]}</td>
                      </>
                    ) : (
                      <>
                        <td></td>
                        <td></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ProtectedWrapper>
    </div>
  );
};

export default Result;
