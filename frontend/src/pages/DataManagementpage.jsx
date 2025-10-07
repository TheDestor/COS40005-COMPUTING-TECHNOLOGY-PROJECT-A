// imports
import React, { useState, useEffect } from "react";
import '../styles/DataManagementpage.css';
import BackupConfigurationModal from "../components/BackupConfigmodal.jsx";
import { FaDatabase, FaHdd, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaTrash } from "react-icons/fa";
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import { useAuth } from '../context/AuthProvider.jsx';
import { toast } from "sonner";

// DetailModal uses `variant` to switch classes
const DetailModal = ({ children, onClose, variant }) => {
  const isDatabase = variant === 'database';
  return (
    <div className={isDatabase ? 'data-modal-overlay' : 'data-modal-overlay'} onClick={onClose}>
      <div className={isDatabase ? 'data-modal-content' : 'data-modal-content'} onClick={(e) => e.stopPropagation()}>
        <button className="data-modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

// DataManagementPage component
const DataManagementPage = () => {
  const [showConfig, setShowConfig] = useState(false);
  const { accessToken } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [confirmAction, setConfirmAction] = useState(null);
  const [dbTotalBytes, setDbTotalBytes] = useState(null);
  const [collectionStats, setCollectionStats] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [dataHealth, setDataHealth] = useState('Unknown');
  const [modalType, setModalType] = useState(null);

  // Helper: format timestamp using Malaysia timezone from backup filename
  const formatMalaysiaTimeFromFilename = (name) => {
    try {
      const m = name.match(/^backup-(.+)\.json$/);
      if (!m) return null;
      let iso = m[1];
      iso = iso.replace(/T(\d{2})-(\d{2})-(\d{2})/, (s, h, mi, se) => `T${h}:${mi}:${se}`);
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
    } catch {
      return null;
    }
  };

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
      setCurrentPage(1); // reset to first page on refresh
    } catch {}
  };

  // Robust download: saves JSON directly to the device
  const downloadBackup = async (filename) => {
    try {
      const headers = {
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const url = `/api/admin/backup/download/${encodeURIComponent(filename)}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        toast.error('Download failed.');
        return;
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success('Download started.');
    } catch (e) {
      toast.error('Download error. Please try again.');
    }
  };

  // Delete backup (client-side removal with UI feedback)
  const deleteBackupFile = async (filename) => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const url = `/api/admin/backup/delete/${encodeURIComponent(filename)}`;
      let ok = false;
      try {
        const r = await fetch(url, { method: 'DELETE', headers });
        ok = r.ok;
      } catch {
        ok = false;
      }

      if (ok) {
        toast.success('Backup deleted.');
        await Promise.all([
          loadBackups(),
          loadBackupStatus(),
          loadAdminMetrics(),
        ]);
      } else {
        setBackups(prev => prev.filter(b => b.name !== filename));
        toast.success('Removed from list. Server delete not available.');
      }
    } catch (e) {
      toast.error('Delete failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Derived: current page items and total pages
  const totalPages = Math.max(1, Math.ceil(backups.length / pageSize));
  const paginatedBackups = backups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const confirmRunBackup = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const r = await fetch('/api/admin/backup/run', { method: 'POST', headers });
      if (r.ok) {
        toast.success('Backup completed successfully.');
        await Promise.all([
          loadBackups(),
          loadBackupStatus(),
          loadAdminMetrics(),
        ]);
      } else {
        toast.error('Backup failed. Please try again.');
      }
    } catch (e) {
      toast.error('Backup failed. Please check your connection.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleSaveConfig = (config) => {
    console.log("Backup Config Saved:", config);
  };

  const formatBytes = (bytes) => {
    if (bytes == null) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let val = Number(bytes);
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(1)} ${units[i]}`;
  };

  const loadAdminMetrics = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const r = await fetch('/api/admin/metrics/stats', { headers });
      if (!r.ok) return;
      const json = await r.json();
      const d = json?.data || {};
      setDbTotalBytes(Number(d.totalDataSizeBytes || 0));
      setCollectionStats(Array.isArray(d.collections) ? d.collections : []);
    } catch {}
  };

  const loadBackupStatus = async () => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      };
      const r = await fetch('/api/admin/backup/status', { headers });
      if (!r.ok) return;
      const s = await r.json();
      setBackupStatus(s);
      setDataHealth(s?.isOutdated ? 'Unhealthy' : 'Healthy');
    } catch {}
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'database': {
        const total = collectionStats.reduce((sum, c) => sum + Number(c.sizeBytes || 0), 0) || 0;
        return (
          <>
            <h2><FaDatabase /> Database Size Details</h2>
            <p className="dbsize-total">Total Size: <strong>{formatBytes(dbTotalBytes)}</strong></p>
            <div className="dbsize-progress-bar-container">
              {collectionStats.map((c, idx) => {
                const pct = total > 0 ? (Number(c.sizeBytes || 0) / total) * 100 : 0;
                const colors = ['#0ea5e9', '#10b981', '#fb923c', '#6366f1', '#f43f5e', '#14b8a6'];
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={c.name}
                    className="dbsize-progress-bar-stack"
                    style={{ width: `${pct.toFixed(1)}%`, backgroundColor: color }}
                    title={`${c.name}: ${formatBytes(c.sizeBytes)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="dbsize-details-grid">
              {collectionStats.map((c, idx) => {
                const pct = total > 0 ? (Number(c.sizeBytes || 0) / total) * 100 : 0;
                const colors = ['#0ea5e9', '#10b981', '#fb923c', '#6366f1', '#f43f5e', '#14b8a6'];
                const color = colors[idx % colors.length];
                return (
                  <React.Fragment key={c.name}>
                    <div className="grid-item-label">
                      <span className="dbsize-legend-color" style={{ backgroundColor: color }}></span>
                      {c.name}
                    </div>
                    <div className="grid-item-value">{formatBytes(c.sizeBytes)}</div>
                    <div className="grid-item-percentage">{pct.toFixed(1)}%</div>
                  </React.Fragment>
                );
              })}
            </div>
          </>
        );
      }
      case 'health':
        return (
          <>
            <h2><FaShieldAlt /> Data Integrity Report</h2>
            <div className="details-grid health-grid">
              <div className={`grid-item-label ${dataHealth === 'Healthy' ? 'status-healthy' : 'status-unhealthy'}`}>
                <FaCheckCircle /> Status
              </div>
              <div className={`grid-item-value ${dataHealth === 'Healthy' ? 'status-healthy' : 'status-unhealthy'}`}>
                <strong>{dataHealth}</strong>
              </div>

              <div className="grid-item-label">
                <FaClock /> Last Backup
              </div>
              <div className="grid-item-value">
                {backupStatus?.lastBackupAtMYT || 'No backups yet'}
              </div>
            </div>
            <p className="modal-footer-note">Backups older than 24 hours are flagged as Unhealthy.</p>
          </>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    loadBackups();
    loadAdminMetrics();
    loadBackupStatus();
  }, [accessToken]);

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <div className="page-title">
        <h2><FaDatabase /> Data Management</h2>
        <p>Manage your database collections and backups.</p>
        </div>
        {/* Data Statistics Cards */}
        <div className="user-stats-container">
          <div className="stat-card clickable" onClick={() => setModalType('database')}>
            <div className="stat-icon-dm database-size">
              <FaDatabase />
            </div>
            <div className="stat-content">
              <h3>Database Size</h3>
              <p className="stat-number">{formatBytes(dbTotalBytes)}</p>
              <p className="stat-description">Total size of collections</p>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => setModalType('health')}>
            <div className="stat-icon-dm data-health">
              <FaShieldAlt />
            </div>
            <div className="stat-content">
              <h3>Data Integrity</h3>
              <p className="stat-number">{dataHealth}</p>
              <p className="stat-description">Last backup: {backupStatus?.lastBackupAtMYT || '—'}</p>
            </div>
          </div>
        </div>

        {/* Backup Table Panel */}
        <div className="backup-table">
          <div className="panel-header">
            <h3>Backup Files</h3>
            <div className="backup-controls">
              <button className="run-backup" onClick={() => setShowConfirmModal(true)} disabled={loading}>
                {loading ? 'Running…' : 'Run Backup'}
              </button>
              <button className="configure" onClick={() => setShowConfig(true)}>Configure</button>
            </div>
          </div>
          {backups.length === 0 ? (
            <div className="empty-state">No backups yet. Run a backup to create one.</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Created At</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBackups.map(b => (
                      <tr key={b.name}>
                        <td className="filename">{b.name}</td>
                        <td>{
                          formatMalaysiaTimeFromFilename(b.name) ||
                          b.createdMYT ||
                          (b.createdAt ? new Date(b.createdAt).toLocaleString('en-MY', {
                            timeZone: 'Asia/Kuala_Lumpur',
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: false,
                          }) : '-')
                        }</td>
                        <td className="size">{(b.size / 1024).toFixed(1)} KB</td>

                        {/* actions cell inside the table body row */}
                        <td className="actions-dm">
                          <button
                            className="action-btn-dm icon-btn download"
                            aria-label="Download"
                            title="Download"
                            onClick={() => setConfirmAction({ type: 'download', filename: b.name })}
                          >
                            <FaDownload />
                          </button>
                          <button
                            className="action-btn-dm icon-btn delete"
                            aria-label="Delete"
                            title="Delete"
                            onClick={() => setConfirmAction({ type: 'delete', filename: b.name })}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="backup-pagination" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px' }}>
                <button className="action-btn-dm" disabled={currentPage === 1 || loading} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Prev</button>
                <span style={{ alignSelf: 'center' }}>{currentPage} / {totalPages}</span>
                <button className="action-btn-dm" disabled={currentPage === totalPages || loading} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
              </div>
            </>
          )}
        </div>

        {showConfig && (
          <BackupConfigurationModal
            onClose={() => setShowConfig(false)}
            onSave={handleSaveConfig}
          />
        )}

        {/* Detail Modal */}
        {modalType && (
          <DetailModal onClose={() => setModalType(null)} variant={modalType === 'database' ? 'database' : 'data'}>
            {renderModalContent()}
          </DetailModal>
        )}

        {/* Confirmation modal before manual backup */}
        {showConfirmModal && (
          <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="confirm-modal">
              <h4 id="confirm-title">Run backup?</h4>
              <p>This will export database collections and create a server backup file.</p>
              <div className="confirm-actions-dm">
                <button className="modal-cancel-btn" onClick={() => setShowConfirmModal(false)} disabled={loading}>Cancel</button>
                <button className="modal-confirm-btn" onClick={confirmRunBackup} disabled={loading}>
                  {loading ? 'Running…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation modal before download/delete */}
        {confirmAction && (
          <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
            <div className="confirm-modal">
              <h4 id="confirm-action-title">
                {confirmAction.type === 'download' ? 'Download backup?' : 'Delete backup?'}
              </h4>
              <p>
                {confirmAction.type === 'download'
                  ? 'This will download the selected backup file to your device.'
                  : 'This will permanently delete the selected backup file.'}
              </p>
              <div className="confirm-actions-dm">
                <button className="modal-cancel-btn" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</button>
                <button
                  className="modal-confirm-btn"
                  onClick={async () => {
                    const name = confirmAction?.filename;
                    if (!name) return;
                    if (confirmAction.type === 'download') {
                      await downloadBackup(name); 
                    } else {
                      await deleteBackupFile(name); 
                    }
                    setConfirmAction(null);
                  }}
                  disabled={loading}
                >
                  {loading ? 'Working…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagementPage;