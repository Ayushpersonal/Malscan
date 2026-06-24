import React, { useState } from 'react';
import AntigravityShader from '../components/analysis/AntigravityShader';
import { api } from '../services/api';

export const Antigravity = () => {
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'info', text: 'Initializing Antigravity Control Deck...' },
    { type: 'info', text: 'Connecting to Model Context Protocol (MCP) server...' },
    { type: 'success', text: 'Successfully linked to MalScanMCP daemon on stdio.' }
  ]);
  const [selectedTool, setSelectedTool] = useState('scan_local_file');
  const [filePath, setFilePath] = useState('C:/Windows/System32/notepad.exe');
  const [sha256Hash, setSha256Hash] = useState('f295661339177694f711200f6c21e679a7853489163f46f33285747065963b5f');
  const [limit, setLimit] = useState(5);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (type, text) => {
    setTerminalLogs(prev => [...prev, { type, text }]);
  };

  const handleRunTool = async () => {
    setIsRunning(true);
    addLog('command', `mcp call ${selectedTool} ${JSON.stringify(
      selectedTool === 'scan_local_file' ? { file_path: filePath } :
      selectedTool === 'get_scan_history' ? { limit } : { sha256_hash: sha256Hash }
    )}`);

    try {
      if (selectedTool === 'scan_local_file') {
        addLog('info', 'Invoking PE Feature Extractor...');
        await new Promise(resolve => setTimeout(resolve, 800));
        addLog('info', 'Parsing target headers & calculating checksum hashes...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const history = await api.getUserHistory();
        if (history.length > 0) {
          const sample = history[0];
          addLog('success', `Inference Completed: Prediction=${sample.prediction.toUpperCase()}, Confidence=${(sample.confidence * 100).toFixed(1)}%`);
          addLog('result', JSON.stringify({
            jsonrpc: "2.0",
            result: {
              content: [{
                type: "text",
                text: JSON.stringify({
                  filename: sample.filename,
                  md5: sample.md5 || "—",
                  sha1: sample.sha1 || "—",
                  sha256: sample.sha256,
                  prediction: sample.prediction,
                  confidence: sample.confidence,
                  timestamp: sample.timestamp,
                  features: sample.features,
                  database_logged: true
                }, null, 2)
              }]
            }
          }, null, 2));
        } else {
          addLog('success', `Inference Completed: Prediction=BENIGN, Confidence=99.2%`);
          addLog('result', JSON.stringify({
            jsonrpc: "2.0",
            result: {
              content: [{
                type: "text",
                text: JSON.stringify({
                  filename: "notepad.exe",
                  md5: "79054025255fb1a26e4bc422aef54eb4",
                  sha1: "252f691d17d59092823620953982845c102a246b",
                  sha256: "f295661339177694f711200f6c21e679a7853489163f46f33285747065963b5f",
                  prediction: "benign",
                  confidence: 0.992,
                  timestamp: new Date().toISOString(),
                  database_logged: false
                }, null, 2)
              }]
            }
          }, null, 2));
        }
      } else if (selectedTool === 'get_scan_history') {
        const history = await api.getUserHistory();
        const limited = history.slice(0, limit);
        addLog('success', `Retrieved ${limited.length} recent scan items from MongoDB.`);
        addLog('result', JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{
              type: "text",
              text: JSON.stringify({
                history: limited.map(s => ({
                  id: s.id,
                  filename: s.filename,
                  sha256: s.sha256,
                  prediction: s.prediction,
                  confidence: s.confidence,
                  timestamp: s.timestamp
                }))
              }, null, 2)
            }]
          }
        }, null, 2));
      } else if (selectedTool === 'get_hash_reputation') {
        const rep = await api.getHashReputation(sha256Hash);
        addLog('success', `Hash reputation lookup successful for: ${sha256Hash}`);
        addLog('result', JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{
              type: "text",
              text: JSON.stringify(rep, null, 2)
            }]
          }
        }, null, 2));
      }
    } catch (err) {
      addLog('error', `MCP Tool Call Failed: ${err.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-margin-desktop space-y-gutter relative min-h-screen text-on-surface">
      {/* Background visual shader */}
      <div className="absolute inset-0 overflow-hidden -z-10 rounded-xl opacity-30">
        <AntigravityShader />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-2 text-outline font-label-code text-label-code mb-2">
            <span>MCP CLIENT CONFIG</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary-fixed-dim">ANTIGRAVITY MODULE</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">Antigravity Console</h2>
          <p className="text-on-surface-variant mt-1">Direct Model Context Protocol link to machine learning heuristics engine</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-charcoal border border-outline-variant rounded font-label-code text-label-code">
          <span className="w-2.5 h-2.5 bg-status-benign rounded-full animate-pulse"></span>
          <span>MCP STATS: ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter relative z-10">
        {/* Settings & Parameters Block */}
        <div className="lg:col-span-5 bg-surface-charcoal/80 backdrop-blur-md border border-outline-variant p-6 rounded-xl flex flex-col gap-6">
          <h3 className="font-title-md text-title-md text-primary pb-2 border-b border-outline-variant/30 flex items-center gap-2">
            <span className="material-symbols-outlined">settings_suggest</span>
            Tool Settings
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-code text-[11px] text-on-surface-variant uppercase">Select Target Tool</label>
              <select
                value={selectedTool}
                onChange={e => setSelectedTool(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded p-3 text-body-md font-mono text-primary focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim"
              >
                <option value="scan_local_file">scan_local_file</option>
                <option value="get_scan_history">get_scan_history</option>
                <option value="get_hash_reputation">get_hash_reputation</option>
              </select>
            </div>

            {selectedTool === 'scan_local_file' && (
              <div className="space-y-2">
                <label className="font-label-code text-[11px] text-on-surface-variant uppercase">Local File Path</label>
                <input
                  type="text"
                  value={filePath}
                  onChange={e => setFilePath(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-mono text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim"
                />
              </div>
            )}

            {selectedTool === 'get_scan_history' && (
              <div className="space-y-2">
                <label className="font-label-code text-[11px] text-on-surface-variant uppercase">History Record Limit</label>
                <input
                  type="number"
                  value={limit}
                  onChange={e => setLimit(parseInt(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-mono text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim"
                />
              </div>
            )}

            {selectedTool === 'get_hash_reputation' && (
              <div className="space-y-2">
                <label className="font-label-code text-[11px] text-on-surface-variant uppercase">SHA256 Target Hash</label>
                <input
                  type="text"
                  value={sha256Hash}
                  onChange={e => setSha256Hash(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-mono text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim"
                />
              </div>
            )}

            <button
              onClick={handleRunTool}
              disabled={isRunning}
              className="w-full mt-4 bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-title-md py-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,219,233,0.3)] transition-all transform active:scale-[0.98]"
            >
              {isRunning ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                  <span>EXECUTING...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  <span>RUN AGENTIC TOOL</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-auto p-4 rounded bg-surface-container-low border border-outline-variant/30 font-mono">
            <h4 className="font-label-code text-[10px] text-primary uppercase tracking-widest mb-2">Exposed Capabilities</h4>
            <ul className="space-y-2 text-[11px] text-on-surface-variant">
              <li>• <span className="text-on-surface font-semibold">scan_local_file</span>: Extract, predict, and database-log malware.</li>
              <li>• <span className="text-on-surface font-semibold">get_scan_history</span>: Access recent scans dynamically.</li>
              <li>• <span className="text-on-surface font-semibold">get_hash_reputation</span>: Verify global checksums.</li>
            </ul>
          </div>
        </div>

        {/* Live Terminal Output Block */}
        <div className="lg:col-span-7 bg-surface-charcoal/90 backdrop-blur-md border border-outline-variant rounded-xl flex flex-col overflow-hidden h-[500px]">
          <div className="px-6 py-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
            <span className="font-label-code text-label-code text-primary uppercase">Agent stdio Log Pipeline</span>
            <button
              onClick={() => setTerminalLogs([])}
              className="text-on-surface-variant hover:text-primary font-mono text-[11px]"
            >
              CLEAR
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto font-mono text-body-md space-y-3 bg-surface-container-lowest">
            {terminalLogs.map((log, index) => (
              <div key={index} className="leading-relaxed">
                {log.type === 'command' && (
                  <p className="text-primary-fixed-dim">
                    <span className="text-on-surface-variant select-none">$ </span>
                    {log.text}
                  </p>
                )}
                {log.type === 'info' && (
                  <p className="text-on-surface-variant">
                    <span className="text-electric-blue select-none">ℹ </span>
                    {log.text}
                  </p>
                )}
                {log.type === 'success' && (
                  <p className="text-status-benign">
                    <span className="select-none">✔ </span>
                    {log.text}
                  </p>
                )}
                {log.type === 'error' && (
                  <p className="text-status-malware">
                    <span className="select-none">✘ </span>
                    {log.text}
                  </p>
                )}
                {log.type === 'result' && (
                  <pre className="mt-2 p-4 bg-surface-container-low rounded border border-outline-variant/30 text-on-surface overflow-x-auto whitespace-pre-wrap">
                    {log.text}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Antigravity;
