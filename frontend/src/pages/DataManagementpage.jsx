// imports
import React, { useState, useEffect, useRef } from "react";
import '../styles/DataManagementpage.css';
import BackupConfigurationModal from "../components/BackupConfigmodal.jsx";
import { FaDatabase, FaHdd, FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaClock, FaDownload, FaTrash } from "react-icons/fa";
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import { useAuth } from '../context/AuthProvider.jsx';
import { toast } from "sonner";
import * as d3 from 'd3';

// DetailModal uses `variant` to switch classes
// DetailModal component
const DetailModal = ({ children, onClose, variant }) => {
  const isDatabase = variant === 'database';
  return (
    <div className={isDatabase ? 'data-modal-overlay' : 'data-modal-overlay'} onClick={onClose}>
      <div
        className={`data-modal-content ${isDatabase ? 'wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        // Responsive width for smaller screens
        style={{
          width: isDatabase ? 'min(96vw, 1000px)' : undefined,
          maxWidth: isDatabase ? undefined : 500
        }}
      >
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
  // Tiny-screen flag: hide chart and show details grid at ≤ 480px
  const [isTinyScreen, setIsTinyScreen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 480px)').matches
      : false
  );
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

  const dbChartRef = useRef(null);

  // DataManagementPage component -> drawDbSizeChart()
  const drawDbSizeChart = () => {
    const el = dbChartRef.current;
    if (!el) return;
  
    const container = d3.select(el).style('position', 'relative').style('width', '100%').style('height', 'auto');
    const colors = ['#0ea5e9', '#10b981', '#fb923c', '#6366f1', '#f43f5e', '#14b8a6'];
  
    const data = Array.isArray(collectionStats)
      ? collectionStats.map((c, idx) => ({
          name: c.name,
          bytes: Number(c.sizeBytes || 0),
          count: Number(c.count || 0),
          color: colors[idx % colors.length],
        }))
      : [];
  
    // Sort by storage size (descending) so 'places' appears first
    data.sort((a, b) => b.bytes - a.bytes);
  
    const total = data.reduce((sum, d) => sum + d.bytes, 0);
    const containerWidth = el.getBoundingClientRect().width || 600;
    const small = containerWidth <= 600;
  
    container.selectAll('*').remove();
  
    if (!data.length || total === 0) {
      container.append('div').style('padding', '8px').style('color', '#666').text('No collection size data');
      return;
    }
  
    const barHeight = small ? 20 : 28;
    const margin = small
      ? { top: 10, right: 56, bottom: 28, left: 120 }
      : { top: 16, right: 80, bottom: 40, left: 160 };
    const width = Math.max(260, containerWidth - margin.left - margin.right);
    const height = data.length * barHeight + margin.top + margin.bottom;
  
    const MB = 1024 * 1024;
    const KB = 1024;
    const useMB = d3.max(data, (d) => d.bytes) >= MB;
    const unitFactor = useMB ? 1 / MB : 1 / KB;
    const unitLabel = useMB ? 'MB' : 'KB';
  
    // Responsive SVG with viewBox and fluid width
    const svgRoot = container
      .append('svg')
      .style('width', '100%')
      .style('height', 'auto')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);
  
    const svg = svgRoot.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.bytes * unitFactor) || 1])
      .range([0, width])
      .nice();
  
    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, data.length * barHeight])
      .padding(0.2);
  
    // Tooltip (update to show usage %)
    const tooltip = container
      .append('div')
      .attr('class', 'dbsize-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', '#fff')
      .style('padding', '8px 10px')
      .style('border-radius', '4px')
      .style('font-size', '14px')
      .style('pointer-events', 'none')
      .style('z-index', '10');
  
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    // Tooltip (show storage share)
    const showTooltip = (event, d) => {
      const localUnitLabel = d.bytes >= MB ? 'MB' : 'KB';
      const localUnitFactor = d.bytes >= MB ? 1 / MB : 1 / KB;
      const sizeVal = d.bytes * localUnitFactor;
      const storagePct = total > 0 ? ((d.bytes / total) * 100).toFixed(1) : '0.0';
      tooltip
        .html(
          `<strong>${d.name}</strong><br/>
           Documents: ${d.count.toLocaleString()}<br/>
           Storage: ${d3.format('.1f')(sizeVal)} ${localUnitLabel}<br/>
           Share: ${storagePct}%`
        )
        .style('visibility', 'visible');
  
      const containerRect = el.getBoundingClientRect();
      const tooltipRect = tooltip.node().getBoundingClientRect();
      let left = event.clientX - containerRect.left - tooltipRect.width / 2;
      let top = event.clientY - containerRect.top - tooltipRect.height - 12;
      left = clamp(left, 8, containerRect.width - tooltipRect.width - 8);
      top = clamp(top, 8, containerRect.height - tooltipRect.height - 8);
      tooltip.style('left', `${left}px`).style('top', `${top}px`);
    };
    const hideTooltip = () => tooltip.style('visibility', 'hidden');
  
    svg
    .append('g')
    .attr('class', 'x-grid')
    .attr('transform', `translate(0,${y.range()[1]})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(small ? 3 : 5)
        .tickSize(-y.range()[1]) // extend grid lines across chart height
        .tickFormat(() => '')    // hide tick text (grid only)
    )
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('line')
        .style('stroke', '#e5e7eb')
        .style('stroke-dasharray', '2,2')
        .style('opacity', 1)
    );

    svg
    .append('g')
    .attr('transform', `translate(0,${y.range()[1]})`)
    .call(d3.axisBottom(x).ticks(small ? 3 : 5).tickFormat((d) => `${d3.format('.1f')(d)} ${unitLabel}`))
    .selectAll('text')
    .style('font-size', small ? '11px' : '14px')
    .style('fill', '#333');
  
    svg
      .append('g')
      .call(d3.axisLeft(y).tickFormat((name) => (small && name.length > 12 ? name.slice(0, 12) + '…' : name)))
      .selectAll('text')
      .style('font-size', small ? '11px' : '14px')
      .style('fill', '#333')
      .on('mouseover', function (event, name) {
        const d = data.find((x) => x.name === name);
        if (d) showTooltip(event, d);
      })
      .on('mousemove', function (event, name) {
        const d = data.find((x) => x.name === name);
        if (d) showTooltip(event, d);
      })
      .on('mouseout', hideTooltip);
  
    const bars = svg
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', (d) => y(d.name))
    .attr('width', 0) // start collapsed
    .attr('height', y.bandwidth())
    .attr('rx', small ? 3 : 4)
    .attr('fill', (d) => d.color)
    .on('mouseover', showTooltip)
    .on('mousemove', showTooltip)
    .on('mouseout', hideTooltip);
    
    bars
    .transition()
    .duration(900)
    .ease(d3.easeCubicOut)
    .delay((d, i) => i * 120)
    .attr('width', (d) => x(d.bytes * unitFactor))
    .on('end', function (d) {
      const xVal = x(d.bytes * unitFactor);
      const labelGap = small ? 6 : 8;
      const maxRight = width - 24;

      const localUnitLabel = d.bytes >= MB ? 'MB' : 'KB';
      const localUnitFactor = d.bytes >= MB ? 1 / MB : 1 / KB;
      const sizeVal = d.bytes * localUnitFactor;

      // Final value label (shown only after animation), placed to the right of bar
      const valueLabelX = Math.min(xVal + labelGap, maxRight);
      const valueLabelY = y(d.name) + y.bandwidth() / 2;

      svg
        .append('text')
        .attr('class', 'value-label')
        .attr('x', valueLabelX)
        .attr('y', valueLabelY)
        .attr('text-anchor', 'start')
        .style('dominant-baseline', 'middle')
        .style('font-size', small ? '11px' : '14px')
        .style('fill', '#333')
        .style('font-weight', '500')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .text(`${d3.format('.1f')(sizeVal)} ${localUnitLabel}`)
        .transition()
        .duration(250)
        .style('opacity', 1);
    });

    svg.selectAll('.pct-label, .value-label').remove();
  
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', y.range()[1] + (small ? 24 : 32))
      .attr('text-anchor', 'middle')
      .style('font-size', small ? '12px' : '14px')
      .style('fill', '#333')
      .style('font-weight', 'bold')
      .text(`Storage Size (${unitLabel})`);
  };

  // Watch the 480px breakpoint and update tiny-screen state
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)');
    const handler = (e) => setIsTinyScreen(e.matches);

    setIsTinyScreen(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler); // Safari

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Draw when not tiny; clear chart markup when tiny
  useEffect(() => {
    if (modalType === 'database' && !isTinyScreen) {
      drawDbSizeChart();
    }
    if (isTinyScreen && dbChartRef.current) {
      d3.select(dbChartRef.current).selectAll('*').remove();
    }
  }, [modalType, collectionStats, isTinyScreen]);

  // Redraw chart on window resize only when not tiny
  useEffect(() => {
    if (modalType !== 'database') return;
    const onResize = () => {
      if (!isTinyScreen) {
        drawDbSizeChart();
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [modalType, isTinyScreen, collectionStats]);
  
  // DataManagementPage component -> resize observer for the database chart
  useEffect(() => {
    // Skip observing/drawing on tiny screens or if chart container isn't present
    if (modalType !== 'database' || !dbChartRef.current || isTinyScreen) return;
  
    const ro = new ResizeObserver(() => {
      drawDbSizeChart();
    });
    ro.observe(dbChartRef.current);
  
    return () => ro.disconnect();
  }, [modalType, collectionStats, isTinyScreen]);

  function renderModalContent() {
      switch (modalType) {
        case 'database': {
          const total = collectionStats.reduce((sum, c) => sum + Number(c.sizeBytes || 0), 0) || 0;
          // Collections sorted by storage size (descending)
          const sortedCollections = [...collectionStats]
            .map(c => ({ ...c, sizeBytes: Number(c.sizeBytes || 0) }))
            .sort((a, b) => b.sizeBytes - a.sizeBytes);
  
          return (
            <>
              <h2><FaDatabase /> Database Size Details</h2>
              <p className="dbsize-total">
                Total Size: <strong>{formatBytes(dbTotalBytes)}</strong>
              </p>
  
              {/* If tiny screen (≤ 480px), hide chart and show a compact details grid */}
              {isTinyScreen ? (
                <div
                  className="dbsize-details-grid"
                  aria-label="Database storage details"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '8px 12px',
                    alignItems: 'center',
                  }}
                >
                  {sortedCollections.map((c) => (
                    <React.Fragment key={c.name}>
                      <div style={{ color: '#333' }}>{c.name}</div>
                      <div style={{ textAlign: 'right', fontWeight: 500 }}>{formatBytes(c.sizeBytes)}</div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                // Otherwise render the horizontal bar chart
                <div
                  ref={dbChartRef}
                  className="dbsize-chart-container"
                  style={{ width: '100%', minHeight: 320, height: 'auto' }}
                  aria-label="Database storage sizes"
                />
              )}
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
                    className="modal-delete-btn"
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
                    {loading ? 'Working…' : 'Delete'}
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