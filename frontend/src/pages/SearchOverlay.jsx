import React from 'react';
import { FiClock, FiX, FiMic, FiSearch } from 'react-icons/fi';
import foodIcon from '../assets/food.png';
import hotelIcon from '../assets/hotel.png';
import placeIcon from '../assets/place.png';
import eventIcon from '../assets/event.png';

const SearchOverlay = ({ onClose }) => {
  const categories = [
    { label: 'Food', icon: foodIcon },
    { label: 'Hotel', icon: hotelIcon },
    { label: 'Places', icon: placeIcon },
    { label: 'Event', icon: eventIcon },
  ];

  const history = Array(5).fill('Borneo Cultural Museum');

  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: '16px',
      borderRadius: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 999,
    }}>
      {/* Top Input Row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search for airport, homestay"
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        />
        <FiX style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={onClose} />
        <FiMic style={{ marginLeft: '8px', cursor: 'pointer' }} />
        <FiSearch style={{ marginLeft: '8px', cursor: 'pointer' }} />
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
        {categories.map(({ label, icon }) => (
          <div key={label} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#f2f2f2',
            padding: '10px',
            borderRadius: '12px',
            width: '70px',
          }}>
            <img src={icon} alt={label} style={{ height: '32px', marginBottom: '6px' }} />
            <span style={{ fontSize: '12px', textAlign: 'center' }}>{label}</span>
          </div>
        ))}
      </div>

      <hr style={{ marginBottom: '12px' }} />

      {/* History */}
      <div>
        {history.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <FiClock style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '14px' }}>{item}</span>
          </div>
        ))}
        <div style={{
          marginTop: '12px',
          color: '#007BFF',
          textAlign: 'center',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          More from recent history
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
