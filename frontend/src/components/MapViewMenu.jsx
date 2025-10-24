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
import { useAuth } from '../context/AuthProvider';

const RADIUS_KM = 10;
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

// Enhanced SWR-like cache system with 24-hour persistence and auto-refresh
const createSWRCache = () => {
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  const REFRESH_INTERVAL = 60 * 1000; // 60 seconds for background refresh
  const cache = new Map();
  
  // Load from localStorage on initialization for persistence
  if (typeof window !== 'undefined') {
    try {
      const savedCache = localStorage.getItem('mapview_cache_v2');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        const now = Date.now();
        
        // Only load items that are still valid (less than 24 hours old)
        Object.entries(parsed).forEach(([key, value]) => {
          if (now - value.timestamp < CACHE_DURATION) {
            cache.set(key, value);
          } else {
            console.log(`🗑️ Removing expired cache: ${key}`);
          }
        });
        
        console.log('📦 Loaded persistent cache from localStorage');
        
        // Clean up expired items from localStorage
        const validCache = {};
        cache.forEach((value, key) => {
          validCache[key] = value;
        });
        localStorage.setItem('mapview_cache_v2', JSON.stringify(validCache));
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }
  
  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      
      // Check if cache is still valid (24 hours)
      if (Date.now() - item.timestamp < CACHE_DURATION) {
        return item.data;
      }
      
      // Cache expired - remove it
      cache.delete(key);
      
      // Also remove from localStorage
      if (typeof window !== 'undefined') {
        try {
          const savedCache = localStorage.getItem('mapview_cache_v2');
          if (savedCache) {
            const parsed = JSON.parse(savedCache);
            delete parsed[key];
            localStorage.setItem('mapview_cache_v2', JSON.stringify(parsed));
          }
        } catch (error) {
          console.error('Failed to clean expired cache from localStorage:', error);
        }
      }
      
      return null;
    },
    
    set: (key, data) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        fetchTime: Date.now(),
        lastRefresh: Date.now()
      });
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          const cacheObj = Object.fromEntries(cache);
          localStorage.setItem('mapview_cache_v2', JSON.stringify(cacheObj));
        } catch (error) {
          console.error('Failed to save cache to localStorage:', error);
        }
      }
    },
    
    clear: (key) => {
      if (key) {
        cache.delete(key);
      } else {
        cache.clear();
      }
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          const cacheObj = Object.fromEntries(cache);
          localStorage.setItem('mapview_cache_v2', JSON.stringify(cacheObj));
        } catch (error) {
          console.error('Failed to update localStorage after clear:', error);
        }
      }
    },
    
    has: (key) => {
      const item = cache.get(key);
      return item && Date.now() - item.timestamp < CACHE_DURATION;
    },
    
    // Get all keys for background refresh
    getAllKeys: () => Array.from(cache.keys()),
    
    // Get item with metadata for refresh logic
    getWithMetadata: (key) => cache.get(key),
    
    // Check if cache is fully populated for instant experience
    isFullyPopulated: () => {
      const essentialKeys = [
        'major_towns',
        'backend_locations', 
        'events',
        'businesses_Attractions',
        'businesses_Accommodation',
        'businesses_Food & Beverages',
        'businesses_Transportation',
        'businesses_Shoppings & Leisures',
        'businesses_Tour Guides'
      ];
      
      // Check if we have basic data
      const hasBasicData = essentialKeys.every(key => cache.has(key));
      
      if (!hasBasicData) return false;
      
      // Check if we have some Overpass data (don't require all categories)
      const cacheKeys = Array.from(cache.keys());
      const hasOverpassData = cacheKeys.some(key => key.startsWith('overpass_'));
      
      return hasBasicData && hasOverpassData;
    },
    
    // Get cache stats
    getStats: () => {
      const keys = cache.getAllKeys();
      const now = Date.now();
      let validCount = 0;
      let expiredCount = 0;
      let overpassCount = 0;
      
      keys.forEach(key => {
        const item = cache.get(key);
        if (item && now - item.timestamp < CACHE_DURATION) {
          validCount++;
          if (key.startsWith('overpass_')) {
            overpassCount++;
          }
        } else {
          expiredCount++;
        }
      });
      
      return {
        total: keys.length,
        valid: validCount,
        expired: expiredCount,
        overpass: overpassCount,
        fullyPopulated: cache.isFullyPopulated()
      };
    }
  };
};

// Global cache instance
const globalCache = createSWRCache();

