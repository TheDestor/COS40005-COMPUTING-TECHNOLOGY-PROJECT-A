import React, { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaPhoneAlt, FaShareAlt, FaBookmark, FaTimes, FaGlobe, FaClock, FaEnvelope, FaCalendar } from 'react-icons/fa';
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

const CustomInfoWindow = ({ 
  location, 
  onCloseClick, 
  onShowReview, 
  addBookmark, 
  onOpenLoginModal,
  onDirectionsClick // Add this new prop
}) => {
  const [activeFooter, setActiveFooter] = useState('');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isFooterDisabled, setIsFooterDisabled] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useAuth();
  const { bookmarks, removeBookmark } = UseBookmarkContext();

  if (!location) return null;

  // Determine the type of location based on available fields
  const getLocationType = () => {
    // Check if it's a route marker first
    if (location.type === 'Starting Point' || location.type === 'Destination' || location.type === 'Waypoint') {
      return 'routeMarker';
    }
    
    // Check for business fields first
    if (location.ownerEmail || location.owner || location.category === 'Accommodation' || location.category === 'Food & Beverages' || location.category === 'Tour Guides' || location.category === 'Transportation' || location.category === 'Shoppings & Leisures') {
      return 'business';
    } 
    // Check for event fields
    else if (location.startDate || location.eventType || location.registrationRequired || location.type === 'Events') {
      return 'event';
    } 
    // Check for major town
    else if (location.type === 'Major Town' || majorTowns.includes(location.name) || location.division) {
      return 'majorTown';
    } 
    // Default to location
    else {
      return 'location';
    }
  };

  const locationType = getLocationType();

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
        image: imageUrl,
        coordinates: [location.latitude || location.lat, location.longitude || location.lng],
        type: location.type || location.category || 'tourist_attraction',
        ownerEmail: location.ownerEmail,
        website: location.website || location.url,
        openingHours: location.openingHours
      }
    });
  };

  // Get phone number from location
  const getPhoneNumber = () => {
    return location.phone || location.contact || location.telephone || location.mobile;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 11) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 7) {
      return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
    }
    
    // Return original if no specific format matches
    return phone;
  };

  // Better mobile detection that excludes desktop
  const isTrueMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && 
           !/Windows|Macintosh|Linux/.test(navigator.userAgent);
  };

  // Handle phone call
  const handlePhoneCall = () => {
    const phoneNumber = getPhoneNumber();
    
    if (!phoneNumber) {
      toast.error('No phone number available for this location');
      return;
    }

    const formattedNumber = formatPhoneNumber(phoneNumber) || phoneNumber;
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Only use tel: protocol for true mobile devices
    if (isTrueMobileDevice()) {
      // On true mobile devices, initiate phone call
      window.location.href = `tel:${cleanPhoneNumber}`;
      toast.success(`Calling ${formattedNumber}`);
    } else {
      // On desktop/tablet, always copy to clipboard
      navigator.clipboard.writeText(formattedNumber).then(() => {
        toast.success(`Phone number ${formattedNumber} copied to clipboard!`);
      }).catch((err) => {
        console.error('Failed to copy phone number:', err);
        // Fallback: show the number in a toast
        toast.info(`Phone: ${formattedNumber}`);
      });
    }
  };

  // Handle directions click
  const handleDirectionsClick = () => {
    if (onDirectionsClick) {
      onDirectionsClick({
        name: location.name,
        latitude: location.latitude || location.lat,
        longitude: location.longitude || location.lng,
        address: location.address,
        description: location.description
      });
      toast.success(`"${location.name}" set as destination`);
    } else {
      toast.info('Directions feature is available');
    }
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

    if (label === "Phone") {
      handlePhoneCall();
      setActiveFooter('');
      return;
    }

    if (label === "Directions") {
      handleDirectionsClick();
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
            image: location.imageUrl || location.image || location.businessImage || defaultImage,
            description: location.description,
            website: location.website || location.url,
            latitude: location.latitude || location.lat,
            longitude: location.longitude || location.lng,
            type: location.type || location.category || 'tourist_attraction',
            
            // Business-specific fields
            openingHours: location.openingHours,
            phone: location.phone,
            address: location.address,
            category: location.category,
            owner: location.owner,
            ownerEmail: location.ownerEmail,
            businessImage: location.businessImage,
            
            // Event-specific fields
            eventType: location.eventType,
            startDate: location.startDate,
            endDate: location.endDate,
            startTime: location.startTime,
            endTime: location.endTime,
            registrationRequired: location.registrationRequired,
            
            // Additional fields
            rating: location.rating,
            division: location.division,
            source: location.source,
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

  // Get division information for major towns
  const getDivisionInfo = () => {
    // If division is explicitly provided, use it
    if (location.division) {
      return location.division;
    }
    
    // Otherwise, use the town name as the division (since major towns are also divisions in Sarawak)
    return location.name;
  };

  // Format date for events
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time for events
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    // If it's already in a readable format, return as is
    if (timeString.includes(':')) {
      return timeString;
    }
    return timeString;
  };

  // Check if start and end dates are the same
  const isSameDate = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    try {
      const start = new Date(startDate).toDateString();
      const end = new Date(endDate).toDateString();
      return start === end;
    } catch {
      return false;
    }
  };

  // Format date range for events
  const formatDateRange = () => {
    if (!location.startDate && !location.endDate) return 'N/A';
    
    if (isSameDate(location.startDate, location.endDate)) {
      // Same date, show only one date
      return formatDate(location.startDate);
    } else {
      // Different dates, show range
      return `${formatDate(location.startDate)} - ${formatDate(location.endDate)}`;
    }
  };

  // Format time period for events
  const formatTimePeriod = () => {
    if (!location.startTime && !location.endTime) return 'N/A';
    
    if (location.startTime && location.endTime) {
      return `${formatTime(location.startTime)} - ${formatTime(location.endTime)}`;
    } else if (location.startTime) {
      return `From ${formatTime(location.startTime)}`;
    } else if (location.endTime) {
      return `Until ${formatTime(location.endTime)}`;
    }
    
    return 'N/A';
  };

  // Get backend URL
  const getBackendUrl = () => {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050';
  };

  // Fixed image URL handler
  const getImageUrl = () => {
    console.log('Location data for image:', {
      name: location.name,
      businessImage: location.businessImage,
      imageUrl: location.imageUrl,
      image: location.image,
      source: location.source,
      type: locationType
    });
    
    // Priority order for images based on location type
    let imageSource;
    
    if (locationType === 'business') {
      // For businesses, prioritize businessImage
      imageSource = location.businessImage || location.image || defaultImage;
    } else if (locationType === 'event') {
      imageSource = location.imageUrl || location.image || defaultImage;
    } else if (locationType === 'majorTown') {
      // For major towns, use image if available, otherwise default
      imageSource = location.image || location.imageUrl || defaultImage;
    } else {
      imageSource = location.image || location.businessImage || location.imageUrl || defaultImage;
    }
    
    // If no image source or empty string, return default
    if (!imageSource || imageSource === 'undefined' || imageSource === 'null' || imageSource.trim() === '') {
      console.log('No valid image source found, using default');
      return defaultImage;
    }

    // If it's already a full URL, use it as is
    if (imageSource.startsWith('http')) {
      console.log('Using full URL:', imageSource);
      return imageSource;
    }

    // For relative paths that start with /uploads (like business images)
    if (imageSource.startsWith('/uploads')) {
      const backendUrl = getBackendUrl();
      // Remove any leading slashes that might cause double slashes
      const cleanPath = imageSource.startsWith('/') ? imageSource : `/${imageSource}`;
      const fullImageUrl = `${backendUrl}${cleanPath}`;
      console.log('Constructed uploads URL for business:', fullImageUrl);
      return fullImageUrl;
    }

    // For other relative paths or direct image names
    if (!imageSource.startsWith('http') && !imageSource.startsWith('/')) {
      const backendUrl = getBackendUrl();
      const fullImageUrl = `${backendUrl}/uploads/${imageSource}`;
      console.log('Constructed relative path URL:', fullImageUrl);
      return fullImageUrl;
    }

    // For other cases, return the image source as is
    console.log('Using direct image path:', imageSource);
    return imageSource;
  };

  // Handle image load errors
  const handleImageError = (e) => {
    console.error('Failed to load image from:', e.target.src);
    setImageError(true);
    setImageLoading(false);
    e.target.onerror = null;
    e.target.src = defaultImage;
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully from:', getImageUrl());
    setImageError(false);
    setImageLoading(false);
  };

  const imageUrl = getImageUrl();

  const renderRouteMarkerDetails = () => (
    <>
      {/* Show coordinates */}
      <div className="info-row">
        <span className="info-row-icon"><FaMapMarkerAlt /></span>
        <span className="info-row-text">
          <strong>Coordinates:</strong> {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
        </span>
      </div>

      {/* Show address if available */}
      {location.address && (
        <div className="info-row">
          <span className="info-row-icon"><FaMapMarkerAlt /></span>
          <span className="info-row-text">
            <strong>Address:</strong> {location.address}
          </span>
        </div>
      )}

      {/* Show division if available */}
      {location.division && (
        <div className="info-row">
          <span className="info-row-icon"><FaMapMarkerAlt /></span>
          <span className="info-row-text">
            <strong>Division:</strong> {location.division}
          </span>
        </div>
      )}

      {/* Show phone if available */}
      {location.phone && (
        <div className="info-row">
          <span className="info-row-icon"><FaPhoneAlt /></span>
          <span 
            className="info-row-link phone-link"
            onClick={handlePhoneCall}
            style={{ cursor: 'pointer' }}
          >
            {formatPhoneNumber(location.phone) || location.phone}
          </span>
        </div>
      )}

      {/* Show website if available */}
      {location.website && (
        <div className="info-row">
          <span className="info-row-icon"><FaGlobe /></span>
          <a
            href={getWebsiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="info-row-link"
          >
            {getWebsiteHostname() || 'Visit Website'}
          </a>
        </div>
      )}

      {/* Show email if available */}
      {location.ownerEmail && (
        <div className="info-row">
          <span className="info-row-icon"><FaEnvelope /></span>
          <span className="info-row-text">{location.ownerEmail}</span>
        </div>
      )}

      {/* Show opening hours if available */}
      {location.openingHours && (
        <div className="info-row">
          <span className="info-row-icon"><FaClock /></span>
          <span className="info-row-text">
            <strong>Opening Hours:</strong> {location.openingHours}
          </span>
        </div>
      )}

      {/* Show event dates if available */}
      {(location.startDate || location.endDate) && (
        <div className="info-row">
          <span className="info-row-icon"><FaCalendar /></span>
          <span className="info-row-text">
            <strong>Event Date:</strong> {formatDateRange()}
          </span>
        </div>
      )}

      {/* Show event times if available */}
      {(location.startTime || location.endTime) && (
        <div className="info-row">
          <span className="info-row-icon"><FaClock /></span>
          <span className="info-row-text">
            <strong>Event Time:</strong> {formatTimePeriod()}
          </span>
        </div>
      )}

      {/* Show event type if available */}
      {location.eventType && (
        <div className="info-row">
          <span className="info-row-icon"><FaStar /></span>
          <span className="info-row-text">
            <strong>Event Type:</strong> {location.eventType}
          </span>
        </div>
      )}

      {/* Show registration info if available */}
      {location.registrationRequired && (
        <div className="info-row">
          <span className="info-row-icon"><FaEnvelope /></span>
          <span className="info-row-text">
            <strong>Registration:</strong> {location.registrationRequired}
          </span>
        </div>
      )}
    </>
  );

  // Render different content based on location type
  const renderBusinessDetails = () => (
    <>
      {location.ownerEmail && (
        <div className="info-row">
          <span className="info-row-icon"><FaEnvelope /></span>
          <span className="info-row-text">{location.ownerEmail}</span>
        </div>
      )}

      {location.address && (
        <div className="info-row">
          <span className="info-row-icon"><FaMapMarkerAlt /></span>
          <span className="info-row-text">{location.address}</span>
        </div>
      )}

      {location.openingHours && (
        <div className="info-row">
          <span className="info-row-icon"><FaClock /></span>
          <span className="info-row-text">{location.openingHours}</span>
        </div>
      )}

      {getPhoneNumber() && (
        <div className="info-row">
          <span className="info-row-icon"><FaPhoneAlt /></span>
          <span 
            className="info-row-link phone-link"
            onClick={handlePhoneCall}
            style={{ cursor: 'pointer' }}
          >
            {formatPhoneNumber(getPhoneNumber()) || getPhoneNumber()}
          </span>
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
    </>
  );

  const renderEventDetails = () => (
    <>
      {(location.startDate || location.endDate) && (
        <div className="info-row">
          <span className="info-row-icon"><FaCalendar /></span>
          <span className="info-row-text">
            <strong>Date:</strong> {formatDateRange()}
          </span>
        </div>
      )}

      {(location.startTime || location.endTime) && (
        <div className="info-row">
          <span className="info-row-icon"><FaClock /></span>
          <span className="info-row-text">
            <strong>Period:</strong> {formatTimePeriod()}
          </span>
        </div>
      )}

      {location.eventType && (
        <div className="info-row">
          <span className="info-row-icon"><FaStar /></span>
          <span className="info-row-text">
            <strong>Event Type:</strong> {location.eventType}
          </span>
        </div>
      )}

      {location.registrationRequired && (
        <div className="info-row">
          <span className="info-row-icon"><FaEnvelope /></span>
          <span className="info-row-text">
            <strong>Registration:</strong> {location.registrationRequired}
          </span>
        </div>
      )}

      {getPhoneNumber() && (
        <div className="info-row">
          <span className="info-row-icon"><FaPhoneAlt /></span>
          <span 
            className="info-row-link phone-link"
            onClick={handlePhoneCall}
            style={{ cursor: 'pointer' }}
          >
            {formatPhoneNumber(getPhoneNumber()) || getPhoneNumber()}
          </span>
        </div>
      )}
    </>
  );

  const renderMajorTownDetails = () => (
    <>
      {/* Show division */}
      <div className="info-row">
        <span className="info-row-icon"><FaMapMarkerAlt /></span>
        <span className="info-row-text">
          <strong>Division:</strong> {getDivisionInfo()}
        </span>
      </div>

      {getPhoneNumber() && (
        <div className="info-row">
          <span className="info-row-icon"><FaPhoneAlt /></span>
          <span 
            className="info-row-link phone-link"
            onClick={handlePhoneCall}
            style={{ cursor: 'pointer' }}
          >
            {formatPhoneNumber(getPhoneNumber()) || getPhoneNumber()}
          </span>
        </div>
      )}

      {/* Show website if available */}
      {getWebsiteUrl() && (
        <div className="info-row">
          <span className="info-row-icon"><FaGlobe /></span>
          <a
            href={getWebsiteUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="info-row-link"
          >
            {getWebsiteHostname() || 'Visit Website'}
          </a>
        </div>
      )}
    </>
  );

  const renderLocationDetails = () => (
    <>
      {getPhoneNumber() && (
        <div className="info-row">
          <span className="info-row-icon"><FaPhoneAlt /></span>
          <span 
            className="info-row-link phone-link"
            onClick={handlePhoneCall}
            style={{ cursor: 'pointer'}}
          >
            {formatPhoneNumber(getPhoneNumber()) || getPhoneNumber()}
          </span>
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
    </>
  );

  return (
    <>
      <button className="info-window-close" onClick={onCloseClick}>
        <FaTimes />
      </button>

      <div className="info-window-card info-window-scrollable">
        <div className="image-container">
          {imageLoading && !imageError && (
            <div className="image-loading">Loading image...</div>
          )}
          <img
            src={imageError ? defaultImage : imageUrl}
            alt={location.name}
            className="info-image"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ 
              display: imageLoading && !imageError ? 'none' : 'block',
              width: '100%',
              height: '200px',
              objectFit: 'cover'
            }}
          />
        </div>

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

        {/* Render details based on location type */}
        {locationType === 'business' && renderBusinessDetails()}
        {locationType === 'event' && renderEventDetails()}
        {locationType === 'majorTown' && renderMajorTownDetails()}
        {locationType === 'location' && renderLocationDetails()}
        {locationType === 'routeMarker' && renderRouteMarkerDetails()}

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
          image: imageError ? defaultImage : imageUrl,
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