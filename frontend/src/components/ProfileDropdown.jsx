import React, { useState } from 'react';
import { FiSettings, FiInfo, FiBookmark } from 'react-icons/fi';
import { FaUser } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/ProfileDropdown.css';
import BookmarkPage from '../pages/Bookmarkpage.jsx';

const ProfileDropdown = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  const profileImage = 'https://i.pravatar.cc/150?img=3';
  const displayName = user?.firstName || 'Guest';

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
                <button className="menu-item51" onClick={() => navigate('/settings')}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item51" onClick={() => navigate('/contact-us')}>
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
                <button className="menu-item51" onClick={() => navigate('/settings')}>
                  <FiSettings size={18} />
                  General
                </button>
                <button className="menu-item51" onClick={() =>{ navigate('/', { state: { openBookmark: true } });
                    setIsOpen(false);}}>
                  <FiBookmark size={18} />
                  Bookmark
                </button>
                <button className="menu-item51" onClick={() => navigate('/profile-settings')}>
                  <FaUser size={18} />
                  Profile Setting
                </button>
                <button className="menu-item51" onClick={() => navigate('/contact-us')}>
                  <FiInfo size={18} />
                  Contact Us
                </button>
              </div>
            </>    
          )}
        </div>
      )}
    </div>
    {showBookmark && <BookmarkPage isOpen={showBookmark} onClose={() => setShowBookmark(false)} />}
    </>
  );
};

export default ProfileDropdown;
