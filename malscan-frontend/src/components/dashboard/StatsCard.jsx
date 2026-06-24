import React from 'react';

export const StatsCard = ({ title, value, icon, type, description }) => {
  const borderClasses = {
    total: 'hover:border-primary-fixed-dim',
    malware: 'hover:border-status-malware',
    benign: 'hover:border-status-benign',
    confidence: 'hover:border-primary-fixed-dim',
  };

  const textClasses = {
    total: 'text-primary',
    malware: 'text-status-malware',
    benign: 'text-status-benign',
    confidence: 'text-primary',
  };

  const bgClasses = {
    total: 'bg-surface-container-highest',
    malware: 'bg-status-malware/10',
    benign: 'bg-status-benign/10',
    confidence: 'bg-surface-container-highest',
  };

  const iconColorClasses = {
    total: 'text-primary-fixed-dim',
    malware: 'text-status-malware',
    benign: 'text-status-benign',
    confidence: 'text-primary-fixed-dim',
  };

  return (
    <div className={`bg-surface-elevated border border-outline-variant p-6 rounded-lg scanline-effect group transition-all duration-300 ${borderClasses[type] || ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded ${bgClasses[type] || ''} ${iconColorClasses[type] || ''}`}>
          <span className="material-symbols-outlined select-none">{icon}</span>
        </div>
        {description && <span className="text-on-surface-variant font-label-code text-[11px] truncate max-w-[150px] select-none">{description}</span>}
      </div>
      <p className="text-on-surface-variant font-label-code text-label-code uppercase tracking-widest text-[11px] select-none">{title}</p>
      <h3 className={`text-headline-lg font-headline-lg mt-1 font-bold ${textClasses[type] || ''}`}>{value}</h3>
    </div>
  );
};

export default StatsCard;
