import React, { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Sarawak bounds: [SouthWest, NorthEast]
const sarawakBounds = [
  [0.8, 109.5],   // Southwest corner (lat, lng)
  [5.5, 115.5],   // Northeast corner (lat, lng)
];
const sarawakCenter = [2.5, 112.5]; // Rough center of Sarawak

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
// In MapComponentTesting.jsx, update the MapContent component:

// Separate component for map content to ensure proper context
function MapContent({ locations, nearbyPlaces, selectedSearchBarPlace, activeCategory, isRoutingActive }) {
  // Helper function to get the correct icon for a location
  const getIconForLocation = (location) => {
    // console.log('Location type:', location.type);
    // console.log('Available types:', Object.keys(categoryIcons));
    
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
            position={[selectedSearchBarPlace.latitude, selectedSearchBarPlace.longitude]}
            icon={searchPlaceIcon}
          >
            <Popup>
              <strong>{selectedSearchBarPlace.name || 'Selected Place'}</strong>
              {selectedSearchBarPlace.description && <div>{selectedSearchBarPlace.description}</div>}
            </Popup>
          </Marker>
          <MarkerClusterGroup disableClusteringAtZoom={18}>
            {nearbyPlaces.map((loc, idx) => (
              <Marker
                key={`nearby-${loc.placeId}-${idx}`}
                position={[loc.latitude, loc.longitude]}
                icon={categoryIcons['Restaurant']}
              >
                <Popup>{loc.name}</Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </>
      ) : (
        <>
          {/* Category/location markers */}
          {!selectedSearchBarPlace && !isRoutingActive && (
            shouldCluster ? (
              <MarkerClusterGroup disableClusteringAtZoom={18}>
                {locations.map((loc, idx) => {
                  const icon = getIconForLocation(loc);
                  return (
                    <Marker
                      key={`${loc.name}-${idx}`}
                      position={[loc.latitude, loc.longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={icon.options.iconUrl}
                            alt={loc.type}
                            style={{ width: 30, height: 30, marginBottom: 8 }}
                          />
                          <div>
                            <strong>{loc.name}</strong>
                            <br />
                            <small>Type: {loc.type}</small>
                            <br />
                            {loc.description || 'No description'}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
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
                  >
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <img
                          src={icon.options.iconUrl}
                          alt={loc.type}
                          style={{ width: 30, height: 30, marginBottom: 8 }}
                        />
                        <div>
                          <strong>{loc.name}</strong>
                          <br />
                          <small>Type: {loc.type}</small>
                          <br />
                          {loc.description || 'No description'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
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

  // Handler for when MapViewMenu selects a category
  const handleMenuSelect = (category, data) => {
    setSelectedSearchBarPlace(null);
    setActiveOption(category);
    setLocations(data || []);
    setZoomTrigger(z => z + 1);
  };

  // Handler for when the search bar selects a place
  const handlePlaceSelect = (place) => {
    setLocations([]);
    setSelectedSearchBarPlace({ ...place });
  };

  // Handler for when MapViewMenu wants to zoom to a place
  const handleZoomToPlace = (place) => {
    setSelectedSearchPlace(place);
  };

  // Set default Major Town data on component mount
  useEffect(() => {
    const defaultMajorTowns = [
      { name: 'Kuching', latitude: 1.5534, longitude: 110.3594, type: 'Major Town', description: 'Capital city of Sarawak' },
      { name: 'Samarahan', latitude: 1.4599, longitude: 110.4883, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Serian', latitude: 1.1670, longitude: 110.5665, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Sri Aman', latitude: 1.2370, longitude: 111.4621, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Betong', latitude: 1.4115, longitude: 111.5290, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Sarikei', latitude: 2.1271, longitude: 111.5182, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Sibu', latitude: 2.2870, longitude: 111.8320, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Mukah', latitude: 2.8988, longitude: 112.0914, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Kapit', latitude: 2.0167, longitude: 112.9333, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Bintulu', latitude: 3.1739, longitude: 113.0428, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Miri', latitude: 4.4180, longitude: 114.0155, type: 'Major Town', description: 'Division in Sarawak' },
      { name: 'Limbang', latitude: 4.7548, longitude: 115.0089, type: 'Major Town', description: 'Division in Sarawak' }
    ];
    if (!selectedSearchBarPlace) {
      setLocations(defaultMajorTowns);
    }
  }, [selectedSearchBarPlace]);

  // Fit map to markers when locations change
  useEffect(() => {
    if (!selectedSearchBarPlace && locations.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        locations.map(loc => [loc.latitude, loc.longitude])
      );
      mapRef.current.fitBounds(bounds);
    }
  }, [locations, selectedSearchBarPlace]);


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
      />

      {/* Top Header Container */}
      <div className="top-header-container">
        <div className="header-elements-wrapper">
          <div className="search-mapview-group">
            <SearchBarTesting onPlaceSelected={handlePlaceSelect} />
            <MapViewMenu 
              onSelect={handleMenuSelect}
              activeOption={activeOption}
              onZoomToPlace={handleZoomToPlace}
            />
          </div>
          <div className="weather-profile-group">
            <WeatherDateTimeTesting
              currentTown={currentTown}
              setCurrentTown={setCurrentTown}
              shouldZoom={shouldZoom}
              setShouldZoom={setShouldZoom}
            />
            <ProfileDropdown onLoginClick={() => setShowLoginModal(true)} />
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
      >
        <MapContent
          locations={locations}
          nearbyPlaces={searchNearbyPlaces}
          selectedSearchBarPlace={selectedSearchBarPlace}
          activeCategory={activeOption}
          isRoutingActive={isRoutingActive}
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
            {/* Start marker */}
            <Marker position={osrmRouteCoords[0]}>
              <Popup>Starting point</Popup>
            </Marker>
            {/* Waypoint markers */}
            {osrmWaypoints && osrmWaypoints.length > 0 && osrmWaypoints.map((pos, idx) => (
              <Marker key={`waypoint-${idx}`} position={[pos.lat, pos.lng]}>
                <Popup>Waypoint {idx + 1}</Popup>
              </Marker>
            ))}
            {/* End marker */}
            <Marker position={osrmRouteCoords[osrmRouteCoords.length - 1]}>
              <Popup>End point</Popup>
            </Marker>
            {/* Route polyline */}
            <Polyline positions={osrmRouteCoords} color="blue" weight={5} />

            <MapZoomControllerTesting routeCoords={osrmRouteCoords} />
          </>
        )}
      </MapContainer>

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}

export default MapComponentTesting;