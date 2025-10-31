import React, { useEffect, useState } from 'react';
// import BookmarkDetail from './BookmarkDetail';
import '../styles/Bookmarkpage.css';
import { FaRegBookmark, FaRegFlag, FaRegStar, FaArrowLeft, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider.jsx';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';
import businessImage from '../assets/business1.jpg'; // Placeholder image
import defaultImage from '../assets/default.png'; // Default image for unrecognized locations
import { toast } from 'sonner';

const BookmarkPage = ({ isOpen, onClose, showLoginOverlay, onBookmarkClick }) => {
  const auth = useAuth();
  const { bookmarks, removeBookmark } = UseBookmarkContext();

  // State to track selected bookmarks
  const [selected, setSelected] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, kind: null });
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  // Panel states: 'collapsed' (short open), 'expanded' (tall open)
  const [mobilePanelState, setMobilePanelState] = useState('collapsed');
  // Remove useState for panelHeight; height will be derived from mobilePanelState
  // const [panelHeight, setPanelHeight] = useState(() => (isMobile ? 30 : undefined));

  useEffect(() => {
    if (isOpen && isMobile) setMobilePanelState('collapsed');
  }, [isOpen, isMobile]);

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
    if (selected.length > 0) {
      setConfirmState({ open: true, kind: 'delete' });
    }
  };

  const closeConfirm = () => setConfirmState({ open: false, kind: null });

  const confirmAction = () => {
    if (confirmState.kind === 'delete') {
      bookmarks
        .filter((b) => selected.includes(b.name))
        .forEach((b) => removeBookmark(b));
      setSelected([]);
      toast.success(`${selected.length} bookmark(s) deleted!`);
    }
    closeConfirm();
  };

  // Select all handler (optional)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(bookmarks.map((b) => b.name));
    } else {
      setSelected([]);
    }
  };

  // Handle bookmark click to plot on map - UPDATED to include all fields
  const handleBookmarkClick = (bookmark) => {
    if (onBookmarkClick) {
      // Create a complete location object with all saved fields
      const locationData = {
        // Basic location fields
        name: bookmark.name,
        latitude: bookmark.latitude,
        longitude: bookmark.longitude,
        description: bookmark.description || '',
        type: bookmark.type || 'Bookmark',
        image: bookmark.image,
        
        // Website/URL fields
        website: bookmark.website,
        url: bookmark.url || bookmark.website,
        
        // Business-specific fields
        openingHours: bookmark.openingHours,
        phone: bookmark.phone,
        address: bookmark.address,
        category: bookmark.category,
        owner: bookmark.owner,
        ownerEmail: bookmark.ownerEmail,
        businessImage: bookmark.businessImage || bookmark.image,
        
        // Event-specific fields
        eventType: bookmark.eventType,
        startDate: bookmark.startDate,
        endDate: bookmark.endDate,
        startTime: bookmark.startTime,
        endTime: bookmark.endTime,
        registrationRequired: bookmark.registrationRequired,
        
        // Additional fields that might be present
        rating: bookmark.rating,
        division: bookmark.division,
        source: bookmark.source,
        
        // Ensure we have coordinates in both formats for compatibility
        coordinates: {
          latitude: bookmark.latitude,
          longitude: bookmark.longitude
        },
        lat: bookmark.latitude,
        lng: bookmark.longitude
      };

      onBookmarkClick(locationData);
    }
    toast.success(`${bookmark.name} plotted on map`);
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
    <div
      className={`bookmark-slide-container ${isOpen ? "show" : ""}`}
      style={isMobile
        ? mobilePanelState === 'collapsed'
          ? { height: '30vh', transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }
          : mobilePanelState === 'expanded'
              ? { height: '60vh', transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }
              : { height: '0', transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)" }
        : {}}
    >
      <div
        className="bookmark-header"
        onClick={e => {
          // Only on mobile
          if (!isMobile) return;
          // Prevent header click if on chevron button (has .bookmark-panel-chevron class)
          if (e.target.closest('.bookmark-panel-chevron')) return;
          if (mobilePanelState === 'collapsed') {
            setMobilePanelState('expanded');
          } else if (mobilePanelState === 'expanded') {
            setMobilePanelState('collapsed');
          }
        }}
        style={isMobile ? { cursor: 'pointer' } : {}}
      >
        <FaRegBookmark className="bookmark-icon"
        />
        <span>My Bookmarks</span>
        {isMobile ? (
          <button
            type="button"
            className="bookmark-panel-chevron"
            aria-label={mobilePanelState === 'collapsed' ? "Expand panel" : mobilePanelState === 'expanded' ? "Close bookmarks" : ''}
            title={mobilePanelState === 'collapsed' ? "Expand panel" : mobilePanelState === 'expanded' ? "Close bookmarks" : ''}
            onClick={e => {
              e.stopPropagation();
              if (mobilePanelState === 'collapsed') {
                setMobilePanelState('expanded');
              } else if (mobilePanelState === 'expanded') {
                setMobilePanelState('collapsed');
              } else if (mobilePanelState === 'closed') {
                setMobilePanelState('collapsed');
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              marginLeft: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            {mobilePanelState === 'expanded' ? (
              <FaChevronDown style={{ fontSize: 20 }} />
            ) : (
              <FaChevronUp style={{ fontSize: 20 }} />
            )}
          </button>
        ) : (
          <FaArrowLeft className="back-icon3" onClick={onClose} style={{ cursor: "pointer" }} />
        )}
      </div>

      <div className="bookmark-content">
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

        <div className="bookmark-list-container">
          <div className="bookmark-list">
            {bookmarks && bookmarks.length > 0 ? (
              bookmarks.map((bookmark) => (
                <div 
                  className="bookmark-item" 
                  key={bookmark.name}
                  onClick={() => handleBookmarkClick(bookmark)}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(bookmark.name)}
                    onChange={() => handleSelect(bookmark)}
                    className="bookmark-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <img
                    src={bookmark.image || defaultImage}
                    alt={bookmark.name}
                    className="bookmark-item-image"
                    onError={(e) => {
                      e.target.src = defaultImage;
                    }}
                  />
                  <div className="bookmark-item-info">
                    <span className="bookmark-item-name">{bookmark.name}</span>
                    {bookmark.type && (
                      <span className="bookmark-item-type">{bookmark.type}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bookmark-empty-state">
                <div className="bookmark-empty-message">
                  You have no bookmarks yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal code remains the same */}
      {confirmState.open && (
        <div className="bookmark-modal-overlay" onClick={closeConfirm}>
          <div className="bookmark-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bookmark-modal-title">
              Delete selected bookmarks?
            </div>
            <div className="bookmark-modal-body">
              This will remove {selected.length} selected bookmark(s) from your bookmarks.
            </div>
            <div className="bookmark-modal-actions">
              <button className="btn-secondary" onClick={closeConfirm}>Cancel</button>
              <button className="btn-danger" onClick={confirmAction}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkPage;