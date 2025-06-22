import React, { useState, useEffect, useCallback } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup, FaLocationArrow, FaExclamationTriangle  } from 'react-icons/fa';
import { toast} from 'react-toastify';
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
import { MdAdd, MdAddLocationAlt } from "react-icons/md";
// import MapZoomController from './MapZoomController';

const travelModes = {
  Car: 'DRIVING',
  Bus: 'TRANSIT',
  Walking: 'WALKING',
  Bicycle: 'BICYCLING',
  Motorbike: 'DRIVING',
};

const LeftSidebar = ({ onSearch, history, setHistory, showRecent, setShowRecent, nearbyPlaces, setSelectedPlace, selectedPlace, setNearbyPlaces }) => {
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
  // const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { openRecent } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocationFetching, setIsLocationFetching] = useState(false);
  // const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeMenu, setActiveMenu] = useState('');
  
  const handleClearStartingPoint = () => {
    setStartingPoint('');
    if (!destination) {
      setRoutes([]); // Clear routes only if destination is also empty
    }
  };

  const handleClearDestination = () => {
    setDestination('');
    if (!startingPoint) {
      setRoutes([]); // Clear routes only if starting point is also empty
    }
  };

  const handleAddCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Prevent multiple clicks
    if (isLocationFetching) {
      toast.warn("Please wait... Fetching your location", { autoClose: 2000 });
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
            { autoClose: 8000 }
          );
          setIsLocationFetching(false);
          setIsLoading(false);
          return;
        }

        try {
          const geocoder = new window.google.maps.Geocoder();
          const results = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, 
              (results, status) => status === "OK" ? resolve(results) : reject(status));
          });

          if (results[0]) {
            const address = results[0].formatted_address;
            
            if (!startingPoint.trim()) {
              setStartingPoint(address);
              toast.success("Current location set as starting point");
            } else if (!destination.trim()) {
              setDestination(address);
              toast.success("Current location set as destination");
            } else {
              setAddDestinations(prev => [...prev, address]);
              toast.success("Current location added as waypoint");
            }
          } else {
            toast.error("Could not determine your address");
          }
        } catch (error) {
          toast.error("Geocoding service error");
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
        toast.error(errorMessage, { autoClose: 8000 });
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

   const handleNearbyPlaceClick = (place) => {
    if (!place.geometry?.location) return;
    
    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };
    
    setSelectedPlace({ 
      ...place, 
      location,
      // Set higher zoom level for place selection
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
              <input
                type="text"
                placeholder="Choosing Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
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

          {isLoading ? (
            <div className="loading-message">Calculating routes...</div>
          ) : routes.length > 0 ? (
            <>
              <div className="route-list">
                {routes && routes.map((route, index) => {
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
                      <div 
                        key={index} 
                        className={`nearby-place-item100 ${selectedPlace?.place_id === place.place_id ? 'selected-place' : ''}`}
                        onClick={() => handleNearbyPlaceClick(place)}
                      >
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

      {/* <MapZoomController selectedPlace={selectedPlace} /> */}

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