import React, { useState, useEffect } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft, FiRefreshCw } from 'react-icons/fi';
import ReactPlayer from 'react-player';

// Advanced Cache configuration
const CACHE_CONFIG = {
  EXPIRY_HOURS: 24, // Cache for 24 hours
  MAX_CACHE_SIZE: 30, // Increased limit for tourist locations
  CACHE_KEY: 'youtube_reels_cache_v2', // New version key
  PRIORITY_CATEGORIES: ['national_park', 'cave', 'museum', 'cultural_site', 'beach', 'mountain'],
  LOW_PRIORITY_CATEGORIES: ['restaurant', 'shopping', 'hotel', 'cafe']
};

// Cache Debug Panel Component
const CacheDebugPanel = () => {
  const [cacheStatus, setCacheStatus] = useState({});
  
  useEffect(() => {
    const checkCache = () => {
      try {
        const cache = JSON.parse(localStorage.getItem(CACHE_CONFIG.CACHE_KEY) || '{}');
        const cacheSize = new Blob([JSON.stringify(cache)]).size;
        
        setCacheStatus({
          totalLocations: Object.keys(cache).length,
          locations: Object.keys(cache),
          totalSize: cacheSize,
          sizeKB: (cacheSize / 1024).toFixed(1),
          usagePercent: ((cacheSize / (5 * 1024 * 1024)) * 100).toFixed(1) // 5MB limit
        });
      } catch (error) {
        // console.error('Cache debug error:', error);
      }
    };
    
    checkCache();
    const interval = setInterval(checkCache, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)', // This centers it perfectly
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      fontSize: '14px',
      zIndex: 10000,
      maxWidth: '400px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      fontFamily: 'monospace',
      border: '2px solid #00ff00',
      boxShadow: '0 0 20px rgba(0,255,0,0.3)'
    }}>
      <strong>🔄 Advanced Cache Monitor</strong>
      <div>📍 Locations: {cacheStatus.totalLocations || 0}/{CACHE_CONFIG.MAX_CACHE_SIZE}</div>
      <div>💾 Size: {cacheStatus.sizeKB || 0}KB ({cacheStatus.usagePercent || 0}%)</div>
      <div style={{maxHeight: '100px', overflowY: 'auto', marginTop: '5px', borderTop: '1px solid #555', paddingTop: '5px'}}>
        {cacheStatus.locations?.map(loc => <div key={loc} style={{padding: '2px 0'}}>📍 {loc}</div>)}
      </div>
    </div>
  );
};

