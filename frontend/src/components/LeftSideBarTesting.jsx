import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup, FaLocationArrow, FaExclamationTriangle, FaTools, FaCar, FaBus, FaWalking, FaBicycle, FaMotorcycle, FaPlane, FaCopy, FaShare, FaCompass, FaMapPin } from 'react-icons/fa';
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
  
  // Don't encode coordinates for OSRM - it expects them as-is
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
  
  console.log(`Fetching route for ${profile}:`, url);
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OSRM request failed for ${profile}:`, response.status, errorText);
    throw new Error(`OSRM request failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  
  // Check if the response has routes
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No routes found in OSRM response for ${profile}`);
  }
  
  return data;
}

// OSRM routing helper with multiple alternatives
async function fetchOSRMRouteAlternatives(start, end, waypoints = [], profile = 'driving', alternatives = 3) {
  const coords = [
    `${start.lng},${start.lat}`,
    ...waypoints.map(wp => `${wp.lng},${wp.lat}`),
    `${end.lng},${end.lat}`
  ].join(';');
  
  // For walking and cycling, don't use alternatives parameter as it may not be supported
  let url;
  if (profile === 'walking' || profile === 'cycling') {
    // Don't encode coordinates for OSRM - it expects them as-is
    url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;
  } else {
    // Use alternatives for driving but with simpler parameters
    url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=true`;
  }
  
  console.log(`Fetching alternatives for ${profile}:`, url);
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OSRM request failed for ${profile}:`, response.status, errorText);
    throw new Error(`OSRM request failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  
  // Check if the response has routes
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No routes found in OSRM response for ${profile}`);
  }
  
  return data;
}

// GraphHopper routing helper (using backend API)
async function fetchGraphHopperRoute(start, end, waypoints = [], profile = 'car') {
  try {
    console.log(`Fetching GraphHopper route via backend API for ${profile}...`);
    console.log(`Start:`, start);
    console.log(`End:`, end);
    console.log(`Waypoints:`, waypoints);
    
    const response = await fetch('/api/graphhopper/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        end,
        waypoints,
        vehicle: profile
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Backend GraphHopper request failed: ${response.status}`, errorData);
      throw new Error(`Backend GraphHopper request failed: ${response.status} - ${errorData.message}`);
    }
    
    const data = await response.json();
    console.log('Backend GraphHopper response:', data);
    
    if (!data.success || !data.routes || data.routes.length === 0) {
      throw new Error('No routes found in backend GraphHopper response');
    }
    
    // Convert backend response to expected format
    return {
      paths: data.routes.map(route => ({
        points: {
          coordinates: route.coordinates.map(([lat, lng]) => [lng, lat]) // Convert back to [lng, lat]
        },
        distance: route.distance,
        time: route.duration * 1000, // Convert seconds to ms
        instructions: route.roadInfo.map(info => ({
          street_name: info.road,
          distance: info.distance,
          time: info.duration * 1000,
          text: info.direction
        }))
      }))
    };
  } catch (error) {
    console.warn('Backend GraphHopper failed:', error);
    throw error;
  }
}

