import React from 'react';
import '../styles/BookmarkDetail.css';
import { AiFillStar } from 'react-icons/ai';

const BookmarkDetail = ({ title, places, onClose }) => {
  return (
    <div className="bookmark-detail-container">
      <div className="detail-header">
        <h2>{title}</h2>
        <span className="close-icon" onClick={onClose}>✕</span>
      </div>
      <hr className="divider" />
      <div className="places-list">
        {places.map((place, index) => (
          <div key={index} className="place-card">
            <img src={place.image} alt={place.title} className="place-image" />
            <div className="place-info">
              <div className="place-title">{place.title}</div>
              <div className="place-rating">
                {place.rating} <AiFillStar className="star-icon" /> ({place.reviews})
              </div>
              <div className="place-category">{place.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkDetail;
