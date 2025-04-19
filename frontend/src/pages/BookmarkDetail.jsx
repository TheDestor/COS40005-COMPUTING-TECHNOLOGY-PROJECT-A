import React from 'react';
import '../styles/BookmarkDetail.css';
import { FaStar, FaArrowLeft } from 'react-icons/fa';

const BookmarkDetail = ({ title, places, onClose }) => {
  return (
    <div className="bookmark-detail-content">
      <div className="bookmark-header">
        <div className="bookmark-title">{title}</div>
        <span className="bookmark-close" onClick={onClose}>
          <FaArrowLeft />
        </span>
      </div>

      <div className="bookmark-detail-list">
        {places.map((place, index) => (
          <div className="bookmark-detail-card" key={index}>
            <img
              src={place.image}
              alt={place.title}
              className="bookmark-detail-image"
            />
            <div className="bookmark-detail-info">
              <div className="bookmark-detail-title">{place.title}</div>
              <div className="bookmark-detail-rating">
                <FaStar className="star-icon" />
                {place.rating} ({place.reviews})
              </div>
              <div className="bookmark-detail-category">{place.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkDetail;
