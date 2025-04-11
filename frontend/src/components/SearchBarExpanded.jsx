import React from 'react';
import { FiClock } from 'react-icons/fi';
import { FaPizzaSlice, FaHotel, FaCalendarAlt } from 'react-icons/fa';
import { GiPalmTree } from 'react-icons/gi';
import '../styles/Searchbar.css';

const SearchBarExpanded = ({ category, setCategory, history }) => {
  // Define categories and their respective icons
  const categories = [
    { name: 'Food', icon: <FaPizzaSlice /> },
    { name: 'Hotel', icon: <FaHotel /> },
    { name: 'Places', icon: <GiPalmTree /> },
    { name: 'Event', icon: <FaCalendarAlt /> },
  ];

  return (
    <div className="searchbar-expanded">
      <div className="category-row">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`category-item ${category === cat.name ? 'active' : ''}`}
            onClick={() => setCategory(cat.name)}
          >
            <div className="category-icon">{cat.icon}</div>
            <div className="category-label">{cat.name}</div>
          </div>
        ))}
      </div>

      <hr />

      <div className="search-history">
        {history.map((item, index) => (
          <div key={index} className="history-item">
            <FiClock className="history-icon" />
            <span>{item}</span>
          </div>
        ))}
        {history.length >= 5 && (
          <div className="more-history">More from recent history</div>
        )}
      </div>
    </div>
  );
};

export default SearchBarExpanded;
