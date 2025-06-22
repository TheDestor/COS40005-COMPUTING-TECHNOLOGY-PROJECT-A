import React, { useEffect, useState } from 'react';
// import BookmarkDetail from './BookmarkDetail';
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar, FaArrowLeft, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider.jsx';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';
import businessImage from '../assets/business1.jpg'; // Placeholder image
import { toast } from 'react-toastify';

const BookmarkPage = ({ isOpen, onClose, showLoginOverlay }) => {
  const auth = useAuth();
  const { bookmarks, removeBookmark } = UseBookmarkContext();

  // State to track selected bookmarks
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (isOpen && (!auth || !auth.user)) {
      if (showLoginOverlay) showLoginOverlay();
      if (onClose) onClose();
    }
    // Reset selection when panel closes
    if (!isOpen) setSelected([]);
  }, [isOpen, auth, showLoginOverlay, onClose]);

  // Handle checkbox toggle
  const handleSelect = (bookmark) => {
    setSelected((prev) =>
      prev.includes(bookmark.name)
        ? prev.filter((name) => name !== bookmark.name)
        : [...prev, bookmark.name]
    );
  };

  // Handle delete selected
  const handleDeleteSelected = () => {
    if (
      selected.length > 0 &&
      window.confirm(`Delete ${selected.length} selected bookmark(s)?`)
    ) {
      bookmarks
        .filter((b) => selected.includes(b.name))
        .forEach((b) => removeBookmark(b));
      setSelected([]);
      toast.success(`${selected.length} bookmark(s) deleted!`);
    }
  };

  // Select all handler (optional)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(bookmarks.map((b) => b.name));
    } else {
      setSelected([]);
    }
  };

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

      {/* Delete button and select all */}
      {bookmarks && bookmarks.length > 0 && selected.length > 0 && (
        <div className="bookmark-actions">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selected.length === bookmarks.length && bookmarks.length > 0}
              onChange={handleSelectAll}
            />
            Select All
          </label>
          <button
            className="bookmark-delete-btn"
            onClick={handleDeleteSelected}
            title="Delete selected"
          >
            <FaTrashAlt /> Delete
          </button>
        </div>
      )}

      <div className="bookmark-list">
        {bookmarks && bookmarks.length > 0 ? (
          bookmarks.map((bookmark) => (
            <div className="bookmark-item" key={bookmark.name}>
              <input
                type="checkbox"
                checked={selected.includes(bookmark.name)}
                onChange={() => handleSelect(bookmark)}
                className="bookmark-checkbox"
              />
              <img
                src={bookmark.image || businessImage}
                alt={bookmark.name}
                className="bookmark-item-image"
              />
              <span className="bookmark-item-name">{bookmark.name}</span>
            </div>
          ))
        ) : (
          <div className="bookmark-empty-message">You have no bookmarks yet.</div>
        )}
      </div>
    </div>
  );
};

export default BookmarkPage;
