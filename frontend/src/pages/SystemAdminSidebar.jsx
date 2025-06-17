import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import '../styles/SystemAdminSidebar.css';
import {
  FaTachometerAlt,
  FaUsersCog,
  FaServer,
  FaDatabase,
  FaShieldAlt,
  FaBars,
  FaMapMarkedAlt,
  FaSignOutAlt,

} from 'react-icons/fa';
import { LuPanelLeftClose } from 'react-icons/lu';
import cbtImage from '../assets/cbt.png';
import { toast } from 'react-toastify';

const SystemAdminSidebar = () => {
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
          <img src={cbtImage} alt="Admin Logo" className="logo-img" />
          <h2 className="username">System Admin</h2>
        </div>
        {/* Close button inside sidebar header for mobile - always visible when sidebar is open in mobile view */}
        {isMobileView && isSidebarOpen && (
          <div className="close-sidebar-btn" onClick={closeSidebar}>
            <LuPanelLeftClose />
          </div>
        )}
      </div>
      
      <div className="sidebar-content">
        <ul className="sidebar-menu-admin">
          <li className="menu-item">
            <NavLink to="/admin-dashboard" end>
              <FaTachometerAlt className="sidebar-icon2" />
              <span className="menu-text">Dashboard</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/user-management">
              <FaUsersCog className="sidebar-icon2" />
              <span className="menu-text">User Management</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/system-monitoring">
              <FaServer className="sidebar-icon2" />
              <span className="menu-text">System Monitoring</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/data-management">
              <FaDatabase className="sidebar-icon2" />
              <span className="menu-text">Data Management</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/security-admin">
              <FaShieldAlt className="sidebar-icon2" />
              <span className="menu-text">System Security</span>
            </NavLink>
          </li>
          <li className="menu-item">
            <NavLink to="/" end>
              <FaMapMarkedAlt className="sidebar-icon2" />
              <span className="menu-text">Map</span>
            </NavLink>
          </li>
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <NavLink to="#" className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt className="sidebar-icon2" />
          <span className="menu-text">Logout</span>
        </NavLink>
      </div>
    </div>
  </>
);
};

export default SystemAdminSidebar;


