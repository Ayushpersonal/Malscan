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
      className={`file-upload-container ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
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
      <div className="upload-icon">
        {selectedFile ? '📄' : '📁'}
      </div>
      {selectedFile ? (
        <div className="file-details">
          <p className="file-name">{selectedFile.name}</p>
          <span className="file-size-badge">{formatBytes(selectedFile.size)}</span>
          <p className="upload-tip-active">Click or Drag another file to replace</p>
        </div>
      ) : (
        <div className="upload-prompt">
          <p className="upload-title">Drag & Drop PE Binary Here</p>
          <p className="upload-subtitle">or click to browse your workspace</p>
          <span className="upload-supported">Target Formats: .exe, .dll, .sys</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
