import React, { useState, useEffect } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt
} from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import '../styles/MapViewMenu.css';
import defaultImage from '../assets/Kuching.png';

// Menu items
const menuItems = [
  { name: 'Major Town', icon: <FaLocationDot />, isFetchOnly: true },
  { name: 'Food', icon: <FaUniversity />, isFetchOnly: true },
  { name: 'Accommodation', icon: <FaBed />, isFetchOnly: true },
  { name: 'Attractions', icon: <FaMountain />, isFetchOnly: true },
  { name: 'Shoppings', icon: <FaPlaneDeparture />, isFetchOnly: true },
  { name: 'Leisures', icon: <FaUmbrellaBeach />, isFetchOnly: true },
  { name: 'Tour Guides', icon: <FaHospital />, isFetchOnly: true },
  { name: 'Events', icon: <FaCalendarAlt />, isFetchOnly: true }
];

const sarawakDivisions = [
  { name: 'Kuching', latitude: 1.5533, longitude: 110.3592 },
  { name: 'Samarahan', latitude: 1.4556, longitude: 110.4882 },
  { name: 'Serian', latitude: 1.2966, longitude: 110.5371 },
  { name: 'Sri Aman', latitude: 1.2400, longitude: 111.4651 },
  { name: 'Betong', latitude: 1.3954, longitude: 111.5000 },
  { name: 'Sarikei', latitude: 2.1256, longitude: 111.5187 },
  { name: 'Sibu', latitude: 2.2967, longitude: 111.8250 },
  { name: 'Mukah', latitude: 2.8985, longitude: 112.0880 },
  { name: 'Kapit', latitude: 2.0167, longitude: 112.9333 },
  { name: 'Bintulu', latitude: 3.1667, longitude: 113.0333 },
  { name: 'Miri', latitude: 4.3997, longitude: 113.9845 },
  { name: 'Limbang', latitude: 4.7500, longitude: 115.0000 }
];


// Categories
const placeCategories = {
  Transport: ['airport', 'bus_station', 'train_station', 'taxi_stand'],
  Accommodation: ['lodging', 'campground', 'homestay'],
  Food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
  Attractions: ['tourist_attraction', 'museum', 'zoo', 'amusement_park', 'aquarium'],
  Shoppings: ['shopping_mall', 'supermarket', 'convenience_store'],
  Leisures: ['spa', 'gym', 'night_club', 'movie_theater', 'stadium', 'park'],
  Events: ['festival', 'concert', 'government event'],
  'Tour Guides': ['tour guide', 'tour operator', 'travel agency'],
  'Major Town': ['city']
};

const MapViewTesting = ({ onSelect, activeOption, onSelectCategory }) => {
  const [selectedMenu, setSelectedMenu] = useState(activeOption || '');
  const [locationsData, setLocationsData] = useState([]);

  const fetchPlacesByCategory = (categoryName, location, radius = 50000) => {
    const entries = placeCategories[categoryName];
    if (!entries || !window.google) return;

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const collectedResults = [];

    const fetchWithPagination = (request, callback) => {
      service.nearbySearch(request, function processResults(results, status, pagination) {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          collectedResults.push(...results);

          if (pagination && pagination.hasNextPage && collectedResults.length < 50) {
            setTimeout(() => pagination.nextPage(), 1000); // delay needed
          } else {
            const formatted = collectedResults.slice(0, 50).map(place => ({
              name: place.name,
              latitude: place.geometry?.location?.lat() || 0,
              longitude: place.geometry?.location?.lng() || 0,
              image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
              description: place.vicinity || 'No description available.',
              url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              rating: place.rating || null,
              openNowText: place.opening_hours?.isOpen() ? 'Open now' : 'Closed now',
              open24Hours: place.opening_hours?.periods?.every(p =>
                p.open?.time === '0000' && p.close?.time === '2359'
              ) || false,
              holidayNotice: place.opening_hours?.special_days?.[0]?.exceptional_hours_text || ''
            }));
            setLocationsData(formatted);
            if (onSelect) onSelect(categoryName, formatted);
            if (onSelectCategory) onSelectCategory(categoryName, formatted);
          }
        } else {
          console.error(`Google Places error for ${categoryName}:`, status);
        }
      });
    };

    entries.forEach(entry => {
      const isKeywordBased = ['Events', 'Tour Guides', 'Major Town'].includes(categoryName);
      const request = {
        location,
        radius,
        ...(isKeywordBased ? { keyword: entry } : { type: entry })
      };

      fetchWithPagination(request);
    });
  };

  const handleMenuItemClick = (item) => {
    setSelectedMenu(item.name);
    const centerOfKuching = new window.google.maps.LatLng(1.5533, 110.3592);
    setLocationsData([]);

    if (item.isFetchOnly) {
      if (item.name === 'Major Town') {
        const formatted = sarawakDivisions.map(town => ({
            name: town.name,
            latitude: town.latitude,
            longitude: town.longitude,
            image: defaultImage,
            description: 'Division in Sarawak, Malaysia.',
            url: `https://www.google.com/maps/search/?api=1&query=${town.latitude},${town.longitude}`,
            rating: null,
            openNowText: '',
            open24Hours: false,
            holidayNotice: ''
        }));
        setLocationsData(formatted);
        if (onSelect) onSelect(item.name, formatted);
        if (onSelectCategory) onSelectCategory(item.name, formatted);
        } else {
        fetchPlacesByCategory(item.name, centerOfKuching);
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
          const isActive = selectedMenu === item.name;

          return (
            <button
              key={item.name}
              className={`menu-item2 ${isActive ? 'active' : ''}`}
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

export default MapViewTesting;
