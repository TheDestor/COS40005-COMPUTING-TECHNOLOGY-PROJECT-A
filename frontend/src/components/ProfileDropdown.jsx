// Profile drop down component with login/logout functionality
// Before login only displays login button and general and contact us options
// After login displays user info, logout button and general, bookmark, profile setting and contact us options

import React, { useState } from 'react';
import { FiSettings, FiInfo, FiBookmark, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const user = {
    firstName: 'John',
    profileImage: 'https://i.pravatar.cc/150?img=3'
  };

  return (
    <div className="profile-dropdown">
      <button className="profile-button" onClick={() => setIsOpen(!isOpen)}>
        👤
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {!isLoggedIn ? (
            <>
              <div className="login-section">
                <span>Login to learn more</span>
                <Link to="/login" className="login-button2" onClick={() => {
                    navigate('/login');
                    setIsOpen(false);}}>
                  Login
                </Link>
              </div>
              <div className="divider" />
              <div>
                <button className="menu-item">
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item">
                  <FiInfo size={18} />
                  Contact Us
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="loggedin-section">
                <div className="user-info">
                  <img src={user.profileImage} alt="Profile" className="user-avatar" />
                  <span>{user.firstName}</span>
                </div>
                <button className="logout-button" onClick={() => setIsLoggedIn(false)}>
                  Logout
                </button>
              </div>
              <div className="divider" />
              <div>
                <button className="menu-item">
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item">
                  <FiBookmark size={18} />
                  Bookmark
                </button>
                <button className="menu-item">
                  <FiUser size={18} />
                  Profile Setting
                </button>
                <button className="menu-item">
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
