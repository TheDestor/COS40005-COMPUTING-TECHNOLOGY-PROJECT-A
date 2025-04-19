import React, { useState } from 'react';
import { FaSearch, FaBell, FaEnvelope } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="greeting">
            <h3>Hi, CBT Admin!</h3>
            <p>Welcome back to your dashboard</p>
          </div>
          <div className="dashboard-actions">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="action-icons">
              <div className="icon-wrapper">
                <FaBell className="action-icon" />
                <span className="badge">5</span>
              </div>
              <div className="icon-wrapper">
                <FaEnvelope className="action-icon" />
                <span className="badge">3</span>
              </div>
            </div>
          </div>
        </div>
        {/* I WILL ADD MORE CONTENT HERE WITH D3 VISUALISATIONS */}
      </div>
    </div>
  );
};

export default DashboardPage;