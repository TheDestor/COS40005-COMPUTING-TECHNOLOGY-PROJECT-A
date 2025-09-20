import React, { useState, useEffect, useRef } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt, FaShoppingCart 
} from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import { MdForest } from "react-icons/md";
import { IoFastFood } from "react-icons/io5";
import '../styles/MapViewMenu.css';
import defaultImage from '../assets/Kuching.png';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'; // Import chevron icons

const RADIUS_KM = 10;
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

const useCurrentPosition = () => {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const opts = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      opts
    );
  }, []);
  return pos;
};

const menuItems = [
  { name: 'Major Town', icon: <FaLocationDot />, isFetchOnly: true },
  { name: 'Attractions', icon: <MdForest />, isFetchOnly: true },
  { name: 'Shoppings & Leisures', icon: <FaShoppingCart />, isFetchOnly: true },
  { name: 'Food & Beverages', icon: <IoFastFood  />, isFetchOnly: true },
  { name: 'Transportation', icon: <FaPlaneDeparture />, isFetchOnly: true },
  { name: 'Accommodation', icon: <FaBed />, isFetchOnly: true },
  { name: 'Tour Guides', icon: <FaHospital />, isFetchOnly: true },
  { name: 'Events', icon: <FaCalendarAlt />, isFetchOnly: true }
];

const sarawakDivisions = [
  { name: 'Kuching', latitude: 1.5534, longitude: 110.3594 },
  { name: 'Samarahan', latitude: 1.4599, longitude: 110.4883 },
  { name: 'Serian', latitude: 1.1670, longitude: 110.5665 },
  { name: 'Sri Aman', latitude: 1.2370, longitude: 111.4621 },
  { name: 'Betong', latitude: 1.4115, longitude: 111.5290 },
  { name: 'Sarikei', latitude: 2.1271, longitude: 111.5182 },
  { name: 'Sibu', latitude: 2.2870, longitude: 111.8320 },
  { name: 'Mukah', latitude: 2.8988, longitude: 112.0914 },
  { name: 'Kapit', latitude: 2.0167, longitude: 112.9333 },
  { name: 'Bintulu', latitude: 3.1739, longitude: 113.0428 },
  { name: 'Miri', latitude: 4.4180, longitude: 114.0155 },
  { name: 'Limbang', latitude: 4.7548, longitude: 115.0089 }
];

const placeCategories = {
  Transportation: ['airport', 'bus_station', 'train_station', 'taxi_stand'],
  Accommodation: ['lodging', 'campground', 'homestay'],
  'Food & Beverages': ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
  Attractions: ['tourist_attraction', 'museum', 'zoo', 'amusement_park', 'aquarium'],
  'Shoppings & Leisures': ['shopping_mall', 'spa', 'gym', 'night_club', 'park'],
  Events: ['festival', 'concert', 'government event'],
  'Tour Guides': ['tour guide', 'tour operator', 'travel agency'],
  'Major Town': ['city']
};

// Map menu category → business category stored in DB
const menuToBusinessCategory = (menuCategory) => {
  switch ((menuCategory || '').toLowerCase()) {
    case 'attractions': return 'Attractions';
    case 'accommodation': return 'Accommodation';
    case 'food & beverages': return 'Food & Beverages';
    case 'transportation': return 'Transportation';
    case 'shoppings & leisures': return 'Shoppings & Leisures';
    case 'tour guides': return 'Tour Guides';
    case 'events': return 'Events';
    default: return null;
  }
};

const fetchApprovedBusinesses = async (menuCategoryName) => {
  try {
    const apiCategory = menuToBusinessCategory(menuCategoryName);
    if (!apiCategory) return [];
    const res = await fetch(`/api/businesses/approved?category=${encodeURIComponent(apiCategory)}&limit=200`);
    if (!res.ok) throw new Error('Failed to fetch approved businesses');
    const json = await res.json();
    const list = (json.data || []).filter(Boolean);

    return list
      .filter(b => b && b.latitude != null && b.longitude != null)
      .map(b => ({
        name: b.name,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        image: b.businessImage
          ? (String(b.businessImage).startsWith('/uploads')
              ? `${window.location.origin}${b.businessImage}`
              : b.businessImage)
          : undefined,
        description: b.description || 'Business',
        type: menuCategoryName,
        source: 'businesses'
      }));
  } catch (e) {
    console.error('Approved businesses fetch error:', e);
    return [];
  }
};

// Overpass endpoints: try in order
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

// In-memory cache and per-category debounce
const overpassCacheRef = { current: new Map() }; // key → { ts, data }
const lastFetchRef = { current: {} };            // category → timestamp

// Build a stable cache key
const cacheKey = (category, lat, lng, radius) =>
  `${category}|${lat.toFixed(4)}|${lng.toFixed(4)}|${radius}`;

