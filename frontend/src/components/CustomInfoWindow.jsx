import React, { useState } from 'react';
import {
  FaStar,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaShareAlt,
  FaBookmark
} from 'react-icons/fa';
import '../styles/CustomInfoWindow.css';

const CustomInfoWindow = ({ location, onCloseClick, onShowReview, addBookmark }) => {
  const [activeFooter, setActiveFooter] = useState('Directions');
  const [showFullDesc, setShowFullDesc] = useState(false);

  if (!location) return null;

  const footerItems = [
    { icon: <FaMapMarkerAlt />, label: 'Directions' },
    { icon: <FaBookmark />, label: 'Save' },
    { icon: <FaPhoneAlt />, label: 'Phone' },
    { icon: <FaShareAlt />, label: 'Share' }
  ];

  const handleFooterClick = (label) => {
    setActiveFooter(label);
    
    if (label === "Save") {
      const bookmarkData = {
        name: location.name,
        image: location.image,
        description: location.description,
        url: location.url
      }
      addBookmark(bookmarkData);
      console.log(bookmarkData);
    }
    console.log(`${label} clicked`);
  };

  return (
    <div className="info-window-card">
      <img src={location.image} alt={location.name} className="info-image" />

      <div className="info-header">
        <h3>{location.name}</h3>
        <p className="rating51">
          5.0 <FaStar color="#ffc107" /> (100)
        </p>
      </div>

      <div className="info-tabs">
        <span className="active-tab">Overview</span>
        <span className="inactive-tab" onClick={onShowReview}>Reviews</span>
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

      <a
        href={location.url}
        target="_blank"
        rel="noopener noreferrer"
        className="info-link"
      >
        {new URL(location.url).hostname}
      </a>

      <div className="info-actions">
        <p className="info-open">
          <span className="open-status">Opens at</span> 12:00am
        </p>
        <button className="book-btn">Explore Now!</button>
      </div>

      <div className="info-footer">
        {footerItems.map((item) => (
          <span
            key={item.label}
            className={`footer-item ${
              activeFooter === item.label ? 'active' : ''
            }`}
            onClick={() => handleFooterClick(item.label)}
          >
            <span className="footer-icon">{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CustomInfoWindow;
