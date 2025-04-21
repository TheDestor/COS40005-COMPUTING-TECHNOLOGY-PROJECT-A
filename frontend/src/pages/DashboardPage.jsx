import React, { useState } from 'react';
import { FaSearch, FaBell, FaEnvelope, FaMapMarkerAlt, FaChartLine, FaEnvelopeOpen, FaFileAlt } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handler for card clicks that can be connected to navigation later
  const handleCardClick = (cardType) => {
    console.log(`${cardType} card clicked`);
    // Later we can add navigation or modal functionality here
  };
  
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
        
        {/* Enhanced Interactive Stat Cards Section */}
        <div className="stat-cards-container">
          <div 
            className="stat-card" 
            onClick={() => handleCardClick('Active Destinations')}
            aria-label="View Active Destinations"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Active Destinations')}
          >
            <div className="stat-icon-wrapper">
              <FaMapMarkerAlt className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Destinations</p>
              <h2 className="stat-value">45</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('Reviews Pending Approval')}
            aria-label="View Reviews Pending Approval"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Reviews Pending Approval')}
          >
            <div className="stat-icon-wrapper">
              <FaChartLine className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Reviews Pending Approval</p>
              <h2 className="stat-value">12</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('New Inquiries')}
            aria-label="View New Inquiries"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('New Inquiries')}
          >
            <div className="stat-icon-wrapper">
              <FaEnvelopeOpen className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">New Inquiries</p>
              <h2 className="stat-value">5</h2>
            </div>
          </div>
          
          <div 
            className="stat-card"
            onClick={() => handleCardClick('Reported Content')}
            aria-label="View Reported Content"
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick('Reported Content')}
          >
            <div className="stat-icon-wrapper">
              <FaFileAlt className="stat-icon" />
            </div>
            <div className="stat-content">
              <p className="stat-label">Reported Content</p>
              <h2 className="stat-value">3</h2>
            </div>
          </div>
        </div>
        
        {/* I WILL ADD MORE CONTENT HERE WITH D3 VISUALISATIONS */}
      </div>
    </div>
  );
};

export default DashboardPage;