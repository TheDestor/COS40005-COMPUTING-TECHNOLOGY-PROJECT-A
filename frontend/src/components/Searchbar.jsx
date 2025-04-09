import React, { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import logo from '../assets/SarawakTourismLogo.png';
import '../styles/Searchbar.css'; // Add this line for CSS

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
    <div className={`searchbar-container ${isMobile ? 'mobile' : ''}`} onClick={handleSearchClick}>
      <img src={logo} alt="Sarawak Logo" className="searchbar-logo" />
      <span className="searchbar-text">Search for airport, homestay</span>
      <FiSearch className="searchbar-icon" />
    </div>
  );
};

export default SearchBar;
