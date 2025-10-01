import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/default.png';
import '../styles/DiscoverPlaces.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaClock, FaExclamationTriangle, FaSearch, FaUtensils, FaBed, FaShoppingBag, FaBus, FaLandmark, FaChevronDown, FaEye, FaGlobe, FaLocationArrow, FaTag, FaPhone, FaEnvelope, FaSync, FaInfoCircle, FaCheckCircle, FaDatabase, FaCloud } from 'react-icons/fa';
import AIChatbot from '../components/AiChatbot.jsx';
import LoginPage from '../pages/Loginpage.jsx';
import L from 'leaflet';
import axios from 'axios';
import { toast } from 'sonner';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DiscoverPlaces = () => {
  const { slug } = useParams();
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordError, setCoordError] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [placesLoading, setPlacesLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cacheType, setCacheType] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mapCenter, setMapCenter] = useState([1.5533, 110.3592]);
  const [mapZoom, setMapZoom] = useState(13);
  const [searchRadius, setSearchRadius] = useState(1000); // in meters
  const [activeCategory, setActiveCategory] = useState('all');
  const [visiblePlaces, setVisiblePlaces] = useState(6);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const mapRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  const categories = [
    { id: 'all', name: 'All', icon: <FaMapMarkerAlt /> },
    { id: 'restaurants', name: 'Restaurants', icon: <FaUtensils /> },
    { id: 'accommodations', name: 'Accommodations', icon: <FaBed /> },
    { id: 'shopping', name: 'Shopping & Leisure', icon: <FaShoppingBag /> },
    { id: 'transportation', name: 'Transportation', icon: <FaBus /> },
    { id: 'attractions', name: 'Attractions', icon: <FaLandmark /> }
  ];

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  // Function to generate slug from place name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  // Function to handle place click - navigate to same page with new slug
  const handlePlaceClick = useCallback((place) => {
    // Generate slug from place name
    const newSlug = generateSlug(place.name);
    
    // Create location data from the clicked place
    const newLocationData = {
      name: place.name,
      latitude: place.coordinates?.[1] || place.lat || mapCenter[0], // Geoapify uses [lng, lat]
      longitude: place.coordinates?.[0] || place.lng || mapCenter[1],
      description: `Exploring ${place.name} and nearby places`,
      address: place.address,
      types: place.types,
      rating: place.rating,
      image: place.photos?.[0] || defaultImage,
      category: getPlaceType(place.types),
      type: 'Place',
      division: 'Nearby Location',
      slug: newSlug
    };

    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Navigate to the same page with the new slug
    navigate(`/discover/${newSlug}`, { 
      state: newLocationData,
      replace: false // Allow browser back button to work
    });

    console.log('Navigating to place:', place.name, 'with slug:', newSlug);
  }, [navigate, mapCenter]);

  const processLocationData = useCallback((data) => {
    try {
      // Accept direct latitude/longitude fields
      let lat = data.latitude;
      let lng = data.longitude;

      // Fallback to coordinates array if needed
      if ((lat === undefined || lng === undefined) && Array.isArray(data.coordinates)) {
        [lat, lng] = data.coordinates;
      }

      // Validate
      if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error(`Invalid coordinates: ${lat}, ${lng}`);
      }

      setMapCenter([lat, lng]);
      return { ...data, latitude: lat, longitude: lng };
    } catch (e) {
      console.error('Coordinate error:', e);
      setCoordError(e.message);
      return { ...data, latitude: 1.5533, longitude: 110.3592 };
    }
  }, []);

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.state, slug]);

  // Load data based on slug or location state
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Priority 1: Check if we have location data from navigation (place click)
        if (location.state) {
          console.log('Loading from navigation state:', location.state);
          const processed = processLocationData(location.state);
          if (isMounted) {
            setLocationData(processed);
            setLoading(false);
          }
          return;
        }

        // Priority 2: Handle slug-based location lookup
        if (slug) {
          console.log('Loading from slug:', slug);
          try {
            // You can fetch location data based on slug from your API
            // For now, we'll create a basic location object from the slug
            const locationFromSlug = {
              name: slug.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' '),
              latitude: 1.5533, // Default coordinates
              longitude: 110.3592,
              description: `Exploring ${slug.split('-').join(' ')} and nearby places`,
              image: defaultImage,
              category: 'attractions',
              type: 'Place',
              division: 'Sarawak'
            };
            
            const processed = processLocationData(locationFromSlug);
            if (isMounted) {
              setLocationData(processed);
            }
          } catch (slugError) {
            console.error('Error loading from slug:', slugError);
            // Fallback to default location
            setLocationData({
              name: 'Kuching',
              description: 'Default location: Kuching, Sarawak',
              image: defaultImage,
              latitude: 1.5533,
              longitude: 110.3592
            });
          }
          return;
        }

        // Priority 3: Fallback to geolocation or default
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            });
          });
          
          if (isMounted) {
            const coords = [position.coords.latitude, position.coords.longitude];
            setMapCenter(coords);
            setLocationData({
              coordinates: coords,
              name: 'Your Current Location',
              desc: 'Exploring nearby places around your current location',
              image: defaultImage,
              latitude: coords[0],
              longitude: coords[1]
            });
          }
        } catch (geolocationError) {
          console.error('Geolocation error:', geolocationError);
          if (isMounted) {
            setCoordError(geolocationError.message);
            setLocationData({
              coordinates: [1.5533, 110.3592],
              name: 'Kuching',
              desc: 'Default location: Kuching, Sarawak',
              image: defaultImage,
              latitude: 1.5533,
              longitude: 110.3592
            });
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          setCoordError(error.message);
          setLocationData({
            coordinates: [1.5533, 110.3592],
            name: 'Kuching',
            desc: 'Default location: Kuching, Sarawak',
            image: defaultImage,
            latitude: 1.5533,
            longitude: 110.3592
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => { 
      isMounted = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [location.state, slug, processLocationData]);

  // Enhanced function to fetch nearby places with better error handling
  const fetchNearbyPlaces = useCallback(async (coords, forceRefresh = false) => {
    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    try {
      setPlacesLoading(true);
      setIsRefreshing(forceRefresh);
      setError(null);
      const [lat, lng] = coords;
      const radius = searchRadius;
      
      // Call our backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await axios.get('/api/geoapify/nearby-places', {
        params: { lat, lng, radius, forceRefresh: forceRefresh ? 'true' : 'false' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Validate response
      if (response.data && response.data.success) {
        // Filter out places without a name
        const places = (response.data.data || []).filter(place => place.name && place.name.trim() !== '');
        setNearbyPlaces(places);
        
        // Update cache status
        setIsCached(response.data.cached || false);
        setCacheType(response.data.cacheType || null);
        setCacheTimestamp(response.data.timestamp || null);
        
        // Update quota info if available
        if (response.data.quotaInfo) {
          setQuotaInfo(response.data.quotaInfo);
          
          // Show warning if approaching quota limit
          if (response.data.quotaInfo.percentage >= 80) {
            setShowQuotaWarning(true);
            setTimeout(() => setShowQuotaWarning(false), 5000);
          }
        }
        
        // Log cache status
        if (response.data.cached) {
          console.log(`✓ Loaded from ${response.data.cacheType} cache (${new Date(response.data.timestamp).toLocaleString()})`);
        } else {
          console.log('✓ Fresh data from API');
        }
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      
      let errorMessage = 'Failed to fetch nearby places';
      
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        
        // Handle quota exceeded
        if (error.response.status === 429) {
          errorMessage = 'API quota exceeded. Using cached data or try again later.';
          setShowQuotaWarning(true);
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check your connection.';
      }
      
      setError(errorMessage);
      
      // Don't clear existing places on error (graceful degradation)
      if (nearbyPlaces.length === 0) {
        setNearbyPlaces([]);
      }
    } finally {
      setPlacesLoading(false);
      setIsRefreshing(false);
    }
  }, [searchRadius, nearbyPlaces.length]);
  
  // Enhanced manual cache refresh with user feedback
  const refreshCachedData = useCallback(async () => {
    try {
      if (!locationData?.latitude || !locationData?.longitude) {
        setError('No location data available');
        return;
      }
      
      setIsRefreshing(true);
      setError(null);
      const lat = locationData.latitude;
      const lng = locationData.longitude;
      const radius = searchRadius;
      
      // Call refresh endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await axios.get('/api/geoapify/refresh-cache', {
        params: { lat, lng, radius },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data && response.data.success) {
        setNearbyPlaces(response.data.data || []);
        setIsCached(false);
        setCacheType(null);
        setCacheTimestamp(new Date());
        
        // Show success toast
        toast.success('Cache refreshed successfully!', {
          position: "bottom-right",
          duration: 3000,
        });
        
      } else {
        throw new Error(response.data?.message || 'Failed to refresh cache');
      }
    } catch (error) {
      console.error('Error refreshing cache:', error);
      
      let errorMessage = 'Failed to refresh cache';
      
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage = 'Refresh timed out. Please try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'API quota exceeded. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [locationData, searchRadius]);

  // Fetch places when location or radius changes
  useEffect(() => {
    if (locationData?.latitude && locationData?.longitude) {
      // Debounce the fetch to avoid rapid successive calls
      fetchTimeoutRef.current = setTimeout(() => {
        fetchNearbyPlaces([locationData.latitude, locationData.longitude]);
      }, 300);
    }
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [locationData?.latitude, locationData?.longitude, searchRadius, fetchNearbyPlaces]);

  // Filter places based on active category
  useEffect(() => {
    if (nearbyPlaces.length > 0) {
      if (activeCategory === 'all') {
        setFilteredPlaces(nearbyPlaces);
      } else {
        const filtered = nearbyPlaces.filter(place => 
          getPlaceType(place.types) === activeCategory
        );
        setFilteredPlaces(filtered);
      }
      setVisiblePlaces(6);
    }
  }, [nearbyPlaces, activeCategory]);

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  // Show more places
  const showMorePlaces = () => {
    setVisiblePlaces(prev => Math.min(prev + 6, filteredPlaces.length));
  };

  // Show all places
  const showAllPlaces = () => {
    setVisiblePlaces(filteredPlaces.length);
  };

  // Function to get place type for categorization
  const getPlaceType = (types) => {
    if (!types || types.length === 0) return 'attractions';
    
    const type = types[0].toLowerCase();
    
    if (type.includes('restaurant') || type.includes('cafe') || type.includes('food') || type.includes('cuisine')) {
      return 'restaurants';
    } else if (type.includes('hotel') || type.includes('accommodation') || type.includes('lodging')) {
      return 'accommodations';
    } else if (type.includes('shop') || type.includes('store') || type.includes('leisure') || type.includes('commercial')) {
      return 'shopping';
    } else if (type.includes('transport') || type.includes('station') || type.includes('parking')) {
      return 'transportation';
    } else if (type.includes('tourism') || type.includes('attraction') || type.includes('entertainment')) {
      return 'attractions';
    }
    
    return 'attractions';
  };

  // Handle radius change
  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setSearchRadius(newRadius);
  };

  // Format cache age for display
  const getCacheAge = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const cacheDate = new Date(timestamp);
    const diffMs = now - cacheDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Debug: Log locationData whenever it changes
  useEffect(() => {
    console.debug("locationData:", locationData);
    console.debug("nearbyPlaces:", nearbyPlaces);
    console.debug("Current slug:", slug);
    if (error) console.error("DiscoverPlaces error:", error);
  }, [locationData, nearbyPlaces, error, slug]);

  // Show error as toast using sonner
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "bottom-right",
        duration: 5000,
      });
    }
  }, [error]);

  return (
    <div className="details-page-dp">
      <MenuNavbar onLoginClick={handleLoginClick} />

      {coordError && (
        <div className="error-banner-dp">
          <FaExclamationTriangle /> {coordError}
        </div>
      )}

      {showQuotaWarning && quotaInfo && (
        <div className="quota-warning-banner-dp">
          <FaExclamationTriangle /> 
          API Quota: {quotaInfo.percentage?.toFixed(1)}% used ({quotaInfo.remaining} calls remaining today)
        </div>
      )}

      {loading ? (
        <div className="loading-section-dp">
          <h2>Loading location details...</h2>
        </div>
      ) : locationData ? (
        <>
          <div className="hero-banner-dp">
            <div className="hero-overlay-dp">
              <h1>{locationData?.name?.toUpperCase()}</h1>
              <p>Exploring {locationData?.name} area</p>
              {/* {slug && <p className="slug-indicator">Slug: {slug}</p>} */}
            </div>
          </div>

          <div className="town-overview-dp">
            <div className="overlay-container-dp">
              <div className="text-content-dp">
                <h2>About {locationData?.name}</h2>
                <p className="overview-text-dp">{locationData?.description || "No description available"}</p>
                <div className="category-info-dp">
                  <p className="category-detail-dp">
                    <FaTag className="detail-icon-dp" /> {locationData?.category || "No category"}
                  </p>
                  <p className="category-detail-dp">
                    <FaLandmark className="detail-icon-dp" /> {locationData?.type || "No type"}
                  </p>
                  <p className="category-detail-dp">
                    <FaMapMarkerAlt className="detail-icon-dp" /> {locationData?.division || "No division"}
                  </p>
                </div>
                <div className="location-info-dp">
                  <p className="location-detail-dp">
                    <FaMapMarkerAlt className="detail-icon-dp" /> {locationData?.name || "No name"}
                  </p>
                  <p className="location-detail-dp">
                    <FaMapMarkerAlt className="detail-icon-dp" /> 
                    <span>
                      {locationData?.latitude?.toFixed(5) ?? "N/A"}, {locationData?.longitude?.toFixed(5) ?? "N/A"}
                    </span>
                  </p>
                </div>
                <div className="website-info-dp">
                  <p className="website-details-dp">
                    <FaGlobe className="detail-icon-dp" /> <a href={locationData?.url} target="_blank" rel="noopener noreferrer">{locationData?.url || "Website not available"}</a>
                  </p>
                </div>
              </div>
              <div className="image-content-dp">
                <img
                  src={locationData?.image || defaultImage}
                  alt={locationData?.name}
                  onError={(e) => {
                    e.target.src = defaultImage;
                    e.target.style.opacity = '0.8';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="nearby-places-section-dp">
            {/* Map Section */}
            <div className="map-section-dp">
              <h2>Location Map</h2>
              <div className="map-container-dp">
                <MapContainer 
                  center={[locationData?.latitude || 1.5533, locationData?.longitude || 110.3592]} 
                  zoom={mapZoom} 
                  style={{ height: '500px', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[locationData?.latitude || 1.5533, locationData?.longitude || 110.3592]}>
                    <Popup>
                      <strong>{locationData?.name}</strong><br />
                      Latitude: {locationData?.latitude?.toFixed(6)}<br />
                      Longitude: {locationData?.longitude?.toFixed(6)}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            <div className="search-controls-dp">
              <h2>
                Nearby Places 
                {activeCategory !== 'all' && ` - ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`}
                <span className="places-count-dp"> ({filteredPlaces.length})</span>
              </h2>
              <div className="radius-selector-dp">
                <label htmlFor="radius">Search Radius: </label>
                <select 
                  id="radius" 
                  value={searchRadius}
                  onChange={handleRadiusChange}
                  disabled={placesLoading}
                >
                  <option value="500">500m</option>
                  <option value="1000">1km</option>
                  <option value="2000">2km</option>
                  <option value="5000">5km</option>
                </select>
                <button 
                  className="refresh-btn-dp" 
                  onClick={refreshCachedData}
                  disabled={isRefreshing || placesLoading}
                  title="Fetch fresh data from API"
                >
                  <FaSync className={isRefreshing ? "spin" : ""} /> 
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </div>
            
            {/* Enhanced cache information display */}
            {isCached && cacheTimestamp && (
              <div className={`cache-info-dp cache-${cacheType}`}>
                {cacheType === 'memory' ? <FaDatabase /> : <FaCloud />}
                <span>
                  Loaded from {cacheType} cache • Updated {getCacheAge(cacheTimestamp)}
                </span>
                <button 
                  className="cache-refresh-link-dp"
                  onClick={refreshCachedData}
                  disabled={isRefreshing}
                >
                  Get fresh data
                </button>
              </div>
            )}
            
            {/* Category filters */}
            <div className="category-filters-dp">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn-dp ${activeCategory === category.id ? 'active-dp' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                  disabled={placesLoading}
                  data-tooltip={category.name}
                  title={category.name}
                >
                  {category.icon}
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
            
            {placesLoading ? (
              <div className="loading-section-dp">
                <div className="spinner-dp"></div>
                <h3>Discovering nearby places...</h3>
                <p>This may take a moment</p>
              </div>
            ) : filteredPlaces.length > 0 ? (
              <>
                <div className="places-grid-dp">
                  {filteredPlaces.slice(0, visiblePlaces).map((place, index) => (
                    <div
                      key={place.place_id || index}
                      className="place-card-dp"
                      onClick={() => handlePlaceClick(place)}
                    >
                      <img 
                        src={place.photos?.[0] || defaultImage} 
                        alt={place.name} 
                        onError={(e) => {
                          e.target.src = defaultImage;
                          e.target.style.opacity = '0.8';
                        }}
                      />
                      <div className="place-info-dp">
                        <div className="place-type-dp">
                          {getPlaceType(place.types).charAt(0).toUpperCase() + getPlaceType(place.types).slice(1)}
                        </div>
                        <h3>{place.name}</h3>
                        <p className="address-dp">{place.address}</p>
                        {place.rating && (
                          <div className="rating-dp">
                            ⭐ {place.rating.toFixed(1)}
                            {place.user_ratings_total > 0 && (
                              <span className="reviews-count-dp"> ({place.user_ratings_total})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {visiblePlaces < filteredPlaces.length && (
                  <div className="load-more-container-dp">
                    <button className="load-more-btn-dp" onClick={showMorePlaces}>
                      <FaChevronDown /> Show More Places ({filteredPlaces.length - visiblePlaces} remaining)
                    </button>
                    <button className="view-all-btn-dp" onClick={showAllPlaces}>
                      <FaEye /> View All {filteredPlaces.length} Places
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-results-dp">
                <FaExclamationTriangle />
                <p>No {activeCategory !== 'all' ? activeCategory : 'places'} found within {searchRadius}m</p>
                <p>Try increasing the search radius or selecting a different category</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="loading-section-dp">
          <h2>Loading location data...</h2>
        </div>
      )}
      
      {showLogin && (
        <LoginPage onClose={closeLogin} />
      )}

      <AIChatbot />
      <Footer />
    </div>
  );
};

export default DiscoverPlaces;