// Map your menu categories to OSM tags (amenity/shop/tourism/highway)
const menuToOverpass = (menuCategory) => {
  switch ((menuCategory || '').toLowerCase()) {
    case 'food & beverages':
      return [{ key: 'amenity', values: ['restaurant','cafe','fast_food','food_court','bar','pub','bakery','ice_cream'] }];
    case 'accommodation':
      return [{ key: 'tourism', values: ['hotel','guest_house','motel','hostel','apartment','camp_site','chalet'] }];
    case 'transportation':
      return [
        { key: 'amenity', values: ['bus_station','ferry_terminal','taxi'] },
        { key: 'public_transport', values: ['stop_position','station','platform'] },
        { key: 'aeroway', values: ['aerodrome','terminal'] },
        { key: 'railway', values: ['station','halt'] }
      ];
    case 'attractions':
      return [
        { key: 'tourism', values: ['attraction','museum','zoo','theme_park','gallery','aquarium','artwork'] },
        { key: 'leisure', values: ['park','nature_reserve','garden'] }
      ];
    case 'shoppings & leisures':
      return [
        { key: 'shop', values: ['mall','supermarket','department_store','convenience','clothes','gift','sports','toys'] },
        { key: 'leisure', values: ['fitness_centre','sports_centre','bowling_alley','amusement_arcade','escape_room','nightclub'] }
      ];
    case 'tour guides':
      return [{ key: 'office', values: ['tourism'] }, { key: 'tourism', values: ['information','guidepost'] }];
    case 'events':
      return [{ key: 'amenity', values: ['community_centre','theatre','conference_centre'] }];
    default:
      return null; // 'Major Town' or unsupported
  }
};

const buildOverpassQL = (rules, center, radiusMeters) => {
  const { lat, lng } = center;
  const blocks = rules.flatMap(({ key, values }) =>
    values.map(v => `
      node["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
      way["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
      relation["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
    `)
  ).join('\n');

  return `
    [out:json][timeout:25];
    (
      ${blocks}
    );
    out center 50;
  `;
};

const fetchOverpassWithFallback = async (ql) => {
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept-Language': 'en' },
        body: new URLSearchParams({ data: ql }).toString()
      });
      if (res.ok) return await res.json();
    } catch (_) { /* try next */ }
  }
  throw new Error('All Overpass endpoints failed');
};

const fetchOverpassPlaces = async (categoryName, center, radiusMeters = 10000) => {
  const rules = menuToOverpass(categoryName);
  if (!rules) return [];

  // Debounce: 2s per category
  const now = Date.now();
  const last = lastFetchRef.current[categoryName] || 0;
  if (now - last < 2000) {
    const k = cacheKey(categoryName, center.lat, center.lng, radiusMeters);
    const cached = overpassCacheRef.current.get(k);
    if (cached) return cached.data;
  }
  lastFetchRef.current[categoryName] = now;

  // Cache check
  const key = cacheKey(categoryName, center.lat, center.lng, radiusMeters);
  const cached = overpassCacheRef.current.get(key);
  if (cached && now - cached.ts < 5 * 60 * 1000) { // 5 min TTL
    return cached.data;
  }

  const ql = buildOverpassQL(rules, center, Math.max(5000, Math.min(radiusMeters, 15000))); // clamp to 5–15 km

  try {
    const data = await fetchOverpassWithFallback(ql);
    const elements = (data.elements || []).map(el => {
      const isWayOrRel = el.type !== 'node';
      const lat2 = isWayOrRel ? el.center?.lat : el.lat;
      const lon2 = isWayOrRel ? el.center?.lon : el.lon;
      if (lat2 == null || lon2 == null) return null;
      return {
        name: el.tags?.name || el.tags?.['name:en'] || 'Place',
        latitude: Number(lat2),
        longitude: Number(lon2),
        image: undefined,
        description: el.tags?.description || '',
        type: categoryName,
        source: 'overpass'
      };
    }).filter(Boolean);

    overpassCacheRef.current.set(key, { ts: now, data: elements });
    return elements;
  } catch (e) {
    console.error('Overpass error:', e);
    return [];
  }
};

