import React, { useState, useEffect } from 'react';
// import BookmarkDetail from './BookmarkDetail';
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider.jsx';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';


const BookmarkPage = ({ isOpen, onClose, showLoginOverlay }) => {
  const auth = useAuth();
  const { bookmarks } = UseBookmarkContext();

  useEffect(() => {
    if (isOpen && (!auth || !auth.user)) {
      if (showLoginOverlay) showLoginOverlay(); // show the login overlay
      if (onClose) onClose(); // close the bookmark panel
    }
  }, [isOpen, auth, showLoginOverlay, onClose]);

  const HeaderWithLogo = ({ title, count, Icon }) => (
    <div className="header-with-logo">
      <Icon className="header-icon" />
      <div className="header-info">
        <div className="header-text">{title}</div>
        <div className="count">{count} place{count > 1 ? 's' : ''}</div>
      </div>
    </div>
  );

  return (
    <div className={`bookmark-panel ${isOpen ? "hidden" : ""}`}>
          <div className="bookmark-header">
            <div className="bookmark-title">
              <FaRegBookmark className="bookmark-icon" />
              My Bookmarks
            </div>
            <span className="bookmark-close" onClick={onClose}><FaArrowLeft /></span>
          </div>

      <div className="bookmark-sections">
        {bookmarks.map((bookmark) => (
          <div className="header-text" key={bookmark.name}>
            <div>
              <h4>{bookmark.name}</h4>
            </div>
          </div>
        ))}
            {/* {sections.map((section, index) => (
              <div
                key={index}
                className="bookmark-section-card"
                onClick={() => setSelectedSection(index)}
              >
                <HeaderWithLogo
                  title={section.title}
                  count={section.count}
                  Icon={section.icon}
                />
              </div>
            ))} */}
          </div>
    </div>
  );
};

export default BookmarkPage;
