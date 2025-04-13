import React from 'react';
import { FiClock } from 'react-icons/fi';
import { FaPizzaSlice, FaHotel, FaCalendarAlt } from 'react-icons/fa';
import { GiPalmTree } from 'react-icons/gi';
import '../styles/Searchbar.css';

const SearchBarExpanded = ({ category, setCategory, history }) => {
  const categories = [
    {
      name: 'Food',
      icon: <FaPizzaSlice />,
      bgColor: '#FFE0B2',
      iconColor: '#FF7043',
    },
    {
      name: 'Hotel',
      icon: <FaHotel />,
      bgColor: '#D1C4E9',
      iconColor: '#7E57C2',
    },
    {
      name: 'Places',
      icon: <GiPalmTree />,
      bgColor: '#C8E6C9',
      iconColor: '#388E3C',
    },
    {
      name: 'Event',
      icon: <FaCalendarAlt />,
      bgColor: '#FFCDD2',
      iconColor: '#E53935',
    },
  ];

  return (
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
            <div className="category-icon" style={{ color: cat.iconColor }}>
              {cat.icon}
            </div>
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
