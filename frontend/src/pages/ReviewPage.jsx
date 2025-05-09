  import React, { useState } from 'react';
  import '../styles/ReviewPage.css';
  import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft } from 'react-icons/fa';
  import { FiThumbsUp, FiShare2 } from 'react-icons/fi';
  import { MdOutlineRateReview } from "react-icons/md";
  import WriteReviewForm from '../components/WriteReviewForm';

  const ReviewPage = ({ onClose }) => {
    const [likedReviews, setLikedReviews] = useState({});
    const [showForm, setShowForm] = useState(false);

    const handleLike = (index) => {
      setLikedReviews((prev) => ({
        ...prev,
        [index]: !prev[index],
      }));
    };

    const reviews = [
      {
        name: "Kenneth Kuan",
        date: "1 week ago",
        text: "Borneo cultural museum good good. It is tough oeri goero ijgo jpvj gdv fijeog i egoe gjpigj g opeigjeroigrih.",
        rating: 4.0,
      },
      {
        name: "Alvin Tan",
        date: "1 week ago",
        text: "Great place! Lots of interesting exhibits and very informative guides.",
        rating: 4.0,
      },
      {
        name: "Kenneth Kuan",
        date: "1 week ago",
        text: "Borneo cultural museum good good. It is tough oeri goero ijgo jpvj gdv fijeog i egoe gjpigj g opeigjeroigrih. dfjlsd fdlf jdslfjlf kjlfk jlfk jsdF JDSLFK JDALV JFADF JSF JAFj klfjsd fJDSLJKLFK JDSLKF JLKF JFL KSJDLF KJSEKLJG GJEE;GJ E; GKJEKGERJG;WGJ E;G JEWGJEWG ;EJWG ;EJW G;LEJW G;EWG ;E G;EJG ;EW G;WEGHEWKJ H;",
        rating: 4.0,
      },
      {
        name: "Alvin Tan",
        date: "1 week ago",
        text: "Great place! Lots of interesting exhibits and very informative guides.",
        rating: 4.0,
      }
    ];

    const renderStars = (rating) => {
      const full = Math.floor(rating);
      const half = rating % 1 >= 0.5;
      const empty = 5 - full - (half ? 1 : 0);
      return (
        <>
          {[...Array(full)].map((_, i) => <FaStar key={`full-${i}`} className="star2" />)}
          {half && <FaStarHalfAlt className="star2" />}
          {[...Array(empty)].map((_, i) => <FaRegStar key={`empty-${i}`} className="star2" />)}
        </>
      );
    };

    return (
      <>
        <div className="review-container2">
          <div className="review-summary">
            <div className="tab-header2">
              <span className="tab" onClick={onClose}>Overview</span>
              <span className="tab active">Reviews</span>
            </div>

            <div className="rating-box">
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map(star => (
                  <div className="rating-row" key={star}>
                    <span>{star}</span>
                    <div className="rating-bar">
                      <div className={`bar2 bar-${star}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="rating-score">
                <span className="score">3.7</span>
                <div className="stars">{renderStars(3.7)}</div>
                <span className="reviews-count">355 reviews</span>
              </div>
            </div>

            <button className="write-review-btn" onClick={() => setShowForm(true)}>
              <MdOutlineRateReview className="icon5" /> Write a review
            </button>
          </div>

          <div className="review-list">
            {reviews.map((review, index) => (
              <div className="review-card" key={index}>
                <div className="user-avatar" />
                <div className="review-content2">
                  <div className="user-name">
                    {review.name} <span className="review-date">({review.date})</span>
                  </div>
                  <div className="stars">{renderStars(review.rating)}</div>
                  <div className="review-text">{review.text}</div>
                  <div className="review-actions">
                    <button
                      className={`like-button ${likedReviews[index] ? 'liked' : ''}`}
                      onClick={() => handleLike(index)}
                    >
                      <FiThumbsUp className="like-button-icon" /> Like
                    </button>
                    <button><FiShare2 /> Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side overlay and form */}
        {showForm && (
          <>
            <div className="review-side-overlay"  />
            <div className="review-side-panel">
              <WriteReviewForm onClose={() => setShowForm(false)} />
            </div>
          </>
        )}
      </>
    );
  };

  export default ReviewPage;
