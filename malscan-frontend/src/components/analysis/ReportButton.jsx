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
    <div className="flex gap-4">
      {error && (
        <div className="text-error font-mono text-xs absolute -bottom-6 left-0">❌ {error}</div>
      )}
      <button
        onClick={handlePdfDownload}
        disabled={pdfLoading || !scanId}
        className="px-4 py-2 border border-outline-variant bg-surface-container-low hover:bg-surface-container-high hover:text-primary text-on-surface font-mono text-xs flex items-center gap-2 rounded transition-all duration-200"
      >
        {pdfLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>
            <span>GENERATING PDF...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>PDF Export</span>
          </>
        )}
      </button>
      <button
        onClick={handleJsonExport}
        disabled={jsonLoading || !scanId}
        className="px-4 py-2 bg-primary-fixed-dim hover:bg-primary-container text-on-primary-fixed font-bold font-mono text-xs flex items-center gap-2 rounded transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,219,233,0.3)]"
      >
        {jsonLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-on-primary-fixed/20 border-t-on-primary-fixed rounded-full animate-spin"></span>
            <span>EXPORTING JSON...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>JSON Export</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ReportButton;
