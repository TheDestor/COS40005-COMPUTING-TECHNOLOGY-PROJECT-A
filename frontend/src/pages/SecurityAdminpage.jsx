import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/SecurityAdminpage.css';
import { FaShieldAlt, FaClock, FaSignInAlt, FaUserShield, FaTimesCircle, FaListAlt, FaSearch, FaFilter } from 'react-icons/fa';
import SystemAdminSidebar from '../pages/SystemAdminSidebar';
import { useAuth } from '../context/AuthProvider';

// SecurityAdminPage component
function SecurityAdminPage() {
  const { accessToken, isLoggedIn } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [signInStats, setSignInStats] = useState({
    userRegularSignIns24h: 0,
    userBusinessSignIns24h: 0,
    adminCBTSignIns24h: 0,
    adminSystemSignIns24h: 0,
    failedLoginAttempts24h: 0,
    deltaUserRegular: 0,
    deltaUserBusiness: 0,
    deltaAdminCBT: 0,
    deltaAdminSystem: 0,
    deltaFailedLogins: 0,
    // aggregated totals
    userTotal24h: 0,
    adminTotal24h: 0,
    deltaUserTotal: 0,
    deltaAdminTotal: 0,
  });
  // Pagination state: 5 rows per page
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  // Filter & search state
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'success' | 'failure'
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Friendly error message mapping
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedError, setSelectedError] = useState('');
  const [closingModal, setClosingModal] = useState(false);

  const friendlyMessages = {
    user_not_found: 'This email does not exist in the database.',
    invalid_credentials: 'The email or password entered by the user is incorrect.',
    account_locked: 'Your account has been temporarily locked due to multiple failed login attempts.',
    invalid_input: 'Please ensure all required fields are filled correctly.', 
  };
  const getFriendlyErrorMessage = (msg) => friendlyMessages[msg] || msg || 'No error details available.';

  useEffect(() => {
    let ignore = false;
    const fetchMetrics = async () => {
      if (!isLoggedIn || !accessToken) return;
      try {
        // metrics
        const res = await fetch('/api/admin/metrics/security-stats', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const json = await res.json();
        const d = json?.data || {};
        const stats = {
          userRegularSignIns24h: d.userRegularSignIns24h ?? 0,
          userBusinessSignIns24h: d.userBusinessSignIns24h ?? 0,
          adminCBTSignIns24h: d.adminCBTSignIns24h ?? 0,
          adminSystemSignIns24h: d.adminSystemSignIns24h ?? 0,
          failedLoginAttempts24h: d.failedLoginAttempts24h ?? 0,
          deltaUserRegular: d.deltaUserRegular ?? 0,
          deltaUserBusiness: d.deltaUserBusiness ?? 0,
          deltaAdminCBT: d.deltaAdminCBT ?? 0,
          deltaAdminSystem: d.deltaAdminSystem ?? 0,
          deltaFailedLogins: d.deltaFailedLogins ?? 0,
        };
        // compute aggregated totals and deltas
        const userTotal24h = (d.userRegularSignIns24h ?? 0) + (d.userBusinessSignIns24h ?? 0);
        const adminTotal24h = (d.adminCBTSignIns24h ?? 0) + (d.adminSystemSignIns24h ?? 0);
        const deltaUserTotal = (d.deltaUserRegular ?? 0) + (d.deltaUserBusiness ?? 0);
        const deltaAdminTotal = (d.deltaAdminCBT ?? 0) + (d.deltaAdminSystem ?? 0);
        if (!ignore) setSignInStats({ ...stats, userTotal24h, adminTotal24h, deltaUserTotal, deltaAdminTotal });
      } catch (e) {
        console.error('Failed to fetch security metrics:', e);
      }
      try {
        const r2 = await fetch('/api/admin/metrics/security-sessions?limit=5000', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const j2 = await r2.json();
        if (!ignore && j2?.success) {
          setSessions(Array.isArray(j2.data) ? j2.data : []);
          const pages = Math.max(1, Math.ceil((Array.isArray(j2.data) ? j2.data.length : 0) / pageSize));
          setCurrentPage((p) => Math.min(p, pages));
        }
      } catch (e) {
        console.error('Failed to fetch security sessions:', e);
      }
    };
    fetchMetrics();
    const t = setInterval(fetchMetrics, 30000);
    return () => { ignore = true; clearInterval(t); };
  }, [isLoggedIn, accessToken]);

  // Reset pagination when filters/search change
  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery]);

  // Derived filtering & searching
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const statusMatch = (s) => (
    filterStatus === 'all' || (filterStatus === 'success' ? String(s.status).toLowerCase() === 'success' : String(s.status).toLowerCase() === 'failure')
  );
  const matchesQuery = (s) => {
    const method = s.method || (s.endpoint === '/google-login' ? 'Google' : s.endpoint === '/login' ? 'Password' : '');
    const fields = [
      s.email || '',
      s.device || '',
      method,
      String(s.status || ''),
      s.role || '',
      new Date(s.time).toLocaleString(),
    ].join(' ').toLowerCase();
    return normalizedQuery === '' || fields.includes(normalizedQuery);
  };
  const filteredSessions = sessions.filter((s) => statusMatch(s) && matchesQuery(s));

  // Pagination (5 per page) over filtered results
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedSessions = filteredSessions.slice(startIndex, startIndex + pageSize);

  const maskIp = (ip) => ip.replace(/\.\d+$/, '.xxx'); // mask last octet

  return (
    <div className="admin-container">
      <SystemAdminSidebar />
      <div className="content-section2">
        <div className="page-title">
          <h2><FaShieldAlt /> Security</h2>
          <p>Monitor and manage security settings.</p>
        </div>

        {/* Sign-in Times Section */}
        <section className="signin-times">
          <h3 className="section-title">
            <span className="section-title-icon"><FaClock /></span>
            Sign-in Times
          </h3>
          {/* Use shared summary styles for exact match */}
          <div className="summary-container" role="region" aria-label="Sign-in metrics">
            {/* User Sign-ins (combined: regular + business) */}
            <div className="summary-box lb-theme non-interactive">
              <div className="summary-header">
                <div className="summary-icon-wrapper lb-bg"><div className="summary-icon"><FaSignInAlt /></div></div>
                <h3>User Sign-ins</h3>
              </div>
              <div className="summary-value-row">
                <span className="value" aria-label="Users sign-ins combined (last 24h)">{signInStats.userTotal24h}</span>
                <small className="summary-note note-green">{signInStats.deltaUserTotal >= 0 ? `+${signInStats.deltaUserTotal}` : signInStats.deltaUserTotal} since last 24 hrs</small>
              </div>
            </div>

            {/* Admin Sign-ins (combined: CBT + System) */}
            <div className="summary-box purple-theme non-interactive">
              <div className="summary-header">
                <div className="summary-icon-wrapper purple-bg"><div className="summary-icon"><FaUserShield /></div></div>
                <h3>Admin Sign-ins</h3>
              </div>
              <div className="summary-value-row">
                <span className="value" aria-label="Admins sign-ins combined (last 24h)">{signInStats.adminTotal24h}</span>
                <small className="summary-note note-green">{signInStats.deltaAdminTotal >= 0 ? `+${signInStats.deltaAdminTotal}` : signInStats.deltaAdminTotal} since last 24 hrs</small>
              </div>
            </div>

            {/* Failed Login Attempts (unchanged) */}
            <div className="summary-box lr-theme non-interactive">
              <div className="summary-header">
                <div className="summary-icon-wrapper lr-bg"><div className="summary-icon"><FaTimesCircle /></div></div>
                <h3>Failed Logins</h3>
              </div>
              <div className="summary-value-row">
                <span className="value" aria-label="Failed login attempts (last 24h)">{signInStats.failedLoginAttempts24h}</span>
                <small className="summary-note note-red">{signInStats.deltaFailedLogins >= 0 ? `+${signInStats.deltaFailedLogins}` : signInStats.deltaFailedLogins} since last 24 hrs</small>
              </div>
            </div>
          </div>
        </section>

        {/* Sign-in Sessions Section */}
        <section className="sessions-section">
          <div className="sessions-header">
            <h3 className="section-title">
              <span className="section-title-icon"><FaListAlt /></span>
              Sign-in Sessions
            </h3>
            <div className="sessions-controls">
              {/* Professional search input with icon */}
              <div className="search-input-sp-wrapper">
                <FaSearch className="search-icon-sp" />
                <input
                  type="text"
                  className="search-input-sp"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search sessions"
                />
              </div>
              {/* Filter trigger with icon */}
              <div className="filter-wrapper">
                <button
                  className="filter-btn pro"
                  onClick={() => setShowFilterMenu((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={showFilterMenu}
                >
                  <FaFilter className="filter-icon-sp" /> Filter
                </button>
                {showFilterMenu && (
                  <div className="filter-menu" role="menu">
                    <button className={`filter-option ${filterStatus==='all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }}>All</button>
                    <button className={`filter-option ${filterStatus==='success' ? 'active' : ''}`} onClick={() => { setFilterStatus('success'); setShowFilterMenu(false); }}>Success</button>
                    <button className={`filter-option ${filterStatus==='failure' ? 'active' : ''}`} onClick={() => { setFilterStatus('failure'); setShowFilterMenu(false); }}>Failure</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="sessions-table-wrapper">
            {filteredSessions.length === 0 ? (
              <div className="no-data" role="status" aria-live="polite">No sign-in attempts found</div>
            ) : (
              <>
                <table className="sessions-table" aria-label="Sign-in sessions table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Device</th>
                      <th>Method</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSessions.map((s, idx) => {
                      const isFailure = String(s.status).toLowerCase() !== 'success';
                      const method = s.method || (s.endpoint === '/google-login' ? 'Google' : s.endpoint === '/login' ? 'Password' : '—');
                      return (
                        <tr
                          key={startIndex + idx}
                          className={isFailure ? 'clickable-row failure-row' : ''}
                          onClick={isFailure ? () => {
                            setSelectedError(getFriendlyErrorMessage(s.errorMessage));
                            setClosingModal(false);
                            setShowErrorModal(true);
                          } : undefined}
                        >
                          <td>{s.email || '—'}</td>
                          <td>{s.device || '—'}</td>
                          <td>{method}</td>
                          <td>{new Date(s.time).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${isFailure ? 'status-failure' : 'status-success'}`}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="pagination-sp" role="navigation" aria-label="Sessions pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      {/* Render failure details modal when active */}
      {showErrorModal && (
        <div className={`modal-overlay-sp ${closingModal ? 'closing' : 'show'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Failure details"
          onAnimationEnd={() => {
            if (closingModal) { setShowErrorModal(false); setClosingModal(false); }
          }}
        >
          <div className={`modal-content-sp ${closingModal ? 'closing' : 'show'}`}>
            <div className="modal-header">
              <h4><FaTimesCircle /> Failure Details</h4>
            </div>
            <p className="modal-message">{selectedError}</p>
            <button className="modal-close-sp" onClick={() => setClosingModal(true)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityAdminPage;