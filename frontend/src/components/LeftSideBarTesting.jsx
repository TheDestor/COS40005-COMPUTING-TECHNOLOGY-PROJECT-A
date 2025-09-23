import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup, FaLocationArrow, FaExclamationTriangle, FaTools, FaCar, FaBus, FaWalking, FaBicycle, FaMotorcycle, FaPlane } from 'react-icons/fa';
import { MdManageAccounts } from 'react-icons/md';
import { toast } from 'sonner';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
// import MapComponentTesting from './MapComponentTesting';
import BusinessSubmissionForm from '../pages/BusinessSubmissionForm';
// import { APIProvider } from '@vis.gl/react-google-maps';
import LoginModal from '../pages/Loginpage';
import { IoCloseOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthProvider.jsx';
import { BiCurrentLocation } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import { MdAdd, MdAddLocationAlt } from "react-icons/md";
// import MapZoomController from './MapZoomController';
import { Polyline } from 'react-leaflet';

function PhotonAutocompleteInput({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef();

  const handleInput = (e) => {
    const val = e.target.value;
    onChange(val);

    // Debounce the fetch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const bbox = '109.5,0.8,115.5,5.5';
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&lang=en&limit=5&bbox=${bbox}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.features || []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSelect = (feature) => {
    onChange(feature.properties.name);
    onSelect(feature);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', zIndex: 1000, border: '1px solid #ccc'
        }}>
          {suggestions.map((feature, idx) => (
            <div
              key={idx}
              style={{ padding: 8, cursor: 'pointer' }}
              onClick={() => handleSelect(feature)}
            >
              {feature.properties.name} {feature.properties.city ? `(${feature.properties.city})` : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Nominatim reverse geocoding helper (free alternative to Google Geocoding)
async function reverseGeocodeNominatim(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SarawakTourismApp/1.0' // Required by Nominatim
      }
    });
    
    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      // Format the address nicely
      const address = data.display_name;
      return address;
    }
    
    throw new Error('No address found');
  } catch (error) {
    console.error('Nominatim reverse geocoding error:', error);
    throw error;
  }
}

// Nominatim geocoding helper
async function geocodeAddressNominatim(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data && data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error('Address not found');
}

// OSRM routing helper (existing)
async function fetchOSRMRoute(start, end, waypoints = [], profile = 'driving') {
  const coords = [
    `${start.lng},${start.lat}`,
    ...waypoints.map(wp => `${wp.lng},${wp.lat}`),
    `${end.lng},${end.lat}`
  ].join(';');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('OSRM request failed');
  const data = await response.json();
  return data;
}

// GraphHopper routing helper (for bus and motorbike)
async function fetchGraphHopperRoute(start, end, waypoints = [], profile = 'car') {
  const coords = [
    `${start.lat},${start.lng}`,
    ...waypoints.map(wp => `${wp.lat},${wp.lng}`),
    `${end.lat},${end.lng}`
  ].join(';');
  
  // Using free GraphHopper API (limited requests)
  const url = `https://graphhopper.com/api/1/route?point=${coords}&vehicle=${profile}&instructions=false&calc_points=true&key=demo&type=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GraphHopper request failed: ${response.status}`);
    }
    const data = await response.json();
    
    // Check if GraphHopper returned valid data
    if (!data.paths || !data.paths[0]) {
      throw new Error('No route found in GraphHopper response');
    }
    
    return data;
  } catch (error) {
    console.warn('GraphHopper failed, falling back to OSRM driving:', error);
    // Fallback to OSRM driving
    return await fetchOSRMRoute(start, end, waypoints, 'driving');
  }
}

// Alternative: OpenRouteService (free tier available)
async function fetchOpenRouteServiceRoute(start, end, waypoints = [], profile = 'driving-car') {
  const coords = [
    [start.lng, start.lat],
    ...waypoints.map(wp => [wp.lng, wp.lat]),
    [end.lng, end.lat]
  ];
  
  const body = {
    coordinates: coords,
    profile: profile,
    format: 'geojson'
  };
  
  // You'll need to get a free API key from openrouteservice.org
  const apiKey = process.env.REACT_APP_ORS_API_KEY || 'demo';
  
  try {
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) throw new Error('ORS request failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('ORS failed, falling back to OSRM:', error);
    return await fetchOSRMRoute(start, end, waypoints, 'driving');
  }
}

const travelModes = {
  Car: { service: 'osrm', profile: 'driving' },
  Bus: { service: 'osrm', profile: 'driving' }, // Use OSRM with bus multiplier
  Walking: { service: 'osrm', profile: 'walking' },
  Bicycle: { service: 'osrm', profile: 'cycling' },
  Motorbike: { service: 'osrm', profile: 'driving' }, // Use OSRM with motorbike multiplier
};

// Transport mode multipliers (relative to car)
const transportMultipliers = {
  Car: { time: 1.0, distance: 1.0 },
  Bus: { time: 1.8, distance: 1.2 }, // Slower, longer routes (bus stops, traffic)
  Walking: { time: 4.0, distance: 0.9 }, // Much slower, shorter direct routes
  Bicycle: { time: 2.5, distance: 1.0 }, // Slower than car
  Motorbike: { time: 0.7, distance: 0.95 }, // Faster, shorter routes (lane splitting)
};

// Enhanced OSRM routing with transport adjustments
async function fetchAdjustedRoute(start, end, waypoints = [], vehicle = 'Car') {
  // Always use OSRM driving profile as base
  const osrmData = await fetchOSRMRoute(start, end, waypoints, 'driving');
  
  if (osrmData.routes && osrmData.routes[0]) {
    const baseRoute = osrmData.routes[0];
    const multiplier = transportMultipliers[vehicle];
    
    // Adjust duration and distance based on transport mode
    const adjustedDuration = baseRoute.duration * multiplier.time;
    const adjustedDistance = baseRoute.distance * multiplier.distance;
    
    // For walking/cycling, use appropriate OSRM profile
    let coords = baseRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    
    if (vehicle === 'Walking') {
      try {
        const walkingData = await fetchOSRMRoute(start, end, waypoints, 'walking');
        if (walkingData.routes && walkingData.routes[0]) {
          coords = walkingData.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      } catch (error) {
        console.warn('Walking route failed, using driving route:', error);
      }
    } else if (vehicle === 'Bicycle') {
      try {
        const cyclingData = await fetchOSRMRoute(start, end, waypoints, 'cycling');
        if (cyclingData.routes && cyclingData.routes[0]) {
          coords = cyclingData.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      } catch (error) {
        console.warn('Cycling route failed, using driving route:', error);
      }
    }
    
    return {
      routes: [{
        ...baseRoute,
        geometry: { coordinates: coords.map(([lat, lng]) => [lng, lat]) },
        duration: adjustedDuration,
        distance: adjustedDistance
      }]
    };
  }
  
  throw new Error('No route found');
}

const LeftSidebarTesting = ({ onSearch, history, setHistory, showRecent, setShowRecent, setSelectedPlace, selectedPlace, setOsrmRouteCoords, setOsrmWaypoints, setIsRoutingActive, onBasemapChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [startingPointCoords, setStartingPointCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showBookmarkpage, setShowBookmarkpage] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [addDestinations, setAddDestinations] = useState([]);
  const [waypointCoords, setWaypointCoords] = useState([]); // Array of {lat, lng} or null
  const [nearbyPlaces, setNearbyPlaces] = useState([]); // Local state for nearby places
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { openRecent } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocationFetching, setIsLocationFetching] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeMenu, setActiveMenu] = useState('');
  const [routeSummary, setRouteSummary] = useState(null);
//   const [osrmRouteCoords, setOsrmRouteCoords] = useState([]);
  
const handleClearStartingPoint = () => {
  setStartingPoint('');
  setStartingPointCoords(null);
  setOsrmRouteCoords([]);
  setOsrmWaypoints([]);
  setAddDestinations([]);
  setWaypointCoords([]);
  setRoutes([]);
  setNearbyPlaces([]); // Clear nearby places
};

const handleClearDestination = () => {
  setDestination('');
  setDestinationCoords(null);
  setOsrmRouteCoords([]);
  setOsrmWaypoints([]);
  setAddDestinations([]);
  setWaypointCoords([]);
  setRoutes([]);
  setNearbyPlaces([]); // Clear nearby places
};

  const handleAddCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
  
    // Prevent multiple clicks
    if (isLocationFetching) {
      toast.warning("Please wait... Fetching your location");
      return;
    }
  
    setIsLocationFetching(true);
    setIsLoading(true);
  
    // Check permission status
    const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
    if (permissionStatus?.state === 'denied') {
      toast.error("Location permission denied. Please enable it in browser settings.");
      setIsLocationFetching(false);
      setIsLoading(false);
      return;
    }
  
    // Add a 2.5-second delay to prevent spamming
    await new Promise(resolve => setTimeout(resolve, 2500));
  
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        if (accuracy > 10000) {
          toast.error(
            `GPS signal weak (accuracy: ${Math.round(accuracy)}m).\n
            1. Ensure high-accuracy mode is enabled on your device.\n
            2. Move to an open area.`,
          );
          setIsLocationFetching(false);
          setIsLoading(false);
          return;
        }
  
        try {
          // Use Nominatim for reverse geocoding (free alternative to Google)
          const address = await reverseGeocodeNominatim(latitude, longitude);
          
          if (!startingPoint.trim()) {
            setStartingPoint(address);
            setStartingPointCoords({ lat: latitude, lng: longitude });
            toast.success("Current location set as starting point");
          } else if (!destination.trim()) {
            setDestination(address);
            setDestinationCoords({ lat: latitude, lng: longitude });
            toast.success("Current location set as destination");
          } else {
            setAddDestinations(prev => [...prev, address]);
            toast.success("Current location added as waypoint");
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Fallback: use coordinates as address
          const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          if (!startingPoint.trim()) {
            setStartingPoint(fallbackAddress);
            setStartingPointCoords({ lat: latitude, lng: longitude });
            toast.success("Current location set as starting point (coordinates only)");
          } else if (!destination.trim()) {
            setDestination(fallbackAddress);
            setDestinationCoords({ lat: latitude, lng: longitude });
            toast.success("Current location set as destination (coordinates only)");
          } else {
            setAddDestinations(prev => [...prev, fallbackAddress]);
            toast.success("Current location added as waypoint (coordinates only)");
          }
        } finally {
          setIsLocationFetching(false);
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLocationFetching(false);
        setIsLoading(false);
        const errorMessage = error.code === error.PERMISSION_DENIED 
          ? "Please enable location permissions in your browser settings"
          : error.message;
        toast.error(errorMessage);
      },
      options
    );
  };

  // Helper functions
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDistance = (meters) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`;
  };

  // Toggle functions
  const toggleRecentHistory = () => {
    if (isExpanded) setIsExpanded(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setShowRecent((prev) => !prev);
  };

  const toggleSidebar = () => {
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setIsExpanded((prev) => !prev);
  };

  const toggleBusinessPanel = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    if (showLayersPanel) setShowLayersPanel(false);
    setShowBusiness((prev) => !prev);
  };

  const toggleBookmark = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    setShowBookmarkpage((prev) => !prev);
  };

  const toggleLayersPanel = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setShowLayersPanel((prev) => !prev);
  };

  const openLoginOverlay = () => {
    setShowLoginModal(true);
  };

  const handleDeleteItems = (itemsToDelete) => {
    setHistory(prev => prev.filter(item => !itemsToDelete.includes(item)));
  };

  const handleRoutesCalculated = (routesData) => {
    if (routesData && routesData.routes) {
      setRoutes(routesData.routes || []);
      // setSelectedRouteIndex(0);
    } else {
      setRoutes([]);
    }
  };

  const handleAddDestination = () => {
    setAddDestinations(prev => [...prev, '']);
    setWaypointCoords(prev => [...prev, null]);
  };

  const handleDestinationChange = (index, value) => {
    const newDestinations = [...addDestinations];
    newDestinations[index] = value;
    setAddDestinations(newDestinations);
  };

  // const geocodeAddress = (address, callback) => {
  //   const geocoder = new window.google.maps.Geocoder();
  //   geocoder.geocode({ address }, (results, status) => {
  //     if (status === 'OK' && results[0]) {
  //       callback(results[0].geometry.location);
  //     }
  //   });
  // };

  const handleNearbyPlaceClick = (place) => {
    if (!place.geometry?.location) return;
    
    const location = {
      lat: typeof place.geometry.location.lat === 'function' 
        ? place.geometry.location.lat() 
        : place.geometry.location.lat,
      lng: typeof place.geometry.location.lng === 'function' 
        ? place.geometry.location.lng() 
        : place.geometry.location.lng
    };
    
    setSelectedPlace({ 
      ...place, 
      location,
      // Set higher zoom level for place selection
    });
  };

  // Fetch nearby places using Overpass API (free alternative to Google Places)
const fetchNearbyPlaces = async (locationCoords, radius = 500) => {
  const { lat, lng } = locationCoords;
  
  // Convert radius from meters to degrees (approximate)
  const radiusDegrees = radius / 111000; // 1 degree ≈ 111km
  
  // Overpass API query for nearby amenities
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|food_court)$"]["name"](around:${radius},${lat},${lng});
      node["tourism"~"^(hotel|guest_house|hostel|attraction|museum|gallery)$"]["name"](around:${radius},${lat},${lng});
      node["shop"~"^(supermarket|convenience|clothes|electronics|bookstore)$"]["name"](around:${radius},${lat},${lng});
      node["leisure"~"^(park|playground|sports_centre|swimming_pool)$"]["name"](around:${radius},${lat},${lng});
    );
    out center meta;
  `;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    if (!response.ok) {
      throw new Error('Overpass API request failed');
    }
    
    const data = await response.json();
    
    // Process the results
    const places = data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        place_id: `overpass_${element.id}`,
        name: element.tags.name,
        vicinity: element.tags['addr:street'] || element.tags['addr:city'] || 'Nearby area',
        rating: null, // Overpass doesn't provide ratings
        user_ratings_total: 0,
        geometry: {
          location: {
            lat: () => element.lat || element.center?.lat,
            lng: () => element.lon || element.center?.lon
          }
        },
        type: element.tags.amenity || element.tags.tourism || element.tags.shop || element.tags.leisure || 'place',
        tags: element.tags
      }))
      .slice(0, 10); // Limit to 10 results
    
    return places;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
};

