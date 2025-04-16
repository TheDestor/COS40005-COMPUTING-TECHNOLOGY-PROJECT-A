// Profile drop down component with login/logout functionality
// Before login only displays login button and general and contact us options
// After login displays user info, logout button and general, bookmark, profile setting and contact us options

import React, { useState } from 'react';
import { FiSettings, FiInfo, FiBookmark, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  }

  const displayName = user?.firstName || "error";
  const profileImage = 'https://i.pravatar.cc/150?img=3';

  return (
    <div className="profile-dropdown">
      <button className="profile-button" onClick={() => setIsOpen(!isOpen)}>
        {isLoggedIn ? (
          <img src={profileImage} alt="Profile Picture"></img>
        ) : (
          <FiUser size={24} />
        )}
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
                  navigate('/login');
                  setIsOpen(false);   // Close dropdown
                }}
              >
                Login
              </button>
              </div>
              <div className="divider3" />
              <div>
              <button className="menu-item" onClick={() => navigate('/settings')}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item" onClick={() => navigate('/contact-us')}>
                  <FiInfo size={18} />
                  Contact Us
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="loggedin-section">
                <div className="user-info">
                  <img src={profileImage} alt="Profile" className="user-avatar" />
                  <span>{displayName}</span>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              <div className="divider" />
              <div>
                <button className="menu-item" onClick={() => navigate('/settings')}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item" onClick={() => navigate('/bookmark')}>
                  <FiBookmark size={18} />
                  Bookmark
                </button>
                <button className="menu-item" onClick={() => navigate('/profile-settings')}>
                  <FiUser size={18} />
                  Profile Setting
                </button>
                <button className="menu-item" onClick={() => navigate('/contact-us')}>
                  <FiInfo size={18} />
                  Contact Us
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
