import React, { useRef, useState, useEffect, useCallback, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import carIcon from '../assets/car.gif';
import homestayIcon from '../assets/homestay.gif';
import townIcon from '../assets/majortown.gif';
import shoppingIcon from '../assets/shopping.gif';
import foodIcon from '../assets/food.gif';
import museumIcon from '../assets/museum.gif';
import tourIcon from '../assets/tour.gif';
import eventIcon from '../assets/event.gif';
import restaurantIcon from '../assets/restaurant.png';

import MapViewMenu from './MapViewMenu';
import CustomInfoWindow from './CustomInfoWindow';
import ReviewPage from '../pages/ReviewPage';
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

const searchPlaceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
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
  'Starting Point': startMarkerIcon,
  'Destination': endMarkerIcon,
  'Waypoint': waypointMarkerIcon,
};

// Separate component for map content to ensure proper context
function MapContent({ locations, nearbyPlaces, selectedSearchBarPlace, activeCategory, isRoutingActive, onMarkerClick, selectedLocation }) {
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

      {/* Show search bar marker and its nearby places if a search bar place is selected */}
      {selectedSearchBarPlace && selectedSearchBarPlace.latitude && selectedSearchBarPlace.longitude ? (
        <>
          <Marker
            position={[selectedSearchBarPlace.coordinates?.latitude || selectedSearchBarPlace.latitude, selectedSearchBarPlace.coordinates?.longitude || selectedSearchBarPlace.longitude]}
            icon={searchPlaceIcon}
            eventHandlers={{
              click: () => onMarkerClick(selectedSearchBarPlace)
            }}
          />
          <MarkerClusterGroup disableClusteringAtZoom={18} zoomToBoundsOnClick={true}>
            {nearbyPlaces.map((loc, idx) => (
              <Marker
                key={`nearby-${loc.placeId}-${idx}`}
                position={[loc.latitude, loc.longitude]}
                icon={categoryIcons['Restaurant']}
                eventHandlers={{
                  click: () => onMarkerClick(loc)
                }}
              />
            ))}
          </MarkerClusterGroup>
        </>
      ) : (
        <>
          {/* Category/location markers */}
          {!selectedSearchBarPlace && !isRoutingActive && (
            shouldCluster ? (
              <MarkerClusterGroup disableClusteringAtZoom={18} spiderfyOnMaxZoom={true} zoomToBoundsOnClick={true}>
                {locations.map((loc, idx) => {
                  const icon = getIconForLocation(loc);
                  return (
                    <Marker
                      key={`${loc.name}-${idx}`}
                      position={[loc.latitude, loc.longitude]}
                      icon={icon}
                      eventHandlers={{
                        click: () => onMarkerClick(loc)
                      }}
                      className={selectedLocation && selectedLocation.name === loc.name ? 'highlighted-marker' : ''}
                    />
                  );
                })}
              </MarkerClusterGroup>
            ) : (
              locations.map((loc, idx) => {
                const icon = getIconForLocation(loc);
                return (
                  <Marker
                    key={`${loc.name}-${idx}`}
                    position={[loc.latitude, loc.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => onMarkerClick(loc)
                    }}
                    className={selectedLocation && selectedLocation.name === loc.name ? 'highlighted-marker' : ''}
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
  const [selectedSearchBarPlace, setSelectedSearchBarPlace] = useState(null);
  const [searchNearbyPlaces, setSearchNearbyPlaces] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [searchBarZoomTrigger, setSearchBarZoomTrigger] = useState(0);
  const [osrmRouteCoords, setOsrmRouteCoords] = useState([]);
  const [osrmWaypoints, setOsrmWaypoints] = useState([]);
  const [isRoutingActive, setIsRoutingActive] = useState(false);
  const [routeAlternatives, setRouteAlternatives] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

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

  // Memoize callback functions to prevent infinite re-renders
  const handleRouteAlternativesChange = useCallback((alternatives, selectedIndex) => {
    setRouteAlternatives(alternatives);
    setSelectedRouteIndex(selectedIndex);
  }, []);

  const handleNearbyPlacesChange = useCallback((places) => {
    setNearbyPlaces(places);
  }, []);

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

  // Enhanced createRouteMarkerLocation function with reverse geocoding
  const createRouteMarkerLocation = async (position, type, name, description, routeInfo = {}) => {
    let detailedDescription = description;
    let address = '';
    let division = '';
    
    // Try to get address and division from coordinates using reverse geocoding
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[0]}&lon=${position[1]}&addressdetails=1`, {
        headers: {
          'User-Agent': 'SarawakTourismApp/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.display_name) {
          address = data.display_name;
          detailedDescription = `${description}\n\nAddress: ${address}`;
        }
        
        // Extract division/state information
        if (data.address) {
          division = data.address.state || data.address.region || data.address.county || '';
        }
        console.log('Reverse geocoding result:', data);
      }
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinates only');
    }
    
    return {
      name: name,
      latitude: position[0],
      longitude: position[1],
      description: detailedDescription,
      type: type,
      coordinates: {
        latitude: position[0],
        longitude: position[1]
      },
      // Include all possible location details
      address: address,
      division: division,
      website: routeInfo.website || '',
      phone: routeInfo.phone || '',
      ownerEmail: routeInfo.ownerEmail || '',
      openingHours: routeInfo.openingHours || '',
      startDate: routeInfo.startDate || '',
      endDate: routeInfo.endDate || '',
      startTime: routeInfo.startTime || '',
      endTime: routeInfo.endTime || '',
      eventType: routeInfo.eventType || '',
      registrationRequired: routeInfo.registrationRequired || '',
      category: type,
      source: 'route_marker'
    };
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
      >
        <TileLayer key={baseLayer.id} url={baseLayer.url} attribution={baseLayer.attribution} />
        <MapContent
          locations={locations}
          nearbyPlaces={searchNearbyPlaces}
          selectedSearchBarPlace={selectedSearchBarPlace}
          activeCategory={activeOption}
          isRoutingActive={isRoutingActive}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
        />
        {selectedSearchBarPlace && (
          <SearchHandlerTesting
            selectedSearchBarPlace={selectedSearchBarPlace}
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
                    `Starting location for your journey`,
                    {
                      website: routeInfo.startingPointWebsite,
                      phone: routeInfo.startingPointPhone,
                      ownerEmail: routeInfo.startingPointEmail,
                      address: routeInfo.startingPointAddress,
                      openingHours: routeInfo.startingPointHours
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
                    routeInfo.name,
                    routeInfo.destination || 'Destination',
                    `Your destination location`,
                    {
                      website: routeInfo.website,
                      phone: routeInfo.destinationPhone,
                      ownerEmail: routeInfo.destinationEmail,
                      address: routeInfo.destinationAddress,
                      openingHours: routeInfo.destinationHours,
                      startDate: routeInfo.startDate,
                      endDate: routeInfo.endDate,
                      startTime: routeInfo.startTime,
                      endTime: routeInfo.endTime,
                      eventType: routeInfo.eventType,
                      registrationRequired: routeInfo.registrationRequired
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
            zIndex: 1000
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
      {selectedLocation && selectedLocation.type !== 'Starting Point' && selectedLocation.type !== 'Destination' && selectedLocation.type !== 'Waypoint' && (
        <TouristInfoSection selectedLocation={selectedLocation} />
      )}

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* Ai Chatbot */}
      <AiChatbot />
    </div>
  );
}

export default MapComponentTesting;