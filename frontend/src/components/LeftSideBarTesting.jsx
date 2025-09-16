import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaBookmark, FaLayerGroup, FaLocationArrow, FaExclamationTriangle  } from 'react-icons/fa';
import { toast} from 'react-toastify';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
// import MapComponentTesting from './MapComponentTesting';
import BusinessSubmissionForm from '../pages/BusinessSubmissionForm';
import { APIProvider } from '@vis.gl/react-google-maps';
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

// OSRM routing helper
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

const travelModes = {
  Car: 'driving',
  Bus: 'driving',      // OSRM does not support bus, fallback to driving
  Walking: 'walking',
  Bicycle: 'cycling',
  Motorbike: 'driving', // OSRM does not support motorbike, fallback to driving
};

const LeftSidebarTesting = ({ onSearch, history, setHistory, showRecent, setShowRecent, nearbyPlaces, setSelectedPlace, selectedPlace, setNearbyPlaces, setOsrmRouteCoords, setOsrmWaypoints, setIsRoutingActive }) => {
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
  // const [nearbyPlaces, setNearbyPlaces] = useState([]);
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
  };

  const handleClearDestination = () => {
    setDestination('');
    setDestinationCoords(null);
    setOsrmRouteCoords([]);
    setOsrmWaypoints([]);
    setAddDestinations([]);
    setWaypointCoords([]);
    setRoutes([]);
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
    setWaypointCoords(prev => [...prev, null]);
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

    // Fetch route from OSRM
    const osrmData = await fetchOSRMRoute(
      startCoords,
      endCoords,
      waypointsCoords,
      travelModes[vehicle]
    );

    if (osrmData.routes && osrmData.routes[0]) {
      // OSRM returns [lng, lat], Leaflet wants [lat, lng]
      const coords = osrmData.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setOsrmRouteCoords(coords);

      if (typeof onRouteRequest === 'function') {
        onRouteRequest(
          startCoords,
          endCoords,
          waypointsCoords,
          travelModes[vehicle]
        );
      }
      setRouteSummary({
        distance: osrmData.routes[0].distance,
        duration: osrmData.routes[0].duration
      });
    } else {
      setRouteSummary(null);
      setOsrmRouteCoords([]);
    }
  } catch (error) {
    setRouteSummary(null);
    alert('Error fetching route: ' + error.message);
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

          {isLoading && <div>Calculating route...</div>}
          {routeSummary && (
            <div>
              <div><strong>Distance:</strong> {(routeSummary.distance / 1000).toFixed(2)} km</div>
              <div><strong>Duration:</strong> {(routeSummary.duration / 60).toFixed(0)} min</div>
            </div>
          )}

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

      {/* <MapZoomController selectedPlace={selectedPlace} /> */}
    </>
  );
};

export default LeftSidebarTesting;