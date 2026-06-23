import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const RiskDistributionChart = ({ distribution }) => {
  const chartData = [
    { name: 'Low', count: distribution.low || 0, color: '#00E676' },      // green
    { name: 'Medium', count: distribution.medium || 0, color: '#FF9100' },   // orange
    { name: 'High', count: distribution.high || 0, color: '#FF1744' },     // red
    { name: 'Critical', count: distribution.critical || 0, color: '#D500F9' } // purple/pink
  ];

  const hasData = chartData.some(d => d.count > 0);

  return (
    <div className="dashboard-card chart-card">
      <div className="card-header-blue">
        <h3 className="card-title font-mono">📊 SEVERITY RISK VECTOR MAP</h3>
      </div>
      <div className="card-body chart-body">
        {!hasData ? (
          <div className="empty-chart-state font-mono">
            <p>No risk metrics classified yet.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid stroke="#1E2028" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8E919A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#8E919A" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    backgroundColor: '#111216',
                    borderColor: '#1E2028',
                    borderRadius: '4px',
                    fontFamily: 'Consolas, monospace',
                  }}
                  itemStyle={{ color: '#F0F2F6' }}
                  labelStyle={{ color: '#8E919A' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDistributionChart;
