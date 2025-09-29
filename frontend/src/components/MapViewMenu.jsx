import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt, FaShoppingCart 
} from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import { MdForest } from "react-icons/md";
import { IoFastFood } from "react-icons/io5";
import '../styles/MapViewMenu.css';
import defaultImage from '../assets/Kuching.png';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

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

const MapViewMenu = ({ onSelect, activeOption, onSelectCategory, onZoomToPlace, isRoutingActive = false, onClearRouting }) => {
  const [selectedMenu, setSelectedMenu] = useState(activeOption || 'Major Town');
  const [locationsData, setLocationsData] = useState([]);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🚀 FIXED: Proper caching with all data sources
  const [categoryData, setCategoryData] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadedCategories, setPreloadedCategories] = useState(new Set(['Major Town']));

  const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState(
    activeOption === null ? { name: 'Select Category', icon: <FaLocationDot /> } : 
    menuItems.find(item => item.name === (activeOption || 'Major Town')) || menuItems[0]
  );
  const [temporarySelection, setTemporarySelection] = useState(null);

  const currentPos = useCurrentPosition();

  // 🚀 FIXED: Proper preloading with ALL data sources
  useEffect(() => {
    const preloadCategories = async () => {
      setIsPreloading(true);
      
      // Preload Major Town instantly
      const majorTownData = sarawakDivisions.map(town => ({
        name: town.name,
        latitude: town.latitude,
        longitude: town.longitude,
        image: defaultImage,
        description: 'Division in Sarawak, Malaysia.',
        type: 'Major Town'
      }));
      
      setCategoryData(prev => ({ ...prev, 'Major Town': majorTownData }));
      
      // Preload other categories with ALL data sources
      const categoriesToLoad = menuItems
        .filter(item => item.isFetchOnly && item.name !== 'Major Town')
        .map(item => item.name);
      
      console.log('🚀 Preloading categories with ALL data sources:', categoriesToLoad);
      
      // Load categories with proper error handling
      for (const category of categoriesToLoad) {
        try {
          const data = await fetchAllDataSources(category);
          if (data && data.length > 0) {
            setCategoryData(prev => ({ ...prev, [category]: data }));
            setPreloadedCategories(prev => new Set([...prev, category]));
            console.log(`✅ Preloaded: ${category} (${data.length} items from all sources)`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to preload ${category}:`, error);
        }
      }
      
      setIsPreloading(false);
    };

    preloadCategories();
  }, []);

  // 🚀 FIXED: Function that fetches ALL data sources
  const fetchAllDataSources = async (categoryName) => {
    try {
      if (categoryName === 'Major Town') {
        return sarawakDivisions.map(town => ({
          name: town.name,
          latitude: town.latitude,
          longitude: town.longitude,
          image: defaultImage,
          description: 'Division in Sarawak, Malaysia.',
          type: 'Major Town'
        }));
      }

      if (categoryName.toLowerCase() === 'events') {
        return await fetchBackendEvents();
      }

      console.log(`📡 Fetching ALL data for: ${categoryName}`);
      
      // 🚀 FIXED: Fetch from ALL sources simultaneously
      const [backendResults, businessResults, overpassResults] = await Promise.all([
        fetchBackendData(categoryName).catch(() => []),
        fetchApprovedBusinesses(categoryName).catch(() => []),
        currentPos ? fetchOverpassPlaces(categoryName, currentPos, RADIUS_KM * 1000).catch(() => []) : []
      ]);

      console.log(`📊 ${categoryName} - Backend: ${backendResults.length}, Business: ${businessResults.length}, Overpass: ${overpassResults.length}`);
      
      // Combine all data
      const allData = [...backendResults, ...businessResults, ...overpassResults];
      
      // Deduplicate
      const uniqueData = allData.reduce((acc, current) => {
        if (!current) return acc;
        const key = `${current.name}_${current.latitude}_${current.longitude}`;
        if (!acc.some(item => 
          item.name === current.name && 
          item.latitude === current.latitude && 
          item.longitude === current.longitude
        )) {
          acc.push(current);
        }
        return acc;
      }, []);

      console.log(`🎯 ${categoryName} - Total unique places: ${uniqueData.length}`);
      return uniqueData;
    } catch (error) {
      console.error(`Error fetching ${categoryName}:`, error);
      return [];
    }
  };

  // 🚀 ORIGINAL DATA FETCHING FUNCTIONS (preserved)
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

  const fetchBackendEvents = async () => {
    try {
      const res = await fetch('/api/event/getAllEvents');
      if (!res.ok) throw new Error('Failed to fetch events');
      const json = await res.json();
      const list = (json.events || []).filter(Boolean);
      return list
        .filter(e => e?.coordinates?.latitude != null && e?.coordinates?.longitude != null)
        .map(e => ({
          name: e.name,
          latitude: Number(e.coordinates.latitude),
          longitude: Number(e.coordinates.longitude),
          image: e.imageUrl || defaultImage,
          description: e.description || 'Event',
          type: 'Events',
          source: 'events'
        }));
    } catch (e) {
      console.error('Events fetch error:', e);
      return [];
    }
  };

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

  // 🚀 FIXED: Click handler that uses ALL preloaded data
  const handleMenuItemClick = useCallback((item) => {
    if (isRoutingActive && activeOption === null && onClearRouting) {
      onClearRouting();
    }

    if (isRoutingActive && activeOption === null) {
      setTemporarySelection(item.name);
      if (isMobileMenu) {
        setSelectedMobileMenuItem(item);
        setIsDropdownOpen(false);
      }
    } else {
      setSelectedMenu(item.name);
      if (isMobileMenu) {
        setSelectedMobileMenuItem(item);
        setIsDropdownOpen(false);
      }
    }

    if (item.isFetchOnly) {
      // 🚀 FIXED: Use preloaded data that includes ALL sources
      if (categoryData[item.name]) {
        const instantData = categoryData[item.name];
        setLocationsData(instantData);
        if (onSelect) onSelect(item.name, instantData);
        if (onSelectCategory) onSelectCategory(item.name, instantData);
        
        // Auto-zoom
        if (instantData.length > 0 && window.mapRef) {
          if (item.name === 'Major Town') {
            const bounds = new L.LatLngBounds();
            instantData.forEach(location => {
              bounds.extend([location.latitude, location.longitude]);
            });
            window.mapRef.fitBounds(bounds, { padding: [20, 20] });
          } else {
            const firstItem = instantData[0];
            window.mapRef.panTo({ lat: firstItem.latitude, lng: firstItem.longitude });
            window.mapRef.setZoom(14);
          }
        }
        
        console.log(`⚡ INSTANT: ${item.name} (${instantData.length} items from all sources)`);
      } else {
        // Fallback: fetch on demand with ALL data sources
        console.log(`🔄 Loading on demand: ${item.name}`);
        setSelectedSearchPlace(null);
        fetchAllDataSources(item.name).then(fullData => {
          if (fullData.length > 0) {
            setLocationsData(fullData);
            if (onSelect) onSelect(item.name, fullData);
            if (onSelectCategory) onSelectCategory(item.name, fullData);
            
            // Cache it
            setCategoryData(prev => ({ ...prev, [item.name]: fullData }));
            setPreloadedCategories(prev => new Set([...prev, item.name]));
          }
        });
      }
    } else {
      if (onSelect) onSelect(item.name);
      if (onSelectCategory) onSelectCategory(item.name);
    }
  }, [isRoutingActive, activeOption, onClearRouting, isMobileMenu, categoryData, onSelect, onSelectCategory]);

  // 🚀 ORIGINAL OVERPASS FUNCTIONS (preserved)
  const OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  const overpassCacheRef = { current: new Map() };
  const lastFetchRef = { current: {} };

  const cacheKey = (category, lat, lng, radius) =>
    `${category}|${lat.toFixed(4)}|${lng.toFixed(4)}|${radius}`;

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
        return null;
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

    const now = Date.now();
    const last = lastFetchRef.current[categoryName] || 0;
    if (now - last < 2000) {
      const k = cacheKey(categoryName, center.lat, center.lng, radiusMeters);
      const cached = overpassCacheRef.current.get(k);
      if (cached) return cached.data;
    }
    lastFetchRef.current[categoryName] = now;

    const key = cacheKey(categoryName, center.lat, center.lng, radiusMeters);
    const cached = overpassCacheRef.current.get(key);
    if (cached && now - cached.ts < 5 * 60 * 1000) {
      return cached.data;
    }

    const ql = buildOverpassQL(rules, center, Math.max(5000, Math.min(radiusMeters, 15000)));

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

  // 🚀 REST OF YOUR ORIGINAL CODE
  useEffect(() => {
    const handleResize = () => {
      setIsMobileMenu(window.innerWidth <= 768); 
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    if (activeOption === null && isRoutingActive) {
      setSelectedMenu('');
      setSelectedMobileMenuItem({ name: 'Select Category', icon: <FaLocationDot /> });
    } else if (!activeOption) {
      const defaultItem = menuItems.find(item => item.name === 'Major Town');
      if (defaultItem) handleMenuItemClick(defaultItem);
    } else {
      setSelectedMenu(activeOption);
      setSelectedMobileMenuItem(menuItems.find(item => item.name === activeOption) || menuItems[0]);
    }
  }, [activeOption, isRoutingActive, handleMenuItemClick]);

  useEffect(() => {
    if (!isRoutingActive) {
      setTemporarySelection(null);
    }
  }, [isRoutingActive]);

  return (
    <div className="mapview-container">
      {isMobileMenu ? (
        <div className="mapview-dropdown-wrapper">
          <button className="dropdown-toggle-mapview-button" onClick={handleDropdownToggle}>
            <span className="dropdown-toggle-mapview-icon">{selectedMobileMenuItem.icon}</span>
            <span className="dropdown-toggle-mapview-text">
              {selectedMobileMenuItem.name}
              {isPreloading && !preloadedCategories.has(selectedMobileMenuItem.name) && (
                <span className="preloading-dot"> ●</span>
              )}
            </span>
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
                  <span className="mapview-dropdown-item-text">
                    {item.name}
                    {isPreloading && !preloadedCategories.has(item.name) && (
                      <span className="preloading-dot"> ●</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="menu-container">
          {menuItems.map((item) => {
            const isActive = isRoutingActive && activeOption === null 
              ? temporarySelection === item.name 
              : selectedMenu === item.name;
            return (
              <button
                key={item.name}
                className={`menu-item2 ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(item)}
              >
                <div className={`icon-container ${isActive ? 'active-icon-container' : ''}`}>
                  <span className={`menu-icon ${isActive ? 'active-icon' : ''}`}>
                    {item.icon}
                    {isPreloading && !preloadedCategories.has(item.name) && (
                      <span className="preloading-dot">●</span>
                    )}
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
      
      {isPreloading && (
        <div className="preloading-indicator">
          <small>Loading categories... {preloadedCategories.size}/{menuItems.length}</small>
        </div>
      )}
    </div>
  );
};

export default MapViewMenu;