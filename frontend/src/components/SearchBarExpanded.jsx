import React, { useState } from 'react';
import { FiClock } from 'react-icons/fi';
import '../styles/Searchbar.css';
import RecentSection from "./RecentSection";
import foodImage from '../assets/Food.png';
import hotelImage from '../assets/Hotel.png';
import placesImage from '../assets/place.png';
import eventImage from '../assets/Event.png';

const SearchBarExpanded = ({ category, setCategory, history, searchTerm, predictions, onPredictionClick, onHistoryClick }) => {
  const [showRecent, setShowRecent] = useState(false);

  const categories = [
    { name: 'Food', image: foodImage, bgColor: '#FFE0B2' },
    { name: 'Hotel', image: hotelImage, bgColor: '#D1C4E9' },
    { name: 'Places', image: placesImage, bgColor: '#C8E6C9' },
    { name: 'Event', image: eventImage, bgColor: '#FFCDD2' },
  ];

  return (
    <>
      <div className="searchbar-expanded">
        <div className="category-row">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className={`category-item ${category === cat.name ? 'active' : ''}`}
              style={{
                backgroundColor: category === cat.name ? cat.bgColor : '#f0f0f0',
              }}
              onClick={() => setCategory(cat.name)}
            >
              <div className="category-icon">
                <img src={cat.image} alt={cat.name} className="category-image" />
              </div>
              <div className="category-label">{cat.name}</div>
            </div>
          ))}
        </div>

        <hr />

        <div className="search-history">
          {searchTerm.trim() === '' ? (
            <>
              {history.map((item, index) => (
                <div key={index} className="history-item" onClick={() => onHistoryClick(item)}>
                  <FiClock className="history-icon" />
                  <span>{item}</span>
                </div>
              ))}
              {history.length >= 5 && (
                <div className="more-history" onClick={() => setShowRecent(true)}>
                  More from recent history
                </div>
              )}
            </>
          ) : (
            <>
              {predictions.length > 0 ? (
                predictions.map((prediction) => (
                  <div
                    key={prediction.place_id}
                    className="history-item prediction"
                    onClick={() => onPredictionClick(prediction.place_id, prediction.description)}
                  >
                    <span>{prediction.description}</span>
                  </div>
                ))
              ) : (
                <div className="history-item" style={{ color: '#888', fontStyle: 'italic' }}>
                  No suggestions found
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Slide-in RecentSection */}
      <RecentSection isOpen={showRecent} onClose={() => setShowRecent(false)} />
    </>
  );
};

export default SearchBarExpanded;
