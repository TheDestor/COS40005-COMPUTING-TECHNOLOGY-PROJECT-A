import React, { useState, useEffect } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt
} from 'react-icons/fa'; // FontAwesome Icons
import { FaLocationDot } from "react-icons/fa6";
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'; // FontAwesome Icons
import '../styles/MapViewMenu.css';
import ky from 'ky';

const MapViewMenu = ({ onSelect, activeOption}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('');

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const menuItems = [
    { name: 'Major Town', icon: <FaLocationDot />, isFetchOnly: true }, // Location Pin
    { name: 'Homestay', icon: <FaBed />, isFetchOnly: true },     // Bed for homestay
    { name: 'Museum', icon: <FaUniversity />, isFetchOnly: true }, // University for Museum
    { name: 'National Park', icon: <FaMountain />, isFetchOnly: true }, // Mountain for National Park
    { name: 'Airport', icon: <FaPlaneDeparture />, isFetchOnly: true }, // Plane for Airport
    { name: 'Beach', icon: <FaUmbrellaBeach />, isFetchOnly: true }, // Umbrella for Beach
    { name: 'Hospital', icon: <FaHospital />, isFetchOnly: true },  // Hospital Icon
    { name: 'Event', icon: <FaCalendarAlt />, isFetchOnly: true }   // Calendar for Event
  ];

  const handleMenuItemClick = async (itemName) => {
    setSelectedMenu(itemName);
    if (itemName) {
      try {
        const response = await ky.get(`/api/locations?type=${encodeURIComponent(itemName)}`).json();
        console.log(`Fetched ${itemName} Data:`, response);

        // Trigger parent to update
        if (onMenuSelect) {
          onMenuSelect(itemName, response);
        }
      } catch (error) {
        console.error(`Error fetching ${itemName}:`, error);
      }
    }
    onSelect(itemName); // Update selected menu
    setIsDropdownOpen(false); // Close the dropdown when an item is selected
  };

  return (
    <div className="mapview-container">
      {!isMobile ? (
        <div className="menu-container">
          {menuItems.map((item) => {
            const isActive = activeOption === item.name;
            // console.log("Rendering", item.name, "active:", isActive);

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
                  {item.icon} {item.name}
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
