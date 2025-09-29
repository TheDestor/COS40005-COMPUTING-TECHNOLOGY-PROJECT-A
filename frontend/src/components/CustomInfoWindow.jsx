import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaPhoneAlt, FaShareAlt, FaBookmark, FaTimes, FaGlobe, FaClock, FaEnvelope } from 'react-icons/fa';
import '../styles/CustomInfoWindow.css';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthProvider.jsx';
import { UseBookmarkContext } from '../context/BookmarkProvider.jsx';
import SharePlace from './SharePlace';
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

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

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
        image: getImageUrl(),
        coordinates: [location.lat, location.lng],
        type: location.type || 'tourist_attraction',
        ownerEmail: location.ownerEmail,
        website: location.website,
        openingHours: location.openingHours
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
    if (isFooterDisabled) return;
  
    setIsFooterDisabled(true);
    setTimeout(() => setIsFooterDisabled(false), 3000);
  
    setActiveFooter(label);
    
    if (label === "Share") {
      setIsShareModalOpen(true);
      setActiveFooter('');
      return;
    }

    if (label === "Save" || label === "Saved") {
      if (auth && auth.user) {
        if (isBookmarked) {
          const bookmarkToRemove = bookmarks.find(bookmark => 
            bookmark.name === location.name && 
            bookmark.latitude === (location.latitude || location.lat) &&
            bookmark.longitude === (location.longitude || location.lng)
          );
          if (bookmarkToRemove) {
            removeBookmark(bookmarkToRemove);
            toast.success("Bookmark removed successfully!");
            setActiveFooter('');
          }
        } else {
          const bookmarkData = {
            name: location.name,
            image: getImageUrl(),
            description: location.description,
            website: location.website,
            latitude: location.latitude || location.lat,
            longitude: location.longitude || location.lng,
            type: location.type || 'tourist_attraction'
          };
          addBookmark(bookmarkData);
          toast.success("Bookmark saved successfully!");
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
  };
  
  const getWebsiteUrl = () => {
    let url = location.website || location.url;
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  };

  const getWebsiteHostname = () => {
    const url = getWebsiteUrl();
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Get backend URL - use environment variable or default to your backend port
  const getBackendUrl = () => {
    return 'http://localhost:5050';
  };

  // Fixed image URL handler
  const getImageUrl = () => {
    console.log('Location data:', location);
    
    // Priority: businessImage > image > defaultImage
    const imageSource = location.businessImage || location.image;
    
    if (!imageSource) {
      console.log('No image source found, using default');
      return defaultImage;
    }

    // If it's already a full URL (starts with http), use it as is
    if (imageSource.startsWith('http')) {
      console.log('Using full URL:', imageSource);
      return imageSource;
    }

    // For uploads images, always use backend URL
    const backendUrl = getBackendUrl();
    
    // Handle different path formats
    let imagePath = imageSource;
    
    // Remove any leading slash to ensure consistent path
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.substring(1);
    }
    
    // Construct the full backend URL for the image
    const fullImageUrl = `${backendUrl}/${imagePath}`;
    console.log('Constructed image URL:', fullImageUrl);
    
    return fullImageUrl;
  };

  return (
    <>
      <button className="info-window-close" onClick={onCloseClick}>
        <FaTimes />
      </button>

      <div className="info-window-card info-window-scrollable">
        <img
          src={getImageUrl()}
          alt={location.name}
          className="info-image"
          onError={(e) => {
            console.error('Failed to load image from:', e.target.src);
            // Fallback to default image
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
          onLoad={() => {
            console.log('Image loaded successfully from:', getImageUrl());
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

        <p className="info-desc">
          {showFullDesc
            ? location.description
            : location.description?.slice(0, 100) + (location.description?.length > 100 ? '...' : '')}
          {location.description?.length > 100 && (
            <span
              className="read-more-toggle"
              onClick={() => setShowFullDesc(!showFullDesc)}
            >
              {showFullDesc ? ' Show less' : ' Read more'}
            </span>
          )}
        </p>

        {location.ownerEmail && (
          <div className="info-row">
            <span className="info-row-icon"><FaEnvelope /></span>
            <span className="info-row-text">{location.ownerEmail}</span>
          </div>
        )}

        {location.openingHours && (
          <div className="info-row">
            <span className="info-row-icon"><FaClock /></span>
            <span className="info-row-text">{location.openingHours}</span>
          </div>
        )}

        {getWebsiteUrl() && (
          <div className="info-row">
            <span className="info-row-icon"><FaGlobe /></span>
            <a
              href={getWebsiteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="info-row-link"
            >
              {getWebsiteHostname()}
            </a>
          </div>
        )}

        <div className="info-actions info-actions-right">
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
          image: getImageUrl(),
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