// Enhanced background cache refresh system - updates every 60 seconds
const startBackgroundRefresh = () => {
  if (typeof window === 'undefined') return null;
  
  console.log('🔄 Starting background cache refresh system (60s interval)...');
  
  // Refresh cache every 60 seconds
  const refreshInterval = setInterval(async () => {
    const stats = globalCache.getStats();
    console.log(`🔄 Background cache refresh cycle started... (${stats.valid} valid items)`);
    
    const keys = globalCache.getAllKeys();
    let refreshedCount = 0;
    let failedCount = 0;
    
    // Get current position for nearby data refresh
    const getCurrentPositionForRefresh = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(DEFAULT_CENTER);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(DEFAULT_CENTER),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
      });
    };

    const currentPos = await getCurrentPositionForRefresh();
    
    for (const key of keys) {
      try {
        // Only refresh items that are due for refresh (older than 60 seconds)
        const item = globalCache.getWithMetadata(key);
        if (item && Date.now() - item.lastRefresh < 60000) {
          continue; // Skip if refreshed recently
        }

        // Determine what type of data this is and refresh accordingly
        if (key === 'major_towns' || key === 'backend_locations') {
          const response = await fetch('/api/locations');
          if (response.ok) {
            const data = await response.json();
            globalCache.set(key, data);
            refreshedCount++;
            console.log(`✅ Refreshed ${key}`);
          } else {
            failedCount++;
          }
        } else if (key === 'events') {
          const response = await fetch('/api/event/getAllEvents');
          if (response.ok) {
            const data = await response.json();
            globalCache.set(key, data.events || []);
            refreshedCount++;
            console.log(`✅ Refreshed ${key}`);
          } else {
            failedCount++;
          }
        } else if (key.startsWith('businesses_')) {
          const category = key.replace('businesses_', '');
          const response = await fetch(`/api/businesses/approved?category=${encodeURIComponent(category)}&limit=500`);
          if (response.ok) {
            const data = await response.json();
            globalCache.set(key, data.data || []);
            refreshedCount++;
            console.log(`✅ Refreshed ${key}`);
          } else {
            failedCount++;
          }
        } else if (key.startsWith('overpass_')) {
          // Refresh Overpass data with current position
          const parts = key.split('_');
          if (parts.length >= 2) {
            const category = parts[1];
            const rules = menuToOverpassMap[category.toLowerCase()];
            if (rules) {
              const ql = buildOverpassQL(rules, currentPos, 10000);
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
                  type: category,
                  source: 'overpass'
                };
              }).filter(Boolean).slice(0, 500);

              const newKey = `overpass_${category}_${currentPos.lat.toFixed(4)}_${currentPos.lng.toFixed(4)}_10000`;
              globalCache.set(newKey, elements);
              refreshedCount++;
              console.log(`✅ Refreshed Overpass data for ${category}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to refresh ${key}:`, error);
        failedCount++;
      }
    }
    
    if (refreshedCount > 0 || failedCount > 0) {
      console.log(`✅ Background refresh completed: ${refreshedCount} items updated, ${failedCount} failed`);
    } else {
      console.log('ℹ️ No items needed refresh this cycle');
    }
  }, 60000); // 60 seconds
  
  return refreshInterval;
};

// Optimized fetch with timeout utility
const fetchWithOptimizedTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Get current position for preload
const getCurrentPositionForPreload = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_CENTER);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(DEFAULT_CENTER),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
};

