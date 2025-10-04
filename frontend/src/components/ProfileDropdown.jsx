import React, { useState } from 'react';
import { FiSettings, FiInfo, FiBookmark } from 'react-icons/fi';
import { FaRegUserCircle, FaUser } from "react-icons/fa";
import { AiOutlineDashboard } from "react-icons/ai";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import '../styles/ProfileDropdown.css';
import defaultUserImage from "../assets/Kuching.png";
import { toast } from 'sonner';

const ProfileDropdown = ({ onLoginClick, onBookmarkToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSuccess = (msg) => {
    toast.success(msg);
  };

  const handleLogout = async () => {
    await logout();
    // window.location.href = '/';
    navigate('/');
    setIsOpen(false);
    handleSuccess("Logged out successfully!");
  };

  const handleBookmarkToggle = () => {
    // Check if user is on the map page (root route)
    if (location.pathname === '/') {
      // User is already on the map page, just toggle bookmark
      if (onBookmarkToggle) {
        onBookmarkToggle();
      }
    } else {
      // User is on a different page, navigate to map and trigger bookmark toggle
      navigate('/', { 
        state: { 
          openBookmark: true 
        } 
      });
    }
    setIsOpen(false);
  };

  const profileImage = user?.avatarUrl || defaultUserImage;
  const displayName = user?.firstName || 'Guest';

  const isCBTAdmin = isLoggedIn && user?.role === 'cbt_admin';
  const isSystemAdmin = isLoggedIn && user?.role === 'system_admin';

  const profileIcon = isLoggedIn ? (
    <img src={profileImage} alt="Profile" className="profile-icon3" />
  ) : (
    <div className="icon-wrapper2">
      <FaUser size={24} className="user-icon2" />
    </div>
  );
  

  return (
    <>
    <div className="profile-dropdown">
      <button className="profile-button" onClick={() => setIsOpen(!isOpen)}>
        {profileIcon}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {!isLoggedIn ? (
            <>
              <div className="login-section">
                <span>Login to learn more</span>
                <button
                  className="login-button2"
                  onClick={() => {
                    onLoginClick();
                    setIsOpen(false);
                  }}
                >
                  Login
                </button>
              </div>
              <div className="divider3" />
              <div>
                <button className="menu-item51" onClick={() => { navigate('/settings'); setIsOpen(false); }}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item51" onClick={() => { navigate('/contact-us'); setIsOpen(false); }}>
                  <FiInfo size={18} />
                  Contact Us
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="loggedin-section">
                <div className="user-info">
                  <img src={profileImage} alt="Profile" className="user-avatar2" />
                  <span>{displayName}</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              <div className="divider3" />
              <div>
                <button className="menu-item51" onClick={() => { navigate('/settings'); setIsOpen(false); }}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item51" onClick={handleBookmarkToggle}>
                  <FiBookmark size={18} />
                  Bookmark
                </button>
                <button className="menu-item51" onClick={() => { navigate('/profile-settings'); setIsOpen(false); }}>
                  <FaRegUserCircle size={18} />
                  Profile Setting
                </button>
                <button className="menu-item51" onClick={() => { navigate('/contact-us'); setIsOpen(false); }}>
                  <FiInfo size={18} />
                  Contact Us
                </button>
                {isCBTAdmin && (
                  <button className="menu-item51" onClick={() => { navigate('/dashboard'); setIsOpen(false); }}>
                    <AiOutlineDashboard size={18} />
                    Dashboard
                  </button>
                )}
                {isSystemAdmin && (
                  <button className="menu-item51" onClick={() => { navigate('/admin-dashboard'); setIsOpen(false); }}>
                    <AiOutlineDashboard size={18} />
                    Dashboard
                  </button>
                )}
              </div>
            </>    
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default ProfileDropdown;