// GraphHopper alternatives helper (using backend API)
async function fetchGraphHopperAlternatives(start, end, waypoints = [], profile = 'car', alternatives = 3) {
  try {
    console.log(`Fetching GraphHopper alternatives via backend API for ${profile}...`);
    console.log(`Start:`, start);
    console.log(`End:`, end);
    console.log(`Waypoints:`, waypoints);
    console.log(`Alternatives:`, alternatives);
    
    const response = await fetch('/api/graphhopper/alternatives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        end,
        waypoints,
        vehicle: profile,
        alternatives
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Backend GraphHopper alternatives request failed: ${response.status}`, errorData);
      throw new Error(`Backend GraphHopper alternatives request failed: ${response.status} - ${errorData.message}`);
    }
    
    const data = await response.json();
    console.log('Backend GraphHopper alternatives response:', data);
    
    if (!data.success || !data.routes || data.routes.length === 0) {
      throw new Error('No routes found in backend GraphHopper alternatives response');
    }
    
    // Convert backend response to expected format
    return {
      paths: data.routes.map(route => ({
        points: {
          coordinates: route.coordinates.map(([lat, lng]) => [lng, lat]) // Convert back to [lng, lat]
        },
        distance: route.distance,
        time: route.duration * 1000, // Convert seconds to ms
        instructions: route.roadInfo.map(info => ({
          street_name: info.road,
          distance: info.distance,
          time: info.duration * 1000,
          text: info.direction
        }))
      }))
    };
  } catch (error) {
    console.warn('Backend GraphHopper alternatives failed:', error);
    throw error;
  }
}

// Valhalla routing helper (free and open source)
async function fetchValhallaRoute(start, end, waypoints = [], profile = 'auto') {
  const coords = [
    [start.lng, start.lat],
    ...waypoints.map(wp => [wp.lng, wp.lat]),
    [end.lng, end.lat]
  ];
  
  const body = {
    locations: coords.map(coord => ({ lat: coord[1], lon: coord[0] })),
    costing: profile,
    directions_options: {
      units: 'kilometers'
    }
  };
  
  try {
    const response = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Valhalla request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.trip || !data.trip.legs) {
      throw new Error('No route found in Valhalla response');
    }
    
    return data;
  } catch (error) {
    console.warn('Valhalla failed:', error);
    throw error;
  }
}

const travelModes = {
  Car: { service: 'graphhopper', profile: 'car', fallbackService: 'osrm', fallbackProfile: 'driving' },
  Bus: { service: 'graphhopper', profile: 'car', fallbackService: 'osrm', fallbackProfile: 'driving', multiplier: { time: 1.5, distance: 1.1 } }, // Bus takes longer due to stops
  Walking: { service: 'graphhopper', profile: 'foot', fallbackService: 'osrm', fallbackProfile: 'walking' },
  Bicycle: { service: 'graphhopper', profile: 'bike', fallbackService: 'osrm', fallbackProfile: 'cycling' },
  Motorbike: { service: 'graphhopper', profile: 'motorcycle', fallbackService: 'osrm', fallbackProfile: 'driving', multiplier: { time: 0.8, distance: 0.95 } }, // Motorbike can be faster
};

// Function to fetch route with alternatives for a specific vehicle
async function fetchRouteWithAlternatives(start, end, waypoints = [], vehicle = 'Car') {
  const routeConfig = travelModes[vehicle];
  
  try {
    let routeData;
    
            // Try primary service first
            try {
              if (routeConfig.service === 'graphhopper') {
                console.log(`Using GraphHopper for ${vehicle}...`);
                // Try alternatives first for driving vehicles
                if (vehicle === 'Car' || vehicle === 'Bus' || vehicle === 'Motorbike') {
                  try {
                    routeData = await fetchGraphHopperAlternatives(start, end, waypoints, routeConfig.profile, 3);
                  } catch (alternativesError) {
                    console.log(`GraphHopper alternatives failed, trying basic route:`, alternativesError.message);
                    routeData = await fetchGraphHopperRoute(start, end, waypoints, routeConfig.profile);
                  }
                } else {
                  routeData = await fetchGraphHopperRoute(start, end, waypoints, routeConfig.profile);
                }
                
                // Check if GraphHopper returned valid coordinates
                if (routeData.paths && routeData.paths.length > 0) {
                  const hasValidCoordinates = routeData.paths.some(path => {
                    return (path.points && path.points.coordinates) || 
                           (path.points && Array.isArray(path.points)) ||
                           (path.geometry && path.geometry.coordinates) ||
                           path.coordinates;
                  });
                  
                  if (!hasValidCoordinates) {
                    console.warn('GraphHopper returned route without coordinates, trying OSRM fallback');
                    throw new Error('GraphHopper missing coordinates');
                  }
                }
              } else if (routeConfig.service === 'valhalla') {
                routeData = await fetchValhallaRoute(start, end, waypoints, routeConfig.profile);
              } else if (routeConfig.service === 'osrm') {
                if (vehicle === 'Walking' || vehicle === 'Bicycle') {
                  console.log(`Using OSRM basic route for ${vehicle}...`);
                  routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.profile);
                } else {
                  try {
                    console.log(`Trying OSRM alternatives for ${vehicle}...`);
                    routeData = await fetchOSRMRouteAlternatives(start, end, waypoints, routeConfig.profile, 3);
                  } catch (alternativesError) {
                    console.log(`OSRM alternatives failed, falling back to basic route:`, alternativesError.message);
                    routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.profile);
                  }
                }
              }
            } catch (primaryError) {
              console.warn(`Primary service failed for ${vehicle}, trying fallback:`, primaryError);
              
              // Fallback to OSRM
              if (routeConfig.fallbackService === 'osrm') {
                if (vehicle === 'Walking' || vehicle === 'Bicycle') {
                  console.log(`Using OSRM basic route for ${vehicle} fallback...`);
                  routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.fallbackProfile);
                } else {
                  try {
                    console.log(`Trying OSRM alternatives for ${vehicle} fallback...`);
                    routeData = await fetchOSRMRouteAlternatives(start, end, waypoints, routeConfig.fallbackProfile, 3);
                  } catch (alternativesError) {
                    console.log(`OSRM alternatives failed, falling back to basic route:`, alternativesError.message);
                    routeData = await fetchOSRMRoute(start, end, waypoints, routeConfig.fallbackProfile);
                  }
                }
              } else if (routeConfig.fallbackService === 'valhalla') {
                console.log(`Using Valhalla for ${vehicle} fallback...`);
                routeData = await fetchValhallaRoute(start, end, waypoints, routeConfig.fallbackProfile);
              }
            }

    // Handle different response formats
    let routes = [];
    
    if (routeData.paths && routeData.paths.length > 0) {
      // GraphHopper response format
      routes = routeData.paths.map(path => {
        
        // Check different possible coordinate structures in GraphHopper response
        let coordinates = [];
        
        if (path.points && path.points.coordinates) {
          // Standard GraphHopper format
          coordinates = path.points.coordinates;
        } else if (path.points && Array.isArray(path.points)) {
          // Alternative format where points is directly an array
          coordinates = path.points;
        } else if (path.geometry && path.geometry.coordinates) {
          // Geometry format
          coordinates = path.geometry.coordinates;
        } else if (path.coordinates) {
          // Direct coordinates format
          coordinates = path.coordinates;
        } else {
          console.warn('GraphHopper path missing coordinates in all expected formats:', path);
          
          // Return empty coordinates - this will be handled by the fallback logic above
          return {
            geometry: { coordinates: [] },
            distance: path.distance || 0,
            duration: (path.time || 0) / 1000,
            legs: []
          };
        }
        
        return {
          geometry: {
            coordinates: coordinates.map(([lng, lat]) => [lng, lat])
          },
          distance: path.distance,
          duration: path.time / 1000, // Convert ms to seconds
          legs: [],
          roadInfo: path.instructions ? path.instructions.map(instruction => ({
            road: instruction.street_name || 'Unknown Road',
            distance: instruction.distance,
            duration: instruction.time / 1000,
            direction: instruction.text
          })) : []
        };
      });
    } else if (routeData.trip && routeData.trip.legs) {
      // Valhalla response format
      const totalDistance = routeData.trip.summary.length * 1000; // Convert km to meters
      const totalDuration = routeData.trip.summary.time; // Already in seconds
      
      routes = [{
        geometry: {
          coordinates: routeData.trip.legs.flatMap(leg => 
            leg.shape.map(coord => [coord[1], coord[0]]) // Valhalla uses [lat, lng], we need [lng, lat]
          )
        },
        distance: totalDistance,
        duration: totalDuration,
        legs: routeData.trip.legs,
        roadInfo: routeData.trip.legs.map(leg => ({
          road: leg.summary?.road_class || 'Unknown Road',
          distance: leg.summary?.length * 1000 || 0,
          duration: leg.summary?.time || 0,
          direction: leg.summary?.road_class || 'Continue'
        }))
      }];
    } else if (routeData.routes && routeData.routes.length > 0) {
      // OSRM response format
      routes = routeData.routes.map(route => ({
        ...route,
        roadInfo: route.legs ? route.legs.flatMap(leg => 
          leg.steps ? leg.steps.map(step => ({
            road: step.name || 'Unknown Road',
            distance: step.distance,
            duration: step.duration,
            direction: step.maneuver?.instruction || 'Continue'
          })) : []
        ) : []
      }));
    }
    
    if (routes.length === 0) {
      throw new Error('No routes found in response');
    }
    
    // Check if all routes have empty coordinates
    const allRoutesEmpty = routes.every(route => !route.geometry.coordinates || route.geometry.coordinates.length === 0);
    if (allRoutesEmpty) {
      console.warn('All routes have empty coordinates, this should trigger fallback');
      throw new Error('All routes have empty coordinates');
    }
    
    
    // Apply multipliers if they exist (for Bus and Motorbike only)
    if (routeConfig.multiplier && routes && routes.length > 0) {
      routes.forEach(route => {
        if (route.duration && route.distance) {
          route.duration = route.duration * routeConfig.multiplier.time;
          route.distance = route.distance * routeConfig.multiplier.distance;
        }
      });
    }
    
    return { routes };
  } catch (error) {
    console.error(`Error fetching ${vehicle} routes:`, error);
    throw error;
  }
}



const LeftSidebarTesting = ({ onSearch, history, setHistory, showRecent, setShowRecent, setSelectedPlace, selectedPlace, setOsrmRouteCoords, setOsrmWaypoints, setIsRoutingActive, onBasemapChange, setSelectedSearchBarPlace, onRouteAlternativesChange, onNearbyPlacesChange, onRouteInfoChange, onClearAllRouting, onSetAddToRecentRef, onSetOpenRecentSectionRef, onSetToggleBookmarkRef }) => {
  const { user, isLoggedIn } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [startingPointCoords, setStartingPointCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [showBusiness, setShowBusiness] = useState(false);
  const [showBookmarkpage, setShowBookmarkpage] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showRecentSection, setShowRecentSection] = useState(false);
  const [recentLocations, setRecentLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('sarawakTourismRecentLocations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mapType, setMapType] = useState('roadmap');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addDestinations, setAddDestinations] = useState([]);
  const [waypointCoords, setWaypointCoords] = useState([]); // Array of {lat, lng} or null
  const [routeAlternatives, setRouteAlternatives] = useState([]); // Local state for route alternatives
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0); // Local state for selected route
  const [nearbyPlaces, setNearbyPlaces] = useState([]); // Local state for nearby places
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { openRecent } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocationFetching, setIsLocationFetching] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeMenu, setActiveMenu] = useState('');
  const [routeSummary, setRouteSummary] = useState(null);
  const autoCalculatedRef = useRef(false);
//   const [osrmRouteCoords, setOsrmRouteCoords] = useState([]);

  // Load recent locations from localStorage on component mount
  useEffect(() => {
    const savedRecentLocations = localStorage.getItem('sarawakTourismRecentLocations');
    if (savedRecentLocations) {
      try {
        setRecentLocations(JSON.parse(savedRecentLocations));
      } catch (error) {
        console.error('Error parsing recent locations from localStorage:', error);
        setRecentLocations([]);
      }
    }
  }, []);

  // Save recent locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(recentLocations));
  }, [recentLocations]);

  // Set up the addToRecent function reference for the parent component
  useEffect(() => {
    if (onSetAddToRecentRef) {
      onSetAddToRecentRef(addToRecentLocations);
    }
  }, [onSetAddToRecentRef]);

  // Set up the openRecentSection function reference for the parent component
  useEffect(() => {
    if (onSetOpenRecentSectionRef) {
      onSetOpenRecentSectionRef(() => {
        setShowRecentSection(true);
        setActiveMenu('recentLocations');
      });
    }
  }, [onSetOpenRecentSectionRef]);

  // Set up the toggleBookmark function reference for the parent component
  useEffect(() => {
    if (onSetToggleBookmarkRef) {
      onSetToggleBookmarkRef(() => {
        setShowBookmarkpage(true);
        setActiveMenu('bookmark');
      });
    }
  }, [onSetToggleBookmarkRef]);
  
const handleClearStartingPoint = () => {
  setStartingPoint('');
  setStartingPointCoords(null);
  setOsrmRouteCoords([]);
  setOsrmWaypoints([]);
  setAddDestinations([]);
  setWaypointCoords([]);
  setRouteAlternatives([]);
  setSelectedRouteIndex(0);
  setNearbyPlaces([]); // Clear nearby places
  autoCalculatedRef.current = false; // Reset auto-calculation flag
};

const handleClearDestination = () => {
  setDestination('');
  setDestinationCoords(null);
  setOsrmRouteCoords([]);
  setOsrmWaypoints([]);
  setAddDestinations([]);
  setWaypointCoords([]);
  setRouteAlternatives([]);
  setSelectedRouteIndex(0);
  setNearbyPlaces([]); // Clear nearby places
  autoCalculatedRef.current = false; // Reset auto-calculation flag
};

const handleClearAllRouting = () => {
  setStartingPoint('');
  setDestination('');
  setStartingPointCoords(null);
  setDestinationCoords(null);
  setOsrmRouteCoords([]);
  setOsrmWaypoints([]);
  setAddDestinations([]);
  setWaypointCoords([]);
  setRouteAlternatives([]);
  setSelectedRouteIndex(0);
  setNearbyPlaces([]);
  autoCalculatedRef.current = false; // Reset auto-calculation flag
  
  // Also call the parent's clearing function if provided
  if (onClearAllRouting) {
    onClearAllRouting();
  }
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

  // Function to generate directions link
  const generateDirectionsLink = () => {
    if (!startingPointCoords || !destinationCoords) {
      toast.error('Please set both starting point and destination');
      return null;
    }

    const start = `${startingPointCoords.lat},${startingPointCoords.lng}`;
    const end = `${destinationCoords.lat},${destinationCoords.lng}`;
    
    // Create a Google Maps directions link
    const googleMapsLink = `https://www.google.com/maps/dir/${start}/${end}`;
    
    // Create a custom app link with route data
    const appLink = `${window.location.origin}?route=true&start=${start}&end=${end}&vehicle=${selectedVehicle}`;
    
    return { googleMapsLink, appLink };
  };

  // Function to copy directions link
  const copyDirectionsLink = async () => {
    const links = generateDirectionsLink();
    if (!links) return;

    try {
      // Copy the Google Maps link to clipboard
      await navigator.clipboard.writeText(links.googleMapsLink);
      toast.success('Directions link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  // Function to share directions
  const shareDirections = async () => {
    const links = generateDirectionsLink();
    if (!links) return;

    const shareData = {
      title: 'Directions',
      text: `Directions from ${startingPoint} to ${destination}`,
      url: links.googleMapsLink
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Directions shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(links.googleMapsLink);
        toast.success('Directions link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        toast.error('Failed to share directions. Please try again.');
      }
    }
  };

  // Toggle functions
  function toggleRecentHistory() {
    if (isExpanded) setIsExpanded(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
  
    if (typeof setShowRecent === 'function') {
      setShowRecent(prev => !prev);
    } else {
      // Fallback: use existing recent section state
      setShowRecentSection(prev => !prev);
      setActiveMenu(prev => (prev === 'recent' ? '' : 'recent'));
    }
  }

  const toggleRecentSection = () => {
    if (isExpanded) setIsExpanded(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    if (showLayersPanel) setShowLayersPanel(false);
    setShowRecentSection((prev) => {
      const next = !prev;
      setActiveMenu(next ? 'recent' : '');
      return next;
    });
  };

  const toggleSidebar = () => {
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    if (showRecentSection) setShowRecentSection(false);
    setActiveMenu('');
    setIsExpanded((prev) => !prev);
  };

  const toggleBusinessPanel = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    if (showLayersPanel) setShowLayersPanel(false);
    if (showRecentSection) setShowRecentSection(false);
    setShowBusiness((prev) => !prev);
  };

  const toggleBookmark = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showRecentSection) setShowRecentSection(false);
    setShowBookmarkpage((prev) => !prev);
  };

  const toggleLayersPanel = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    if (showRecentSection) setShowRecentSection(false);
    setShowLayersPanel((prev) => !prev);
  };

  const openLoginOverlay = () => {
    setShowLoginModal(true);
  };

  const handleDeleteItems = (itemsToDelete) => {
    setHistory(prev => prev.filter(item => !itemsToDelete.includes(item)));
  };

  // Function to add a location to recent locations
  const addToRecentLocations = (location) => {
    if (!location || !location.name || !location.latitude || !location.longitude) {
      return;
    }

    const locationData = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description || '',
      type: location.type || 'Location',
      timestamp: new Date().toISOString(),
      source: location.source || 'search'
    };

    setRecentLocations(prev => {
      // Remove if already exists (to avoid duplicates)
      const filtered = prev.filter(item => 
        !(item.name === locationData.name && 
          Math.abs(item.latitude - locationData.latitude) < 0.0001 &&
          Math.abs(item.longitude - locationData.longitude) < 0.0001)
      );
      
      // Add to beginning and limit to 20 items
      return [locationData, ...filtered].slice(0, 20);
    });
  };

  // Function to handle recent location click
  const handleRecentLocationClick = (location) => {
    // Plot the location on the map by setting it as selected search bar place
    setSelectedSearchBarPlace({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
      type: location.type
    });

    // Close the recent section
    setShowRecentSection(false);
    setActiveMenu('');
  };

  // Function to delete selected recent locations
  const handleDeleteRecentItems = (itemsToDelete) => {
    try {
      // Compute next list now so we can persist before broadcasting
      const next = recentLocations.filter(item => !itemsToDelete.includes(item));
      setRecentLocations(next);
      localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify(next));
      // Notify any listeners (e.g., search dropdown) to refresh their recent caches
      window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'delete_selected', items: itemsToDelete } }));
    } catch (_) {
      // no-op
    }
  };

  // Function to clear all recent locations
  const handleClearAllRecent = () => {
    try {
      setRecentLocations([]);
      // Clear persisted storage immediately for other components relying on it
      localStorage.setItem('sarawakTourismRecentLocations', JSON.stringify([]));
      // Broadcast a global event so any dropdowns/consumers can clear their UI
      window.dispatchEvent(new CustomEvent('recentLocationsUpdated', { detail: { action: 'clear_all' } }));
    } catch (_) {
      // no-op
    }
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
    
    const placeData = { 
      ...place, 
      location,
      latitude: location.lat,
      longitude: location.lng,
      name: place.name,
      type: place.type || 'Nearby Place',
      description: place.vicinity || place.type || 'Nearby place'
    };
    
    setSelectedPlace(placeData);
    
    // Also set this as a selected search bar place to show on map
    setSelectedSearchBarPlace({
      name: place.name,
      latitude: location.lat,
      longitude: location.lng,
      description: place.vicinity || place.type || 'Nearby place',
      type: place.type || 'Nearby Place'
    });

    // Trigger a custom event to notify the map component to zoom and show info window
    const customEvent = new CustomEvent('nearbyPlaceSelected', {
      detail: placeData
    });
    window.dispatchEvent(customEvent);
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
  
  // If this is a manual selection (not auto-calculation), reset the flag
  if (autoCalculatedRef.current) {
    autoCalculatedRef.current = false;
  }

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

    // Fetch multiple route alternatives for the selected vehicle
    const routeData = await fetchRouteWithAlternatives(startCoords, endCoords, waypointsCoords, vehicle);

    if (routeData.routes && routeData.routes.length > 0) {
      // Process all route alternatives
      const alternatives = routeData.routes.map((route, index) => {
        
        const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]); // Convert from [lng, lat] to [lat, lng] for Leaflet
        
        return {
          index,
          distance: route.distance,
          duration: route.duration,
          coords,
          vehicle,
          roadInfo: route.roadInfo || []
        };
      });

      setRouteAlternatives(alternatives);
      setSelectedRouteIndex(0); // Select the first (fastest) route by default
      
      // Set the first route as active
      const firstRoute = alternatives[0];
      
      // Ensure we have valid coordinates
      if (firstRoute.coords && firstRoute.coords.length > 0) {
        setOsrmRouteCoords(firstRoute.coords);
        setRouteSummary({ 
          distance: firstRoute.distance, 
          duration: firstRoute.duration,
          vehicle: firstRoute.vehicle,
          roadInfo: firstRoute.roadInfo
        });
      } else {
        console.error('First route has no coordinates!');
        toast.error('Route calculation failed: No coordinates found');
      }
      
      // Fetch nearby places around the destination
      try {
        const nearbyPlaces = await fetchNearbyPlaces(endCoords, 500);
        setNearbyPlaces(nearbyPlaces);
      } catch (error) {
        console.warn('Failed to fetch nearby places:', error);
        setNearbyPlaces([]);
      }
      
      // Show success message with transport mode
      const message = alternatives.length > 1 
        ? `${vehicle} routes calculated successfully! ${alternatives.length} options available.`
        : `${vehicle} route calculated successfully!`;
      toast.success(message);
    } else {
      console.error('No routes found in routeData:', routeData);
      setRouteSummary(null);
      setOsrmRouteCoords([]);
      setRouteAlternatives([]);
      setSelectedRouteIndex(0);
      setNearbyPlaces([]);
      toast.error(`No routes found for ${vehicle} transport mode`);
    }
  } catch (error) {
    console.error('Routing error:', error);
    
    // Create a fallback straight-line route if we have start and end coordinates
    if (startCoords && endCoords) {
      console.log('Creating fallback straight-line route');
      const fallbackCoords = [
        [startCoords.lat, startCoords.lng],
        [endCoords.lat, endCoords.lng]
      ];
      
      // Calculate straight-line distance
      const distance = Math.sqrt(
        Math.pow(endCoords.lat - startCoords.lat, 2) + 
        Math.pow(endCoords.lng - startCoords.lng, 2)
      ) * 111000; // Convert to meters (rough approximation)
      
      const fallbackRoute = {
        index: 0,
        distance: distance,
        duration: distance / (vehicle === 'Walking' ? 1.4 : vehicle === 'Bicycle' ? 4.2 : 13.9), // Rough speed in m/s
        coords: fallbackCoords,
        vehicle
      };
      
      setRouteAlternatives([fallbackRoute]);
      setSelectedRouteIndex(0);
      setOsrmRouteCoords(fallbackCoords);
      setRouteSummary({ 
        distance: fallbackRoute.distance, 
        duration: fallbackRoute.duration,
        vehicle: fallbackRoute.vehicle
      });
      
      toast.warning(`Using fallback route for ${vehicle}. API routing failed: ${error.message}`);
    } else {
      setRouteSummary(null);
      setOsrmRouteCoords([]);
      setRouteAlternatives([]);
      setSelectedRouteIndex(0);
      setNearbyPlaces([]);
      
      // Show more helpful error messages
      if (vehicle === 'Walking' && error.message.includes('walking route')) {
        toast.error('Walking route not available. The route may not be accessible on foot. Try using a different transport mode.');
      } else if (vehicle === 'Bicycle' && error.message.includes('cycling route')) {
        toast.error('Cycling route not available. The route may not be accessible by bicycle. Try using a different transport mode.');
      } else {
        toast.error(`Failed to calculate routes for ${vehicle}: ${error.message}`);
      }
    }
  } finally {
    setIsLoading(false);
  }
};

// Auto-calculate Car route when both start and destination coordinates are available
useEffect(() => {
  const shouldAutoCalculate = 
    startingPointCoords && 
    destinationCoords && 
    !isLoading &&
    routeAlternatives.length === 0 && // Only if no route is already calculated
    selectedVehicle === 'Car' && // Only auto-calculate for Car
    !autoCalculatedRef.current; // Prevent multiple auto-calculations

  if (shouldAutoCalculate) {
    autoCalculatedRef.current = true;
    // Auto-select Car and calculate route
    handleVehicleClick('Car');
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [startingPointCoords, destinationCoords, isLoading, routeAlternatives.length, selectedVehicle]);

useEffect(() => {
  setOsrmWaypoints(waypointCoords.filter(Boolean));
}, [waypointCoords]);

useEffect(() => {
    // Routing is active if both start and end are set (and valid), or if there are any waypoints
    const routingActive =
      !!startingPointCoords &&
      !!destinationCoords &&
      (addDestinations.length === 0 || waypointCoords.some(Boolean));
    setIsRoutingActive(routingActive);
  }, [startingPointCoords, destinationCoords, addDestinations, waypointCoords]);

  // Notify parent component when route alternatives change
  useEffect(() => {
    if (onRouteAlternativesChange) {
      onRouteAlternativesChange(routeAlternatives, selectedRouteIndex);
    }
  }, [routeAlternatives, selectedRouteIndex, onRouteAlternativesChange]);

  // Notify parent component when nearby places change
  useEffect(() => {
    if (onNearbyPlacesChange) {
      onNearbyPlacesChange(nearbyPlaces);
    }
  }, [nearbyPlaces, onNearbyPlacesChange]);

  // Notify parent component when route info changes
  useEffect(() => {
    if (onRouteInfoChange) {
      onRouteInfoChange({
        startingPoint,
        destination,
        startingPointCoords,
        destinationCoords
      });
    }
  }, [startingPoint, destination, startingPointCoords, destinationCoords, onRouteInfoChange]);
  

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
              toggleRecentSection();
            } else {
              setActiveMenu('recent');
              toggleRecentSection();
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
        {isLoggedIn && user?.role === 'business' && (
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
        )}

        {isLoggedIn && user?.role === 'business' && (
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
        )}
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
            <div className="section-label">
              <FaMapMarkerAlt className="section-icon" />
              <span>Map Route Direction</span>
            </div>
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
                placeholder="Enter starting location..."
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
                placeholder="Enter destination..."
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

          <div className="destination-actions-container">
            <div className="destination-actions-buttons">
              <button className="add-destination-button" onClick={handleAddDestination}>
                <MdAddLocationAlt className="action-icon" />
                Add Destination
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
                    <FaLocationArrow className="action-icon" />
                    My Location
                  </>
                )}
              </button>
            </div>
          </div>

          {isLoading && <div className="loading-message">Calculating route...</div>}
            {routeSummary && (
              <div className="route-summary-container">
                <div className="route-summary-header">
                  <FaMapMarkerAlt className="section-icon" />
                  <h4>Route Summary</h4>
                </div>
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
                <div className="route-summary-item">
                  <FaCar className="summary-icon" />
                  <span className="summary-label">Transport:</span>
                  <span className="summary-value">{routeSummary.vehicle}</span>
                </div>
                {routeSummary.roadInfo && routeSummary.roadInfo.length > 0 && (
                  <div className="route-summary-item">
                    <FaMapMarkerAlt className="summary-icon" />
                    <span className="summary-label">Main Roads:</span>
                    <span className="summary-value">
                      {routeSummary.roadInfo
                        .filter(road => road.road && road.road !== 'Unknown Road')
                        .slice(0, 3)
                        .map(road => road.road)
                        .join(', ') || 'Various roads'}
                    </span>
                  </div>
                )}
              </div>
            )}

