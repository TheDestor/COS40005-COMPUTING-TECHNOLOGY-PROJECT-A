import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaQuestionCircle, 
  FaChartBar, 
  FaUsers, 
  FaCalendarPlus, 
  FaBuilding, 
  FaMapMarkerAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import '../styles/Sidebar.css';
import cbtImage from '../assets/cbt.png';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={cbtImage} alt="CBT Logo" className="logo-img" />
          <h2 className="sidebar-name">CBT Admin</h2>
        </div>
      </div>
      
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          <li className="menu-item">
            <NavLink to="/dashboard" end>
              <FaTachometerAlt className="icon" />
              <span className="menu-text">Dashboard</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/view-inquiry">
              <FaQuestionCircle className="icon" />
              <span className="menu-text">View Inquiries</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/view-analytics">
              <FaChartBar className="icon" />
              <span className="menu-text">View Analytics</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/manage-reviews">
              <FaUsers className="icon" />
              <span className="menu-text">Manage Reviews</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/add-event">
              <FaCalendarPlus className="icon" />
              <span className="menu-text">Add Event</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/business-management">
              <FaBuilding className="icon" />
              <span className="menu-text">Business Management</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/manage-location">
              <FaMapMarkerAlt className="icon" />
              <span className="menu-text">Manage Location</span>
            </NavLink>
          </li>
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <NavLink to="/logout" className="logout-btn">
          <FaSignOutAlt className="icon" />
          <span className="menu-text">Logout</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;