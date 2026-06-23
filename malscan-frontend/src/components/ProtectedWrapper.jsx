import React from 'react';

export const ProtectedWrapper = ({ children, title }) => {
  return (
    <div className="protected-wrapper">
      <div className="border-glow-line"></div>
      {title && (
        <div className="wrapper-header">
          <span className="terminal-prefix">&gt; </span>
          <h2 className="wrapper-title">{title}</h2>
        </div>
      )}
      <div className="wrapper-content">
        {children}
      </div>
    </div>
  );
};

export default ProtectedWrapper;