{isLoading ? (
            <div className="loading-message">Loading nearby places...</div>
          ) : routeSummary ? (
            <>
              {/* Show route summary and nearby places when we have a route */}
              <div className="route-footer">
                <div className="explore-nearby-text">
                  <FaCompass className="explore-icon" />
                  Explore Nearby
                </div>
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
                        <div className="place-type100">
                          <FaMapPin className="place-type-icon" />
                          {place.type}
                        </div>
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

          {routeSummary && (
  <div className="directions-actions-container">
    <div className="directions-actions-header">
      <FaShare className="section-icon" />
      <h4>Share Directions</h4>
    </div>
              <div className="directions-actions-buttons">
                <button 
                  className="copy-directions-button"
                  onClick={copyDirectionsLink}
                  title="Copy Google Maps directions link"
                >
                  <FaCopy className="action-icon" />
                  Copy Link
                </button>
                <button 
                  className="share-directions-button"
                  onClick={shareDirections}
                  title="Share directions"
                >
                  <FaShare className="action-icon" />
                  Share
                </button>
              </div>
              <div className="directions-info">
                <small>Links will open in Google Maps for navigation</small>
              </div>
            </div>
          )}

          {routeSummary && routeAlternatives.length > 1 && (
            <div className="route-alternatives-container">
              <div className="route-alternatives-header">
                <h4>Route Options</h4>
                <span className="route-count">{routeAlternatives.length} routes available</span>
              </div>
              <div className="route-alternatives-list">
                {routeAlternatives.map((route, index) => (
                  <div 
                    key={index}
                    className={`route-alternative-item ${index === selectedRouteIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRouteIndex(index);
                      setOsrmRouteCoords(route.coords);
                      setRouteSummary({ 
                        distance: route.distance, 
                        duration: route.duration,
                        vehicle: route.vehicle,
                        roadInfo: route.roadInfo
                      });
                    }}
                  >
                    <div className="route-alternative-header">
                      <div className="route-info">
                        <span className="route-number">Route {index + 1}</span>
                        {index === 0 && <span className="fastest-badge">Fastest</span>}
                      </div>
                    </div>
                    <div className="route-alternative-details">
                      <div className="route-detail-item">
                        <FaClock className="detail-icon" />
                        <span>{formatDuration(route.duration)}</span>
                      </div>
                      <div className="route-detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span>{formatDistance(route.distance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Recent Section */}
          {showRecentSection && (
            <RecentSection
              isOpen={showRecentSection}
              onClose={() => {
                setShowRecentSection(false);
                setActiveMenu('');
              }}
              history={recentLocations}
              onItemClick={handleRecentLocationClick}
              onDeleteItems={handleDeleteRecentItems}
              onClearAll={handleClearAllRecent}
            />
          )}

          {/* Bookmark Section */}
          {showBookmarkpage && (
            <BookmarkPage
              isOpen={showBookmarkpage}
              onClose={() => {
                setShowBookmarkpage(false);
                setActiveMenu('');
              }}
              showLoginOverlay={openLoginOverlay}
              onBookmarkClick={(bookmark) => {
                const bookmarkData = {
                  name: bookmark.name,
                  latitude: bookmark.latitude,
                  longitude: bookmark.longitude,
                  description: bookmark.description,
                  type: bookmark.type
                };
                
                // Set both selected place and search bar place to ensure marker appears
                setSelectedPlace(bookmarkData);
                setSelectedSearchBarPlace(bookmarkData);
                
                // Close the bookmark panel after clicking
                setShowBookmarkpage(false);
                setActiveMenu('');
              }}
            />
          )}

          {/* <MapZoomController selectedPlace={selectedPlace} /> */}
          </>
  );
};

export default LeftSidebarTesting;