import React, { useState } from "react";
import '../styles/DataManagementpage.css';
import BackupConfigurationModal from "../components/BackupConfigmodal.jsx";
import { FaDatabase } from "react-icons/fa";
import { FaDownload, FaTrash, FaCog, FaPlay } from "react-icons/fa";

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

    const handleSaveConfig = (config) => {
        console.log("Backup Config Saved:", config);
        // Save config to server or state
      };

  return (
    <div className="content-section2">
      <h2><FaDatabase /> Data Management</h2>
      
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
  );
};

export default DataManagementPage;

