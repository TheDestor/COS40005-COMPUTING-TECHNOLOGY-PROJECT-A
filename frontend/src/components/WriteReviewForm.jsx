import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import '../styles/WriteReviewForm.css';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { IoMdPhotos } from 'react-icons/io';
import { ToastContainer } from 'react-toastify';

const WriteReviewForm = ({ onClose, location, user }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [postDisabled, setPostDisabled] = useState(false);
  const navigate = useNavigate();

  const handleRating = (index) => {
    if (rating === index) setRating(index - 0.5);
    else if (rating === index - 0.5) setRating(0);
    else setRating(index);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    setFiles(prev => [...prev, ...validFiles]);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleReviewChange = (e) => {
    const value = e.target.value;
    if (value.length <= 1000) setReviewText(value);
  };

  const handlePost = () => {
    const failAndDisable = (message) => {
      toast.error(message, {
        position: 'bottom-right',
        autoClose: 2000, 
      });
      setPostDisabled(true);
      setTimeout(() => setPostDisabled(false), 2000);
    };
  
    if (rating === 0) {
      failAndDisable('Please select a rating before submitting.');
      return;
    }
  
    if (reviewText.trim() === '') {
      failAndDisable('Please enter your review text.');
      return;
    }
  
    if (files.length > 0 && files.some(file =>
      !file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
      failAndDisable('Only image and video files are allowed.');
      return;
    }
  
    // Simulate submission
    console.log({ rating, reviewText, files });
  
    toast.success('Review submitted successfully!', {
      position: 'bottom-right',
      autoClose: 2000,
      zIndex: 9999, 
    });
  
    setPostDisabled(true);
    setTimeout(() => {
      onClose(); 
    }, 2500);
  };  
  
  const handleCancel = () => {
    const confirmCancel = window.confirm('Are you sure you want to discard your changes?');
    if (confirmCancel) onClose();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      let icon = rating >= i ? <FaStar /> :
                 rating >= i - 0.5 ? <FaStarHalfAlt /> : <FaRegStar />;
      stars.push(
        <span
          key={i}
          className="star2"
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
      <h3 className="location-title">{location?.name || 'Unknown Location'}</h3>

      <div className="user-section">
        <div className="avatar-circle" />
        <span className="username">{user?.firstname} {user?.lastname}</span>
      </div>

      <div className="star-rating">{renderStars()}</div>

      <textarea
        className="review-textbox"
        placeholder="Leave your review here..."
        value={reviewText}
        onChange={handleReviewChange}
        maxLength={1000}
      />
      <div className="char-counter">{reviewText.length}/1000</div>

      <label className="file-upload-container">
        <IoMdPhotos className="upload-icon" />
        Add photos & videos
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>

      <div className="preview-container">
        {previews.map((src, index) =>
          files[index]?.type.startsWith('image/') ? (
            <img key={index} src={src} alt="preview" className="media-preview" />
          ) : (
            <video key={index} controls className="media-preview">
              <source src={src} type={files[index].type} />
              Your browser does not support video preview.
            </video>
          )
        )}
      </div>

      <div className="review-buttons">
        <button className="cancel-btn6" onClick={handleCancel}>Cancel</button>
        <button className="post-btn" onClick={handlePost} disabled={postDisabled}>Post</button>
      </div>

      <ToastContainer/>
    </div>
  );
};

export default WriteReviewForm;
