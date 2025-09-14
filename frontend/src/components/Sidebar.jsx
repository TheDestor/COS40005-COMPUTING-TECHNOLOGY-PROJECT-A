import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { 
  FaTachometerAlt, 
  FaQuestionCircle, 
  FaChartBar, 
  FaUsers, 
  FaCalendarPlus, 
  FaBuilding, 
  FaMapMarkerAlt,
  FaMapMarkedAlt,
  FaSignOutAlt,
  FaBars
} from 'react-icons/fa';
import { LuPanelLeftClose } from 'react-icons/lu';
import '../styles/Sidebar.css';
import cbtImage from '../assets/cbt.png';
import { toast } from 'react-toastify';

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState === null ? true : JSON.parse(savedState);
  });
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebarState', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      const isCurrentlyMobile = window.innerWidth <= 992;
      setIsMobileView(isCurrentlyMobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  };

  const handleSuccess = (msg) => {
    toast.success(msg, { position: 'bottom-right' });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
    handleSuccess("Logged out successfully!");
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button (Hamburger) - Only visible when mobile and sidebar is CLOSED */}
      {isMobileView && !isSidebarOpen && (
        <div className="mobile-sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </div>
      )}

      {/* Sidebar Backdrop for Mobile Overlay */}
      {isMobileView && isSidebarOpen && (
        <div className="sidebar-backdrop active" onClick={closeSidebar}></div>
      )}

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={cbtImage} alt="CBT Logo" className="logo-img" />
            <h2 className="sidebar-name">CBT Admin</h2>
          </div>
          {/* Close button inside sidebar header for mobile - always visible when sidebar is open in mobile view */}
          {isMobileView && isSidebarOpen && (
            <div className="close-sidebar-btn" onClick={closeSidebar}>
              <LuPanelLeftClose />
            </div>
          )}
        </div>
        
        <div className="sidebar-content">
          <ul className="sidebar-menu">
            <li className="menu-item">
              <NavLink to="/dashboard" end>
                <FaTachometerAlt className="icon123" />
                <span className="menu-text">Dashboard</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/view-inquiry">
                <FaQuestionCircle className="icon123" />
                <span className="menu-text">View Inquiries</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/view-analytics">
                <FaChartBar className="icon123" />
                <span className="menu-text">View Analytics</span>
              </NavLink>
            </li>

            {/*
            <li className="menu-item">
              <NavLink to="/manage-reviews">
                <FaUsers className="icon123" />
                <span className="menu-text">Manage Reviews</span>
              </NavLink>
            </li>
            */}
            
            <li className="menu-item">
              <NavLink to="/add-event">
                <FaCalendarPlus className="icon123" />
                <span className="menu-text">Add Event</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/business-management">
                <FaBuilding className="icon123" />
                <span className="menu-text">Business Management</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/manage-location">
                <FaMapMarkerAlt className="icon123" />
                <span className="menu-text">Manage Location</span>
              </NavLink>
            </li>
            <li className="menu-item">
              <NavLink to="/" end>
                <FaMapMarkedAlt className="icon123" />
                <span className="menu-text">Map</span>
              </NavLink>
            </li>
          </ul>
        </div>
        
        <div className="sidebar-footer">
          <NavLink to="#" className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="icon123" />
            <span className="menu-text">Logout</span>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default Sidebar;