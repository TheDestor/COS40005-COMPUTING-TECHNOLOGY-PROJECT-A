import React from 'react';
import '../styles/SystemMonitoringpage.css';
import { FaExclamationTriangle, FaDatabase, FaLock, FaGlobe, FaServer, FaCircleNotch, FaCog } from 'react-icons/fa';

// Create a non-Recharts version of the donut chart that doesn't use hooks
const StaticPerformanceDonutChart = () => {
  // Performance data (hardcoded as per original)
  const performanceValue = 82.3;
  const remainingValue = 17.7;
  
  // Additional metrics that can be displayed
  const detailMetrics = [
    { name: 'CPU Efficiency', value: 88.2, unit: '%' },
    { name: 'Memory Optimization', value: 76.5, unit: '%' },
    { name: 'Disk I/O', value: 92.0, unit: '%' },
    { name: 'Network Throughput', value: 72.7, unit: '%' }
  ];

  const getStatusColor = (value) => {
    if (value >= 80) return '#4ade80'; // Green for good
    if (value >= 60) return '#facc15'; // Yellow for warning
    return '#f87171'; // Red for poor
  };

  const getStatusText = (value) => {
    if (value >= 80) return 'Good';
    if (value >= 60) return 'Average';
    return 'Poor';
  };

  const statusColor = getStatusColor(performanceValue);
  const statusText = getStatusText(performanceValue);

  // Calculate SVG parameters for the donut
  const size = 180; // Adjusted size to fit better in the layout
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (performanceValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-4 h-full">
      <div className="w-full flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Overall Performance</h3>
        <FaCog className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
      
      {/* New layout with flex row for chart and metrics side by side */}
      <div className="flex flex-row w-full">
        {/* Left side: Chart */}
        <div className="flex items-center justify-center" style={{ flex: '0 0 50%' }}>
          <div className="relative" style={{ width: size, height: size }}>
            {/* Background circle */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="none"
                stroke="#f0f0f0"
                strokeWidth={strokeWidth}
              />
              {/* Foreground circle (performance) */}
              <circle
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="none"
                stroke={statusColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold" style={{ color: statusColor }}>
                {performanceValue}%
              </div>
              <div className="text-lg font-medium" style={{ color: statusColor }}>
                {statusText}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Metrics */}
        <div className="flex-1 pl-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Breakdown</h4>
          <div className="space-y-2">
            {detailMetrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{metric.name}</span>
                  <span className="text-sm font-medium" style={{ color: getStatusColor(metric.value) }}>
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${metric.value}%`, 
                      backgroundColor: getStatusColor(metric.value) 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemMonitoringPage = () => {
  return (
    <div className="content-section2">
      <h2><FaServer /> System Monitoring</h2>

      <div className="system-cards">
        <div className="card2 cpu">
            <h3>CPU Usage</h3>
            <div className="value">70%</div>
            <div className="change positive">+5% over the last day</div>
        </div>
        <div className="card2 memory">
            <h3>Memory Usage</h3>
            <div className="value">64%</div>
            <div className="change positive">+10% over the last day</div>
        </div>
        <div className="card2 storage">
            <h3>Storage</h3>
            <div className="value">1.2TB / 2TB</div>
            <div className="change positive">51% used</div>
        </div>
        <div className="card2 network">
            <h3>Network</h3>
            <div className="value">124 Mbps</div>
            <div className="change">12ms latency</div>
        </div>
        <div className="card2 performance">
          <StaticPerformanceDonutChart />
        </div>
      </div>

      <div className="recent-events">
        <div className="header">
          <h3>Recent System Events</h3>
          <button>View All</button>
        </div>
        <ul className="events-list">
          <li>
            <FaExclamationTriangle className="icon" />
            <div>
              <p>CPU usage exceeded threshold (85%) on production-server-01</p>
              <span>2 minutes ago · Server Monitoring</span>
            </div>
          </li>
          <li>
            <FaDatabase className="icon" />
            <div>
              <p>Nightly database backup completed successfully</p>
              <span>32 minutes ago · Backup System</span>
            </div>
          </li>
          <li>
            <FaLock className="icon" />
            <div>
              <p>Security patches installed (v2.4.1) across all servers</p>
              <span>1 hour ago · Update Service</span>
            </div>
          </li>
          <li>
            <FaGlobe className="icon" />
            <div>
              <p>Unusual network traffic pattern detected from region EU-West</p>
              <span>2 hours ago · Network Security</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="resource-trends">
        <div className="header">
          <h3>Resource Usage Trends</h3>
          <span className="tag">Last 12 months</span>
        </div>
        <div className="bar-chart">
          {["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].map((month, idx) => (
            <div key={month} className="bar-wrapper">
              <div className={`bar ${month === 'MAR' ? 'highlight' : ''}`} style={{ height: `${Math.random() * 50 + 10}%` }}></div>
              <span>{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoringPage;