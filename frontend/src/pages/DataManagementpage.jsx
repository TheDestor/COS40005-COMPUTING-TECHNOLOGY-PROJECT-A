import React, { useState, useEffect } from "react";
import '../styles/DataManagementpage.css';
import BackupConfigurationModal from "../components/BackupConfigmodal.jsx";
import { FaDatabase, FaUsers, FaUserClock, FaUserCheck } from "react-icons/fa";
import { FaDownload, FaTrash, FaCog, FaPlay } from "react-icons/fa";
import SystemAdminSidebar from '../pages/SystemAdminSidebar';

const backups = [
  {
    name: "Backup version 1.0",
    date: "2024-11-24",
    size: "40.2 GB",
    type: "Full",
    status: "Completed",
  },
  {
    name: "Backup version 1.1",
    date: "2024-11-22",
    size: "37.1 GB",
    type: "Increment",
    status: "Completed",
  },
  {
    name: "Backup version 2.0",
    date: "2023-12-22",
    size: "35.2 GB",
    type: "Full",
    status: "Expiring Soon",
  },
];

const DataManagementPage = () => {
  const [showConfig, setShowConfig] = useState(false);
  const [currentUsers, setCurrentUsers] = useState(0);
  const [todayUsers, setTodayUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  // Simulate real-time data updates
  useEffect(() => {
    // Initial values
    setCurrentUsers(42);
    setTodayUsers(128);
    setTotalUsers(5243);

    // Simulate real-time changes
    const interval = setInterval(() => {
      // Random fluctuations for demo purposes
      setCurrentUsers(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(35, prev + change); // Don't go below 35
      });
      
      setTodayUsers(prev => prev + Math.floor(Math.random() * 3));
      setTotalUsers(prev => prev + Math.floor(Math.random() * 2));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = (config) => {
    console.log("Backup Config Saved:", config);
    // Save config to server or state
  };

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
    <div className="content-section2">
      <h2><FaDatabase /> Data Management</h2>
      
      {/* User Statistics Cards */}
      <div className="user-stats-container">
        <div className="stat-card">
          <div className="stat-icon current-users">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Current Users</h3>
            <p className="stat-number">{currentUsers}</p>
            <p className="stat-description">Active right now</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon today-users">
            <FaUserClock />
          </div>
          <div className="stat-content">
            <h3>Today's Users</h3>
            <p className="stat-number">{todayUsers}</p>
            <p className="stat-description">Visited today</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total-users">
            <FaUserCheck />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-number">{totalUsers}</p>
            <p className="stat-description">Since launch</p>
          </div>
        </div>
      </div>

      <div className="backup-controls">
        <button className="run-backup"><FaPlay /> Run Backup Now</button>
        <button className="configure" onClick={() => setShowConfig(true)}><FaCog /> Configure</button>
      </div>

      {showConfig && (
        <BackupConfigurationModal
          onClose={() => setShowConfig(false)}
          onSave={handleSaveConfig}
        />
      )}

      <div className="backup-table">
        <table>
          <thead>
            <tr>
              <th>Backup Name</th>
              <th>Date</th>
              <th>Size</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((backup, index) => (
              <tr key={index}>
                <td>{backup.name}</td>
                <td>{backup.date}</td>
                <td>{backup.size}</td>
                <td>{backup.type}</td>
                <td>
                  <span className={`status ${backup.status.replace(" ", "").toLowerCase()}`}>
                    {backup.status}
                  </span>
                </td>
                <td className="actions">
                  <button className="download"><FaDownload /></button>
                  <button className="delete"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default DataManagementPage;