import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import FileUpload from '../components/FileUpload';
import ProtectedWrapper from '../components/ProtectedWrapper';

export const Home = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0 = Idle, 1 = Uploading, 2 = Parsing PE Headers, 3 = Running Model Inference
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    }, 1500);

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
      // Pass prediction payload to Result page via Router state
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

  return (
    <div className="home-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loader-card">
            <div className="scanner-line"></div>
            <div className="loader-spinner"></div>
            <h3 className="loader-title">ANALYZING PORTABLE EXECUTABLE</h3>
            <p className="loader-step">{stepsList[loadingStep]}</p>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${(loadingStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="home-hero">
        <h1 className="hero-title">MALSCAN</h1>
        <p className="hero-subtitle">Static Windows PE to XGBoost Runtime Process Classifier</p>
      </div>

      <ProtectedWrapper title="Malware Threat Scanning Core">
        <div className="scan-section">
          <FileUpload onFileSelect={handleFileSelect} selectedFile={file} />
          
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          <div className="action-container">
            <button
              onClick={handleScan}
              disabled={!file || loading}
              className={`scan-button ${!file ? 'disabled' : ''}`}
            >
              RUN THREAT HEURISTICS ANALYSIS
            </button>
          </div>
        </div>
      </ProtectedWrapper>

      <div className="info-grid">
        <div className="info-card">
          <h4 className="info-card-title">Static-to-Runtime Mapping</h4>
          <p className="info-card-desc">
            Translates raw Windows PE header markers, sections, and resources directly into equivalent low-level Linux scheduler & memory runtime features.
          </p>
        </div>
        <div className="info-card">
          <h4 className="info-card-title">XGBoost ML Classifier</h4>
          <p className="info-card-desc">
            Evaluates the mapped process control heuristics using a trained 33-feature XGBoost model to yield accurate malware labels and confidence metrics.
          </p>
        </div>
        <div className="info-card">
          <h4 className="info-card-title">Resilient Cloud Audit Logs</h4>
          <p className="info-card-desc">
            Saves and indexes analysis logs in a MongoDB Atlas cluster, failing over to local in-memory isolation logs automatically if the database cluster goes offline.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
