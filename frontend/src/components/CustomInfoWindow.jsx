import React, { useState, useEffect } from 'react';
import { FaStar, FaMapMarkerAlt, FaPhoneAlt, FaShareAlt, FaBookmark, FaTimes } from 'react-icons/fa';
import '../styles/CustomInfoWindow.css';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider.jsx';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';
import SharePlace from './SharePlace'; // adjust path as needed
import { useNavigate } from 'react-router-dom';
import defaultImage from '../assets/default.png';

const majorTowns = [
  'Kuching',
  'Sibu',
  'Bintulu',
  'Miri',
  'Serian',
  'Sri Aman',
  'Sarikei',
  'Kapit',
  'Mukah',
  'Limbang',
  'Samarahan',
  'Betong'
];

const CustomInfoWindow = ({ location, onCloseClick, onShowReview, addBookmark, onOpenLoginModal }) => {
  const [activeFooter, setActiveFooter] = useState('');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isFooterDisabled, setIsFooterDisabled] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [exploreData, setExploreData] = useState(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const { bookmarks, removeBookmark } = UseBookmarkContext();

  if (!location) return null;

  // Check if current location is already bookmarked
  const isBookmarked = bookmarks.some(bookmark => 
    bookmark.name === location.name && 
    bookmark.latitude === (location.latitude || location.lat) &&
    bookmark.longitude === (location.longitude || location.lng)
  );

  // Note: We don't automatically set activeFooter for bookmarks
  // The bookmark-highlighted class will handle the visual indication

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove non-word characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-'); // collapse multiple hyphens
  };

  // Fetch handler
  const handleExploreClick = () => {
    const isMajorTown = majorTowns.includes(location.name);
    const slug = generateSlug(location.name);
    
    const path = isMajorTown 
      ? `/towns/${slug}`
      : `/discover/${slug}`;

    navigate(path, {
      state: {
        name: location.name,
        desc: location.description || 'No description available',
        image: location.image || defaultImage,
        coordinates: [location.lat, location.lng], // Correct coordinate order
        type: location.type || 'tourist_attraction'
      }
    });
  };

  const footerItems = [
    { icon: <FaMapMarkerAlt />, label: 'Directions' },
    { icon: <FaBookmark />, label: isBookmarked ? 'Saved' : 'Save' },
    { icon: <FaPhoneAlt />, label: 'Phone' },
    { icon: <FaShareAlt />, label: 'Share' }
  ];

  const handleFooterClick = (label) => {
    if (isFooterDisabled) return; // prevent if already disabled
  
    setIsFooterDisabled(true); // disable footer
    setTimeout(() => setIsFooterDisabled(false), 3000); // enable after 3 seconds
  
    setActiveFooter(label);
    
    if (label === "Share") {
      setIsShareModalOpen(true);
      setActiveFooter('');
      return;
    }

    if (label === "Save" || label === "Saved") {
      if (auth && auth.user) {
        if (isBookmarked) {
          // Remove bookmark if already bookmarked
          const bookmarkToRemove = bookmarks.find(bookmark => 
            bookmark.name === location.name && 
            bookmark.latitude === (location.latitude || location.lat) &&
            bookmark.longitude === (location.longitude || location.lng)
          );
          if (bookmarkToRemove) {
            removeBookmark(bookmarkToRemove);
            toast.success("Bookmark removed successfully!");
            setActiveFooter(''); // Clear active state after removal
          }
        } else {
          // Add new bookmark
          const bookmarkData = {
            name: location.name,
            image: location.image,
            description: location.description,
            url: location.url,
            latitude: location.latitude || location.lat,
            longitude: location.longitude || location.lng,
            type: location.type || 'tourist_attraction'
          };
          addBookmark(bookmarkData);
          toast.success("Bookmark saved successfully!");
          console.log(bookmarkData);
        }
      } else {
        onOpenLoginModal?.();
        toast.warning("Please log in to save bookmarks.");
        setActiveFooter('');
      }
    } else {
      toast.info(`${label} feature is still in development.`);
      setActiveFooter('');
    }
  
    console.log(`${label} clicked`);
  };
  
  

  return (
    <>
    <button className="info-window-close" onClick={onCloseClick}>
        <FaTimes />
    </button>

    <div className="info-window-card">
      <img
        src={location.image || defaultImage}
        alt={location.name}
        className="info-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultImage;
        }}
      />

      <div className="info-header">
        <h3>{location.name}</h3>
        {location.rating && (
          <p className="rating51">
            {location.rating.toFixed(1)} <FaStar color="#ffc107" />
          </p>
        )}
      </div>

      <div className="info-tabs">
        <span className="active-tab">Overview</span>
        {/* <span className="inactive-tab" onClick={onShowReview}>Reviews</span> */}
      </div>

      <p className="info-desc">
        {showFullDesc
          ? location.description
          : location.description.slice(0, 100) + (location.description.length > 100 ? '...' : '')}
        {location.description.length > 100 && (
          <span
            className="read-more-toggle"
            onClick={() => setShowFullDesc(!showFullDesc)}
          >
            {showFullDesc ? ' Show less' : ' Read more'}
          </span>
        )}
      </p>

      {/* {location.url && location.url.startsWith('http') ? (
        <a
          href={location.url}
          target="_blank"
          rel="noopener noreferrer"
          className="info-link"
        >
          {new URL(location.url).hostname}
        </a>
      ) : (
        <span className="info-link">No website available</span>
      )} */}


      <div className="info-actions">
        {/* {location.openNowText && (
          <p className="info-open-status" style={{ color: location.openNowText.includes('Open') ? 'green' : 'red' }}>
            {location.open24Hours ? 'Open 24 hours' : location.openNowText}
          </p>
        )} */}
        <p>Open at 12 noon </p>
        <button className="book-btn" onClick={handleExploreClick}>Explore Now!</button>
      </div>

      <div className="info-footer">
        {footerItems.map((item) => {
          const isBookmarkItem = item.label === 'Save' || item.label === 'Saved';
          const isBookmarkHighlighted = isBookmarkItem && isBookmarked;
          
          return (
            <span
              key={item.label}
              className={`footer-item ${activeFooter === item.label ? 'active' : ''} ${isFooterDisabled ? 'disabled' : ''} ${isBookmarkHighlighted ? 'bookmark-highlighted' : ''}`}
              onClick={() => handleFooterClick(item.label)}
              style={{ pointerEvents: isFooterDisabled ? 'none' : 'auto', opacity: isFooterDisabled ? 0.5 : 1 }}
            >
              <span className="footer-icon">{item.icon}</span>
              {item.label}
            </span>
          );
        })}
      </div>
    </div>

    <SharePlace
      visible={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      location={{
        name: location.name,
        image: location.image,
        description: location.description || "No address provided",
        latitude: location.latitude || "N/A",
        longitude: location.longitude || "N/A",
        url: location.url || window.location.href
      }}
    />

    </>
  );
};

export default CustomInfoWindow;
