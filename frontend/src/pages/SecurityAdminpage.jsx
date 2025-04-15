import React, { useState } from 'react';
import '../styles/SecurityAdminpage.css';
import { FaShieldAlt } from 'react-icons/fa';
import { AiOutlineReload } from 'react-icons/ai';
import { FaCheckCircle, FaBan } from "react-icons/fa";

const SecurityAdminPage = () => {
  const [policies, setPolicies] = useState({
    twoFA: true,
    autoLock: true,
    passwordComplexity: true,
  });

  const togglePolicy = (policy) => {
    setPolicies({ ...policies, [policy]: !policies[policy] });
  };

  return (
    <div className="content-section2">
      {/* Header */}
      <div className="security-header">
        <h2><FaShieldAlt /> Security</h2>
        <button className="refresh-btn"><AiOutlineReload /> Refresh</button>
      </div>

      {/* Dashboard Cards */}
      <div className="security-dashboard">
        <div className="card2">
          <p>Threats Detected</p>
          <h3>12</h3>
          <span>+3 new today</span>
        </div>
        <div className="card2">
          <p>Failed Logins</p>
          <h3>24</h3>
          <span>▲ 40% decrease</span>
        </div>
        <div className="card2">
          <p>Security Updates</p>
          <h3>5</h3>
          <span>All systems patched</span>
        </div>
        <div className="card2">
          <p>Firewall Blocks</p>
          <h3>87</h3>
          <span>▲ 15% increase</span>
        </div>
      </div>

      {/* Security Policies */}
      <div className="security-policies">
        <label>
          <input
            type="checkbox"
            checked={policies.twoFA}
            onChange={() => togglePolicy('twoFA')}
          />
          Require 2FA
        </label>
        <label>
          <input
            type="checkbox"
            checked={policies.autoLock}
            onChange={() => togglePolicy('autoLock')}
          />
          Auto-lock inactive sessions
        </label>
        <label>
          <input
            type="checkbox"
            checked={policies.passwordComplexity}
            onChange={() => togglePolicy('passwordComplexity')}
          />
          Password complexity
        </label>
      </div>

      {/* Threat Chart */}
      <div className="chart-section">
        <h3>Security Threats Over Time</h3>
        <p>Last 30 days of threat activity</p>
        <div className="chart-placeholder">[Chart Here]</div>
      </div>

      {/* Alerts */}
      <div className="alerts-section">
        <h3>Recent Security Alerts</h3>

        {[
          {
            message: 'Multiple failed login attempts from suspicious IP (192.168.1.45)',
            severity: 'High',
            time: '2 hours ago'
          },
          {
            message: 'Database firewall triggered unusual query pattern',
            severity: 'Medium',
            time: '3 hours ago'
          },
          {
            message: 'New admin user created without 2FA',
            severity: 'Critical',
            time: '5 hours ago'
          },
          {
            message: 'Multiple failed login attempts from suspicious IP (192.168.1.45)',
            severity: 'High',
            time: '1 day ago'
          },
        ].map((alert, index) => (
          <div key={index} className="alert-card">
            <div>
              <strong>{alert.message}</strong>
              <p>{alert.severity} Severity · {alert.time}</p>
            </div>
            <div className="actions">
              <button className="actions-white"><FaCheckCircle /> Investigate</button>
              <button className="actions-red"><FaBan /> Block</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityAdminPage;
