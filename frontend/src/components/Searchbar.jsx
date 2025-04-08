// components/SearchBar.jsx
import React from 'react';
import { FiSearch } from 'react-icons/fi'; // Import search icon from react-icons

const SearchBar = ({ onSearch }) => {
  const styles = {
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6rem',
      padding: '8px 16px',
      backgroundColor: '#ECE6F0',
      borderRadius: '20px',
      cursor: 'pointer',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    searchIcon: {
      fontSize: '18px',
      color: '#333',
    },
    searchText: {
      fontSize: '12px',
      color: '#333',
    },
  };

  return (
    <div 
      style={styles.searchContainer}
      onClick={() => onSearch('')} // Trigger search when clicked
    >
      <span style={styles.searchText}>Search your destination</span>
      <FiSearch style={styles.searchIcon} />  
    </div>
  );
};

export default SearchBar;