function TouristInfoSection({ selectedLocation }) {
  const [reels, setReels] = useState([]);
  const [containerStyle, setContainerStyle] = useState({ top: '60px' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Toggle debug panel
  const [isCollapsed, setIsCollapsed] = useState(() => window.innerWidth <= 660);
  const [hasUserToggled, setHasUserToggled] = useState(false);

  // Enhanced Cache management functions
  const getCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_CONFIG.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      // console.warn('Failed to read cache from localStorage:', error);
      return {};
    }
  };

  const setCache = (cacheData) => {
    try {
      // Check size before saving
      const cacheSize = new Blob([JSON.stringify(cacheData)]).size;
      if (cacheSize > 4.5 * 1024 * 1024) { // 4.5MB warning
        // console.warn('Cache approaching limit, cleaning up...');
        cacheData = cleanupCache(cacheData);
      }
      
      localStorage.setItem(CACHE_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
      // console.log('💾 Cache saved successfully');
    } catch (error) {
      // console.warn('Failed to write cache:', error);
      if (error.name === 'QuotaExceededError') {
        const cleanedCache = cleanupCache(cacheData);
        localStorage.setItem(CACHE_CONFIG.CACHE_KEY, JSON.stringify(cleanedCache));
      }
    }
  };

  // Smart cache cleanup based on priority and usage
  const cleanupCache = (cache) => {
    const entries = Object.entries(cache);
    
    if (entries.length <= CACHE_CONFIG.MAX_CACHE_SIZE) {
      return cache; // No cleanup needed
    }

    // console.log('🧹 Cleaning up cache...');

    // Sort by priority: low priority → least viewed → oldest
    entries.sort((a, b) => {
      const aPriority = getLocationPriority(a[1].category);
      const bPriority = getLocationPriority(b[1].category);
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      const aViews = a[1].viewCount || 0;
      const bViews = b[1].viewCount || 0;
      if (aViews !== bViews) return aViews - bViews;
      
      return a[1].timestamp - b[1].timestamp;
    });

    // Keep only the top MAX_CACHE_SIZE entries
    const keptEntries = entries.slice(-CACHE_CONFIG.MAX_CACHE_SIZE);
    const removedEntries = entries.slice(0, entries.length - CACHE_CONFIG.MAX_CACHE_SIZE);
    
    // console.log('🗑️ Removed:', removedEntries.map(([key]) => key));
    // console.log('💾 Kept:', keptEntries.map(([key]) => key));
    
    return Object.fromEntries(keptEntries);
  };

  const getLocationPriority = (category) => {
    if (CACHE_CONFIG.PRIORITY_CATEGORIES.includes(category)) return 3;
    if (CACHE_CONFIG.LOW_PRIORITY_CATEGORIES.includes(category)) return 1;
    return 2; // Default priority
  };

  const shouldCacheLocation = (category) => {
    // Cache all locations for now, but prioritize cleanup
    return true;
  };

  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    
    const expiryTime = CACHE_CONFIG.EXPIRY_HOURS * 60 * 60 * 1000;
    return Date.now() - cachedData.timestamp < expiryTime;
  };

  const getCachedReels = (locationName) => {
    const cache = getCache();
    const cached = cache[locationName];
    
    if (cached && isCacheValid(cached)) {
      // Update view count when accessed
      cached.viewCount = (cached.viewCount || 0) + 1;
      cache[locationName] = cached;
      setCache(cache);
      
      return {
        reels: cached.data,
        timestamp: cached.timestamp,
        isFromCache: true
      };
    }
    return null;
  };

  const setCachedReels = (locationName, reelsData, category = 'unknown') => {
    if (!shouldCacheLocation(category)) {
      // console.log('🚫 Skipping cache for category:', category);
      return;
    }

    const cache = getCache();
    
    cache[locationName] = {
      data: reelsData,
      timestamp: Date.now(),
      category: category,
      viewCount: 1
    };
    
    // console.log('✅ Caching:', locationName, 'with', reelsData.length, 'videos');
    setCache(cache);
  };

  const refreshData = async () => {
    if (!selectedLocation) return;
    
    setIsRefreshing(true);
    await fetchReelsData(true);
    setIsRefreshing(false);
  };

  const fetchReelsData = async (forceRefresh = false) => {
    if (!selectedLocation) return;

    const locationName = selectedLocation.name;
    const category = selectedLocation.category || 'unknown';
    
    // console.log('🔍 Fetching for:', locationName, 'Category:', category);
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedReels(locationName);
      if (cached) {
        // console.log('⚡ Loading from cache:', locationName);
        setReels(cached.reels);
        setLastUpdated(cached.timestamp);
        setShowScrollIndicator(true);
        setTimeout(() => setShowScrollIndicator(false), 3000);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      const apiKey = 'AIzaSyAl79EwWjJZ9w1IFFZlT7RvzORHoA7szYY';
      const searchQuery = `${selectedLocation.name} sarawak tourism shorts`;
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=10&q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

      // console.log('🌐 API Call:', locationName);
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Unknown YouTube API error';
        
        // Fallback to cache if available
        const cached = getCachedReels(locationName);
        if (cached) {
          setReels(cached.reels);
          setLastUpdated(cached.timestamp);
          setError(`API Error: ${errorMessage}. Showing cached data.`);
        } else {
          throw new Error(`YouTube API: ${errorMessage} (status ${response.status})`);
        }
        return;
      }

      if (!data.items) {
        throw new Error('No videos found for this location');
      }

      const videos = data.items.map(item => ({
        id: item.id.videoId,
        videoUrl: `https://youtu.be/${item.id.videoId}`,
        caption: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url,
        channel: item.snippet.channelTitle
      }));

      setReels(videos);
      setLastUpdated(Date.now());
      
      // Cache the new data
      setCachedReels(locationName, videos, category);
      
      setShowScrollIndicator(true);
      setTimeout(() => setShowScrollIndicator(false), 3000);
      
    } catch (error) {
      // console.error('Fetch error:', error);
      
      // Final fallback to cache
      const cached = getCachedReels(locationName);
      if (cached) {
        setReels(cached.reels);
        setLastUpdated(cached.timestamp);
        setError(`Error: ${error.message}. Showing cached data.`);
      } else {
        setError(error.message);
        setReels([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReelsData();
  }, [selectedLocation]);

  useEffect(() => {
    const navbar = document.querySelector('.navbar');
    const updatePosition = () => {
      if (navbar) setContainerStyle({ top: `${navbar.offsetHeight}px` });
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  useEffect(() => {
    const handleResponsiveCollapse = () => {
      const isMobile = window.innerWidth <= 660;
      // Only auto-adjust if user hasn’t manually toggled
      if (!hasUserToggled) {
        setIsCollapsed(isMobile);
      }
    };

    handleResponsiveCollapse();
    window.addEventListener('resize', handleResponsiveCollapse);
    return () => window.removeEventListener('resize', handleResponsiveCollapse);
  }, [hasUserToggled]);
  const toggleDebug = () => setShowDebug(!showDebug);

  const toggleCollapse = () => {
    setHasUserToggled(true);
    setIsCollapsed((prev) => !prev);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // One-click cache test function
  const runCacheTest = () => {
    const cache = getCache();
    const testResults = {
      'Cache System': 'Advanced Cache v2',
      'Cache Key': CACHE_CONFIG.CACHE_KEY,
      'Locations Cached': Object.keys(cache).length,
      'Max Capacity': CACHE_CONFIG.MAX_CACHE_SIZE,
      'Current Location Cached': cache[selectedLocation?.name] ? '✅' : '❌',
      'Cache Size': `${(new Blob([JSON.stringify(cache)]).size/1024).toFixed(1)}KB`,
      'Storage Used': `${((new Blob([JSON.stringify(cache)]).size/(5*1024*1024))*100).toFixed(1)}%`
    };
    
    // console.log('🧪 CACHE TEST RESULTS:');
    // console.table(testResults);
    
    alert(`Cache Test:\nLocations: ${Object.keys(cache).length}/${CACHE_CONFIG.MAX_CACHE_SIZE}\nSize: ${(new Blob([JSON.stringify(cache)]).size/1024).toFixed(1)}KB\nCurrent: ${cache[selectedLocation?.name] ? 'CACHED ✅' : 'NOT CACHED ❌'}`);
  };

  return (
    <div className={`tourist-info-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      {showDebug && <CacheDebugPanel />}
      
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>

      <div 
        className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
        style={{ ...containerStyle, zIndex: 20000 }}
      >
        

        {!isCollapsed && reels.length > 0 && showScrollIndicator && (
          <div className="scroll-down-indicator">
            <span></span>
            <p>Scroll down</p>
          </div>
        )}

        <div className="reels-content">
          {loading && <p className="loading">Loading videos...</p>}
          {error && (
            // <p className={`error ${error.includes('cached data') ? 'warning' : ''}`}>
            //   {error}
            // </p>
            <div className="error-message">
              <p>Oops something went wrong</p>
            </div>
          )}
          
          {!loading && !error && (
            <>
              {reels.length > 0 ? (
                reels.map((reel) => (
                  <div key={reel.id} className="reel-item">
                    <div className="video-container">
                      <ReactPlayer
                        url={reel.videoUrl}
                        controls
                        playing={false}
                        className="react-player"
                        width="100%"
                        height="100%"
                        config={{
                          youtube: {
                            playerVars: { 
                              modestbranding: 1,
                              rel: 0,
                              playsinline: 1
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="reel-info">
                      <p className="caption">{reel.caption}</p>
                      {reel.channel && <p className="channel">By {reel.channel}</p>}
                    </div>
                  </div>
                ))
              ) : (
                !loading && <p className="no-reels">No videos found for this location</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristInfoSection;