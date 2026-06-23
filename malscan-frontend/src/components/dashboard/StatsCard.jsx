import React from 'react';

export const StatsCard = ({ title, value, icon, type, description }) => {
  // Determine color theme based on type
  const typeClasses = {
    total: 'stats-card-total',
    malware: 'stats-card-malware',
    benign: 'stats-card-benign',
    confidence: 'stats-card-confidence',
  };

  return (
    <div className={`dashboard-card stats-card ${typeClasses[type] || ''}`}>
      <div className="stats-card-glow"></div>
      <div className="stats-card-content">
        <div className="stats-card-header">
          <span className="stats-card-title">{title}</span>
          <span className="stats-card-icon">{icon}</span>
        </div>
        <div className="stats-card-body">
          <h2 className="stats-card-value">{value}</h2>
          {description && <p className="stats-card-desc">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