const handleVehicleClick = async (vehicle) => {
  setSelectedVehicle(vehicle);
  setIsLoading(true);

  try {
    let startCoords = startingPointCoords;
    let endCoords = destinationCoords;

    // Fallback to geocoding if user didn't select from autocomplete
    if (!startCoords) {
      const geo = await geocodeAddressNominatim(startingPoint);
      startCoords = geo;
    }
    if (!endCoords) {
      const geo = await geocodeAddressNominatim(destination);
      endCoords = geo;
    }

    // Use waypointCoords for waypoints that have a value, otherwise geocode
    const waypointsCoords = await Promise.all(
      addDestinations.map(async (dest, idx) => {
        if (!dest?.trim()) return null;
        if (waypointCoords[idx]) return waypointCoords[idx];
        return await geocodeAddressNominatim(dest);
      })
    ).then(arr => arr.filter(Boolean));

    // Get routing service configuration
    const routeConfig = travelModes[vehicle];
    let routeData;

    // Route based on service type
    switch (routeConfig.service) {
      case 'osrm':
        if (vehicle === 'Walking' || vehicle === 'Bicycle') {
          // Use direct OSRM for walking/cycling
          routeData = await fetchOSRMRoute(
            startCoords,
            endCoords,
            waypointsCoords,
            routeConfig.profile
          );
        } else {
          // Use adjusted routing for other modes
          routeData = await fetchAdjustedRoute(
            startCoords,
            endCoords,
            waypointsCoords,
            vehicle
          );
        }
        break;
      case 'graphhopper':
        routeData = await fetchGraphHopperRoute(
          startCoords,
          endCoords,
          waypointsCoords,
          routeConfig.profile
        );
        break;
      case 'ors':
        routeData = await fetchOpenRouteServiceRoute(
          startCoords,
          endCoords,
          waypointsCoords,
          routeConfig.profile
        );
        break;
      default:
        throw new Error(`Unknown routing service: ${routeConfig.service}`);
    }

    // Process route data (handle different response formats)
    if (routeData.routes && routeData.routes[0]) {
      let coords, distance, duration;
      
      if (routeConfig.service === 'graphhopper') {
        // GraphHopper response format
        const route = routeData.paths && routeData.paths[0] ? routeData.paths[0] : null;
        if (!route) {
          throw new Error('Invalid GraphHopper response format');
        }
        coords = route.points.coordinates.map(([lng, lat]) => [lat, lng]);
        distance = route.distance;
        duration = route.time / 1000; // Convert ms to seconds
      } else if (routeConfig.service === 'ors') {
        // OpenRouteService response format
        const route = routeData.features && routeData.features[0] ? routeData.features[0] : null;
        if (!route) {
          throw new Error('Invalid ORS response format');
        }
        coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        distance = route.properties.summary.distance;
        duration = route.properties.summary.duration;
      } else {
        // OSRM response format (including adjusted routes)
        const route = routeData.routes[0];
        coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        distance = route.distance;
        duration = route.duration;
      }

      setOsrmRouteCoords(coords);
      setRouteSummary({ distance, duration });
      
      // Fetch nearby places around the destination
      try {
        const nearbyPlaces = await fetchNearbyPlaces(endCoords, 500);
        setNearbyPlaces(nearbyPlaces);
      } catch (error) {
        console.warn('Failed to fetch nearby places:', error);
        setNearbyPlaces([]);
      }
      
      // Show success message with transport mode
      toast.success(`${vehicle} route calculated successfully!`);
    } else {
      setRouteSummary(null);
      setOsrmRouteCoords([]);
      setNearbyPlaces([]);
      toast.error(`No route found for ${vehicle} transport mode`);
    }
  } catch (error) {
    setRouteSummary(null);
    setOsrmRouteCoords([]);
    setNearbyPlaces([]);
    console.error('Routing error:', error);
    toast.error(`Failed to calculate route for ${vehicle}: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  // Check that all required coordinates are set
  if (
    !startingPointCoords ||
    !destinationCoords ||
    addDestinations.length !== waypointCoords.length ||
    waypointCoords.some((wp, idx) => addDestinations[idx]?.trim() && !wp)
  ) {
    return;
  }

  const debounce = setTimeout(() => {
    handleVehicleClick(selectedVehicle);
  }, 600);

  return () => clearTimeout(debounce);
}, [startingPointCoords, destinationCoords, waypointCoords, addDestinations, selectedVehicle]);

useEffect(() => {
  setOsrmWaypoints(waypointCoords.filter(Boolean));
}, [waypointCoords, setOsrmWaypoints]);

useEffect(() => {
    // Routing is active if both start and end are set (and valid), or if there are any waypoints
    const routingActive =
      !!startingPointCoords &&
      !!destinationCoords &&
      (addDestinations.length === 0 || waypointCoords.some(Boolean));
    setIsRoutingActive(routingActive);
  }, [startingPointCoords, destinationCoords, addDestinations, waypointCoords, setIsRoutingActive]);
  

  return (
    <>
      <div className="sidebar100">
        <div className="menu-icon100" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div
          className={`menu-item100${activeMenu === 'recent' ? ' active' : ''}`}
          onClick={() => {
            if (activeMenu === 'recent') {
              setActiveMenu('');
              toggleRecentHistory();
            } else {
              setActiveMenu('recent');
              toggleRecentHistory();
            }
          }}
        >
          <FaClock className="icon100" />
          <span className="label100">Recent</span>
        </div>
        <div
          className={`menu-item100${activeMenu === 'bookmark' ? ' active' : ''}`}
          onClick={() => {
            if (activeMenu === 'bookmark') {
              setActiveMenu('');
              toggleBookmark();
            } else {
              setActiveMenu('bookmark');
              toggleBookmark();
            }
          }}
        >
          <FaBookmark className="icon100" />
          <span className="label100">Bookmark</span>
        </div>
        <div
          className={`menu-item100${activeMenu === 'business' ? ' active' : ''}`}
          onClick={() => {
            if (activeMenu === 'business') {
              setActiveMenu('');
              toggleBusinessPanel();
            } else {
              setActiveMenu('business');
              toggleBusinessPanel();
            }
          }}
        >
          <FaBuilding className="icon100" />
          <span className="label100">Business</span>
        </div>

        <div
          className={`menu-item100${activeMenu === 'managebusiness' ? ' active' : ''}`}
          onClick={() => {
            setActiveMenu('managebusiness');
            window.location.href = '/manage-business';
          }}
        >
          <MdManageAccounts className="icon100" />
          <span className="label100">Manage Business</span>
        </div>
        <div
          className={`menu-item101${activeMenu === 'layers' ? ' active' : ''}`}
          onClick={() => {
            if (activeMenu === 'layers') {
              setActiveMenu('');
              toggleLayersPanel();
            } else {
              setActiveMenu('layers');
              toggleLayersPanel();
            }
          }}
        >
          <FaLayerGroup className="icon100" />
          <span className="label100">Layers</span>
        </div>
      </div>
    
      <div className={`side-panel100 ${isExpanded ? 'expanded' : ''}`}>
        <div className="transport-section">
            <div className="transport-row">
              {['Car', 'Bus', 'Walking'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                    onClick={() => handleVehicleClick(v)}>
                  {v === 'Car' ? <FaCar /> : v === 'Bus' ? <FaBus /> : <FaWalking />}
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className="transport-row">
              {['Bicycle', 'Motorbike'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                    onClick={() => handleVehicleClick(v)}>
                  {v === 'Bicycle' ? <FaBicycle /> : <FaMotorcycle />}
                  <span>{v}</span>
                </div>
              ))}
              <div className="transport-option disabled" title="Not available">
                <FaPlane />
                <span>Flight</span>
              </div>
            </div>
          </div>

          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon red" />
              <PhotonAutocompleteInput
                value={startingPoint}
                onChange={setStartingPoint}
                onSelect={feature => {
                  setStartingPoint(feature.properties.name);
                  setStartingPointCoords({
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                  });
                }}
                placeholder="Choosing Starting point"
              />
              {startingPoint && (
                <button 
                  className="clear-button2" 
                  onClick={handleClearStartingPoint}
                  title="Clear input"
                >
                  <IoCloseOutline />
                </button>
              )}
              <FaSearch className="input-icon" />
            </div>
          </div>

          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon red" />
              <PhotonAutocompleteInput
                value={destination}
                onChange={setDestination}
                onSelect={feature => {
                  setDestination(feature.properties.name);
                  setDestinationCoords({
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0]
                  });
                }}
                placeholder="Choosing Destination"
              />
              {destination && (
                <button 
                  className="clear-button2" 
                  onClick={handleClearDestination}
                  title="Clear input"
                >
                  <IoCloseOutline />
                </button>
              )}
              <FaSearch className="input-icon" />
            </div>
          </div>

          {addDestinations.map((dest, index) => (
            <div className="input-container" key={index}>
              <div className="input-box">
                <FaMapMarkerAlt className="input-icon-add" />
                <PhotonAutocompleteInput
                  value={addDestinations[index]}
                  onChange={val => {
                    // Update the text
                    setAddDestinations(prev => {
                      const arr = [...prev];
                      arr[index] = val;
                      return arr;
                    });
                    // Clear the coordinate if user is typing
                    setWaypointCoords(prev => {
                      const arr = [...prev];
                      arr[index] = null;
                      return arr;
                    });
                  }}
                  onSelect={feature => {
                    // Set the text and the coordinate
                    setAddDestinations(prev => {
                      const arr = [...prev];
                      arr[index] = feature.properties.name;
                      return arr;
                    });
                    setWaypointCoords(prev => {
                      const arr = [...prev];
                      arr[index] = {
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0]
                      };
                      return arr;
                    });
                  }}
                  placeholder={`Add destination ${index + 1}`}
                />
                <button onClick={() => {
                    setAddDestinations(prev => prev.filter((_, i) => i !== index));
                    setWaypointCoords(prev => prev.filter((_, i) => i !== index));
                }}>
                    <IoCloseOutline />
                </button>
              </div>
            </div>
          ))}

          <div className="destination-buttons">
            <button className="add-destination" onClick={handleAddDestination}>
              <MdAddLocationAlt style={{ marginRight: '5px', color:'purple', height:'18px', width:'18px' }}/> Add Destination
            </button>
            <button 
              className="current-location-button" 
              onClick={handleAddCurrentLocation}
              title="Use my current location"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="location-error"></span>
                  Locating...
                </>
              ) : (
                <>
                  <FaLocationArrow style={{ marginRight: '5px' }} />
                  My Location
                </>
              )}
            </button>
          </div>

          {isLoading && <div className="loading-message">Calculating route...</div>}
            {routeSummary && (
              <div className="route-summary-container">
                <div className="route-summary-item">
                  <FaMapMarkerAlt className="summary-icon" />
                  <span className="summary-label">Distance:</span>
                  <span className="summary-value">{(routeSummary.distance / 1000).toFixed(2)} km</span>
                </div>
                <div className="route-summary-item">
                  <FaClock className="summary-icon" />
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">{(routeSummary.duration / 60).toFixed(0)} min</span>
                </div>
              </div>
            )}

{isLoading ? (
            <div className="loading-message">Calculating routes...</div>
          ) : routeSummary ? (
            <>
              {/* Show route summary and nearby places when we have a route */}
              <div className="route-footer">
                <div className="send-copy-row">
                  <div className="send-directions-text">📩 Send Directions</div>
                  <div className="copy-link">COPY LINK</div>
                </div>
                
                <hr />

                <div className="explore-nearby-text">🔍 Explore Nearby</div>
                {nearbyPlaces.length > 0 ? (
                  <div className="nearby-places-container100">
                    {nearbyPlaces.map((place, index) => (
                      <div 
                        key={index} 
                        className={`nearby-place-item100 ${selectedPlace?.place_id === place.place_id ? 'selected-place' : ''}`}
                        onClick={() => handleNearbyPlaceClick(place)}
                      >
                        <div className="place-name100">{place.name}</div>
                        <div className="place-address100">{place.vicinity}</div>
                        <div className="place-type100">📍 {place.type}</div>
                        {place.rating && (
                          <div className="place-rating100">
                            ⭐ {place.rating} ({place.user_ratings_total || 0} reviews)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-nearby-places">
                    No nearby places found around the destination.
                  </div>
                )}
              </div>
            </>
          ) : null}

          </div>
            {showBusiness && (
              <BusinessSubmissionForm
                isOpen={showBusiness}
                onClose={() => setShowBusiness(false)}
                onSubmitSuccess={() => {
                  toast.success('Business submitted successfully!');
                  setShowBusiness(false);
                }}
              />
            )}

            <MapLayer
              isOpen={showLayersPanel}
              onClose={() => setShowLayersPanel(false)}
              onMapTypeChange={onBasemapChange}
            />

          {/* <MapZoomController selectedPlace={selectedPlace} /> */}
          </>
  );
};

export default LeftSidebarTesting;