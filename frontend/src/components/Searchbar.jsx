import React, { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import logo from '../assets/SarawakTourismLogo.png'; // update if needed

const SearchBar = ({ onSearch, onExpand }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSearchClick = () => {
    if (onExpand) onExpand();
    if (onSearch) onSearch('');
  };

  return (
    <div
      onClick={handleSearchClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#ECE6F0',
        borderRadius: '20px',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      <img src={logo} alt="Sarawak Logo" style={{ height: '24px', marginRight: '10px' }} />
      <span style={{ fontSize: '14px', color: '#555', marginRight: '10px' }}>
        Search for airport, homestay
      </span>
      <FiSearch style={{ fontSize: '18px', color: '#333' }} />
    </div>
  );
};

export default SearchBar;
