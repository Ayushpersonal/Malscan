import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import FileUpload from '../components/FileUpload';

export const Home = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); 
  const [error, setError] = useState('');
  const [latestScan, setLatestScan] = useState(null);
  const navigate = useNavigate();

  // Load the latest scan from database for summary display on home page
  useEffect(() => {
    const loadLatest = async () => {
      try {
        const history = await api.getUserHistory();
        if (history && history.length > 0) {
          setLatestScan(history[0]);
        }
      } catch (err) {}
    };
    loadLatest();
  }, []);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError('');
  };

  const startLoaderAnimation = () => {
    setLoadingStep(1);
    const steps = [
      'Uploading binary data to sandbox...',
      'Analyzing static PE headers and sections...',
      'Mapping heuristics to process runtime structures...',
      'Running XGBoost ML classifier inference...'
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(currentStep + 1);
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  };

  const handleScan = async () => {
    if (!file) return;

    setError('');
    setLoading(true);
    const clearAnimation = startLoaderAnimation();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await api.scanFile(formData);
      clearAnimation();
      setLoading(false);
      navigate('/result', { state: { result } });
    } catch (err) {
      clearAnimation();
      setLoading(false);
      setError(err.message || 'An error occurred during file scanning.');
    }
  };

  const stepsList = [
    'Idle',
    'Uploading Binary Data...',
    'Analyzing PE Header Structure...',
    'Mapping Risk Heuristics...',
    'Running Model Inference...'
  ];

  const hasLatest = latestScan !== null;

  return (
    <div className="space-y-gutter pb-12 text-on-surface">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center backdrop-blur-md">
          <div className="bg-surface-charcoal border border-primary-fixed-dim/30 shadow-[0_0_20px_rgba(0,219,233,0.15)] p-12 rounded-xl text-center w-full max-w-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-fixed-dim shadow-[0_0_8px_#00dbe9] animate-[scan_2s_infinite_linear]"></div>
            <div className="w-12 h-12 border-4 border-primary-fixed-dim/10 border-t-primary-fixed-dim rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="font-title-md text-title-md font-bold tracking-wider mb-2 uppercase text-primary">Analyzing Portable Executable</h3>
            <p className="font-mono text-sm text-primary-fixed-dim mb-6">{stepsList[loadingStep]}</p>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-electric-blue to-teal-accent transition-all duration-300"
                style={{ width: `${(loadingStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">File Intelligence Analysis</h2>
        <p className="text-on-surface-variant font-body-md">Static and heuristic decomposition of executable binaries.</p>
      </div>

      {error && (
        <div className="bg-error-container/10 border border-error/30 text-error p-4 rounded-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p className="text-body-md">{error}</p>
        </div>
      )}

      {/* Upload Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-8 flex flex-col gap-6">
          <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
          
          <div className="flex justify-center">
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className={`w-full md:w-auto bg-electric-blue hover:bg-electric-blue/80 text-white font-bold py-4 px-10 rounded shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 select-none ${
                !file ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_15px_rgba(46,116,255,0.3)]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
              <span>INITIALIZE SCAN</span>
            </button>
          </div>
        </div>

        {/* Side Parameters */}
        <div className="md:col-span-4 bg-surface-elevated border border-outline-variant rounded-xl p-6 flex flex-col gap-6">
          <div>
            <h4 className="font-label-code text-label-code text-primary-fixed-dim uppercase tracking-widest mb-4">Scan Parameters</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                <span className="text-body-md text-on-surface-variant">Heuristics</span>
                <span className="font-label-code text-status-benign font-semibold">ENABLED</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                <span className="text-body-md text-on-surface-variant">Cloud Lookup</span>
                <span className="font-label-code text-status-benign font-semibold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                <span className="text-body-md text-on-surface-variant">Deep Sandbox</span>
                <span className="font-label-code text-status-medium font-semibold">OPTIONAL</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-body-md text-on-surface-variant">Unpacking</span>
                <span className="font-label-code text-status-benign font-semibold">AUTO</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-status-medium text-[18px]">info</span>
                <p className="text-[12px] font-semibold uppercase tracking-tight">Security Note</p>
              </div>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">All uploads are analyzed in a volatile environment and purged every 24 hours unless marked for persistence.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Scan Results Section */}
      {hasLatest && (
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full animate-pulse ${
                latestScan.prediction === 'malware' ? 'bg-status-malware' : 'bg-status-benign'
              }`}></span>
              <h3 className="font-title-md text-title-md">Latest Report: <span className="text-on-surface-variant font-mono">{latestScan.filename}</span></h3>
            </div>
            <button 
              onClick={() => navigate(`/scan/${latestScan.id}`)}
              className="text-primary hover:underline text-body-md flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span> View Full Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            {/* Prediction Badge */}
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-label-code text-on-surface-variant uppercase mb-4">Final Prediction</p>
              <div className={`px-6 py-2 border font-bold rounded-full text-lg tracking-wide shadow-md ${
                latestScan.prediction === 'malware' 
                  ? 'bg-status-malware/10 border-status-malware text-status-malware shadow-status-malware/10' 
                  : 'bg-status-benign/10 border-status-benign text-status-benign shadow-status-benign/10'
              }`}>
                {latestScan.prediction?.toUpperCase()}
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-label-code text-on-surface-variant uppercase mb-4">Confidence Score</p>
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle className="text-surface-container-highest" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" stroke-width="4"></circle>
                  <circle 
                    className={latestScan.prediction === 'malware' ? 'text-status-malware' : 'text-status-benign'} 
                    cx="40" 
                    cy="40" 
                    fill="transparent" 
                    r="36" 
                    stroke="currentColor" 
                    strokeDasharray="226" 
                    strokeDashoffset={226 - (226 * latestScan.confidence)} 
                    strokeWidth="4"
                  ></circle>
                </svg>
                <span className="absolute font-title-md text-title-md">{(latestScan.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Risk Level */}
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
              <p className="text-[10px] font-label-code text-on-surface-variant uppercase mb-2">Risk Level</p>
              <div className="flex flex-col gap-2">
                <span className={`text-headline-lg font-bold leading-none ${
                  latestScan.prediction === 'malware' ? 'text-status-malware' : 'text-status-benign'
                }`}>
                  {latestScan.prediction === 'malware' ? 'CRITICAL' : 'SECURE'}
                </span>
                <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${latestScan.prediction === 'malware' ? 'bg-status-malware' : 'bg-status-benign'}`}
                    style={{ width: `${latestScan.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Scan Time */}
            <div className="bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
              <p className="text-[10px] font-label-code text-on-surface-variant uppercase mb-2">Analysis Date</p>
              <div className="space-y-1">
                <p className="text-title-md font-bold text-primary truncate">{new Date(latestScan.timestamp).toLocaleDateString()}</p>
                <p className="text-[11px] text-on-surface-variant font-label-code">Engine: XGBoost v1.0.0</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
