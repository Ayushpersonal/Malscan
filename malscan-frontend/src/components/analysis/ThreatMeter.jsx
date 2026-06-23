import React from 'react';

// Returns the arc color based on confidence level
const getArcColor = (pct, isMalware) => {
  if (isMalware) {
    if (pct >= 85) return '#D500F9';  // critical - purple
    if (pct >= 70) return '#FF1744';  // high - red
    return '#FF9100';                  // medium - orange
  } else {
    if (pct >= 85) return '#00E676';  // trusted - green
    return '#00E5FF';                  // low-medium - cyan
  }
};

const getRiskLabel = (pct, isMalware) => {
  if (isMalware) {
    if (pct >= 85) return { label: 'CRITICAL', color: '#D500F9' };
    if (pct >= 70) return { label: 'HIGH', color: '#FF1744' };
    return { label: 'MEDIUM', color: '#FF9100' };
  }
  if (pct >= 85) return { label: 'LOW', color: '#00E676' };
  return { label: 'GUARDED', color: '#00E5FF' };
};

export const ThreatMeter = ({ confidence, prediction }) => {
  const pct = Math.round((confidence || 0) * 100);
  const isMalware = prediction?.toLowerCase() === 'malware' || prediction === '1';
  const arcColor = getArcColor(pct, isMalware);
  const risk = getRiskLabel(pct, isMalware);

  // SVG radial dial: 180° arc from left to right
  const radius = 62;
  const cx = 90;
  const cy = 90;
  const circumference = Math.PI * radius; // half circle
  const strokeDasharray = circumference;
  // Fill proportional to pct
  const strokeDashoffset = circumference - (circumference * pct) / 100;

  // Convert arc to path: start at left (180°), sweep to right (0°)
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  return (
    <div className="threat-meter-container">
      <div className="threat-meter-title font-mono">THREAT CONFIDENCE GAUGE</div>
      <div className="threat-meter-wrapper">
        <svg viewBox="0 0 180 100" width="200" height="110" className="threat-meter-svg">
          {/* Background track arc */}
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke="#1E2028"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Active colored arc */}
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={arcColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 6px ${arcColor})`,
              transition: 'stroke-dashoffset 0.6s ease'
            }}
          />
          {/* Center value */}
          <text x={cx} y={cy - 8} textAnchor="middle" fill={arcColor}
            fontSize="22" fontWeight="900" fontFamily="Consolas, monospace">
            {pct}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="#8E919A"
            fontSize="7" fontFamily="Consolas, monospace" letterSpacing="2">
            CONFIDENCE
          </text>
        </svg>
      </div>
      <div className="threat-meter-verdict">
        <span className="threat-meter-badge font-mono" style={{ color: risk.color, borderColor: risk.color }}>
          {isMalware ? '☣️' : '🛡️'} {prediction?.toUpperCase() || 'UNKNOWN'} — {risk.label}
        </span>
      </div>
    </div>
  );
};

export default ThreatMeter;
