import React, { useState } from 'react';
import '../styles/SystemAdminPage.css';
import {
  FaTachometerAlt,
  FaUsersCog,
  FaServer,
  FaDatabase,
  FaShieldAlt
} from 'react-icons/fa';
import Navbar from '../components/MenuNavbar.jsx';
import UserManagementPage from '../pages/UserManagementpage.jsx';
import SystemAdminDashboard from '../pages/SystemAdminDashboard.jsx';

const SystemAdminPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const SectionPlaceholder = ({ icon, title }) => (
    <div className="content-section2">
      <h2>{icon} {title}</h2>
      <p>Feature coming soon or under development...</p>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <SystemAdminDashboard />
      case 'user':
        return <UserManagementPage />
      case 'monitoring':
        return <SectionPlaceholder icon={<FaServer className="icon" />} title="System Monitoring" />;
      case 'data':
        return <SectionPlaceholder icon={<FaDatabase className="icon" />} title="Data Management" />;
      case 'security':
        return <SectionPlaceholder icon={<FaShieldAlt className="icon" />} title="Security" />;
      default:
        return null;
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt className="sidebar-icon2" /> },
    { id: 'user', label: 'User Management', icon: <FaUsersCog className="sidebar-icon2" /> },
    { id: 'monitoring', label: 'System Monitoring', icon: <FaServer className="sidebar-icon2" /> },
    { id: 'data', label: 'Data Management', icon: <FaDatabase className="sidebar-icon2" /> },
    { id: 'security', label: 'Security', icon: <FaShieldAlt className="sidebar-icon2" /> },
  ];

  return (
    <div>
      <Navbar />
      <div className="admin-container">
        <div className="sidebar2">
          <div className="user-profile2">
            <div className="profile-icon2">👤</div>
            <div className="username">Admin User</div>
          </div>
          {sidebarItems.map(item => (
            <div
              key={item.id}
              className={`sidebar-item2 ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        <div className="main-content2">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemAdminPage;