// Enhanced PARALLEL preloading system for 500 data limit
const useParallelPreload = () => {
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadMessage, setPreloadMessage] = useState('Initializing...');
  const [isInstantExperience, setIsInstantExperience] = useState(false);

  const preloadEssentialData = async () => {
    if (typeof window === 'undefined') return;

    // Check if cache is already fully populated - INSTANT EXPERIENCE
    if (globalCache.isFullyPopulated()) {
      console.log('⚡ Cache is fully populated - INSTANT EXPERIENCE AVAILABLE');
      setPreloadProgress(100);
      setPreloadMessage('Instant experience ready!');
      setIsInstantExperience(true);
      setTimeout(() => setIsPreloading(false), 800);
      return;
    }

    // Check if we've already pre-loaded recently (within 1 hour)
    const lastPreload = localStorage.getItem('mapview_last_preload_v2');
    const now = Date.now();
    if (lastPreload && now - parseInt(lastPreload) < 60 * 60 * 1000) {
      console.log('⚡ Using recently pre-loaded data');
      setPreloadProgress(100);
      setPreloadMessage('Loading cached data...');
      setTimeout(() => setIsPreloading(false), 500);
      return;
    }

    console.log('🚀 ENHANCED PARALLEL Pre-loading 500 items per category...');
    setIsPreloading(true);
    setIsInstantExperience(false);
    setPreloadProgress(0);
    setPreloadMessage('Starting enhanced parallel load...');

    try {
      let completedBatches = 0;
      const totalBatches = 6; // Increased from 4 to 6 for better parallelism

      const updateProgress = (message, batchIncrement = 1) => {
        completedBatches += batchIncrement;
        const progress = Math.min(Math.round((completedBatches / totalBatches) * 100), 95);
        setPreloadProgress(progress);
        setPreloadMessage(message);
        console.log(`📊 Enhanced parallel pre-load: ${progress}% - ${message}`);
      };

      // BATCH 1: Load Major Towns + Events in PARALLEL (Core data)
      setPreloadMessage('Loading core map data...');
      const batch1Promises = [
        // Major Towns
        fetchWithOptimizedTimeout('/api/locations').then(majorTowns => {
          globalCache.set('major_towns', majorTowns);
          globalCache.set('backend_locations', majorTowns);
          return majorTowns;
        }).catch(error => {
          console.error('Failed to pre-load major towns:', error);
          return [];
        }),

        // Events
        fetchWithOptimizedTimeout('/api/event/getAllEvents').then(events => {
          globalCache.set('events', events.events || []);
          return events.events || [];
        }).catch(error => {
          console.error('Failed to pre-load events:', error);
          return [];
        })
      ];

      await Promise.allSettled(batch1Promises);
      updateProgress('Core map data loaded', 1);

      // BATCH 2: Load ALL Business Categories in PARALLEL (6 categories at once)
      setPreloadMessage('Loading all businesses in parallel...');
      const allBusinessCategories = [
        'Attractions', 'Accommodation', 'Food & Beverages', 
        'Transportation', 'Shoppings & Leisures', 'Tour Guides'
      ];
      
      const businessPromises = allBusinessCategories.map(category => 
        fetchWithOptimizedTimeout(`/api/businesses/approved?category=${encodeURIComponent(category)}&limit=500`)
          .then(businesses => {
            globalCache.set(`businesses_${category}`, businesses.data || []);
            console.log(`✅ Loaded ${businesses.data?.length || 0} ${category} businesses`);
            return businesses.data || [];
          })
          .catch(error => {
            console.error(`Failed to pre-load ${category} businesses:`, error);
            return [];
          })
      );

      await Promise.allSettled(businessPromises);
      updateProgress('All businesses loaded', 2); // Count as 2 batches since it's heavy

      // BATCH 3: Overpass Data - Load in larger parallel batches
      setPreloadMessage('Loading map points in parallel...');
      const currentPos = await getCurrentPositionForPreload();
      const overpassCategories = ['Attractions', 'Accommodation', 'Food & Beverages', 'Transportation', 'Shoppings & Leisures', 'Tour Guides'];
      
      // Load Overpass in batches of 3 (instead of 2) for faster loading
      const overpassBatchSize = 3;
      const totalOverpassBatches = Math.ceil(overpassCategories.length / overpassBatchSize);
      
      for (let i = 0; i < overpassCategories.length; i += overpassBatchSize) {
        const batch = overpassCategories.slice(i, i + overpassBatchSize);
        const overpassPromises = batch.map(category => 
          loadOverpassCategory(category, currentPos)
        );
        
        await Promise.allSettled(overpassPromises);
        const progressIncrement = 1 / totalOverpassBatches;
        updateProgress(`Map data ${Math.min(i + overpassBatchSize, overpassCategories.length)}/${overpassCategories.length}`, progressIncrement);
      }

      // BATCH 4: Background data validation and cache optimization
      setPreloadMessage('Optimizing data cache...');
      
      // Validate we have all essential data
      const essentialKeys = [
        'major_towns', 'backend_locations', 'events',
        'businesses_Attractions', 'businesses_Accommodation', 
        'businesses_Food & Beverages', 'businesses_Transportation',
        'businesses_Shoppings & Leisures', 'businesses_Tour Guides'
      ];
      
      const missingKeys = essentialKeys.filter(key => !globalCache.has(key));
      if (missingKeys.length > 0) {
        console.log('⚠️ Missing cache keys:', missingKeys);
        // Could trigger re-fetch for missing data here if needed
      }
      
      updateProgress('Cache optimized', 1);

      // Final completion
      updateProgress('Finalizing...', 1);
      localStorage.setItem('mapview_last_preload_v2', now.toString());
      setPreloadProgress(100);
      setPreloadMessage('All 500-item data loaded!');

      console.log('🎉 ENHANCED PARALLEL pre-load complete with 500 items per category');

      // Start background refresh after preload completes
      setTimeout(() => {
        startBackgroundRefresh();
      }, 2000); // Reduced from 3000 to 2000

    } catch (error) {
      console.error('❌ Enhanced parallel pre-load error:', error);
      setPreloadMessage('Ready with available data');
      setPreloadProgress(100);
    } finally {
      setTimeout(() => {
        setIsPreloading(false);
      }, 800);
    }
  };

  const loadOverpassCategory = async (category, currentPos) => {
    try {
      const rules = menuToOverpassMap[category.toLowerCase()];
      if (rules) {
        const ql = buildOverpassQL(rules, currentPos, 10000);
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
            type: category,
            source: 'overpass'
          };
        }).filter(Boolean).slice(0, 500);

        const key = `overpass_${category}_${currentPos.lat.toFixed(4)}_${currentPos.lng.toFixed(4)}_10000`;
        globalCache.set(key, elements);
        console.log(`✅ Loaded ${elements.length} ${category} Overpass points`);
      }
    } catch (error) {
      console.error(`Overpass load failed for ${category}:`, error);
    }
  };

  return { 
    preloadProgress, 
    isPreloading, 
    preloadMessage, 
    preloadEssentialData,
    isInstantExperience 
  };
};

