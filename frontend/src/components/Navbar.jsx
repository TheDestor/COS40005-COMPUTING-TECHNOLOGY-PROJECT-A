// NavigationBar.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './Searchbar.jsx';
import MapViewMenu from './MapViewMenu.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import WeatherDateTime from './WeatherDateTime.jsx'; // Imported the new component
import '../styles/Navbar.css';

const NavigationBar = ({ onLoginClick, activeOption, onMenuChange, setSelectedPlace, history, onSearch }) => {
  const [currentTown, setCurrentTown] = useState('Kuching');
  // const [activeMenuOption, setActiveMenuOption] = useState('Major Town');

  // const handleSearch = (query) => {
  //   console.log('Searching for:', query);
  //   // Implement your search functionality here
  // };

  const handleMenuSelect = (option) => {
    // setActiveMenuOption(option);
    onMenuChange(option);
    // Add your map view change logic here
    console.log('Selected view:', option);
  };
  

  return (
    <div className="navbar">
      <div className="left-section">
        <div className="search-container">
          <SearchBar onSearch={onSearch} setSelectedPlace={setSelectedPlace} history={history} />
        </div>
      </div>

      <div className="center-section">
        <MapViewMenu onSelect={handleMenuSelect} activeOption={activeOption} />
      </div>

      <div className="top-right-section">
        <div className="right-content">
          <WeatherDateTime
            currentTown={currentTown}
            setCurrentTown={setCurrentTown}
          />
          <ProfileDropdown onLoginClick={onLoginClick} />
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
