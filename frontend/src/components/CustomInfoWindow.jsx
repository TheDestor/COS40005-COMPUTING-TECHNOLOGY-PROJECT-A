// CustomInfoWindow.jsx
import React from 'react';
import { FaStar, FaMapMarkerAlt, FaPhoneAlt, FaShareAlt } from "react-icons/fa";
import '../styles/CustomInfoWindow.css';

const CustomInfoWindow = ({ location, onCloseClick }) => {
  if (!location) return null;

  return (
    <div className="info-window-card">
      <img src={location.image} alt={location.name} className="info-image" />

      <div className="info-header">
        <h3>{location.name}</h3>
        <p className="rating">
          5.0 <FaStar color="gold" /> (100)
        </p>
      </div>

      <div className="info-tabs">
        <span className="active">Overview</span>
        <span>Reviews</span>
      </div>

      <p className="info-desc">{location.description}</p>

      <a
        href={location.website}
        target="_blank"
        rel="noopener noreferrer"
        className="info-link"
      >
        {location.name}
      </a>

      <p className="info-open">
        Opens at <strong>{location.name}</strong>
      </p>

      <div className="info-actions">
        <button className="book-btn">Book Now!</button>
      </div>

      <div className="info-footer">
        <span><FaMapMarkerAlt /> Directions</span>
        <span><FaPhoneAlt /> Phone</span>
        <span><FaShareAlt /> Share</span>
      </div>

      {/* <button onClick={onCloseClick} className="info-close">×</button> */}
    </div>
  );
};

export default CustomInfoWindow;
