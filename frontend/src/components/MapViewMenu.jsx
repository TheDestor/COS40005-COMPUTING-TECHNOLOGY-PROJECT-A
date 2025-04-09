import React, { useState, useEffect } from 'react';
import {
  FiMapPin, FiHome, FiBook, FiAnchor, FiNavigation,
  FiUmbrella, FiPlusCircle, FiCalendar, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import '../styles/MapViewMenu.css';

const MapViewMenu = ({ onSelect, activeOption = 'Major Town' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const menuItems = [
    { name: 'Major Town', icon: <FiMapPin /> },
    { name: 'Homestay', icon: <FiHome /> },
    { name: 'Museum', icon: <FiBook /> },
    { name: 'National Park', icon: <FiAnchor /> },
    { name: 'Airport', icon: <FiNavigation /> },
    { name: 'Beach', icon: <FiUmbrella /> },
    { name: 'Hospital', icon: <FiPlusCircle /> },
    { name: 'Event', icon: <FiCalendar /> }
  ];

  const handleMenuItemClick = (name) => {
    onSelect(name);
    setIsDropdownOpen(false); // Close the dropdown when an item is selected
  };

  return (
    <div className="mapview-container">
      {!isMobile ? (
        <div className="menu-container">
          {menuItems.map((item) => {
            const isActive = activeOption === item.name;
            return (
              <button
                key={item.name}
                className="menu-item2"
                onClick={() => handleMenuItemClick(item.name)}
              >
                <div className={`icon-container ${isActive ? 'active-icon-container' : ''}`}>
                  <span className={`menu-icon ${isActive ? 'active-icon' : ''}`}>
                    {item.icon}
                  </span>
                </div>
                <span className={`menu-text2 ${isActive ? 'active-text' : ''}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="dropdown-container">
          <div
            className="dropdown-wrapper"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle the dropdown
          >
            <span className="menu-dropdown">{activeOption}</span>
            {isDropdownOpen ? <FiChevronUp className="dropdown-arrow" /> : <FiChevronDown className="dropdown-arrow" />}
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  className="menu-item-dropdown"
                  onClick={() => handleMenuItemClick(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapViewMenu;