// KEEP ALL EXISTING CONFIGURATION
const menuToOverpassMap = {
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
};

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

// Keep existing buildOverpassQL for nearby locations
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
    [out:json][timeout:15];
    (
      ${blocks}
    );
    out center 300;
  `;
};

const fetchOverpassWithFallback = async (ql) => {
  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
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
};

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

// Enhanced MapViewMenu component with only nearby mode
const MapViewMenu = React.memo(({ onSelect, activeOption, onSelectCategory, onZoomToPlace, isRoutingActive = false, onClearRouting, isSearchActive = false }) => {
  // Cache references - using global cache for everything including Overpass
  const lastFetchRef = useRef({});
  const dataCacheRef = useRef(globalCache);
  const refreshIntervalRef = useRef(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  const [selectedMenu, setSelectedMenu] = useState(activeOption || 'Major Town');
  const [locationsData, setLocationsData] = useState([]);
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  const [isMobileMenu, setIsMobileMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [temporarySelection, setTemporarySelection] = useState(null);

  const currentPos = useCurrentPosition();
  const { user } = useAuth();

  // Use the PARALLEL preload hook
  const { preloadProgress, isPreloading, preloadMessage, preloadEssentialData, isInstantExperience } = useParallelPreload();

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

  // Use the external Overpass configuration
  const menuToOverpass = useCallback((menuCategory) => {
    return menuToOverpassMap[(menuCategory || '').toLowerCase()] || null;
  }, []);

  // Enhanced instant data loaders with fallbacks - INCLUDING OVERPASS DATA
  const getInstantMajorTowns = useCallback(() => {
    const cached = dataCacheRef.current.get('major_towns');
    if (!cached) return [];
    
    console.log('⚡ Loading Major Towns from cache');
    return cached
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
  }, []);

  const getInstantBackendData = useCallback((categoryName) => {
    const cached = dataCacheRef.current.get('backend_locations');
    if (!cached) return [];
    
    console.log(`⚡ Loading ${categoryName} from backend cache`);
    return cached.filter(item => {
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
    })).slice(0, 500);
  }, []);

  const getInstantBusinessesData = useCallback((categoryName) => {
    const apiCategory = menuToBusinessCategory(categoryName);
    if (!apiCategory) return [];
    
    const cached = dataCacheRef.current.get(`businesses_${apiCategory}`);
    if (!cached) return [];
    
    console.log(`⚡ Loading ${categoryName} businesses from cache`);
    return cached
      .filter(b => b && b.latitude != null && b.longitude != null)
      .slice(0, 500)
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
        type: categoryName,
        source: 'businesses',
        website: b.website || '',
        openingHours: b.openingHours || '',
        phone: b.phone || '',
        owner: b.owner || '',
        ownerEmail: b.ownerEmail || '',
        address: b.address || '',
        category: b.category || '',
      }));
  }, [menuToBusinessCategory]);

  const getInstantEventsData = useCallback(() => {
    const cached = dataCacheRef.current.get('events');
    if (!cached) return [];
    
    console.log('⚡ Loading Events from cache');
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return cached
      .filter(item => {
        const eventEndDate = item.endDate ? new Date(item.endDate) : null;
        if (!eventEndDate) return false;
        eventEndDate.setHours(0, 0, 0, 0);
        return eventEndDate >= currentDate;
      })
      .filter(item => {
        const userType = user?.userType || 'tourist';
        const userRole = user?.role;
        const eventAudiences = item.targetAudience || [];
        
        if (userRole === 'system_admin' || userRole === 'cbt_admin' || userRole === 'business') {
          return true;
        } else {
          return eventAudiences.includes('Tourist');
        }
      })
      .filter(item => item?.coordinates?.latitude != null && item?.coordinates?.longitude != null)
      .slice(0, 500)
      .map(item => ({
        _id: item._id, // add event id for DB fetch on navigation
        name: item.name,
        latitude: Number(item.coordinates.latitude),
        longitude: Number(item.coordinates.longitude),
        image: item.imageUrl || defaultImage,
        imageUrl: item.imageUrl, // ensure imageUrl is carried through
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
  }, [user]);

  // Get instant Overpass data from cache
  const getInstantOverpassData = useCallback((categoryName) => {
    if (!currentPos) {
      // Try default center if no current position
      const defaultKey = `overpass_${categoryName}_${DEFAULT_CENTER.lat.toFixed(4)}_${DEFAULT_CENTER.lng.toFixed(4)}_10000`;
      const defaultCached = dataCacheRef.current.get(defaultKey);
      return defaultCached || [];
    }
    
    // First try exact match with current position
    const exactKey = `overpass_${categoryName}_${currentPos.lat.toFixed(4)}_${currentPos.lng.toFixed(4)}_10000`;
    const exactCached = dataCacheRef.current.get(exactKey);
    
    if (exactCached) {
      console.log(`⚡ Loading exact nearby ${categoryName} Overpass data from cache: ${exactCached.length} items`);
      return exactCached;
    }
    
    // If no exact match, search for any cached Overpass data for this category
    console.log(`🔍 Searching for any cached Overpass data for ${categoryName}...`);
    const allKeys = dataCacheRef.current.getAllKeys();
    const overpassKeys = allKeys.filter(key => 
      key.startsWith(`overpass_${categoryName}_`) && dataCacheRef.current.get(key)
    );
    
    if (overpassKeys.length > 0) {
      // Use the most recent cached data for this category
      const mostRecentKey = overpassKeys.reduce((mostRecent, key) => {
        const currentItem = dataCacheRef.current.getWithMetadata(key);
        const mostRecentItem = dataCacheRef.current.getWithMetadata(mostRecent);
        
        if (!currentItem || !mostRecentItem) return mostRecent;
        
        return currentItem.timestamp > mostRecentItem.timestamp ? key : mostRecent;
      }, overpassKeys[0]);
      
      const cachedData = dataCacheRef.current.get(mostRecentKey);
      console.log(`⚡ Loading cached ${categoryName} Overpass data from ${mostRecentKey}: ${cachedData.length} items`);
      return cachedData;
    }
    
    // Try default center as final fallback
    const defaultKey = `overpass_${categoryName}_${DEFAULT_CENTER.lat.toFixed(4)}_${DEFAULT_CENTER.lng.toFixed(4)}_10000`;
    return dataCacheRef.current.get(defaultKey) || [];
  }, [currentPos]);

  // Background data fetchers with 401 error handling AND OVERPASS CACHING
  const fetchMajorTowns = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('/api/locations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('🔐 401 Unauthorized - User not logged in, using cached data');
          return getInstantMajorTowns();
        }
        return [];
      }
      const data = await res.json();

      // Cache the data for instant loading next time
      dataCacheRef.current.set('major_towns', data);
      dataCacheRef.current.set('backend_locations', data);
      
      return data
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
    } catch (error) {
      console.error('Major Towns fetch error:', error);
      return getInstantMajorTowns(); // Fallback to cached data
    }
  }, [getInstantMajorTowns]);

  const fetchApprovedBusinesses = useCallback(async (menuCategoryName) => {
    try {
      const apiCategory = menuToBusinessCategory(menuCategoryName);
      if (!apiCategory) return [];
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(`/api/businesses/approved?category=${encodeURIComponent(apiCategory)}&limit=500`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('🔐 401 Unauthorized - User not logged in, using cached data');
          return getInstantBusinessesData(menuCategoryName);
        }
        return [];
      }
      const json = await res.json();
      const list = (json.data || []).filter(Boolean);

      // Cache the data for instant loading next time
      dataCacheRef.current.set(`businesses_${apiCategory}`, list);

      return list
        .filter(b => b && b.latitude != null && b.longitude != null)
        .slice(0, 500)
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
    } catch (e) {
      console.error('Approved businesses fetch error:', e);
      return getInstantBusinessesData(menuCategoryName); // Fallback to cached data
    }
  }, [menuToBusinessCategory, getInstantBusinessesData]);

  const fetchBackendEvents = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('/api/event/getAllEvents', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('🔐 401 Unauthorized - User not logged in, using cached data');
          return getInstantEventsData();
        }
        return [];
      }
      const json = await res.json();
      const list = (json.events || []).filter(Boolean);

      // Cache the data for instant loading next time
      dataCacheRef.current.set('events', list);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      return list
        .filter(item => {
          const eventEndDate = item.endDate ? new Date(item.endDate) : null;
          if (!eventEndDate) return false;
          eventEndDate.setHours(0, 0, 0, 0);
          return eventEndDate >= currentDate;
        })
        .filter(item => {
          const userType = user?.userType || 'tourist';
          const userRole = user?.role;
          const eventAudiences = item.targetAudience || [];
          
          if (userRole === 'system_admin' || userRole === 'cbt_admin' || userRole === 'business') {
            return true;
          } else {
            return eventAudiences.includes('Tourist');
          }
        })
        .filter(item => item?.coordinates?.latitude != null && item?.coordinates?.longitude != null)
        .slice(0, 500)
        .map(item => ({
          _id: item._id,
          name: item.name,
          latitude: Number(item.coordinates.latitude),
          longitude: Number(item.coordinates.longitude),
          image: item.imageUrl || defaultImage,
          imageUrl: item.imageUrl,
          description: item.description || 'Event',
          type: 'Events',
          source: 'events',
          startDate: item.startDate,
          endDate: item.endDate,
          startTime: item.startTime,
          endTime: item.endTime,
          // Add dailySchedule from backend
          dailySchedule: Array.isArray(item.dailySchedule) ? item.dailySchedule : [],
          eventType: item.eventType,
          registrationRequired: item.registrationRequired,
          targetAudience: item.targetAudience || [],
          eventOrganizers: item.eventOrganizers || '',
          eventHashtags: item.eventHashtags || []
        }));
    } catch (e) {
      console.error('Events fetch error:', e);
      return getInstantEventsData(); // Fallback to cached data
    }
  }, [user, getInstantEventsData]);

  const fetchBackendData = useCallback(async (categoryName) => {
    // Skip for Major Town since we have a dedicated function for it
    if (categoryName.toLowerCase() === 'major town') {
      return [];
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('/api/locations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 401 Unauthorized - User not logged in, using cached data');
          return getInstantBackendData(categoryName);
        }
        return [];
      }
      const data = await response.json();

      // Cache the data for instant loading next time
      dataCacheRef.current.set('backend_locations', data);

      return data.filter(item => {
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
      })).slice(0, 500);
    } catch (error) {
      console.error('Backend fetch error:', error);
      return getInstantBackendData(categoryName); // Fallback to cached data
    }
  }, [getInstantBackendData]);

  // Overpass data fetching WITH PROPER CACHING
  const fetchOverpassPlaces = useCallback(async (categoryName, center, radiusMeters = 10000) => {
    const rules = menuToOverpass(categoryName);
    if (!rules) return [];

    const now = Date.now();
    const key = `overpass_${categoryName}_${center.lat.toFixed(4)}_${center.lng.toFixed(4)}_${radiusMeters}`;
    
    // Check cache first - using global persistent cache
    const cached = dataCacheRef.current.get(key);
    if (cached) {
      console.log(`✅ Using cached Overpass data for ${categoryName}: ${cached.length} items`);
      return cached;
    }

    console.log(`📍 Fetching fresh Overpass data for ${categoryName}...`);
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
      }).filter(Boolean).slice(0, 500);

      // CACHE THE OVERPASS DATA for instant loading next time
      dataCacheRef.current.set(key, elements);
      console.log(`💾 Cached Overpass data for ${categoryName}: ${elements.length} items`);

      return elements;
    } catch (e) {
      console.error('Overpass error:', e);
      return [];
    }
  }, [menuToOverpass]);

  // COMPLETE DATA FETCHER - Fetches fresh data and updates cache
  const fetchPlacesByCategoryComplete = useCallback(async (categoryName, radiusMeters = RADIUS_KM * 1000) => {
    setLoadingStates(prev => ({ ...prev, [categoryName]: true }));

    try {
      let completeData = [];

      // Special case: Major Town
      if ((categoryName || '').toLowerCase() === 'major town') {
        completeData = await fetchMajorTowns();
      }
      // Special case: Events
      else if ((categoryName || '').toLowerCase() === 'events') {
        completeData = await fetchBackendEvents();
      }
      // Other categories - ONLY NEARBY MODE
      else {
        const apiCategory = menuToBusinessCategory(categoryName);
        
        // Always use nearby data
        let overpassResults = [];
        if (currentPos) {
          overpassResults = await fetchOverpassPlaces(categoryName, currentPos, radiusMeters);
        }

        const [backendResults, businessResults] = await Promise.all([
          fetchBackendData(categoryName),
          fetchApprovedBusinesses(categoryName),
        ]);

        completeData = [...backendResults, ...businessResults, ...overpassResults]
          .reduce((acc, cur) => {
            if (!cur) return acc;
            const key = `${cur.name}|${Math.round(Number(cur.latitude) * 1e5)}|${Math.round(Number(cur.longitude) * 1e5)}`;
            if (!acc.find(i => `${i.name}|${Math.round(Number(i.latitude) * 1e5)}|${Math.round(Number(i.longitude) * 1e5)}` === key)) {
              acc.push(cur);
            }
            return acc;
          }, [])
          .slice(0, 500);
      }

      console.log(`✅ COMPLETE loaded ${completeData.length} ${categoryName} items`);
      return completeData;
    } catch (error) {
      console.error('Complete fetch error:', error);
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, [categoryName]: false }));
    }
  }, [
    currentPos,
    fetchOverpassPlaces,
    fetchMajorTowns,
    fetchBackendEvents,
    fetchBackendData,
    fetchApprovedBusinesses,
    menuToBusinessCategory,
    menuToOverpass
  ]);

  // ULTRA FAST INSTANT LOADER - Always tries cache first INCLUDING OVERPASS
  const fetchPlacesByCategoryInstant = useCallback(async (categoryName) => {
    console.log(`⚡ INSTANT loading attempt: ${categoryName}`);
    
    let instantData = [];

    // Special case: Major Town
    if ((categoryName || '').toLowerCase() === 'major town') {
      instantData = getInstantMajorTowns();
    }
    // Special case: Events
    else if ((categoryName || '').toLowerCase() === 'events') {
      instantData = getInstantEventsData();
    }
    // Other categories - INCLUDE OVERPASS DATA
    else {
      const backendResults = getInstantBackendData(categoryName);
      const businessResults = getInstantBusinessesData(categoryName);
      const overpassResults = getInstantOverpassData(categoryName);

      console.log(`📊 Cache results for ${categoryName}:`, {
        backend: backendResults.length,
        business: businessResults.length,
        overpass: overpassResults.length,
        total: backendResults.length + businessResults.length + overpassResults.length
      });

      instantData = [...backendResults, ...businessResults, ...overpassResults];
      
      // Remove duplicates based on name and coordinates
      const seen = new Set();
      instantData = instantData.filter(item => {
        if (!item) return false;
        const key = `${item.name}|${item.latitude}|${item.longitude}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 500);
    }

    // Return instant data immediately if available
    if (instantData.length > 0) {
      console.log(`✅ INSTANT SUCCESS: Loaded ${instantData.length} ${categoryName} items from cache`);
      return instantData;
    }

    console.log(`❌ INSTANT FAILED: No cached data for ${categoryName}`);
    return null; // No cached data available
  }, [
    getInstantMajorTowns,
    getInstantBackendData,
    getInstantBusinessesData,
    getInstantEventsData,
    getInstantOverpassData
  ]);

  // Enhanced menu item click handler with ULTRA FAST instant loading INCLUDING OVERPASS
  const handleMenuItemClick = useCallback(async (item) => {
    console.log(`🎯 Clicked: ${item.name}`);
    
    // Clear routing if needed
    if (isRoutingActive && activeOption === null && onClearRouting) {
      onClearRouting();
    }

    // Update UI state IMMEDIATELY
    if (isRoutingActive && activeOption === null) {
      setTemporarySelection(item.name);
    } else {
      setSelectedMenu(item.name);
    }

    if (isMobileMenu) {
      setSelectedMobileMenuItem(item);
      setIsDropdownOpen(false);
    }

    setLocationsData([]);

    if (item.isFetchOnly) {
      // STEP 1: Try to load INSTANTLY from cache (ULTRA FAST) - INCLUDING OVERPASS
      const instantData = await fetchPlacesByCategoryInstant(item.name);
      
      if (instantData && instantData.length > 0) {
        // SUCCESS: Show cached data immediately (backend + businesses + overpass)
        setLocationsData(instantData);
        if (onSelect) onSelect(item.name, instantData);
        if (onSelectCategory) onSelectCategory(item.name, instantData);
        
        // Auto-pan to user's location (NEARBY MODE)
        if (instantData.length > 0 && window.mapRef && currentPos) {
          window.mapRef.panTo({ lat: currentPos.lat, lng: currentPos.lng });
          window.mapRef.setZoom(item.name === 'Major Town' ? 10 : 14);
        }
        
        console.log(`⚡ INSTANT SUCCESS: Displayed ${instantData.length} ${item.name} items`);
      } else {
        // FAILED: No cached data, show loading and fetch fresh data
        console.log(`⏳ No cached data for ${item.name}, fetching complete data...`);
        const completeData = await fetchPlacesByCategoryComplete(item.name);
        
        setLocationsData(completeData);
        if (onSelect) onSelect(item.name, completeData);
        if (onSelectCategory) onSelectCategory(item.name, completeData);
      }
      
      // Always refresh data in background for next time (including Overpass)
      setTimeout(() => {
        fetchPlacesByCategoryComplete(item.name).then(freshData => {
          if (freshData.length > 0) {
            console.log(`🔄 Background refresh completed for ${item.name}`);
          }
        });
      }, 1000);
      
      // Zoom to user's location (NEARBY MODE)
      if (currentPos && typeof onZoomToPlace === 'function') {
        onZoomToPlace({ latitude: currentPos.lat, longitude: currentPos.lng, category: item.name });
      }
    } else {
      if (onSelect) onSelect(item.name);
      if (onSelectCategory) onSelectCategory(item.name);
    }
    
    setIsFirstLoad(false);
  }, [
    isRoutingActive,
    activeOption,
    onClearRouting,
    isMobileMenu,
    fetchPlacesByCategoryInstant,
    fetchPlacesByCategoryComplete,
    currentPos,
    onZoomToPlace,
    onSelect,
    onSelectCategory
  ]);

  // Optimized loading overlay with better UX
  const renderLoadingOverlay = () => {
    if (!isPreloading) return null;

    return (
      <div className="pre-fetch-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div className="pre-fetch-popup" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          textAlign: 'center',
          minWidth: '280px',
          maxWidth: '90vw',
          animation: 'slideUp 0.4s ease'
        }}>
          <div className="pre-fetch-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h3 style={{ marginBottom: '0.5rem', color: '#333', fontSize: '1.1rem' }}>
            {isInstantExperience ? 'Ready!' : 'Loading Sarawak Map'}
          </h3>
          <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#3498db', marginBottom: '0.5rem' }}>
            {preloadProgress}% Complete
          </p>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
            {preloadMessage}
          </p>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#f0f0f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${preloadProgress}%`,
              height: '100%',
              backgroundColor: '#3498db',
              transition: 'width 0.2s ease',
              animation: preloadProgress === 100 ? 'pulse 1s infinite' : 'none'
            }}></div>
          </div>
          {preloadProgress >= 70 && preloadProgress < 100 && (
            <p style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: '0.8rem' }}>
              ✨ Almost ready - you can start exploring
            </p>
          )}
          {isInstantExperience && (
            <p style={{ fontSize: '0.75rem', color: '#27ae60', marginTop: '0.8rem' }}>
              ⚡ Using cached data for instant experience
            </p>
          )}
        </div>
        
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  // Check if we have cached data on component mount
  useEffect(() => {
    const hasCachedData = globalCache.isFullyPopulated();
    setHasPreloaded(hasCachedData);
    
    if (hasCachedData) {
      console.log('⚡ Using cached data for instant experience');
      // Start background refresh immediately if we have cached data
      setTimeout(() => {
        refreshIntervalRef.current = startBackgroundRefresh();
      }, 3000);
    }
  }, []);

  // Add this to your component's useEffect for faster user interaction:
  useEffect(() => {
    // Start preloading immediately
    const timer = setTimeout(preloadEssentialData, 100);
    
    // Even faster Major Town loading for 500 data
    const loadTimer = setTimeout(() => {
      if (isFirstLoad && !activeOption) {
        console.log('🚀 ULTRA-FAST start - loading Major Town with 500 data');
        const majorTownItem = menuItems.find(item => item.name === 'Major Town');
        if (majorTownItem) {
          handleMenuItemClick(majorTownItem);
        }
        setIsFirstLoad(false);
      }
    }, 500); // Reduced from 800ms to 500ms for faster startup
    
    return () => {
      clearTimeout(timer);
      clearTimeout(loadTimer);
    };
  }, []);

  // Auto-load Major Town on first render if we have cached data
  useEffect(() => {
    if (hasPreloaded && isFirstLoad && !activeOption) {
      console.log('🚀 First load with cached data - auto-loading Major Town');
      const majorTownItem = menuItems.find(item => item.name === 'Major Town');
      if (majorTownItem) {
        handleMenuItemClick(majorTownItem);
      }
      setIsFirstLoad(false);
    }
  }, [hasPreloaded, isFirstLoad, activeOption, handleMenuItemClick]);

  // Check if we have pre-loaded data on component mount
  useEffect(() => {
    const checkPreloadStatus = () => {
      const hasData = 
        dataCacheRef.current.get('major_towns') ||
        dataCacheRef.current.get('backend_locations') ||
        dataCacheRef.current.get('events');
      
      setHasPreloaded(!!hasData);
      console.log('📊 Pre-load status:', hasData ? 'HAS CACHED DATA' : 'NO CACHED DATA');
    };

    checkPreloadStatus();
  }, []);

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

  const handleDropdownToggle = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // Effect for active option changes
  useEffect(() => {
    if (activeOption === null && (isRoutingActive || isSearchActive)) {
      setSelectedMenu('');
      setSelectedMobileMenuItem({ name: 'Select Category', icon: <FaLocationDot /> });
    } else if (!activeOption && isFirstLoad && !hasPreloaded) {
      const defaultItem = menuItems.find(item => item.name === 'Major Town');
      if (defaultItem) handleMenuItemClick(defaultItem);
    } else {
      setSelectedMenu(activeOption);
      setSelectedMobileMenuItem(menuItems.find(item => item.name === activeOption) || menuItems[0]);
    }
  }, [activeOption, isRoutingActive, isSearchActive, handleMenuItemClick, isFirstLoad, hasPreloaded]);

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
    <>
      {renderLoadingOverlay()}
      
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
    </>
  );
});

export default MapViewMenu;