const MapViewMenu = ({ onSelect, activeOption, onSelectCategory, onZoomToPlace }) => {
  const [selectedMenu, setSelectedMenu] = useState(activeOption || 'Major Town');
  const [locationsData, setLocationsData] = useState([]);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState(
    menuItems.find(item => item.name === (activeOption || 'Major Town')) || menuItems[0]
  );

  const currentPos = useCurrentPosition();

  useEffect(() => {
    const handleResize = () => {
      // Set isMobileMenu to true only for screens 768px or smaller
      setIsMobileMenu(window.innerWidth <= 768); 
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchBackendData = async (categoryName) => {
    try {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch backend data');
      const data = await response.json();

      return data.filter(item => {
        switch(categoryName.toLowerCase()) {
          case 'attractions': return item.category === 'Attraction';
          case 'accommodation': return item.category === 'Accommodation';
          case 'food & beverages': return item.category === 'Restaurant';
          case 'transportation': return item.category === 'Transport';
          default: return item.category === categoryName;
        }
      }).map(item => ({
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        image: item.image || defaultImage,
        description: item.description || 'No description available',
        rating: item.rating || null,
        type: item.category,
        source: 'backend'
      }));
    } catch (error) {
      console.error('Backend fetch error:', error);
      return [];
    }
  };

  const fetchPlacesByCategory = async (categoryName, _location, radiusMeters = RADIUS_KM * 1000) => {
    try {
      // 1) Your backend category locations (whole category)
      const backendResults = await fetchBackendData(categoryName);

      // 2) Your approved businesses (whole category)
      const businessResults = await (fetchApprovedBusinesses?.(categoryName) || Promise.resolve([]));

      // 3) Overpass nearby ONLY if we have the user’s current position
      let overpassResults = [];
      if (currentPos && typeof fetchOverpassPlaces === 'function') {
        overpassResults = await fetchOverpassPlaces(categoryName, currentPos, radiusMeters);
      }

      // Merge + dedupe by name + rounded coords
      const combined = [...backendResults, ...businessResults, ...overpassResults].reduce((acc, cur) => {
        if (!cur) return acc;
        const key = `${cur.name}|${Math.round(Number(cur.latitude) * 1e5)}|${Math.round(Number(cur.longitude) * 1e5)}`;
        if (!acc.find(i => `${i.name}|${Math.round(Number(i.latitude) * 1e5)}|${Math.round(Number(i.longitude) * 1e5)}` === key)) {
          acc.push(cur);
        }
        return acc;
      }, []);

      setLocationsData(combined);
      if (onSelect) onSelect(categoryName, combined);
      if (onSelectCategory) onSelectCategory(categoryName, combined);

      if (combined.length > 0 && categoryName !== 'Major Town' && window.mapRef) {
        window.mapRef.panTo({ lat: combined[0].latitude, lng: combined[0].longitude });
        window.mapRef.setZoom(14);
      }
    } catch (error) {
      console.error('Fetch category error:', error);
    }
  };

  const handleMenuItemClick = (item) => {
    setSelectedMenu(item.name);
    if (isMobileMenu) {
      setSelectedMobileMenuItem(item);
      setIsDropdownOpen(false);
    }

    const centerOfKuching = new window.google.maps.LatLng(1.5533, 110.3592);
    setLocationsData([]);
    
    if (item.isFetchOnly) {
      if (item.name === 'Major Town') {
        setSelectedSearchPlace(null);
        const formatted = sarawakDivisions.map(town => ({
          name: town.name,
          latitude: town.latitude,
          longitude: town.longitude,
          image: defaultImage,
          description: 'Division in Sarawak, Malaysia.',
          type: 'Major Town'
        }));
        setLocationsData(formatted);
        if (onSelect) onSelect(item.name, formatted);
        if (onSelectCategory) onSelectCategory(item.name, formatted);
        // Call the zoom handler with Major Town category
        if (onZoomToPlace) onZoomToPlace({ 
          latitude: 1.5533, 
          longitude: 110.3592,
          category: 'Major Town'
        });
      } else {
        setSelectedSearchPlace({ latitude: 1.5533, longitude: 110.3592 });
        fetchPlacesByCategory(item.name, centerOfKuching);
        // Call the zoom handler with the selected category
        if (onZoomToPlace) onZoomToPlace({ 
          latitude: 1.5533, 
          longitude: 110.3592,
          category: item.name
        });
      }
    } else {
      if (onSelect) onSelect(item.name);
      if (onSelectCategory) onSelectCategory(item.name);
    }
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    if (!activeOption) {
      const defaultItem = menuItems.find(item => item.name === 'Major Town');
      if (defaultItem) handleMenuItemClick(defaultItem);
    } else {
      setSelectedMenu(activeOption);
      setSelectedMobileMenuItem(menuItems.find(item => item.name === activeOption) || menuItems[0]);
    }
  }, [activeOption]);

  return (
    <div className="mapview-container">
      {isMobileMenu ? (
        <div className="mapview-dropdown-wrapper">
          <button className="dropdown-toggle-mapview-button" onClick={handleDropdownToggle}>
            <span className="dropdown-toggle-mapview-icon">{selectedMobileMenuItem.icon}</span>
            <span className="dropdown-toggle-mapview-text">{selectedMobileMenuItem.name}</span>
            <span className="dropdown-toggle-mapview-icon">
              {isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </button>
          {isDropdownOpen && (
            <div className="mapview-dropdown-menu-list">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  className={`mapview-dropdown-menu-item ${selectedMobileMenuItem.name === item.name ? 'active-mapview-dropdown-item' : ''}`}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <span className="mapview-dropdown-item-icon">{item.icon}</span>
                  <span className="mapview-dropdown-item-text">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
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
                  <div className="menu-text-wrapper">
                    <span>{item.name}</span>
                  </div>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MapViewMenu;