import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const ThreatDistributionChart = ({ data }) => {
  const chartData = [
    { name: 'Malware', value: data.malware_percentage || 0, count: data.malware_count || 0 },
    { name: 'Benign', value: data.benign_percentage || 0, count: data.benign_count || 0 },
  ];

  // Neon colors matching existing theme
  const COLORS = ['#FF1744', '#00E676'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="custom-tooltip font-mono">
          <p className="label">{`${pData.name}: ${pData.value.toFixed(2)}%`}</p>
          <p className="desc">{`Count: ${pData.count} scans`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card chart-card">
      <div className="card-header-blue">
        <h3 className="card-title font-mono">☣️ THREAT VERDICT RATIO</h3>
      </div>
      <div className="card-body chart-body">
        {chartData[0].value === 0 && chartData[1].value === 0 ? (
          <div className="empty-chart-state font-mono">
            <p>No verdict telemetry recorded.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="font-mono legend-label">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatDistributionChart;
