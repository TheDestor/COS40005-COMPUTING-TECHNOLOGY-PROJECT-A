// imports
import React, { useState, useEffect } from "react";
import '../styles/DataManagementpage.css';
import BackupConfigurationModal from "../components/BackupConfigmodal.jsx";
import { FaDatabase, FaHdd, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaPlay, FaCog } from "react-icons/fa";
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import { useAuth } from '../context/AuthProvider.jsx';

const initialBackups = [
  {
    id: 1,
    name: "Backup version 1.0",
    date: "2024-11-24",
    size: "40.2 GB",
    type: "Full",
    status: "Completed",
  },
  {
    id: 2,
    name: "Backup version 1.1",
    date: "2024-11-22",
    size: "37.1 GB",
    type: "Increment",
    status: "Completed",
  },
  {
    id: 3,
    name: "Backup version 2.0",
    date: "2023-12-22",
    size: "35.2 GB",
    type: "Full",
    status: "Expiring Soon",
  },
];

const DetailModal = ({ children, onClose }) => {
  return (
    <div className="data-modal-overlay" onClick={onClose}>
      <div className="data-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="data-modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

const DataManagementPage = () => {
  const [showConfig, setShowConfig] = useState(false);
  const { accessToken } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBackups = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const r = await fetch('/api/admin/backup/list', { headers });
      if (!r.ok) return;
      const list = await r.json();
      setBackups(Array.isArray(list) ? list : []);
    } catch {}
  };

  const runBackup = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const r = await fetch('/api/admin/backup/run', { method: 'POST', headers });
      if (r.ok) {
        await loadBackups();
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = (filename) => {
    const headers = new Headers({
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    });
    const url = `/api/admin/backup/download/${encodeURIComponent(filename)}`;
    // open in new tab for simple download
    window.open(url, '_blank');
  };

  useEffect(() => { loadBackups(); }, [accessToken]);
  const [databaseSize, setDatabaseSize] = useState("15.3 GB");
  const [uploadsStorage, setUploadsStorage] = useState("24.9 GB");
  const [dataHealth, setDataHealth] = useState("Healthy");
  const [modalType, setModalType] = useState(null); // null, 'database', 'storage', or 'health'

  // The useEffect for simulating user data can be removed or repurposed later
  // for real data metrics.

  const handleSaveConfig = (config) => {
    console.log("Backup Config Saved:", config);
    // Save config to server or state
  };

  const handleDeleteBackup = (backupId) => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      // Remove backup from state
      setBackups(prevBackups => prevBackups.filter(backup => backup.id !== backupId));
      
      // Here you would typically also make an API call to delete from server
      // Example: await deleteBackupFromServer(backupId);
      
      console.log(`Backup with ID ${backupId} deleted`);
    }
  };

  const handleDownloadBackup = (backup) => {
    // Implement download functionality
    console.log(`Downloading backup: ${backup.name}`);
    // Here you would typically trigger a download or redirect to download URL
    // Example: window.location.href = `/api/backups/${backup.id}/download`;
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'database':
        const dbItems = [
          { label: 'Businesses', size: '7.1 GB', percentage: '46.4%', color: '#007bff' },
          { label: 'Users', size: '5.2 GB', percentage: '34.0%', color: '#28a745' },
          { label: 'Reviews', size: '3.0 GB', percentage: '19.6%', color: '#ffc107' },
        ];
        return (
          <>
            <h2><FaDatabase /> Database Size Details</h2>
            <p className="modal-total">Total Size: <strong>{databaseSize}</strong></p>
            <div className="progress-bar-container">
              {dbItems.map(item => (
                <div key={item.label} className="progress-bar-stack" style={{ width: item.percentage, backgroundColor: item.color }} title={`${item.label}: ${item.size} (${item.percentage})`}></div>
              ))}
            </div>
            <div className="details-grid">
              {dbItems.map(item => (
                <React.Fragment key={item.label}>
                  <div className="grid-item-label">
                    <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                    {item.label}
                  </div>
                  <div className="grid-item-value">{item.size}</div>
                  <div className="grid-item-percentage">{item.percentage}</div>
                </React.Fragment>
              ))}
            </div>
          </>
        );
      case 'storage':
        const storageItems = [
          { label: 'Business Images', size: '18.5 GB', percentage: 74.3, color: '#17a2b8' },
          { label: 'User Avatars', size: '6.4 GB', percentage: 25.7, color: '#fd7e14' },
        ];
        return (
          <>
            <h2><FaHdd /> Uploads Storage Details</h2>
            <p className="modal-total">Total Usage: <strong>{uploadsStorage}</strong></p>
            {storageItems.map(item => (
              <div key={item.label} className="progress-item">
                <div className="progress-label">
                  <span>{item.label}</span>
                  <strong>{item.size}</strong>
                </div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                </div>
              </div>
            ))}
          </>
        );
      case 'health':
        return (
          <>
            <h2><FaShieldAlt /> Data Integrity Report</h2>
            <div className="details-grid health-grid">
              <div className="grid-item-label status-healthy">
                <FaCheckCircle /> Status
              </div>
              <div className="grid-item-value status-healthy">
                <strong>{dataHealth}</strong>
              </div>

              <div className="grid-item-label">
                <FaClock /> Last Check
              </div>
              <div className="grid-item-value">
                July 28, 2024, 10:00 AM UTC
              </div>

              <div className="grid-item-label">
                <FaExclamationTriangle /> Orphaned Records
              </div>
              <div className="grid-item-value">
                0 Found
              </div>
            </div>
            <p className="modal-footer-note">Next scheduled check: July 29, 2024, 12:00 PM UTC</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <h2><FaDatabase /> Data Management</h2>
        {/* Data Statistics Cards */}
        <div className="user-stats-container">
          <div className="stat-card clickable" onClick={() => setModalType('database')}>
            <div className="stat-icon database-size">
              <FaDatabase />
            </div>
            <div className="stat-content">
              <h3>Database Size</h3>
              <p className="stat-number">{databaseSize}</p>
              <p className="stat-description">Total size of collections</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => setModalType('storage')}>
            <div className="stat-icon storage-usage">
              <FaHdd />
            </div>
            <div className="stat-content">
              <h3>Uploads Storage</h3>
              <p className="stat-number">{uploadsStorage}</p>
              <p className="stat-description">User-uploaded content</p>
            </div>
          </div>
          
          <div className="stat-card clickable" onClick={() => setModalType('health')}>
            <div className="stat-icon data-health">
              <FaShieldAlt />
            </div>
            <div className="stat-content">
              <h3>Data Integrity</h3>
              <p className="stat-number">{dataHealth}</p>
              <p className="stat-description">Last check: 2h ago</p>
            </div>
          </div>
        </div>

        {/* Backup Table Panel */}
        <div className="backup-table">
          <div className="panel-header">
            <h3>Backup Files</h3>
            <p className="muted">Latest server backups</p>
          </div>
          <div className="backup-controls">
            <button className="run-backup" onClick={runBackup} disabled={loading}>
              {loading ? 'Running…' : 'Run Backup'}
            </button>
            <button className="configure" onClick={() => setShowConfig(true)}>Configure</button>
          </div>
          {backups.length === 0 ? (
            <div className="empty-state">No backups yet. Run a backup to create one.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Created</th>
                    <th>Size</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b.name}>
                      <td className="filename">{b.name}</td>
                      <td>{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="size">{(b.size / 1024).toFixed(1)} KB</td>
                      <td className="actions">
                        <button className="action-btn-dm download" onClick={() => downloadBackup(b.name)}>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showConfig && (
          <BackupConfigurationModal
            onClose={() => setShowConfig(false)}
            onSave={handleSaveConfig}
          />
        )}

        {modalType && (
          <DetailModal onClose={() => setModalType(null)}>
            {renderModalContent()}
          </DetailModal>
        )}
      </div>
    </div>
  );
};

export default DataManagementPage;