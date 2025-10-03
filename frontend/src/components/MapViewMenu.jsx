import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FaBed, FaUniversity, FaMountain, FaPlaneDeparture,
  FaUmbrellaBeach, FaHospital, FaCalendarAlt, FaShoppingCart 
} from 'react-icons/fa';
import { FaLocationDot } from "react-icons/fa6";
import { MdForest } from "react-icons/md";
import { IoFastFood } from "react-icons/io5";
import '../styles/MapViewMenu.css';
import defaultImage from '../assets/default.png';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthProvider'; // Import auth context

const RADIUS_KM = 10;
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

// Static data - defined outside component
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

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

// Memoized custom hook for current position
const useCurrentPosition = () => {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const opts = { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 };
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      opts
    );
  }, []);
  return pos;
};

// Memoized component
const MapViewMenu = React.memo(({ onSelect, activeOption, onSelectCategory, onZoomToPlace, isRoutingActive = false, onClearRouting }) => {
  // Cache references
  const overpassCacheRef = useRef(new Map());
  const lastFetchRef = useRef({});
  const categoryDataCacheRef = useRef(new Map());

  const [selectedMenu, setSelectedMenu] = useState(activeOption || 'Major Town');
  const [locationsData, setLocationsData] = useState([]);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [temporarySelection, setTemporarySelection] = useState(null);

  const currentPos = useCurrentPosition();
  const { user } = useAuth(); // Get user from auth context

  // Memoized mobile menu state
  const [selectedMobileMenuItem, setSelectedMobileMenuItem] = useState(
    activeOption === null ? { name: 'Select Category', icon: <FaLocationDot /> } : 
    menuItems.find(item => item.name === (activeOption || 'Major Town')) || menuItems[0]
  );

  // Optimized category mapping
  const menuToBusinessCategoryMap = useMemo(() => ({
    'attractions': 'Attractions',
    'accommodation': 'Accommodation',
    'food & beverages': 'Food & Beverages',
    'transportation': 'Transportation',
    'shoppings & leisures': 'Shoppings & Leisures',
    'tour guides': 'Tour Guides',
    'events': 'Events'
  }), []);

  const menuToBusinessCategory = useCallback((menuCategory) => {
    return menuToBusinessCategoryMap[(menuCategory || '').toLowerCase()] || null;
  }, [menuToBusinessCategoryMap]);

  // Optimized Overpass configuration
  const menuToOverpassMap = useMemo(() => ({
    'food & beverages': [{ key: 'amenity', values: ['restaurant','cafe','fast_food','food_court','bar','pub','bakery','ice_cream'] }],
    'accommodation': [{ key: 'tourism', values: ['hotel','guest_house','motel','hostel','apartment','camp_site','chalet'] }],
    'transportation': [
      { key: 'amenity', values: ['bus_station','ferry_terminal','taxi'] },
      { key: 'public_transport', values: ['stop_position','station','platform'] },
      { key: 'aeroway', values: ['aerodrome','terminal'] },
      { key: 'railway', values: ['station','halt'] }
    ],
    'attractions': [
      { key: 'tourism', values: ['attraction','museum','zoo','theme_park','gallery','aquarium','artwork'] },
      { key: 'leisure', values: ['park','nature_reserve','garden'] }
    ],
    'shoppings & leisures': [
      { key: 'shop', values: ['mall','supermarket','department_store','convenience','clothes','gift','sports','toys'] },
      { key: 'leisure', values: ['fitness_centre','sports_centre','bowling_alley','amusement_arcade','escape_room','nightclub'] }
    ],
    'tour guides': [{ key: 'office', values: ['tourism'] }, { key: 'tourism', values: ['information','guidepost'] }],
    'events': [{ key: 'amenity', values: ['community_centre','theatre','conference_centre'] }]
  }), []);

  const menuToOverpass = useCallback((menuCategory) => {
    return menuToOverpassMap[(menuCategory || '').toLowerCase()] || null;
  }, [menuToOverpassMap]);

  const buildOverpassQL = useCallback((rules, center, radiusMeters) => {
    const { lat, lng } = center;
    const blocks = rules.flatMap(({ key, values }) =>
      values.map(v => `
        node["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
        way["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
        relation["${key}"="${v}"](around:${radiusMeters},${lat},${lng});
      `)
    ).join('\n');

    return `
      [out:json][timeout:15];
      (
        ${blocks}
      );
      out center 300;
    `;
  }, []);

  const fetchOverpassWithFallback = useCallback(async (ql) => {
    for (const url of OVERPASS_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept-Language': 'en' },
          body: new URLSearchParams({ data: ql }).toString(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) return await res.json();
      } catch (_) { /* try next */ }
    }
    return { elements: [] };
  }, []);

  const fetchOverpassPlaces = useCallback(async (categoryName, center, radiusMeters = 10000) => {
    const rules = menuToOverpass(categoryName);
    if (!rules) return [];

    const now = Date.now();
    const last = lastFetchRef.current[categoryName] || 0;
    if (now - last < 1500) {
      const key = `${categoryName}|${center.lat.toFixed(4)}|${center.lng.toFixed(4)}|${radiusMeters}`;
      const cached = overpassCacheRef.current.get(key);
      if (cached) return cached.data;
    }
    lastFetchRef.current[categoryName] = now;

    const key = `${categoryName}|${center.lat.toFixed(4)}|${center.lng.toFixed(4)}|${radiusMeters}`;
    const cached = overpassCacheRef.current.get(key);
    if (cached && now - cached.ts < 5 * 60 * 1000) {
      return cached.data;
    }

    const ql = buildOverpassQL(rules, center, Math.max(5000, Math.min(radiusMeters, 10000)));

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
      }).filter(Boolean).slice(0, 40);

      overpassCacheRef.current.set(key, { ts: now, data: elements });
      return elements;
    } catch (e) {
      console.error('Overpass error:', e);
      return [];
    }
  }, [menuToOverpass, buildOverpassQL, fetchOverpassWithFallback]);

  // Optimized resize handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobileMenu(window.innerWidth <= 768);
    };
    
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    handleResize();
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Fetch Major Towns from backend - specifically only Major Town locations
  const fetchMajorTowns = useCallback(async () => {
    const cacheKey = 'major_towns';
    const now = Date.now();
    const cached = categoryDataCacheRef.current.get(cacheKey);
    
    if (cached && now - cached.timestamp < 300000) { // 5 minutes cache
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Fetch all locations first
      const res = await fetch('/api/locations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) return [];
      const data = await res.json();

      // Filter to only include Major Town locations
      const result = data
        .filter(item => 
          item && 
          item.latitude != null && 
          item.longitude != null && 
          (item.category === 'Major Town' || item.type === 'Major Town')
        )
        .map(item => ({
          name: item.name,
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          image: item.image || defaultImage,
          description: item.description || 'Major Town in Sarawak',
          type: 'Major Town',
          source: 'backend',
          division: item.division || '',
          url: item.url || '',
          category: item.category || 'Major Town'
        }));

      categoryDataCacheRef.current.set(cacheKey, { timestamp: now, data: result });
      return result;
    } catch (error) {
      console.error('Major Towns fetch error:', error);
      return [];
    }
  }, []);

  const fetchApprovedBusinesses = useCallback(async (menuCategoryName) => {
    const cacheKey = `businesses_${menuCategoryName}`;
    const now = Date.now();
    const cached = categoryDataCacheRef.current.get(cacheKey);
    
    if (cached && now - cached.timestamp < 300000) {
      return cached.data;
    }

    try {
      const apiCategory = menuToBusinessCategory(menuCategoryName);
      if (!apiCategory) return [];
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(`/api/businesses/approved?category=${encodeURIComponent(apiCategory)}&limit=100`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) return [];
      const json = await res.json();
      const list = (json.data || []).filter(Boolean);

      const result = list
        .filter(b => b && b.latitude != null && b.longitude != null)
        .slice(0, 50)
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
          source: 'businesses',
          website: b.website || '',
          openingHours: b.openingHours || '',
          phone: b.phone || '',
          owner: b.owner || '',
          ownerEmail: b.ownerEmail || '',
          address: b.address || '',
          category: b.category || '',
        }));

      categoryDataCacheRef.current.set(cacheKey, { timestamp: now, data: result });
      return result;
    } catch (e) {
      console.error('Approved businesses fetch error:', e);
      return [];
    }
  }, [menuToBusinessCategory]);

  // Fixed fetchBackendEvents with user-based filtering - no infinite loop
  const fetchBackendEvents = useCallback(async () => {
    const userKey = user ? `${user.role}_${user.userType}` : 'tourist';
    const cacheKey = `events_${userKey}`;
    const now = Date.now();
    const cached = categoryDataCacheRef.current.get(cacheKey);
    
    if (cached && now - cached.timestamp < 300000) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('/api/event/getAllEvents', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) return [];
      const json = await res.json();
      const list = (json.events || []).filter(Boolean);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      // Process the data with user-based filtering
      const processedData = list
        .filter(item => {
          // Filter out past events - only show events where endDate is today or in the future
          const eventEndDate = item.endDate ? new Date(item.endDate) : null;
          if (!eventEndDate) return false;
          
          eventEndDate.setHours(0, 0, 0, 0);
          return eventEndDate >= currentDate;
        })
        .filter(item => {
          // Filter by target audience based on user type - SAME LOGIC AS EVENT PAGE
          const userType = user?.userType || 'tourist'; // Default to tourist if not logged in
          const userRole = user?.role; // Check for admin roles
          const eventAudiences = item.targetAudience || [];
          
          // System admin, CBT admin, and business users can see all events
          if (userRole === 'system_admin' || userRole === 'cbt_admin' || userRole === 'business') {
            return true;
          } else {
            // Tourist users (including non-logged in) can only see tourist events
            return eventAudiences.includes('Tourist');
          }
        })
        .filter(item => item?.coordinates?.latitude != null && item?.coordinates?.longitude != null)
        .slice(0, 300)
        .map(item => ({
          name: item.name,
          latitude: Number(item.coordinates.latitude),
          longitude: Number(item.coordinates.longitude),
          image: item.imageUrl || defaultImage,
          description: item.description || 'Event',
          type: 'Events',
          source: 'events',
          startDate: item.startDate,
          endDate: item.endDate,
          startTime: item.startTime,
          endTime: item.endTime,
          eventType: item.eventType,
          registrationRequired: item.registrationRequired,
          targetAudience: item.targetAudience || [],
          eventOrganizers: item.eventOrganizers || '',
          eventHashtags: item.eventHashtags || []
        }));

      categoryDataCacheRef.current.set(cacheKey, { timestamp: now, data: processedData });
      return processedData;
    } catch (e) {
      console.error('Events fetch error:', e);
      return [];
    }
  }, [user]); // Only depend on user

  const fetchBackendData = useCallback(async (categoryName) => {
    // Skip for Major Town since we have a dedicated function for it
    if (categoryName.toLowerCase() === 'major town') {
      return [];
    }

    const cacheKey = `backend_${categoryName}`;
    const now = Date.now();
    const cached = categoryDataCacheRef.current.get(cacheKey);
    
    if (cached && now - cached.timestamp < 300000) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('/api/locations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return [];
      const data = await response.json();

      const result = data.filter(item => {
        switch(categoryName.toLowerCase()) {
          case 'attractions': return item.category === 'Attraction';
          case 'accommodation': return item.category === 'Accommodation';
          case 'food & beverages': return item.category === 'Restaurant';
          case 'transportation': return item.category === 'Transport';
          case 'shoppings & leisures': return ['Shopping', 'Leisure'].includes(item.category);
          case 'tour guides': return item.category === 'Tour Guide';
          case 'events': return item.category === 'Event';
          default: return item.category === categoryName;
        }
      }).map(item => ({
        ...item,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        image: item.image || defaultImage,
        description: item.description || 'No description available',
        rating: item.rating || null,
        type: item.category,
        source: 'backend',
      })).slice(0, 50);

      categoryDataCacheRef.current.set(cacheKey, { timestamp: now, data: result });
      return result;
    } catch (error) {
      console.error('Backend fetch error:', error);
      return [];
    }
  }, []);

  // Main data fetcher
  const fetchPlacesByCategory = useCallback(async (categoryName, _location, radiusMeters = RADIUS_KM * 1000) => {
    setLoadingStates(prev => ({ ...prev, [categoryName]: true }));

    try {
      // Special case: Major Town - fetch from backend
      if ((categoryName || '').toLowerCase() === 'major town') {
        const majorTowns = await fetchMajorTowns();
        setLocationsData(majorTowns);
        if (onSelect) onSelect(categoryName, majorTowns);
        if (onSelectCategory) onSelectCategory(categoryName, majorTowns);
        if (majorTowns.length > 0 && window.mapRef) {
          window.mapRef.panTo({ lat: majorTowns[0].latitude, lng: majorTowns[0].longitude });
          window.mapRef.setZoom(10); // Zoom out a bit for major towns to see more area
        }
        return;
      }

      // Special case: backend Events - now with user-based filtering
      if ((categoryName || '').toLowerCase() === 'events') {
        const events = await fetchBackendEvents();
        setLocationsData(events);
        if (onSelect) onSelect(categoryName, events);
        if (onSelectCategory) onSelectCategory(categoryName, events);
        if (events.length > 0 && window.mapRef) {
          window.mapRef.panTo({ lat: events[0].latitude, lng: events[0].longitude });
          window.mapRef.setZoom(14);
        }
        return;
      }

      // Use cached data if available for other categories
      const cacheKey = `category_${categoryName}_${currentPos ? `${currentPos.lat}_${currentPos.lng}` : 'default'}`;
      const now = Date.now();
      const cached = categoryDataCacheRef.current.get(cacheKey);
      
      if (cached && now - cached.timestamp < 300000) {
        setLocationsData(cached.data);
        if (onSelect) onSelect(categoryName, cached.data);
        if (onSelectCategory) onSelectCategory(categoryName, cached.data);
        if (cached.data.length > 0 && categoryName !== 'Major Town' && window.mapRef) {
          window.mapRef.panTo({ lat: cached.data[0].latitude, lng: cached.data[0].longitude });
          window.mapRef.setZoom(14);
        }
        return;
      }

      // Fetch fresh data for other categories
      const [backendResults, businessResults, overpassResults] = await Promise.all([
        fetchBackendData(categoryName),
        fetchApprovedBusinesses(categoryName),
        currentPos && typeof fetchOverpassPlaces === 'function' 
          ? fetchOverpassPlaces(categoryName, currentPos, radiusMeters)
          : Promise.resolve([])
      ]);

      const combined = [...backendResults, ...businessResults, ...overpassResults].reduce((acc, cur) => {
        if (!cur) return acc;
        const key = `${cur.name}|${Math.round(Number(cur.latitude) * 1e5)}|${Math.round(Number(cur.longitude) * 1e5)}`;
        if (!acc.find(i => `${i.name}|${Math.round(Number(i.latitude) * 1e5)}|${Math.round(Number(i.longitude) * 1e5)}` === key)) {
          acc.push(cur);
        }
        return acc;
      }, []).slice(0, 80);

      // Cache the results
      categoryDataCacheRef.current.set(cacheKey, { timestamp: now, data: combined });

      setLocationsData(combined);
      if (onSelect) onSelect(categoryName, combined);
      if (onSelectCategory) onSelectCategory(categoryName, combined);
      if (combined.length > 0 && categoryName !== 'Major Town' && window.mapRef) {
        window.mapRef.panTo({ lat: combined[0].latitude, lng: combined[0].longitude });
        window.mapRef.setZoom(14);
      }
    } catch (error) {
      console.error('Fetch category error:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [categoryName]: false }));
    }
  }, [
    currentPos, 
    fetchBackendData, 
    fetchApprovedBusinesses, 
    fetchOverpassPlaces, 
    fetchBackendEvents, 
    fetchMajorTowns, 
    onSelect, 
    onSelectCategory
  ]);

  // Menu item click handler
  const handleMenuItemClick = useCallback((item) => {
    // Clear routing if we're in routing mode and user selects a category
    if (isRoutingActive && activeOption === null && onClearRouting) {
      onClearRouting();
    }

    // Always update the local state for visual feedback
    if (isRoutingActive && activeOption === null) {
      // In routing mode, use temporary selection for visual feedback
      setTemporarySelection(item.name);
      if (isMobileMenu) {
        setSelectedMobileMenuItem(item);
        setIsDropdownOpen(false);
      }
    } else {
      // Normal mode
      setSelectedMenu(item.name);
      if (isMobileMenu) {
        setSelectedMobileMenuItem(item);
        setIsDropdownOpen(false);
      }
    }

    setLocationsData([]);

    if (item.isFetchOnly) {
      if (item.name === 'Major Town') {
        setSelectedSearchPlace(null);
        // This will now trigger the fetchMajorTowns function
        fetchPlacesByCategory(item.name, { latitude: 1.5533, longitude: 110.3592 });
      } else {
        setSelectedSearchPlace(null);
        fetchPlacesByCategory(item.name, { latitude: 1.5533, longitude: 110.3592 });
      }
      // zoom to user's current location (if available)
      if (currentPos && typeof onZoomToPlace === 'function') {
        onZoomToPlace({ latitude: currentPos.lat, longitude: currentPos.lng, category: item.name });
      }
    } else {
      if (onSelect) onSelect(item.name);
      if (onSelectCategory) onSelectCategory(item.name);
      if (currentPos && typeof onZoomToPlace === 'function') {
        onZoomToPlace({ latitude: currentPos.lat, longitude: currentPos.lng, category: item.name });
      }
    }
  }, [
    isRoutingActive, 
    activeOption, 
    onClearRouting, 
    isMobileMenu, 
    currentPos, 
    onSelect, 
    onSelectCategory, 
    onZoomToPlace, 
    fetchPlacesByCategory
  ]);

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // Effect for active option changes
  useEffect(() => {
    if (activeOption === null && isRoutingActive) {
      // Routing mode - clear visual selection but allow interaction
      setSelectedMenu('');
      setSelectedMobileMenuItem({ name: 'Select Category', icon: <FaLocationDot /> });
    } else if (!activeOption) {
      // No active option but not routing mode - default to Major Town
      const defaultItem = menuItems.find(item => item.name === 'Major Town');
      if (defaultItem) handleMenuItemClick(defaultItem);
    } else {
      setSelectedMenu(activeOption);
      setSelectedMobileMenuItem(menuItems.find(item => item.name === activeOption) || menuItems[0]);
    }
  }, [activeOption, isRoutingActive, handleMenuItemClick]);

  // Clear temporary selection when routing ends
  useEffect(() => {
    if (!isRoutingActive) {
      setTemporarySelection(null);
    }
  }, [isRoutingActive]);

  // Memoized menu item rendering for desktop
  const renderDesktopMenuItems = useCallback(() => {
    return menuItems.map((item) => {
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
            </span>
          </div>
          <span className={`menu-text2 ${isActive ? 'active-text' : ''}`}>
            {item.name}
          </span>
        </button>
      );
    });
  }, [selectedMenu, isRoutingActive, activeOption, temporarySelection, handleMenuItemClick]);

  // Memoized dropdown menu items
  const renderDropdownMenuItems = useCallback(() => {
    return menuItems.map((item) => {
      return (
        <button
          key={item.name}
          className={`mapview-dropdown-menu-item ${selectedMobileMenuItem.name === item.name ? 'active-mapview-dropdown-item' : ''}`}
          onClick={() => handleMenuItemClick(item)}
        >
          <span className="mapview-dropdown-item-icon">{item.icon}</span>
          <span className="mapview-dropdown-item-text">{item.name}</span>
        </button>
      );
    });
  }, [selectedMobileMenuItem, handleMenuItemClick]);

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
              {renderDropdownMenuItems()}
            </div>
          )}
        </div>
      ) : (
        <div className="menu-container">
          {renderDesktopMenuItems()}
        </div>
      )}
    </div>
  );
});

export default MapViewMenu;