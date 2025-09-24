import React, { useState, useEffect } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft, FiRefreshCw } from 'react-icons/fi';
import ReactPlayer from 'react-player';

// Cache configuration
const CACHE_CONFIG = {
  EXPIRY_HOURS: 24, // Cache for 24 hours
  MAX_CACHE_SIZE: 5, // Maximum number of locations to cache
  CACHE_KEY: 'youtube_reels_cache'
};

const TouristInfoSection = ({ selectedLocation }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [reels, setReels] = useState([]);
  const [containerStyle, setContainerStyle] = useState({ top: '60px' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache management functions
  const getCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_CONFIG.CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.warn('Failed to read cache from localStorage:', error);
      return {};
    }
  };

  const setCache = (cacheData) => {
    try {
      localStorage.setItem(CACHE_CONFIG.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to write cache to localStorage:', error);
      // Clear old cache if storage is full
      if (error.name === 'QuotaExceededError') {
        clearOldCacheEntries(cacheData);
      }
    }
  };

  const clearOldCacheEntries = (currentCache) => {
    // Sort entries by timestamp and keep only the newest ones
    const entries = Object.entries(currentCache);
    if (entries.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const trimmedCache = Object.fromEntries(
        entries.slice(0, CACHE_CONFIG.MAX_CACHE_SIZE)
      );
      setCache(trimmedCache);
    }
  };

  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    
    const expiryTime = CACHE_CONFIG.EXPIRY_HOURS * 60 * 60 * 1000; // Convert to milliseconds
    return Date.now() - cachedData.timestamp < expiryTime;
  };

  const getCachedReels = (locationName) => {
    const cache = getCache();
    const cached = cache[locationName];
    
    if (cached && isCacheValid(cached)) {
      return {
        reels: cached.data,
        timestamp: cached.timestamp,
        isFromCache: true
      };
    }
    return null;
  };

  const setCachedReels = (locationName, reelsData) => {
    const cache = getCache();
    cache[locationName] = {
      data: reelsData,
      timestamp: Date.now()
    };
    setCache(cache);
  };

  const refreshData = async () => {
    if (!selectedLocation) return;
    
    setIsRefreshing(true);
    await fetchReelsData(true); // Force refresh
    setIsRefreshing(false);
  };

  const fetchReelsData = async (forceRefresh = false) => {
    if (!selectedLocation) return;

    const locationName = selectedLocation.name;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedReels(locationName);
      if (cached) {
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
      
      // IMPORTANT: Replace with your actual API key
      const apiKey = 'AIzaSyAl79EwWjJZ9w1IFFZlT7RvzORHoA7szYY';
      const searchQuery = `${selectedLocation.name} sarawak tourism shorts`;
      const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=10&q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Unknown YouTube API error';
        
        // If API fails, try to use cached data if available
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
      setCachedReels(locationName, videos);
      
      setShowScrollIndicator(true);
      setTimeout(() => setShowScrollIndicator(false), 3000);
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Final fallback to cache if available
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

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`tourist-info-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>

      <div 
        className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
        style={containerStyle}
      >
        {!isCollapsed && (
          <div className="cache-controls">
            <button 
              className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              onClick={refreshData}
              disabled={loading || isRefreshing}
              title="Refresh data"
            >
              <FiRefreshCw />
            </button>
            {lastUpdated && (
              <span className="last-updated">
                Updated: {formatTime(lastUpdated)}
              </span>
            )}
          </div>
        )}

        {!isCollapsed && reels.length > 0 && showScrollIndicator && (
          <div className="scroll-down-indicator">
            <span></span>
            <p>Scroll down</p>
          </div>
        )}

        <div className="reels-content">
          {loading && <p className="loading">Loading videos...</p>}
          {error && (
            <p className={`error ${error.includes('cached data') ? 'warning' : ''}`}>
              {error}
            </p>
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