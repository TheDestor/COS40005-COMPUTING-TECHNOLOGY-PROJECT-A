import React from 'react';
import '../styles/SystemMonitoringpage.css';
import { FaExclamationTriangle, FaDatabase, FaLock, FaGlobe, FaServer } from 'react-icons/fa';

const DataManagementPage = () => {
  return (
    <div className="content-section2">
      <h2><FaServer /> System Monitoring</h2>

      <div className="system-cards">
        <div className="card cpu">
            <h3>CPU Usage</h3>
            <div className="value">70%</div>
            <div className="change positive">+5% over the last day</div>
        </div>
        <div className="card memory">
            <h3>Memory Usage</h3>
            <div className="value">64%</div>
            <div className="change positive">+10% over the last day</div>
        </div>
        <div className="card storage">
            <h3>Storage</h3>
            <div className="value">1.2TB / 2TB</div>
            <div className="change positive">51% used</div>
        </div>
        <div className="card network">
            <h3>Network</h3>
            <div className="value">124 Mbps</div>
            <div className="change">12ms latency</div>
        </div>
        <div className="card performance">
            <div className="performance-circle">
            <div className="percentage">82.3%</div>
            <div className="status">Good</div>
            </div>
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

export default DataManagementPage;
