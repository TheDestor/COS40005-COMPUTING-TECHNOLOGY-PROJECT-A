import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from 'react-router-dom';

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
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Or use your own pin image
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
};

// Separate component for map content to ensure proper context
function MapContent({ locations, nearbyPlaces, selectedSearchBarPlace, activeCategory, isRoutingActive, onMarkerClick, selectedLocation }) {
  // Helper function to get the correct icon for a location
  const getIconForLocation = (location) => {
    // Normalize the type for Events
    const locationType = location.type || 'Major Town';
    
    if (categoryIcons[location.type]) {
      // console.log('Found icon for type:', location.type);
      return categoryIcons[location.type];
    }
    
    // console.log('No icon found for type:', location.type, '- using default');
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
            // riseOnHover={false}
            // autoPan={false}
          >
            {/* <Popup>
              <strong>{selectedSearchBarPlace.name || 'Selected Place'}</strong>
              {selectedSearchBarPlace.description && <div>{selectedSearchBarPlace.description}</div>}
            </Popup> */}
          </Marker>
          <MarkerClusterGroup disableClusteringAtZoom={18} zoomToBoundsOnClick={true}>
            {nearbyPlaces.map((loc, idx) => (
              <Marker
                key={`nearby-${loc.placeId}-${idx}`}
                position={[loc.latitude, loc.longitude]}
                icon={categoryIcons['Restaurant']}
                eventHandlers={{
                  click: () => onMarkerClick(loc)
                }}
                // riseOnHover={false} 
                // autoPan={false}
              >
                {/* <Popup>{loc.name}</Popup> */}
              </Marker>
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
                      // riseOnHover={false}
                      // autoPan={false}
                    />
                    //   <Popup>
                    //     <div style={{ textAlign: 'center' }}>
                    //       <img
                    //         src={icon.options.iconUrl}
                    //         alt={loc.type}
                    //         style={{ width: 30, height: 30, marginBottom: 8 }}
                    //       />
                    //       <div>
                    //         <strong>{loc.name}</strong>
                    //         <br />
                    //         <small>Type: {loc.type}</small>
                    //         <br />
                    //         {loc.description || 'No description'}
                    //       </div>
                    //     </div>
                    //   </Popup>
                    // </Marker>
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
                  //   <Popup>
                  //     <div style={{ textAlign: 'center' }}>
                  //       <img
                  //         src={icon.options.iconUrl}
                  //         alt={loc.type}
                  //         style={{ width: 30, height: 30, marginBottom: 8 }}
                  //       />
                  //       <div>
                  //         <strong>{loc.name}</strong>
                  //         <br />
                  //         <small>Type: {loc.type}</small>
                  //         <br />
                  //         {loc.description || 'No description'}
                  //       </div>
                  //     </div>
                  //   </Popup>
                  // </Marker>
                );
              })
            )
          )}
        </>
      )}
    </>
  );
}

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
    closeInfoWindow(); // Close info window when menu category changes
    setSelectedSearchBarPlace(null);
    setActiveOption(category);
    setLocations(data || []);
    setZoomTrigger(z => z + 1);
    
    // Clear routing data when category is selected
    clearAllRoutingData();
  };

  // Handler for when the search bar selects a place
  const handlePlaceSelect = (place) => {
    closeInfoWindow(); // Close info window when new place is searched
    setLocations([]);
    setSelectedSearchBarPlace({ ...place });
  };

  // Handler for when MapViewMenu wants to zoom to a place
  const handleZoomToPlace = (place) => {
    closeInfoWindow(); // Close info window when zooming to place
    setSelectedSearchPlace(place);
  };

  // Handler for marker clicks
  const handleMarkerClick = (location) => {
    // Normalize the location data to handle both formats
    const normalizedLocation = {
      ...location,
      // If coordinates exist, use them, otherwise use direct lat/lng
      latitude: location.coordinates?.latitude || location.latitude,
      longitude: location.coordinates?.longitude || location.longitude,
      // Ensure we have the original coordinates object if it exists
      coordinates: location.coordinates
    };

    // If clicking the same marker, toggle the info window
    if (selectedLocation && selectedLocation.name === location.name) {
      closeInfoWindow();
    } else {
      setSelectedLocation(location);
      
      // Fly to the marker with smooth animation
      if (mapRef.current) {
        const map = mapRef.current;
        const markerPosition = [location.latitude, location.longitude];
        
        // Calculate optimal zoom level for a good view
        const currentZoom = map.getZoom();
        const optimalZoom = Math.max(15, Math.min(currentZoom + 4, 18)); 
        
        // Fly to the marker position with smooth animation
        map.flyTo(markerPosition, optimalZoom, {
          duration: 1.8, // Smooth animation duration
          easeLinearity: 0.25
        });
      }
    }
  };

  // Handler for closing the info window
  const handleCloseInfoWindow = () => {
    closeInfoWindow();
  };

  // Handler for showing review page
  const handleShowReview = () => {
    setShowReviewPage(true);
  };

  // Handler for opening login modal
  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
  };

  // Handle navigation state for bookmark toggle
  useEffect(() => {
    if (location.state?.openBookmark && toggleBookmarkRef.current) {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        toggleBookmarkRef.current();
      }, 100);
    }
  }, [location.state]);

  // Fetch Major Town data on component mount
  useEffect(() => {
    const loadInitialMajorTowns = async () => {
      // Only fetch if we don't have any locations yet and no search bar place is selected
      if (locations.length === 0 && !selectedSearchBarPlace) {
        const majorTowns = await fetchMajorTowns();
        if (majorTowns.length > 0) {
          setLocations(majorTowns);
          // Optionally fit the map bounds to show all major towns
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
      // Check if the click target is actually the map (not a marker or control)
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

  // Close info window when weather/town changes
  useEffect(() => {
    if (shouldZoom) {
      closeInfoWindow();
    }
  }, [shouldZoom, currentTown]);

  // Close info window when base layer changes
  useEffect(() => {
    closeInfoWindow();
  }, [baseLayer]);

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
      
      // Set the selected location to show the info window
      setSelectedLocation(placeData);
      
      // Fly to the marker with smooth animation
      if (mapRef.current) {
        const map = mapRef.current;
        const markerPosition = [placeData.latitude, placeData.longitude];
        
        // Calculate optimal zoom level for a good view
        const currentZoom = map.getZoom();
        const optimalZoom = Math.max(15, Math.min(currentZoom + 4, 18)); 
        
        // Fly to the marker position with smooth animation
        map.flyTo(markerPosition, optimalZoom, {
          duration: 1.8, // Smooth animation duration
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
    // Routing is active if both start and end are set (and valid), or if there are any waypoints
    const routingActive =
      !!osrmRouteCoords[0] && // Assuming osrmRouteCoords[0] is the start
      !!osrmRouteCoords[osrmRouteCoords.length - 1] && // Assuming osrmRouteCoords[osrmRouteCoords.length - 1] is the end
      (osrmWaypoints.length === 0 || osrmWaypoints.some(Boolean));
    setIsRoutingActive(routingActive);
  }, [osrmRouteCoords, osrmWaypoints]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Left Sidebar */}
      <LeftSideBarTesting 
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
                click: () => {
                  const startLocation = {
                    name: routeInfo.startingPoint || 'Starting Point',
                    latitude: osrmRouteCoords[0][0],
                    longitude: osrmRouteCoords[0][1],
                    description: routeInfo.startingPoint ? `Starting location: ${routeInfo.startingPoint}` : 'Your journey begins here',
                    type: 'Starting Point'
                  };
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
                  click: () => {
                    const waypointLocation = {
                      name: `Waypoint ${idx + 1}`,
                      latitude: pos.lat,
                      longitude: pos.lng,
                      description: `Stop ${idx + 1} on your route`,
                      type: 'Waypoint'
                    };
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
                click: () => {
                  const endLocation = {
                    name: routeInfo.destination || 'Destination',
                    latitude: osrmRouteCoords[osrmRouteCoords.length - 1][0],
                    longitude: osrmRouteCoords[osrmRouteCoords.length - 1][1],
                    description: routeInfo.destination ? `Destination: ${routeInfo.destination}` : 'You have arrived!',
                    type: 'Destination'
                  };
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
        
        {/* Nearby Places - No markers, only zoom functionality handled by sidebar */}
      </MapContainer>

      {/* Custom Info Window */}
      {selectedLocation && !showReviewPage && (
        <div className="custom-info-window-container"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '50%',
            left: '350px', // Fixed distance from left edge
            transform: 'translateY(-50%)',
            zIndex: 1000
          }}
        >
          <CustomInfoWindow
            location={{
              // name: selectedLocation.name,
              // image: selectedLocation.image || 'default-image.jpg',
              // description: selectedLocation.description || "No description available.",
              // latitude: selectedLocation.latitude || "N/A",
              // longitude: selectedLocation.longitude || "N/A",
              // url: selectedLocation.url || 'No URL provided',
              // rating: selectedLocation.rating,
              // openNowText: selectedLocation.openNowText,
              // open24Hours: selectedLocation.open24Hours,
              // type: selectedLocation.type
              ...selectedLocation
            }}
            addBookmark={addBookmark}
            onCloseClick={handleCloseInfoWindow}
            // onShowReview={handleShowReview}
            onOpenLoginModal={handleOpenLoginModal}
          />
        </div>
      )}

      {/* Tourist Info Section (YouTube Reels) */}
      {selectedLocation && (
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