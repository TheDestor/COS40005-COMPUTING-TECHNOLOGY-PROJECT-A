import React, { useRef, useState, useEffect, useCallback, forwardRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import EventNotificationPanel from './EventNotificationPanel';

import carIcon from '../assets/car.gif';
import homestayIcon from '../assets/homestay.gif';
import townIcon from '../assets/majortown.gif';
import shoppingIcon from '../assets/shopping.gif';
import foodIcon from '../assets/food.gif';
import museumIcon from '../assets/museum.gif';
import tourIcon from '../assets/tour.gif';
import eventIcon from '../assets/event.gif';
import restaurantIcon from '../assets/restaurant.png';
import bookmarkTownPng from '../assets/town.png';

import MapViewMenu from './MapViewMenu';
import CustomInfoWindow from './CustomInfoWindow';
// import ReviewPage from '../pages/ReviewPage';
import { UseBookmarkContext } from '../context/BookmarkProvider';
import '../styles/MapComponent.css';
import SearchBarTesting from './SearchbarTesting';
import SearchHandlerTesting from './SearchHandlerTesting';
import WeatherDateTimeTesting from './WeatherDateTimeTesting';
import { townCoordinates } from '../townCoordinates';
import LoginModal from '../pages/Loginpage';
import TouristInfoSection from './TouristInfoSection';
import ProfileDropdown from './ProfileDropdown';
import SharePlace from './SharePlace';
import MapZoomControllerTesting from './MapZoomControllerTesting';
import ZoomHandlerTesting from './ZoomHandlerTesting';
import WeatherTownHandlerTesting from './WeatherTownHandlerTesting';
import LeftSideBarTesting from './LeftSideBarTesting';
import AiChatbot from './AiChatbot';

// Sarawak bounds: [SouthWest, NorthEast]
const sarawakBounds = [
  [0.8, 109.5],   // Southwest corner (lat, lng)
  [5.5, 115.5],   // Northeast corner (lat, lng)
];
const sarawakCenter = [2.5, 112.5]; // Rough center of Sarawak

// Custom waypoint marker with number
const createWaypointMarkerIcon = (number) => {
  const iconHtml = `
    <div style="
      background: #fd7e14;
      border: 2px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      ${number}
    </div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-waypoint-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Helper to create a Leaflet icon from an image
const createIcon = (iconUrl) =>
  new L.Icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    className: 'custom-leaflet-icon'
  });

// NEW: scale a Leaflet icon for selected markers
const scaleIcon = (baseIcon, scale = 3) => {
  const { iconUrl, iconSize, iconAnchor, popupAnchor, className } = baseIcon.options;
  const size = Array.isArray(iconSize) ? iconSize : [60, 60];
  const anchor = Array.isArray(iconAnchor) ? iconAnchor : [size[0] / 2, size[1]];
  const popup = Array.isArray(popupAnchor) ? popupAnchor : [0, -anchor[1]];
  return new L.Icon({
    iconUrl,
    iconSize: [size[0] * scale, size[1] * scale],
    iconAnchor: [anchor[0] * scale, anchor[1] * scale],
    popupAnchor: [popup[0] * scale, popup[1] * scale],
    className: `${className || ''} selected-marker-icon`.trim()
  });
};

const searchPlaceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: 'custom-leaflet-icon'
});

const bookmarkMarkerIcon = new L.Icon({
  iconUrl: bookmarkTownPng,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: 'custom-leaflet-icon'
});

// Route markers with different colors
const startMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-leaflet-icon'
});

const endMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-leaflet-icon'
});

const waypointMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-leaflet-icon'
});

const toiletMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-leaflet-icon'
});
const pharmacyMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-leaflet-icon'
});

const categoryIcons = {
  'Major Town': createIcon(townIcon),
  'Accommodation': createIcon(homestayIcon),
  'Food & Beverages': createIcon(foodIcon),
  'Attractions': createIcon(museumIcon),
  'Attraction': createIcon(museumIcon),
  'Shoppings & Leisures': createIcon(shoppingIcon),
  'Transport': createIcon(carIcon),
  'Transportation': createIcon(carIcon),
  'Tour Guides': createIcon(tourIcon),
  'Events': createIcon(eventIcon),
  'Restaurant': createIcon(restaurantIcon),
  'Toilet': toiletMarkerIcon,
  'Pharmacy': pharmacyMarkerIcon,
  'Starting Point': startMarkerIcon,
  'Destination': endMarkerIcon,
  'Waypoint': waypointMarkerIcon,
};

// Separate component for map content to ensure proper context
function MapContent({ locations, nearbyPlaces, activeSearchLocation, activeCategory, isRoutingActive, onMarkerClick, selectedLocation }) {
  {/* Normalize coords from either {latitude, longitude} or {coordinates.{latitude, longitude}} */}
const rawLat = activeSearchLocation?.coordinates?.latitude ?? activeSearchLocation?.latitude;
const rawLng = activeSearchLocation?.coordinates?.longitude ?? activeSearchLocation?.longitude;
const searchLat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
const searchLng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;
const hasSearchCoords = Number.isFinite(searchLat) && Number.isFinite(searchLng);

  const contextMenuItems = [
        { 
            label: 'View details', 
            icon: 'info', 
            click: () => onMarkerClick(activeSearchLocation) 
        }
    ];
  // Helper function to get the correct icon for a location
  const getIconForLocation = (location) => {
    if (categoryIcons[location.type]) {
      return categoryIcons[location.type];
    }
    return categoryIcons['Major Town'];
  };

  // Only cluster if not Major Town
  const shouldCluster = activeCategory !== 'Major Town';

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Show search marker and nearby places when we have valid coords */}
      {hasSearchCoords ? (
          <>
            {/* Anchor marker at searched location: hide while routing to avoid duplicate with route end pin */}
            {!isRoutingActive && (
              <Marker
                position={[searchLat, searchLng]}
                // Use town.png for bookmark anchors, else retain the red icon
                icon={(String(activeSearchLocation?.type || '').toLowerCase() === 'bookmark')
                      ? bookmarkMarkerIcon
                      : endMarkerIcon}
                eventHandlers={{ click: () => onMarkerClick(activeSearchLocation) }}
                riseOnHover={true}
                zIndexOffset={1000}
              />
            )}
            {/* Nearby markers: distinct icons, NO clustering */}
            {nearbyPlaces.map((loc, idx) => {
              const lc = [
                (loc.category || ''),
                (loc.type || ''),
                (loc.subcategory || ''),
                (loc.class || ''),
                ...(Array.isArray(loc.categories) ? loc.categories : []),
                ...(Array.isArray(loc.tags) ? loc.tags : []),
                ...(Array.isArray(loc?.properties?.categories) ? loc.properties.categories : []),
              ]
                .filter(Boolean)
                .map((s) => String(s).toLowerCase());

              const isToilet = lc.some((s) =>
                s.includes('toilet') || s.includes('restroom') || s.includes('washroom') || s === 'wc'
              );
              const isPharmacy = lc.some((s) =>
                s.includes('pharmacy') || s.includes('chemist') || s.includes('drugstore')
              );
              const baseIcon = isToilet ? categoryIcons['Toilet'] : isPharmacy ? categoryIcons['Pharmacy'] : categoryIcons['Restaurant'];

              const selLat = selectedLocation?.latitude ?? selectedLocation?.lat;
              const selLng = selectedLocation?.longitude ?? selectedLocation?.lng;
              const isSelected =
                Number.isFinite(selLat) &&
                Number.isFinite(selLng) &&
                Math.abs(selLat - loc.latitude) < 1e-6 &&
                Math.abs(selLng - loc.longitude) < 1e-6;

              const icon = isSelected ? scaleIcon(baseIcon, 1.7) : baseIcon;

              return (
                <Marker
                  key={`nearby-${loc.placeId || loc.name || idx}-${idx}`}
                  position={[loc.latitude, loc.longitude]}
                  icon={icon}
                  eventHandlers={{ click: () => onMarkerClick(loc) }}
                  riseOnHover={true}
                  zIndexOffset={isSelected ? 1200 : 900}
                />
              );
            })}
          </>
        ) : (
        <>
          {/* Category/location markers */}
          {!activeSearchLocation && !isRoutingActive && (
            shouldCluster ? (
              <MarkerClusterGroup disableClusteringAtZoom={18} spiderfyOnMaxZoom={true} zoomToBoundsOnClick={true}>
                {locations.map((loc, idx) => {
                const baseIcon = getIconForLocation(loc);
                const selLat = selectedLocation?.latitude ?? selectedLocation?.lat;
                const selLng = selectedLocation?.longitude ?? selectedLocation?.lng;
                const isSelected =
                  Number.isFinite(selLat) &&
                  Number.isFinite(selLng) &&
                  Math.abs(selLat - loc.latitude) < 1e-6 &&
                  Math.abs(selLng - loc.longitude) < 1e-6;

                const icon = isSelected ? scaleIcon(baseIcon, 1.7) : baseIcon;

                return (
                  <Marker
                    key={`${loc.name}-${idx}`}
                    position={[loc.latitude, loc.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => onMarkerClick(loc)
                    }}
                    className={selectedLocation && selectedLocation.name === loc.name ? 'highlighted-marker' : ''}
                    zIndexOffset={isSelected ? 1100 : 0}
                  />
                );
              })}
              </MarkerClusterGroup>
            ) : (
              locations.map((loc, idx) => {
                const baseIcon = getIconForLocation(loc);
                const selLat = selectedLocation?.latitude ?? selectedLocation?.lat;
                const selLng = selectedLocation?.longitude ?? selectedLocation?.lng;
                const isSelected =
                  Number.isFinite(selLat) &&
                  Number.isFinite(selLng) &&
                  Math.abs(selLat - loc.latitude) < 1e-6 &&
                  Math.abs(selLng - loc.longitude) < 1e-6;

                const icon = isSelected ? scaleIcon(baseIcon, 1.7) : baseIcon;

                return (
                  <Marker
                    key={`${loc.name}-${idx}`}
                    position={[loc.latitude, loc.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => onMarkerClick(loc)
                    }}
                    className={selectedLocation && selectedLocation.name === loc.name ? 'highlighted-marker' : ''}
                    zIndexOffset={isSelected ? 1100 : 0}
                  />
                );
              })
            )
          )}
        </>
      )}
    </>
  );
}

// Create a ref-forwarded version of LeftSideBarTesting
const LeftSideBarTestingWithRef = forwardRef((props, ref) => {
  return <LeftSideBarTesting {...props} ref={ref} />;
});

function MapComponentTesting({  }) {
  const mapRef = useRef();
  const leftSidebarRef = useRef();
  const location = useLocation();
  const [currentTown, setCurrentTown] = useState('Kuching');
  const [shouldZoom, setShouldZoom] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activeOption, setActiveOption] = useState('Major Town');
  const [selectedSearchPlace, setSelectedSearchPlace] = useState(null);
  // Keep a single source of truth for the search-bar-selected place
  const [selectedSearchBarPlace, setSelectedSearchBarPlace] = useState(null);
  const [activeSearchLocation, setActiveSearchLocation] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [searchBarZoomTrigger, setSearchBarZoomTrigger] = useState(0);
  const [osrmRouteCoords, setOsrmRouteCoords] = useState([]);
  const [osrmWaypoints, setOsrmWaypoints] = useState([]);
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [routeAlternatives, setRouteAlternatives] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [searchNearbyPlaces, setSearchNearbyPlaces] = useState([]);
  // Keep backend-sourced nearby places separate, then combine
  const [backendNearbyPlaces, setBackendNearbyPlaces] = useState([]);
  // Default nearby filter: Restaurants
  const [nearbyFilterCategory, setNearbyFilterCategory] = useState('restaurant');

  // Merge and dedup helper: prefers backend entries first, then external "fetch" entries
  const mergeAndDedupNearby = useCallback((externalArr = [], backendArr = []) => {
    const result = [];
    const seen = new Set();
    const getLat = (p) =>
      typeof p?.geometry?.location?.lat === 'function'
        ? p.geometry.location.lat()
        : p?.geometry?.location?.lat ?? p.latitude;
    const getLng = (p) =>
      typeof p?.geometry?.location?.lng === 'function'
        ? p.geometry.location.lng()
        : p?.geometry?.location?.lng ?? p.longitude;
    const makeKey = (p) => {
      const name = String(p?.name || '').toLowerCase().trim();
      const lat = getLat(p);
      const lng = getLng(p);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return `${name}|unknown`;
      // Round to 6 decimals to avoid floating noise
      return `${name}|${lat.toFixed(6)}|${lng.toFixed(6)}`;
    };

    // Backend first to preserve its precedence
    for (const p of backendArr) {
      const key = makeKey(p);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    }
    // External list next
    for (const p of externalArr) {
      const key = makeKey(p);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    }
    return result;
  }, []);

  // Fetch backend locations and approved businesses near the selected search place
  useEffect(() => {
    if (!selectedSearchBarPlace) {
      setBackendNearbyPlaces([]);
      return;
    }

    const lat =
      selectedSearchBarPlace?.coordinates?.latitude ?? selectedSearchBarPlace?.latitude;
    const lng =
      selectedSearchBarPlace?.coordinates?.longitude ?? selectedSearchBarPlace?.longitude;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setBackendNearbyPlaces([]);
      return;
    }

    const backendUrl = import.meta.env.VITE_DEPLOYMENT_BACKEND || 'http://localhost:5050';
    const radiusMeters = 1500;

    // Local Haversine in meters
    const distanceMeters = (aLat, aLng, bLat, bLng) => {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371000;
      const dLat = toRad(bLat - aLat);
      const dLon = toRad(bLng - aLng);
      const lat1 = toRad(aLat);
      const lat2 = toRad(bLat);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };

    const fetchNearbyBackend = async () => {
      try {
        const [locRes, bizRes] = await Promise.all([
          fetch(`${backendUrl}/api/locations`),
          fetch(`${backendUrl}/api/businesses/approved`),
        ]);

        const locations = locRes.ok ? await locRes.json() : [];
        const bizJson = bizRes.ok ? await bizRes.json() : null;
        const businesses = Array.isArray(bizJson?.data) ? bizJson.data : [];

        const nearbyLocations = locations
          .filter((l) => Number.isFinite(l?.latitude) && Number.isFinite(l?.longitude))
          .filter((l) => distanceMeters(lat, lng, l.latitude, l.longitude) <= radiusMeters)
          .map((l) => ({
            id: l._id ?? l.id,
            place_id: l._id ?? l.id,
            name: l.name,
            latitude: l.latitude,
            longitude: l.longitude,
            category: l.category || l.type,
            type: l.type || 'location',
            vicinity: l.division || l.description || '',
            description: l.description,
            division: l.division,
            url: l.url,
            image: l.image, // Location image field
            status: l.status,
            source: 'backend_location',
            // Additional metadata for display
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
          }));

        const nearbyBusinesses = businesses
          .filter((b) => Number.isFinite(b?.latitude) && Number.isFinite(b?.longitude))
          .filter((b) => distanceMeters(lat, lng, b.latitude, b.longitude) <= radiusMeters)
          .map((b) => ({
            id: b._id,
            place_id: b._id,
            name: b.name,
            latitude: b.latitude,
            longitude: b.longitude,
            category: b.category,
            type: 'business',
            vicinity: b.address || '',
            description: b.description,
            address: b.address,
            phone: b.phone,
            website: b.website,
            openingHours: b.openingHours,
            owner: b.owner,
            ownerEmail: b.ownerEmail,
            businessImage: b.businessImage, // Business image field
            ownerAvatar: b.ownerAvatar,
            status: b.status,
            priority: b.priority,
            submissionDate: b.submissionDate,
            source: 'backend_business',
            // Additional metadata for display
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
          }));

        setBackendNearbyPlaces([...nearbyLocations, ...nearbyBusinesses]);
      } catch (err) {
        console.warn('Failed fetching backend nearby places:', err);
        setBackendNearbyPlaces([]);
      }
    };

    fetchNearbyBackend();
  }, [selectedSearchBarPlace]);

  // Combine external "fetch locations" with backend nearby and dedup
  const combinedNearbyPlaces = useMemo(() => {
    return mergeAndDedupNearby(searchNearbyPlaces, backendNearbyPlaces);
  }, [searchNearbyPlaces, backendNearbyPlaces, mergeAndDedupNearby]);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [destinationInput, setDestinationInput] = useState('');

  const [routeInfo, setRouteInfo] = useState({
    startingPoint: '',
    destination: '',
    startingPointCoords: null,
    destinationCoords: null
  });
  const [baseLayer, setBaseLayer] = useState({
    id: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  });

  // Ref to store the addToRecent function from LeftSideBarTesting
  const addToRecentRef = useRef(null);
  const openRecentSectionRef = useRef(null);
  const toggleBookmarkRef = useRef(null);

  // New state for CustomInfoWindow
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const { addBookmark } = UseBookmarkContext();

  // Function to close info window
  const closeInfoWindow = () => {
    setSelectedLocation(null);
    setShowReviewPage(false);
  };

  // Updated handleDirectionsClick function
  const handleDirectionsClick = (locationData) => {
  console.log('Directions clicked for:', locationData);
  
  // Use the ref to call LeftSideBarTesting's internal method
  if (leftSidebarRef.current && leftSidebarRef.current.setDestinationFromExternal) {
    leftSidebarRef.current.setDestinationFromExternal(
      locationData.name, 
      { 
        lat: locationData.latitude || locationData.coordinates?.latitude, 
        lng: locationData.longitude || locationData.coordinates?.longitude 
      }
    );
  }
  
  // Open the sidebar
  setIsSidebarExpanded(true);
  
  // Close the info window
  setSelectedLocation(null);
  
  // toast.success(`"${locationData.name}" set as destination`);
};

  // Function to clear all routing data
  const clearAllRoutingData = () => {
    setOsrmRouteCoords([]);
    setOsrmWaypoints([]);
    setIsRoutingActive(false);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setNearbyPlaces([]);
  };

  // Fetch Major Towns from backend on initial load
  const fetchMajorTowns = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch('/api/locations', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) return [];
      const data = await res.json();

      // Filter to only include Major Town locations
      const majorTowns = data
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
          image: item.image,
          description: item.description || 'Major Town in Sarawak',
          type: 'Major Town',
          source: 'backend',
          division: item.division || '',
          url: item.url || '',
          category: item.category || 'Major Town'
        }));

      return majorTowns;
    } catch (error) {
      console.error('Major Towns fetch error:', error);
      return [];
    }
  }, []);

  // Handler for when MapViewMenu selects a category
  const handleMenuSelect = (category, data) => {
    closeInfoWindow();
    setSelectedSearchBarPlace(null);
    setActiveOption(category);
    setLocations(data || []);
    setZoomTrigger(z => z + 1);
    clearAllRoutingData();
  };

  // Handler for when the search bar selects a place
  const handlePlaceSelect = (place) => {
    closeInfoWindow();
    setLocations([]);
    // Keep MapViewMenu inactive during search
    setActiveOption(null);
    // Clear any existing routing (polyline, markers, and sidebar state)
    clearAllRoutingData();
    if (leftSidebarRef.current && leftSidebarRef.current.clearAllRouting) {
      leftSidebarRef.current.clearAllRouting();
    }
    setActiveSearchLocation(null);
    setSelectedSearchBarPlace(null);
    setSelectedSearchBarPlace({ ...place });
  };

  // Handler for when MapViewMenu wants to zoom to a place
  const handleZoomToPlace = (place) => {
    closeInfoWindow();
    setSelectedSearchPlace(place);
  };

  // Handler for marker clicks - UPDATED to handle route markers
  const handleMarkerClick = async (location) => {
  const normalizedLocation = {
    ...location,
    latitude: location.coordinates?.latitude || location.latitude,
    longitude: location.coordinates?.longitude || location.longitude,
    coordinates: location.coordinates
  };

  if (selectedLocation && selectedLocation.name === location.name) {
    closeInfoWindow();
  } else {
    setSelectedLocation(normalizedLocation);
    
    if (mapRef.current) {
      const map = mapRef.current;
      const markerPosition = [normalizedLocation.latitude, normalizedLocation.longitude];
      const currentZoom = map.getZoom();
      const optimalZoom = Math.max(15, Math.min(currentZoom + 4, 18)); 
      
      map.flyTo(markerPosition, optimalZoom, {
        duration: 1.8,
        easeLinearity: 0.25
      });
    }
  }
};

  // Handler for closing the info window
  const handleCloseInfoWindow = () => {
    closeInfoWindow();
  };

  // Handler for opening login modal
  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
  };

  // Show login modal ONCE when redirected from profile settings after logout
  useEffect(() => {
    const showOnce = location.state?.showLoginOnce;
    const dismissed = localStorage.getItem('profileLoginModalDismissed') === 'true';
    if (showOnce) {
      if (!dismissed) {
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
      }
      // Clear navigation state to avoid re-triggering
      window.history.replaceState({}, '', location.pathname + location.search);
    }
  }, [location.state, location.pathname, location.search]);

  const handleLoginModalClose = () => {
    localStorage.setItem('profileLoginModalDismissed', 'true');
    setShowLoginModal(false);
  };

  // Handle navigation state for bookmark toggle
  useEffect(() => {
    if (location.state?.openBookmark && toggleBookmarkRef.current) {
      setTimeout(() => {
        toggleBookmarkRef.current();
      }, 100);
    }
  }, [location.state]);

  // Fetch Major Town data on component mount
  useEffect(() => {
    const loadInitialMajorTowns = async () => {
      if (locations.length === 0 && !selectedSearchBarPlace) {
        const majorTowns = await fetchMajorTowns();
        if (majorTowns.length > 0) {
          setLocations(majorTowns);
          if (mapRef.current) {
            const bounds = L.latLngBounds(
              majorTowns.map(loc => [loc.latitude, loc.longitude])
            );
            mapRef.current.fitBounds(bounds);
          }
        }
      }
    };

    loadInitialMajorTowns();
  }, [fetchMajorTowns, locations.length, selectedSearchBarPlace]);

  // Fit map to markers when locations change
  useEffect(() => {
    if (!selectedSearchBarPlace && !selectedSearchPlace && locations.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      );
      mapRef.current.fitBounds(bounds);
    }
  }, [locations, selectedSearchBarPlace, selectedSearchPlace]);

  // Close info window when map is clicked
  useEffect(() => {
    const handleMapClick = (e) => {
      const target = e.target;
      const isMarker = target.closest('.leaflet-marker-icon') || 
                      target.closest('.leaflet-popup') ||
                      target.closest('.custom-info-window-container') ||
                      target.closest('.leaflet-control-container');
      
      if (!isMarker) {
        closeInfoWindow();
      }
    };

    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement) {
      mapElement.addEventListener('click', handleMapClick);
    }

    return () => {
      if (mapElement) {
        mapElement.removeEventListener('click', handleMapClick);
      }
    };
  }, []);

  // Close info window when routing becomes active
  useEffect(() => {
    if (isRoutingActive) {
      closeInfoWindow();
    }
  }, [isRoutingActive]);

  // Keep map view centered on search anchor when filter changes
  useEffect(() => {
    if (selectedSearchBarPlace && mapRef.current) {
      const lat = selectedSearchBarPlace?.coordinates?.latitude ?? selectedSearchBarPlace?.latitude;
      const lng = selectedSearchBarPlace?.coordinates?.longitude ?? selectedSearchBarPlace?.longitude;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapRef.current.panTo([lat, lng], { animate: true });
      }
    }
  }, [nearbyFilterCategory, selectedSearchBarPlace]);

  // Pan to activeSearchLocation as it changes (recent/bookmark selections)
  useEffect(() => {
    if (activeSearchLocation && mapRef.current) {
      const lat = activeSearchLocation?.coordinates?.latitude ?? activeSearchLocation?.latitude;
      const lng = activeSearchLocation?.coordinates?.longitude ?? activeSearchLocation?.longitude;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapRef.current.panTo([lat, lng], { animate: true });
      }
    }
  }, [activeSearchLocation]);

  // NEW: Clear search bar plotting when starting route direction
  useEffect(() => {
    if (routeInfo.startingPointCoords || routeInfo.destinationCoords || isRoutingActive) {
      setSelectedSearchBarPlace(null);
    }
  }, [routeInfo.startingPointCoords, routeInfo.destinationCoords, isRoutingActive]);

  // Use route destination (or starting point) as anchor for nearby while routing
  useEffect(() => {
    if (!isRoutingActive) return;
    const dest = routeInfo.destinationCoords || routeInfo.startingPointCoords;
    const lat = dest?.lat;
    const lng = dest?.lng;

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setSelectedSearchBarPlace({
        name: routeInfo.destination || 'Destination',
        latitude: lat,
        longitude: lng,
        type: 'Destination'
      });
    } else {
      setSelectedSearchBarPlace(null);
    }
  }, [isRoutingActive, routeInfo.destinationCoords, routeInfo.startingPointCoords, routeInfo.destination]);

  // Memoize callback functions to prevent infinite re-renders
  const handleRouteAlternativesChange = useCallback((alternatives, selectedIndex) => {
    setRouteAlternatives(alternatives);
    setSelectedRouteIndex(selectedIndex);
  }, []);

  const handleNearbyPlacesChange = useCallback((places) => {
    setNearbyPlaces(places);
  }, []);

  // Robust category matcher (Restaurants, Toilets, Pharmacies)
  const matchesCategory = useCallback((place, cat) => {
    if (!cat || cat === 'all') return true;
    const tokens = [
      (place.category || ''),
      (place.type || ''),
      (place.subcategory || ''),
      (place.class || ''),
      ...(Array.isArray(place.categories) ? place.categories : []),
      ...(Array.isArray(place.tags) ? place.tags : []),
      ...(Array.isArray(place?.properties?.categories) ? place.properties.categories : []),
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());

    if (cat === 'restaurant') {
      return tokens.some((s) =>
        s.includes('restaurant') || s.includes('food') || s.includes('cafe') || s.includes('eat')
      );
    }
    if (cat === 'toilet') {
      return tokens.some((s) =>
        s.includes('toilet') || s.includes('restroom') || s.includes('washroom') || s === 'wc'
      );
    }
    if (cat === 'pharmacy') {
      return tokens.some((s) =>
        s.includes('pharmacy') || s.includes('chemist') || s.includes('drugstore')
      );
    }
    if (cat === 'hotel') {
      return tokens.some((s) =>
        s.includes('hotel') || s.includes('accommodation') || s.includes('guest')
      );
    }
    return false;
  }, []);

  // Filter nearby places around the search location by selected category (use combined)
  const filteredNearbyPlaces = useMemo(() => {
    return (combinedNearbyPlaces || []).filter((p) => matchesCategory(p, nearbyFilterCategory));
  }, [combinedNearbyPlaces, nearbyFilterCategory, matchesCategory]);

  const handleRouteInfoChange = useCallback((info) => {
    setRouteInfo(info);
  }, []);

  // Listen for nearby place selection events
  useEffect(() => {
    const handleNearbyPlaceSelected = (event) => {
      const placeData = event.detail;
      setSelectedLocation(placeData);
      
      if (mapRef.current) {
        const map = mapRef.current;
        const markerPosition = [placeData.latitude, placeData.longitude];
        const currentZoom = map.getZoom();
        const optimalZoom = Math.max(15, Math.min(currentZoom + 4, 18)); 
        
        map.flyTo(markerPosition, optimalZoom, {
          duration: 1.8,
          easeLinearity: 0.25
        });
      }
    };

    window.addEventListener('nearbyPlaceSelected', handleNearbyPlaceSelected);
    return () => {
      window.removeEventListener('nearbyPlaceSelected', handleNearbyPlaceSelected);
    };
  }, []);

  useEffect(() => {
    const routingActive =
      !!osrmRouteCoords[0] &&
      !!osrmRouteCoords[osrmRouteCoords.length - 1] &&
      (osrmWaypoints.length === 0 || osrmWaypoints.some(Boolean));
    setIsRoutingActive(routingActive);
  }, [osrmRouteCoords, osrmWaypoints]);

  // Enhanced createRouteMarkerLocation function with prioritized data fetching sequence
  const createRouteMarkerLocation = async (position, type, name, description, routeInfo = {}) => {
    let detailedDescription = description;
    let address = '';
    let division = '';
    let enhancedData = {};
    let dataFound = false;
    
    // Use Vite environment variable syntax
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';
    
    try {
      // Step 1: Check backend location data first
      try {
        const locationResponse = await fetch(`${backendUrl}/api/locations?category=All`);
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          
          // Find closest location within 100m radius
          const closestLocation = locationData.find(location => {
            if (!location.latitude || !location.longitude) return false;
            
            const distance = calculateDistance(
              position[0], position[1],
              location.latitude, location.longitude
            );
            return distance <= 0.1; // 100m in kilometers
          });
          
          if (closestLocation) {
            enhancedData = {
              name: closestLocation.name || name,
              category: closestLocation.category || type,
              description: closestLocation.description || description,
              division: closestLocation.division || '',
              website: closestLocation.url || routeInfo.website || '',
              image: closestLocation.image || null,
              source: 'backend_location'
            };
            
            address = closestLocation.description || '';
            division = closestLocation.division || '';
            dataFound = true;
            
            console.log('Found matching backend location data');
          }
        }
      } catch (locationError) {
        console.log('Backend location API not available');
      }

      // Step 2: If no location data found, check business locations
      if (!dataFound) {
        try {
          const businessResponse = await fetch(`${backendUrl}/api/businesses/approved`);
          if (businessResponse.ok) {
            const businessData = await businessResponse.json();
            
            if (businessData.success && businessData.data) {
              // Find closest business within 100m radius
              const closestBusiness = businessData.data.find(business => {
                if (!business.latitude || !business.longitude) return false;
                
                const distance = calculateDistance(
                  position[0], position[1],
                  business.latitude, business.longitude
                );
                return distance <= 0.1; // 100m in kilometers
              });
              
              if (closestBusiness) {
                enhancedData = {
                  name: closestBusiness.name || name,
                  category: closestBusiness.category || type,
                  description: closestBusiness.description || description,
                  division: closestBusiness.division || '',
                  website: closestBusiness.website || routeInfo.website || '',
                  phone: closestBusiness.phone || routeInfo.phone || '',
                  ownerEmail: closestBusiness.ownerEmail || routeInfo.ownerEmail || '',
                  openingHours: closestBusiness.openingHours || routeInfo.openingHours || '',
                  businessImage: closestBusiness.businessImage || null,
                  rating: closestBusiness.rating || null,
                  source: 'backend_business'
                };
                
                address = closestBusiness.address || '';
                division = closestBusiness.division || '';
                dataFound = true;
                
                console.log('Found matching business data');
              }
            }
          }
        } catch (businessError) {
          console.log('Backend business API not available');
        }
      }

      // Step 3: If still no data found, check event locations
      if (!dataFound) {
        try {
          const eventResponse = await fetch(`${backendUrl}/api/event/getAllEvents`);
          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            
            if (eventData.success && eventData.data) {
              // Find closest event within 100m radius
              const closestEvent = eventData.data.find(event => {
                if (!event.latitude || !event.longitude) return false;
                
                const distance = calculateDistance(
                  position[0], position[1],
                  event.latitude, event.longitude
                );
                return distance <= 0.1; // 100m in kilometers
              });
              
              if (closestEvent) {
                enhancedData = {
                  name: closestEvent.name || name,
                  category: 'Events',
                  description: closestEvent.description || description,
                  division: closestEvent.division || '',
                  website: closestEvent.website || routeInfo.website || '',
                  phone: closestEvent.phone || routeInfo.phone || '',
                  ownerEmail: closestEvent.ownerEmail || routeInfo.ownerEmail || '',
                  image: closestEvent.imageUrl || null,
                  
                  // Event-specific details
                  startDate: closestEvent.startDate || routeInfo.startDate || '',
                  endDate: closestEvent.endDate || routeInfo.endDate || '',
                  startTime: closestEvent.startTime || routeInfo.startTime || '',
                  endTime: closestEvent.endTime || routeInfo.endTime || '',
                  eventType: closestEvent.eventType || routeInfo.eventType || '',
                  registrationRequired: closestEvent.registrationRequired || routeInfo.registrationRequired || '',
                  
                  source: 'backend_event'
                };
                
                address = closestEvent.address || '';
                division = closestEvent.division || '';
                dataFound = true;
                
                console.log('Found matching event data');
              }
            }
          }
        } catch (eventError) {
          console.log('Backend event API not available');
        }
      }

      // Step 4: Skip reverse geocoding; use provided details directly
      if (!dataFound) {
        address = routeInfo.address || '';
        division = routeInfo.division || '';
        detailedDescription = description;
      }

    } catch (error) {
      console.log('Enhanced data fetching failed, using coordinates only');
    }
    
    return {
      name: enhancedData.name || name,
      latitude: position[0],
      longitude: position[1],
      description: enhancedData.description || detailedDescription,
      type: type,
      coordinates: {
        latitude: position[0],
        longitude: position[1]
      },
      // Enhanced location details from prioritized sources
      address: address,
      division: division,
      website: enhancedData.website || routeInfo.website || '',
      phone: enhancedData.phone || routeInfo.phone || '',
      ownerEmail: enhancedData.ownerEmail || routeInfo.ownerEmail || '',
      openingHours: enhancedData.openingHours || routeInfo.openingHours || '',
      
      // Event details (for destination markers that might be events)
      startDate: enhancedData.startDate || routeInfo.startDate || '',
      endDate: enhancedData.endDate || routeInfo.endDate || '',
      startTime: enhancedData.startTime || routeInfo.startTime || '',
      endTime: enhancedData.endTime || routeInfo.endTime || '',
      eventType: enhancedData.eventType || routeInfo.eventType || '',
      registrationRequired: enhancedData.registrationRequired || routeInfo.registrationRequired || '',
      
      // Business details
      category: enhancedData.category || type,
      rating: enhancedData.rating || null,
      // businessImage: enhancedData.businessImage || null,
      image: enhancedData.image || routeInfo.image || routeInfo.imageUrl || routeInfo.businessImage || null,
      
      // POI details from Overpass (only as fallback)
      amenity: enhancedData.amenity || '',
      tourism: enhancedData.tourism || '',
      shop: enhancedData.shop || '',
      leisure: enhancedData.leisure || '',
      
      // Source tracking for debugging
      source: enhancedData.source || 'route_marker',
      dataEnhanced: dataFound
    };
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Left Sidebar with ref */}
      <LeftSideBarTestingWithRef 
        ref={leftSidebarRef}
        setOsrmRouteCoords={setOsrmRouteCoords}
        setOsrmWaypoints={setOsrmWaypoints}
        setIsRoutingActive={setIsRoutingActive}
        onBasemapChange={setBaseLayer}
        setSelectedSearchBarPlace={setSelectedSearchBarPlace}
        setSelectedPlace={setSelectedLocation}
        selectedPlace={selectedLocation}
        onRouteAlternativesChange={handleRouteAlternativesChange}
        onNearbyPlacesChange={handleNearbyPlacesChange}
        onRouteInfoChange={handleRouteInfoChange}
        onClearAllRouting={clearAllRoutingData}
        onSetAddToRecentRef={(func) => {
          addToRecentRef.current = func;
        }}
        onSetOpenRecentSectionRef={(func) => {
          openRecentSectionRef.current = func;
        }}
        onSetToggleBookmarkRef={(func) => {
          toggleBookmarkRef.current = func;
        }}
        isExpand={isSidebarExpanded}
        setIsExpand={setIsSidebarExpanded}
        destinationInput={destinationInput}
        setDestinationInput={setDestinationInput}
        selectedSearchBarPlace={selectedSearchBarPlace}
        // Use combined list so backend+external stay together
        searchNearbyPlaces={combinedNearbyPlaces}
        nearbyFilterCategory={nearbyFilterCategory}
        onNearbyFilterCategoryChange={setNearbyFilterCategory}
        setActiveSearchLocation={setActiveSearchLocation}
        activeSearchLocation={activeSearchLocation}
      />

      {/* Top Header Container */}
      <div className="top-header-container">
        <div className="header-elements-wrapper">
          <div className="search-mapview-group">
            <SearchBarTesting 
              onPlaceSelected={handlePlaceSelect} 
              onAddToRecent={(location) => {
                if (addToRecentRef.current) {
                  addToRecentRef.current(location);
                }
              }}
              onOpenRecentSection={() => {
                if (openRecentSectionRef.current) {
                  openRecentSectionRef.current();
                }
              }}
            />
            <MapViewMenu 
              onSelect={handleMenuSelect}
              activeOption={isRoutingActive ? null : activeOption}
              onZoomToPlace={handleZoomToPlace}
              isRoutingActive={isRoutingActive}
              onClearRouting={clearAllRoutingData}
              // NEW: prevent search-active state while routing
              isSearchActive={!isRoutingActive && !!selectedSearchBarPlace}
            />
          </div>
          <div className="weather-profile-group">
            <WeatherDateTimeTesting
              currentTown={currentTown}
              setCurrentTown={setCurrentTown}
              shouldZoom={shouldZoom}
              setShouldZoom={setShouldZoom}
            />
            <ProfileDropdown 
              onLoginClick={() => setShowLoginModal(true)} 
              onBookmarkToggle={() => {
                if (toggleBookmarkRef.current) {
                  toggleBookmarkRef.current();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* The Map */}
      <MapContainer
        center={sarawakCenter}
        zoom={7.5}
        minZoom={7}
        maxZoom={18}
        style={{ width: '100vw', height: '100vh', zIndex: 1 }}
        maxBounds={sarawakBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        scrollWheelZoom={true}
        ref={mapRef}
        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
      >
        <TileLayer key={baseLayer.id} url={baseLayer.url} attribution={baseLayer.attribution} />
        <MapContent
          locations={locations}
          nearbyPlaces={filteredNearbyPlaces}
          activeSearchLocation={activeSearchLocation || selectedSearchBarPlace}
          activeCategory={activeOption}
          isRoutingActive={isRoutingActive}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
        />
        {/* Allow nearby fetcher to run during routing so markers show */}
        {selectedSearchBarPlace && (
          <SearchHandlerTesting
            selectedSearchBarPlace={selectedSearchBarPlace}
            setSearchNearbyPlaces={setSearchNearbyPlaces}
            searchBarZoomTrigger={searchBarZoomTrigger}
          />
        )}
        {activeSearchLocation && (
          <SearchHandlerTesting
            selectedSearchBarPlace={activeSearchLocation}
            setSearchNearbyPlaces={setSearchNearbyPlaces}
            searchBarZoomTrigger={searchBarZoomTrigger}
          />
        )}
        <WeatherTownHandlerTesting
          currentTown={currentTown}
          shouldZoom={shouldZoom}
          setShouldZoom={setShouldZoom}
        />
        <ZoomHandlerTesting 
          selectedSearchPlace={selectedSearchPlace} 
          selectedCategory={activeOption}
          zoomTrigger={zoomTrigger}
        />
        {osrmRouteCoords.length > 0 && (
          <>
            {/* Start marker - Green */}
            <Marker 
              position={osrmRouteCoords[0]} 
              icon={startMarkerIcon}
              eventHandlers={{
                click: async () => {
                  const startLocation = await createRouteMarkerLocation(
                    osrmRouteCoords[0],
                    'Starting Point',
                    routeInfo.startingPoint || 'Starting Point',
                    'Your selected starting location',
                    {
                      address: routeInfo.startingPoint || routeInfo.address || '',
                      website: routeInfo.website,
                      phone: routeInfo.phone,
                      ownerEmail: routeInfo.email,
                      openingHours: routeInfo.openingHours,
                      startDate: routeInfo.startDate,
                      endDate: routeInfo.endDate,
                      eventType: routeInfo.eventType,
                      registrationRequired: routeInfo.registrationRequired,
                      image: routeInfo.image || routeInfo.imageUrl || routeInfo.businessImage
                    }
                  );
                  handleMarkerClick(startLocation);
                }
              }}
            />

            {/* Waypoint markers - Custom numbered */}
            {osrmWaypoints && osrmWaypoints.length > 0 && osrmWaypoints.map((pos, idx) => (
              <Marker 
                key={`waypoint-${idx}`} 
                position={[pos.lat, pos.lng]} 
                icon={createWaypointMarkerIcon(idx + 1)}
                eventHandlers={{
                  click: async () => {
                    const waypointInfo = routeInfo.waypoints?.[idx] || {};
                    const waypointLocation = await createRouteMarkerLocation(
                      [pos.lat, pos.lng],
                      'Waypoint',
                      waypointInfo.name || `Waypoint ${idx + 1}`,
                      `Stop ${idx + 1} on your route`,
                      waypointInfo
                    );
                    handleMarkerClick(waypointLocation);
                  }
                }}
              />
            ))}

            {/* End marker - Red */}
            <Marker 
              position={osrmRouteCoords[osrmRouteCoords.length - 1]} 
              icon={endMarkerIcon}
              eventHandlers={{
                click: async () => {
                  const endLocation = await createRouteMarkerLocation(
                    osrmRouteCoords[osrmRouteCoords.length - 1],
                    'Destination',
                    routeInfo.destination || 'Destination',
                    'Your selected destination',
                    {
                      address: routeInfo.destination || routeInfo.address || '',
                      website: routeInfo.website,
                      phone: routeInfo.phone,
                      ownerEmail: routeInfo.email,
                      openingHours: routeInfo.openingHours,
                      startDate: routeInfo.startDate,
                      endDate: routeInfo.endDate,
                      startTime: routeInfo.startTime,
                      endTime: routeInfo.endTime,
                      eventType: routeInfo.eventType,
                      registrationRequired: routeInfo.registrationRequired,
                      image: routeInfo.image || routeInfo.imageUrl || routeInfo.businessImage
                    }
                  );
                  handleMarkerClick(endLocation);
                }
              }}
            />
            
            {/* Route polylines - show all alternatives */}
            {routeAlternatives.map((route, index) => {
              return (
                <Polyline 
                  key={index}
                  positions={route.coords} 
                  color={index === selectedRouteIndex ? "blue" : "lightblue"} 
                  weight={index === selectedRouteIndex ? 5 : 3}
                  opacity={index === selectedRouteIndex ? 1 : 0.6}
                />
              );
            })}
            <MapZoomControllerTesting routeCoords={osrmRouteCoords} />
          </>
        )}
      </MapContainer>

      {/* Custom Info Window - UPDATED to show route markers */}
      {selectedLocation && !showReviewPage && (
        <div className="custom-info-window-container"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '350px',
            transform: 'translateY(-50%)',
            zIndex: 20000
          }}
        >
          <CustomInfoWindow
            location={selectedLocation}
            addBookmark={addBookmark}
            onCloseClick={handleCloseInfoWindow}
            onOpenLoginModal={handleOpenLoginModal}
            onDirectionsClick={handleDirectionsClick}
            // Add custom props for route markers
            isRouteMarker={selectedLocation.type === 'Starting Point' || selectedLocation.type === 'Destination' || selectedLocation.type === 'Waypoint'}
            routeMarkerType={selectedLocation.type}
          />
        </div>
      )}

      {/* Tourist Info Section (YouTube Reels) - Only show for non-route markers */}
      {selectedLocation &&
        <TouristInfoSection selectedLocation={selectedLocation} />
      } 

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={handleLoginModalClose} />}

      {/* Ai Chatbot */}
      <AiChatbot />

      {/* Event Notification */}
      <EventNotificationPanel />
    </div>
  );
}

export default MapComponentTesting;
