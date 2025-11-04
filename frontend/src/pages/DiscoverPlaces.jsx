import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/default.png';
import '../styles/DiscoverPlaces.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaCalendarAlt, FaArrowUp, FaClock, FaExclamationTriangle, FaSearch, FaUtensils, FaBed, FaShoppingBag, FaBus, FaLandmark, FaChevronDown, FaEye, FaGlobe, FaLocationArrow, FaTag, FaPhone, FaEnvelope, FaSync, FaInfoCircle, FaCheckCircle, FaDatabase, FaCloud, FaCalendar, FaUsers, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FaMapLocationDot } from 'react-icons/fa6';
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

function DiscoverPlaces() {
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  
  // Use the location image for the hero banner background (fallback to default)
  const heroBgUrl = locationData?.image || defaultImage;

  const [showScheduleSection, setShowScheduleSection] = useState(true);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleFilterFilledOnly, setScheduleFilterFilledOnly] = useState(false);

  // Calendar state
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day'
  const [calendarDate, setCalendarDate] = useState(new Date());
  // const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);

  // Define event-derived fields BEFORE any helpers that use them
  const eventType = locationData?.eventType || locationData?.type || selectedPlace?.eventType || selectedPlace?.type || null;
  const eventOrganizers = locationData?.eventOrganizers || selectedPlace?.eventOrganizers || null;
  const eventHashtags = locationData?.eventHashtags || selectedPlace?.eventHashtags || null;
  const dailySchedule = locationData?.dailySchedule || selectedPlace?.dailySchedule || [];
  const eventWebsiteUrl = locationData?.websiteUrl || selectedPlace?.websiteUrl || null;
  
  // Event-only details flag for conditional rendering (hide category/type/division/website)
  const isEventDetail = Boolean(
    locationData?.type === 'Event' ||
    locationData?.eventType ||
    locationData?.registrationRequired ||
    (locationData?.startDate && locationData?.endDate)
  );

  const calendarEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const toDateOnly = (d) => {
            const dd = new Date(d);
            dd.setHours(0, 0, 0, 0);
            return dd;
        };

        const start = locationData?.startDate ? toDateOnly(locationData.startDate) : null;
        const end = locationData?.endDate ? toDateOnly(locationData.endDate) : null;

        const statusFor = (dateOnly) => {
            if (start && end) {
                if (dateOnly >= start && dateOnly <= end) return 'ongoing';
                if (dateOnly < start) return 'upcoming';
                return 'past';
            }
            return dateOnly >= today ? 'upcoming' : 'past';
        };

        const events = [];

        // Primary: build from dailySchedule if present
        if (Array.isArray(dailySchedule) && dailySchedule.length > 0) {
          dailySchedule
            .filter((s) => s?.date)
            .forEach((s, idx) => {
              const dateOnly = toDateOnly(s.date);
              events.push({
                id: `current-${idx}`,
                date: dateOnly,
                startTime: s.startTime || locationData?.startTime || '',
                endTime: s.endTime || locationData?.endTime || '',
                title: locationData?.name || 'Event',
                description: locationData?.description || '',
                type: eventType || 'Event',
                status: statusFor(dateOnly),
                eventId: locationData?.eventId || null,
              });
            });
        } else {
          // Fallback: if no dailySchedule, use startDate/endDate with location times
          const baseStart = start;
          const baseEnd = end || start;

          if (baseStart) {
            const cursor = new Date(baseStart);
            const endCursor = new Date(baseEnd);
            while (cursor <= endCursor) {
              const dateOnly = toDateOnly(cursor);
              events.push({
                id: `fallback-${dateOnly.getTime()}`,
                date: new Date(dateOnly),
                startTime: locationData?.startTime || '',
                endTime: locationData?.endTime || '',
                title: locationData?.name || 'Event',
                description: locationData?.description || '',
                type: eventType || 'Event',
                status: statusFor(dateOnly),
                eventId: locationData?.eventId || null,
              });
              cursor.setDate(cursor.getDate() + 1);
            }
          }
        }

        return events;
    }, [
        dailySchedule,
        eventType,
        locationData?.startDate,
        locationData?.endDate,
        locationData?.startTime,
        locationData?.endTime,
        locationData?.name,
        locationData?.description,
        locationData?.eventId,
    ]);

  const gotoPrev = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() - 1);
    setCalendarDate(d);
  };

  const gotoNext = () => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + 1);
    setCalendarDate(d);
  };

  const formatTimeDP = (t) => {
    if (!t) return '';
    const [h, m] = String(t).split(':');
    return `${String(h).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`;
  };

  const eventsOnDate = (date) => {
    const d0 = new Date(date);
    d0.setHours(0, 0, 0, 0);
    return calendarEvents.filter((ev) => {
      const ed = new Date(ev.date);
      ed.setHours(0, 0, 0, 0);
      return ed.getTime() === d0.getTime();
    });
  };

  const handleEventClick = (ev) => {
    setSelectedCalendarEvent(ev);
  };

  // Only show the calendar when there are calendar events (event places)
  const shouldShowCalendar = Array.isArray(calendarEvents) && calendarEvents.length > 0; 

  const getTodayScheduleInfo = useCallback(() => {
    if (!isEventDetail) return null;
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Find today's schedule from dailySchedule array
    const todaySchedule = dailySchedule?.find(schedule => {
      if (!schedule.date) return false;
      const scheduleDate = new Date(schedule.date);
      const scheduleDateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
      return scheduleDateStr === todayStr;
    });
    
    // Use today's schedule times if available, otherwise fallback to general times
    const startTime = todaySchedule?.startTime || locationData?.startTime;
    const endTime = todaySchedule?.endTime || locationData?.endTime;
    
    return { startTime, endTime, hasDailySchedule: Array.isArray(dailySchedule) && dailySchedule.length > 0 };
  }, [isEventDetail, dailySchedule, locationData?.startTime, locationData?.endTime]);

  const formatTimeDisplayDP = (time) => {
    if (!time) return '';
    const [hours, minutes] = String(time).split(':');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const getFilteredScheduleEntries = useCallback(() => {
    const q = (scheduleSearchQuery || '').toLowerCase();
    const entries = Array.isArray(dailySchedule) ? dailySchedule.slice() : [];
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    return entries.filter((entry) => {
      const filled = entry?.startTime && entry?.endTime;
      const label = new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toLowerCase();
      return (!scheduleFilterFilledOnly || filled) && (!q || label.includes(q));
    });
  }, [dailySchedule, scheduleSearchQuery, scheduleFilterFilledOnly]);

  const handleCopyScheduleDP = useCallback(() => {
    const lines = getFilteredScheduleEntries().map((entry) => {
      const label = new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const start = formatTimeDisplayDP(entry.startTime) || '—';
      const end = formatTimeDisplayDP(entry.endTime) || '—';
      return `${label}: ${start} - ${end}`;
    });
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => toast.success('Schedule copied to clipboard'))
      .catch(() => toast.error('Failed to copy schedule'));
  }, [getFilteredScheduleEntries]);

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

  // useEffect: Load data based on slug or location state — add eventId-first fetch
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        setLoading(true);
  
        // Priority 0: If coming from CustomInfoWindow with eventId, fetch event from DB
        if (location.state?.eventId) {
          const id = location.state.eventId;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const res = await axios.get(`/api/event/getEvent/${id}`, { signal: controller.signal });
            clearTimeout(timeoutId);
  
            if (res?.data?.event) {
              const ev = res.data.event;
              const lat = Number(ev?.coordinates?.latitude) || (Array.isArray(location.state.coordinates) ? Number(location.state.coordinates[0]) : 1.5533);
              const lng = Number(ev?.coordinates?.longitude) || (Array.isArray(location.state.coordinates) ? Number(location.state.coordinates[1]) : 110.3592);
  
              const processed = processLocationData({
                name: ev.name,
                description: ev.description,
                image: ev.imageUrl || defaultImage,
                latitude: lat,
                longitude: lng,
                // Event details for Discover Places
                eventType: ev.eventType,
                eventOrganizers: ev.eventOrganizers,
                eventHashtags: ev.eventHashtags,
                dailySchedule: Array.isArray(ev.dailySchedule) ? ev.dailySchedule : [],
                startDate: ev.startDate,
                endDate: ev.endDate,
                startTime: ev.startTime,
                endTime: ev.endTime,
                websiteUrl: ev.websiteUrl,
                // Optional: treat as event category/type
                category: 'Events',
                type: 'Event',
                eventId: ev._id || id
              });
  
              if (isMounted) {
                setLocationData(processed);
                setLoading(false);
              }
              return;
            }
          } catch (err) {
            console.error('Failed to fetch event by ID:', err);
            // Fall through to existing state handling if DB fetch fails
          }
        }
  
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
          <section
            className="hero-banner-dp"
            style={{
              backgroundImage: `url(${heroBgUrl})`,
            }}
          >
            <div className="hero-overlay-dp">
              <h1>{locationData?.name?.toUpperCase()}</h1>
            </div>
          </section>

          <div className="town-overview-dp">
            <div className="overlay-container-dp">
              <div className="text-content-dp">
                <h2>About the location</h2>
                <p className="overview-text-dp">{locationData?.description || "No description available"}</p>

                {/* Responsive info cards grid */}
                <div className="info-cards-grid-dp">

                  {/* Combined Details card: Location + Event details */}
                  <div className="info-card-dp">
                    <div className="info-card-header-dp">Place Details</div>
                    <div className="info-card-body-dp">
                      <div className="details-info-dp">
                        {/* Category card: hidden for event details */}
                        {!isEventDetail && (
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
                        )}

                        {/* Event details (shown if present) */}
                        {eventType && (
                          <p className="event-detail-dp">
                            <FaCalendarAlt className="detail-icon-dp" /> {eventType}
                          </p>
                        )}
                        {eventOrganizers && (
                          <p className="event-detail-dp">
                            <FaUsers className="detail-icon-dp" /> {eventOrganizers}
                          </p>
                        )}
                        {eventHashtags && (
                          <div className="event-detail-dp event-hashtags-dp">
                            <FaTag className="detail-icon-dp" /> 
                            <span className="hashtags-container-dp">
                              {String(eventHashtags)
                                .split(',')
                                .map(h => h.trim())
                                .filter(Boolean)
                                .map((h, idx) => (
                                  <span key={`${h}-${idx}`} className="hashtag-badge-dp">{h}</span>
                                ))}
                            </span>
                          </div>
                        )}
                        {eventWebsiteUrl && (
                          <p className="event-detail-dp">
                            <FaGlobe className="detail-icon-dp" />
                            <a
                              href={eventWebsiteUrl}
                              title="Click to copy link"
                              style={{ color: '#0d6efd', textDecoration: 'underline', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(eventWebsiteUrl)
                                  .then(() => toast.success('Website URL copied'))
                                  .catch(() => toast.error('Failed to copy link'));
                              }}
                            >
                              {eventWebsiteUrl}
                            </a>
                          </p>
                        )}

                        {/* Location details */}
                        <div className="location-info-dp">
                          <p className="location-detail-dp">
                            <FaMapLocationDot className="detail-icon-dp" /> {locationData?.name || "No name"}
                          </p>
                          <p className="location-detail-dp">
                            <FaMapMarkerAlt className="detail-icon-dp" /> 
                            <span>
                              {locationData?.latitude?.toFixed(5) ?? "N/A"}, {locationData?.longitude?.toFixed(5) ?? "N/A"}
                            </span>
                          </p>
                        </div>

                        {/* Website card: hidden for event details */}
                        {!isEventDetail && (
                          <div className="website-info-dp">
                            <p className="website-details-dp">
                              <FaGlobe className="detail-icon-dp" /> <a href={locationData?.url} target="_blank" rel="noopener noreferrer">{locationData?.url || "Website not available"}</a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="image-content-dp">
                <MapContainer
                  center={[
                    locationData?.latitude ?? mapCenter[0],
                    locationData?.longitude ?? mapCenter[1],
                  ]}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[
                      locationData?.latitude ?? mapCenter[0],
                      locationData?.longitude ?? mapCenter[1],
                    ]}
                  >
                    <Popup>
                      {locationData?.name || 'Selected Location'}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="nearby-places-section-dp">
          
            {/* Calendar Section: only show for events */}
            {shouldShowCalendar && (
              <section className="calendar-section-dp">
                <div className="calendar-toolbar-dp">
                  <div className="calendar-controls-dp">
                  <div className="calendar-nav-dp">
                  <button
                    type="button"
                    className="calendar-nav-btn-dp prev"
                    aria-label="Previous month"
                    onClick={gotoPrev}
                  >
                    <FaChevronLeft aria-hidden="true" />
                  </button>
                  <span className="current-date-dp">
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    className="calendar-nav-btn-dp next"
                    aria-label="Next month"
                    onClick={gotoNext}
                  >
                    <FaChevronRight aria-hidden="true" />
                  </button>
                </div>
                  </div>
                </div>

                <div className={`calendar-content-dp fadeSwitch-dp ${calendarView}`}>
                  {calendarView === 'month' && (
                    <CalendarMonthGrid
                      baseDate={calendarDate}
                      eventsOnDate={eventsOnDate}
                      onEventClick={handleEventClick}
                      formatTimeDP={formatTimeDP}
                    />
                  )}
                </div>
              </section>
            )}

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

      {/* Scroll to top button */}
      <button
        className={`scroll-to-top-btn-mj ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        title="Scroll to top"
      >
        <FaArrowUp />
      </button>

      <AIChatbot />
      <Footer />
    </div>
  );
};

function CalendarMonthGrid({ baseDate, eventsOnDate, onEventClick, formatTimeDP }) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const startDay = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);

  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const isSameMonth = (d) => d.getMonth() === baseDate.getMonth();

  return (
    <div className="calendar-grid-month-dp">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
        <div key={wd} className="calendar-weekday-header-dp">{wd}</div>
      ))}
      {days.map((d, idx) => {
        const evs = eventsOnDate(d);
        return (
          <div key={idx} className={`calendar-day-cell-dp ${isSameMonth(d) ? '' : 'muted-dp'}`}>
            <div className="calendar-day-number-dp">{d.getDate()}</div>
            <div className="calendar-day-events-dp">
              {evs.map((ev) => (
                <button
                  key={ev.id}
                  className={`calendar-event-pill-dp status-${ev.status}`}
                  title={`${formatTimeDP(ev.startTime)} - ${formatTimeDP(ev.endTime)}`}
                  onClick={() => onEventClick(ev)}
                >
                  <span className="status-dot-dp" aria-hidden="true"></span>
                  {ev.startTime ? `${formatTimeDP(ev.startTime)} - ${formatTimeDP(ev.endTime)} ` : ''}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarWeekGrid({ baseDate, eventsOnDate, onEventClick, formatTimeDP }) {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay()); // Sunday
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <div className="calendar-grid-week-dp">
      {days.map((d) => {
        const evs = eventsOnDate(d);
        return (
          <div key={d.toISOString()} className="calendar-week-day-dp">
            <div className="calendar-week-day-header-dp">
              <span className="calendar-week-day-name-dp">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="calendar-week-day-date-dp">
                {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="calendar-week-events-dp">
              {evs.length === 0 ? (
                <div className="calendar-empty-dp">No events</div>
              ) : evs.map((ev) => (
                <button
                  key={ev.id}
                  className={`calendar-event-card-dp status-${ev.status}`}
                  onClick={() => onEventClick(ev)}
                >
                  <div className="calendar-event-time-dp">
                    <span className="status-dot-dp" aria-hidden="true"></span>
                    {ev.startTime ? `${formatTimeDP(ev.startTime)} - ${formatTimeDP(ev.endTime)}` : 'All day'}
                  </div>
                  {/* <div className="calendar-event-title-dp">{ev.title}</div> */}
                  {ev.description && <div className="calendar-event-desc-dp">{ev.description}</div>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarDayList({ baseDate, eventsOnDate, onEventClick, formatTimeDP }) {
  const evs = eventsOnDate(baseDate);

  return (
    <div className="calendar-day-list-dp">
      <div className="calendar-day-header-dp">
        {baseDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      {evs.length === 0 ? (
        <div className="calendar-empty-dp">No events for this day</div>
      ) : evs.map((ev) => (
        <button
          key={ev.id}
          className={`calendar-event-row-dp status-${ev.status}`}
          onClick={() => onEventClick(ev)}
        >
          <span className="calendar-event-time-dp">
            <span className="status-dot-dp" aria-hidden="true"></span>
            {ev.startTime ? `${formatTimeDP(ev.startTime)} - ${formatTimeDP(ev.endTime)}` : 'All day'}
          </span>
          {/* <span className="calendar-event-title-dp">{ev.title}</span> */}
        </button>
      ))}
    </div>
  );
}

export default DiscoverPlaces;