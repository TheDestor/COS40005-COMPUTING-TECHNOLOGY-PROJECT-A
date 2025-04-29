import React, { useState, useEffect } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt
} from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import '../styles/MapViewMenu.css';
import ky from 'ky';
import defaultImage from '../assets/Kuching.png';

const MapViewMenu = ({ onSelect, activeOption, onSelectCategory }) => {
  const [selectedMenu, setSelectedMenu] = useState(activeOption || '');

  const menuItems = [
    { name: 'Major Town', icon: <FaLocationDot />, isFetchOnly: true },
    { name: 'Homestay', icon: <FaBed />, isFetchOnly: true },
    { name: 'Museum', icon: <FaUniversity />, isFetchOnly: true },
    { name: 'National Park', icon: <FaMountain />, isFetchOnly: true },
    { name: 'Airport', icon: <FaPlaneDeparture />, isFetchOnly: true },
    { name: 'Beach', icon: <FaUmbrellaBeach />, isFetchOnly: true },
    { name: 'Hospital', icon: <FaHospital />, isFetchOnly: true },
    { name: 'Event', icon: <FaCalendarAlt />, isFetchOnly: true }
  ];

  const handleMenuItemClick = async (item) => {
    setSelectedMenu(item.name);
    if (item.isFetchOnly) {
      try {
        const response = await ky.get(`/api/locations?type=${encodeURIComponent(item.name)}`).json();
        console.log(`Fetched ${item.name} Data:`, response);

        // Ensure the backend response contains latitude/longitude
        const formattedData = response.map(location => ({
          ...location, // Include all properties from the response
          coordinates: [location.latitude, location.longitude] || 'No Coordinates',
          image: location.image || defaultImage, // Ensure image field is populated, fallback to defaultImage
          description: location.description || 'No description available.',
        }));

        if (onSelect) onSelect(item.name, formattedData);
        if (onSelectCategory) onSelectCategory(item.name, formattedData);
      } catch (error) {
        console.error(`Error fetching ${item.name}:`, error);
      }
    } else {
      if (onSelect) onSelect(item.name);
      if (onSelectCategory) onSelectCategory(item.name);
    }
  };

  useEffect(() => {
    if (!activeOption) {
      const defaultItem = menuItems.find(item => item.name === 'Major Town');
      if (defaultItem) {
        handleMenuItemClick(defaultItem);
      }
    } else {
      setSelectedMenu(activeOption);
    }
  }, [activeOption]);

  return (
    <div className="mapview-container">
      <div className="menu-container">
        {menuItems.map((item) => {
          const isActive = activeOption === item.name || selectedMenu === item.name;

          return (
            <button
              key={item.name}
              className="menu-item2"
              onClick={() => handleMenuItemClick(item)}
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
    </div>
  );
};

export default MapViewMenu;
