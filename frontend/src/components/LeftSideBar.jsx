import React, { useState, useEffect, useCallback } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup } from 'react-icons/fa';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
import MapComponent from './MapComponent';
import BusinessSubmissionForm from '../pages/BusinessSubmissionForm';
import { APIProvider } from '@vis.gl/react-google-maps';
import LoginModal from '../pages/Loginpage';
import { IoCloseOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthProvider.jsx';
import { BiCurrentLocation } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";

const travelModes = {
  Car: 'DRIVING',
  Bus: 'TRANSIT',
  Walking: 'WALKING',
  Bicycle: 'BICYCLING',
  Motorbike: 'DRIVING',
};

const LeftSidebar = ({ onSearch, history, setHistory, showRecent, setShowRecent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [showBusiness, setShowBusiness] = useState(false);
  const [showBookmarkpage, setShowBookmarkpage] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [addDestinations, setAddDestinations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { openRecent } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const handleAddCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            setIsLoading(false);
            if (status === "OK" && results[0]) {
              setAddDestinations(prev => [...prev, results[0].formatted_address]);
            } else {
              setLocationError("Could not determine your address");
            }
          }
        );
      },
      (error) => {
        setIsLoading(false);
        setLocationError(error.message);
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
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
    setRoutes(routesData.routes);
    setSelectedRouteIndex(0);
  };

  const handleAddDestination = () => {
    setAddDestinations(prev => [...prev, '']);
  };

  const handleDestinationChange = (index, value) => {
    const newDestinations = [...addDestinations];
    newDestinations[index] = value;
    setAddDestinations(newDestinations);
  };

  const geocodeAddress = (address, callback) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        callback(results[0].geometry.location);
      }
    });
  };

  const fetchNearbyPlaces = (locationCoords) => {
    const placeType = selectedCategory === 'All' ? 'restaurant' : selectedCategory.toLowerCase();
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      location: locationCoords,
      radius: 500,
      type: placeType,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setNearbyPlaces(results);
      }
    });
  };

  const handleVehicleClick = async (vehicle) => {
  setSelectedVehicle(vehicle);
  setIsLoading(true);

  try {
    const directionsService = new window.google.maps.DirectionsService();
    
    // Filter out empty destinations
    const validWaypoints = addDestinations
      .filter(dest => dest.trim())
      .map(dest => ({ location: dest }));

    const response = await directionsService.route({
      origin: startingPoint,
      destination: destination,
      waypoints: validWaypoints.length > 0 ? validWaypoints : undefined,
      travelMode: travelModes[vehicle],
      provideRouteAlternatives: true,
      optimizeWaypoints: true  // Let Google optimize the route order
    });

    setRoutes(response.routes);
    setSelectedRouteIndex(0);  // Reset to first route when recalculating

    geocodeAddress(destination, (coords) => {
      fetchNearbyPlaces(coords);
    });
  } catch (error) {
    console.error('Error fetching directions:', error);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  const handler = setTimeout(() => {
    if (startingPoint.trim() && destination.trim()) {
      handleVehicleClick(selectedVehicle);
    }
  }, 1000);

  return () => clearTimeout(handler);
}, [startingPoint, destination, selectedVehicle, addDestinations]);  // Add addDestinations here

  const initAutocomplete = useCallback((input, setter) => {
    if (!input || input.dataset.autocomplete) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'MY' },
      fields: ['place_id', 'geometry', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setter(place.formatted_address);
      }
    });

    input.dataset.autocomplete = 'initialized';
  }, []);

  useEffect(() => {
    const initializeAutocomplete = () => {
      // Initialize for static inputs
      initAutocomplete(
        document.querySelector('input[placeholder="Choosing Starting point"]'),
        setStartingPoint
      );
      initAutocomplete(
        document.querySelector('input[placeholder="Choosing Destination"]'),
        setDestination
      );

      // Initialize for additional destinations
      document.querySelectorAll('input[placeholder^="Add destination"]').forEach((input, index) => {
        initAutocomplete(input, (address) => {
          const newDestinations = [...addDestinations];
          newDestinations[index] = address;
          setAddDestinations(newDestinations);
        });
      });
    };

    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval);
          initializeAutocomplete();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [addDestinations, initAutocomplete, setStartingPoint, setDestination]);

  return (
    <>
      <div className="sidebar100">
        <div className="menu-icon100" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div className="menu-item100" onClick={toggleRecentHistory}>
          <FaClock className="icon100" />
          <span className="label100">Recent</span>
        </div>
        <div className="menu-item100" onClick={toggleBookmark}>
          <FaBookmark className="icon100" />
          <span className="label100">Bookmark</span>
        </div>
        <div className="menu-item100" onClick={toggleBusinessPanel}>
          <FaBuilding className="icon100" />
          <span className="label100">Business</span>
        </div>
        <div className="menu-item101" onClick={toggleLayersPanel}>
          <FaLayerGroup className="icon100" />
          <span className="label100">Layers</span>
        </div>
      </div>
    
      <APIProvider apiKey='AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI'>
        <div className={`side-panel100 ${isExpanded ? 'expanded' : ''}`}>
          <div className="transport-section">
            <div className="transport-row">
              {['Car', 'Bus', 'Walking'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                     onClick={() => handleVehicleClick(v)}>
                  {v === 'Car' ? '🚗' : v === 'Bus' ? '🚌' : '🚶'}<span>{v}</span>
                </div>
              ))}
            </div>
            <div className="transport-row">
              {['Bicycle', 'Motorbike'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} 
                     onClick={() => handleVehicleClick(v)}>
                  {v === 'Bicycle' ? '🚴' : '🏍️'}<span>{v}</span>
                </div>
              ))}
              <div className="transport-option disabled" title="Not available">
                ✈️<span>Flight</span>
              </div>
            </div>
          </div>

          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon red" />
              <input
                type="text"
                placeholder="Choosing Starting point"
                value={startingPoint}
                onChange={(e) => setStartingPoint(e.target.value)}
              />
              <FaSearch className="input-icon" />
            </div>
          </div>

          <div className="input-container">
            <div className="input-box">
              <FaMapMarkerAlt className="input-icon red" />
              <input
                type="text"
                placeholder="Choosing Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <FaSearch className="input-icon" />
            </div>
          </div>

          {addDestinations.map((dest, index) => (
            <div className="input-container" key={index}>
              <div className="input-box">
                <FaMapMarkerAlt className="input-icon-add" />
                <input
                  type="text"
                  placeholder={`Add destination ${index + 1}`}
                  value={dest}
                  onChange={(e) => handleDestinationChange(index, e.target.value)}
                />
                <button onClick={() => setAddDestinations(prev => prev.filter((_, i) => i !== index))}>
                  <IoCloseOutline />
                </button>
              </div>
            </div>
          ))}

          <button 
            className="current-location-button" 
            onClick={handleAddCurrentLocation}
            title="Add Current Location"
          >
          <BiCurrentLocation /> Current Location
          </button>
          
          <button className="add-destination" onClick={handleAddDestination}>
          <IoMdAdd /> Add Destination
          </button>

          {isLoading && (
            <div className="loading-message">Getting your current location...</div>
          )}
          {locationError && (
            <div className="location-error">{locationError}</div>
          )}

          {isLoading ? (
            <div className="loading-message">Calculating routes...</div>
          ) : routes.length > 0 ? (
            <>
              <div className="route-list">
                {routes.map((route, index) => {
                  const totalDuration = route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
                  const totalDistance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
                  
                  return (
                    <div 
                      key={index} 
                      className={`route-item ${index === selectedRouteIndex ? 'active-route' : ''}`}
                      onClick={() => setSelectedRouteIndex(index)}
                    >
                      <div><strong>{route.summary}</strong></div>
                      <div className="route-details">
                        <span className="time">
                          <FaClock /> {formatDuration(totalDuration)}
                        </span>
                        <span className="distance">
                          <FaMapMarkerAlt /> {formatDistance(totalDistance)}
                        </span>
                      </div>
                      <hr />
                    </div>
                  );
                })}
              </div>

              <div className="route-footer">
                <div className="send-copy-row">
                  <div className="send-directions-text">📩 Send Directions</div>
                  <div className="copy-link">COPY LINK</div>
                </div>
                
                <hr />

                <div className="explore-nearby-text">🔍 Explore Nearby</div>

                {nearbyPlaces.length > 0 && (
                  <div className="nearby-places-container100">
                    {nearbyPlaces.map((place, index) => (
                      <div key={index} className="nearby-place-item100">
                        <div className="place-name100">{place.name}</div>
                        <div className="place-address100">{place.vicinity}</div>
                        {place.rating && (
                          <div className="place-rating100">
                            ⭐ {place.rating} ({place.user_ratings_total || 0} reviews)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </APIProvider>

            <RecentSection 
        isOpen={showRecent} 
        onClose={() => setShowRecent(false)} 
        history={history} 
        onItemClick={onSearch} 
        onDeleteItems={handleDeleteItems} 
      />
      <BookmarkPage 
        isOpen={showBookmarkpage} 
        onClose={() => setShowBookmarkpage(false)} 
        showLoginOverlay={openLoginOverlay}
      />
      <BusinessSubmissionForm  
        isOpen={showBusiness} 
        onClose={() => setShowBusiness(false)} 
      />
      <MapLayer 
        isOpen={showLayersPanel} 
        onClose={() => setShowLayersPanel(false)} 
        onMapTypeChange={(type) => setMapType(type)} 
        onCategoryChange={(category) => setSelectedCategory(category)}
      />
      <MapComponent 
        startingPoint={startingPoint} 
        destination={destination} 
        mapType={mapType} 
        nearbyPlaces={nearbyPlaces} 
        selectedCategory={selectedCategory} 
        selectedVehicle={travelModes[selectedVehicle]} 
        addDestinations={addDestinations.filter(dest => dest.trim())}
        onRoutesCalculated={handleRoutesCalculated}  
        routes={routes} 
        selectedRouteIndex={selectedRouteIndex}
      />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default LeftSidebar;