import React, { useState } from 'react';
import '../styles/WriteReviewForm.css';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { IoMdPhotos } from 'react-icons/io';

const WriteReviewForm = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [files, setFiles] = useState([]);

  const handleRating = (index) => {
    if (rating === index) {
      setRating(index - 0.5);
    } else if (rating === index - 0.5) {
      setRating(0); // toggle off
    } else {
      setRating(index);
    }
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let icon;
      if (rating >= i) {
        icon = <FaStar />;
      } else if (rating >= i - 0.5) {
        icon = <FaStarHalfAlt />;
      } else {
        icon = <FaRegStar />;
      }
      stars.push(
        <span
          key={i}
          className="star"
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => handleRating(i)}
        >
          {icon}
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="write-review-modal">
      <h3 className="location-title">Borneo Cultural Museum</h3>
      <div className="user-section">
        <div className="avatar-circle" />
        <span className="username">Kenneth Kuan</span>
      </div>

      <div className="star-rating">{renderStars()}</div>

      <textarea
        className="review-textbox"
        placeholder="Leaves your review here..."
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />

      <label className="file-upload-container">
        <IoMdPhotos className="upload-icon" />
        Add photos & videos
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>

      <div className="review-buttons">
        <button className="cancel-btn6" onClick={onClose}>Cancel</button>
        <button className="post-btn">Post</button>
      </div>
    </div>
  );
};

export default WriteReviewForm;
