// src/pages/SystemAdminDashboard.jsx

import React from 'react';
import { FaTachometerAlt } from 'react-icons/fa';

const SystemAdminDashboard = () => {
  const summaryData = [
    { title: 'Active Today', value: '250 users', status: '+5% over the last day', class: 'positive' },
    { title: 'System Performance', value: '99.98% uptime', status: '+0% over the last day', class: 'neutral' },
    { title: 'Data Integrity', value: 'Backup up to date', status: 'Today 2am', class: 'positive' },
  ];

  const adminActivities = [
    { admin: 'aty@outlook.com', action: 'Delete user account', date: '31/3/2025', status: 'Completed' },
    { admin: 'kkys@outlook.com', action: 'Add user account', date: '31/3/2025', status: 'Incomplete' },
  ];

  const systemAlerts = [
    { alert: 'Security', message: 'Unauthorized access attempt', date: '31/3/2025', status: 'Investigated' },
    { alert: 'Performance', message: 'High server load', date: '31/3/2025', status: 'Monitoring' },
  ];

  const renderTable = (title, headers, data) => (
    <div className="table-section">
      <div className="table-header">
        <h3>{title}</h3>
        <button className="view-all">View All</button>
      </div>
      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((head, idx) => (
                <th key={idx}>{head}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
                <td><button className="details-button">Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="content-section2">
      <h2><FaTachometerAlt className="icon" /> Dashboard</h2>

      <div className="summary-container">
        {summaryData.map((item, idx) => (
          <div className="summary-box" key={idx}>
            <h3>{item.title}</h3>
            <p className="value">{item.value}</p>
            <p className={`status ${item.class}`}>{item.status}</p>
          </div>
        ))}
      </div>

      {renderTable('Recent Admin Activity', ['Admin', 'Action', 'Date', 'Status'], adminActivities)}
      {renderTable('System Alerts', ['Alert', 'Message', 'Date', 'Status'], systemAlerts)}
    </div>
  );
};

export default SystemAdminDashboard;
