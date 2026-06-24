import React, { useRef, useState } from 'react';

export const FileUpload = ({ onFileSelect, selectedFile }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`group relative overflow-hidden bg-surface-container-lowest border rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] transition-all cursor-pointer ${
        isDragOver ? 'border-primary-fixed bg-surface-container' : 'border-outline-variant hover:border-primary-fixed-dim/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".exe,.dll,.sys,.scr,.ocx" 
      />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6 border border-outline-variant group-hover:border-primary-fixed transition-colors">
          <span className="material-symbols-outlined text-[40px] text-primary-fixed-dim select-none" style={{ fontVariationSettings: "'FILL' 0" }}>cloud_upload</span>
        </div>
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-title-md text-title-md mb-2 text-primary font-bold">{selectedFile.name}</h3>
            <span className="bg-primary text-background font-label-code text-[11px] px-2.5 py-1 rounded font-bold uppercase select-none">{formatBytes(selectedFile.size)}</span>
            <p className="text-[12px] text-on-surface-variant font-mono mt-4">Click or drag another file to replace</p>
          </div>
        ) : (
          <>
            <h3 className="font-title-md text-title-md mb-2 text-on-surface">Drag &amp; Drop Binary</h3>
            <p className="text-on-surface-variant mb-4 max-w-sm text-body-md">
              Support for <span className="font-label-code text-primary">.exe</span>, <span className="font-label-code text-primary">.dll</span>, and <span className="font-label-code text-primary">.sys</span> up to 50MB.
            </p>
            <div className="flex items-center gap-4">
              <span className="border border-outline hover:bg-surface-container-high text-on-surface py-2 px-6 rounded font-bold transition-all text-body-md select-none">
                BROWSE FILES
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
