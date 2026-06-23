import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ScanTrendChart = ({ trends }) => {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  const getChartData = () => {
    switch (timeframe) {
      case 'weekly':
        return (trends.weekly_scans || []).map(item => ({ name: item.week, count: item.count }));
      case 'monthly':
        return (trends.monthly_scans || []).map(item => ({ name: item.month, count: item.count }));
      case 'daily':
      default:
        return (trends.daily_scans || []).map(item => ({ name: item.date.substring(5), count: item.count })); // show MM-DD
    }
  };

  const activeData = getChartData();
  const hasData = activeData.some(d => d.count > 0);

  return (
    <div className="dashboard-card chart-card trend-chart-card">
      <div className="card-header-cyan trend-header">
        <h3 className="card-title font-mono">📈 SCAN VOLUME FLUCTUATIONS</h3>
        <div className="timeframe-toggles">
          <button 
            onClick={() => setTimeframe('daily')} 
            className={`time-btn font-mono ${timeframe === 'daily' ? 'active' : ''}`}
          >
            DAILY
          </button>
          <button 
            onClick={() => setTimeframe('weekly')} 
            className={`time-btn font-mono ${timeframe === 'weekly' ? 'active' : ''}`}
          >
            WEEKLY
          </button>
          <button 
            onClick={() => setTimeframe('monthly')} 
            className={`time-btn font-mono ${timeframe === 'monthly' ? 'active' : ''}`}
          >
            MONTHLY
          </button>
        </div>
      </div>
      
      <div className="card-body chart-body">
        {!hasData ? (
          <div className="empty-chart-state font-mono">
            <p>No scanning telemetry mapped for this timeframe.</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart
                data={activeData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
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
                  contentStyle={{
                    backgroundColor: '#111216',
                    borderColor: '#00E5FF',
                    borderRadius: '4px',
                    fontFamily: 'Consolas, monospace',
                  }}
                  itemStyle={{ color: '#00E5FF' }}
                  labelStyle={{ color: '#8E919A' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00E5FF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#cyanGlow)" 
                  activeDot={{ r: 6, stroke: '#00E5FF', strokeWidth: 1, fill: '#0A0A0C' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanTrendChart;
