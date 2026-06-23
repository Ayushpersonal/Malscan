import React, { useState } from 'react';
import { api } from '../../services/api';

export const ReportButton = ({ scanId, filename }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [error, setError] = useState('');

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handlePdfDownload = async () => {
    if (!scanId) return;
    setPdfLoading(true);
    setError('');
    try {
      const blob = await api.getScanReport(scanId);
      const safeName = (filename || 'scan').replace(/[^a-zA-Z0-9._-]/g, '_');
      triggerDownload(blob, `MalScan_Report_${safeName}_${scanId.slice(0, 8)}.pdf`);
    } catch (err) {
      setError(err.message || 'PDF report download failed.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleJsonExport = async () => {
    if (!scanId) return;
    setJsonLoading(true);
    setError('');
    try {
      const data = await api.exportScanJson(scanId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const safeName = (filename || 'scan').replace(/[^a-zA-Z0-9._-]/g, '_');
      triggerDownload(blob, `MalScan_Export_${safeName}_${scanId.slice(0, 8)}.json`);
    } catch (err) {
      setError(err.message || 'JSON export failed.');
    } finally {
      setJsonLoading(false);
    }
  };

  return (
    <div className="report-btn-group">
      {error && (
        <div className="report-error font-mono">❌ {error}</div>
      )}
      <button
        onClick={handlePdfDownload}
        disabled={pdfLoading || !scanId}
        className="action-btn report-pdf-btn font-mono"
      >
        {pdfLoading ? (
          <span className="report-btn-loading">
            <span className="btn-spinner"></span>
            GENERATING PDF...
          </span>
        ) : '📄 DOWNLOAD PDF REPORT'}
      </button>
      <button
        onClick={handleJsonExport}
        disabled={jsonLoading || !scanId}
        className="action-btn report-json-btn font-mono"
      >
        {jsonLoading ? (
          <span className="report-btn-loading">
            <span className="btn-spinner"></span>
            EXPORTING JSON...
          </span>
        ) : '📦 EXPORT RAW JSON'}
      </button>
    </div>
  );
};

export default ReportButton;
