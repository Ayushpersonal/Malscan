import React from 'react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card quick-actions-card">
      <div className="card-header-cyan">
        <h3 className="card-title font-mono">🛠️ RAPID SOC COMMANDS</h3>
      </div>
      <div className="card-body quick-actions-body">
        <button 
          onClick={() => navigate('/')} 
          className="action-btn quick-action-btn font-mono"
        >
          ⚡ LAUNCH SCANNER
        </button>
        <button 
          onClick={() => navigate('/history')} 
          className="action-btn quick-action-btn history-btn font-mono"
        >
          📂 SCAN HISTORY LOGS
        </button>
        <button 
          onClick={() => navigate('/profile')} 
          className="action-btn quick-action-btn profile-btn font-mono"
        >
          👤 OPERATOR SECURITY PROFILE
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
