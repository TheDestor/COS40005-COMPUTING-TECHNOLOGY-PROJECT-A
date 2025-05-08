import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaSort, FaBookmark, FaLayerGroup } from 'react-icons/fa';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
import MapComponent from './MapComponent';
import BusinessSubmissionForm from '../pages/BusinessSubmissionForm';
import { AdvancedMarker, APIProvider } from '@vis.gl/react-google-maps';
import LoginModal from '../pages/Loginpage';
import { IoCloseOutline } from "react-icons/io5";
import { useAuth } from '../context/AuthProvider.jsx';

const travelModes = {
  Car: 'DRIVING',
  Bus: 'TRANSIT',
  Walking: 'WALKING',
  Bicycle: 'BICYCLING',
  Motorbike: 'DRIVING', // treated like Car
  Flight: 'TRANSIT',    // flights not directly supported, fallback to TRANSIT
};

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const LeftSidebar = ({ onSearch, history, setHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [showRecent, setShowRecent] = useState(false);
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
  const [segmentedRoutes, setSegmentedRoutes] = useState([]);
  const debouncedVehicleClick = useRef(null);
  const { openRecent } = useAuth();

  useEffect(() => {
    // Initialize the debounced function once
    debouncedVehicleClick.current = debounce(() => {
      handleVehicleClick('Car');
    }, 1000); // 1 second
  }, []);

  useEffect(() => {
    if (startingPoint.trim() && destination.trim()) {
      debouncedVehicleClick.current();
    }
  }, [startingPoint, destination]);

  useEffect(() => {
    return () => {
      // Clear timeout if component unmounts
      if (debouncedVehicleClick.current) {
        clearTimeout(debouncedVehicleClick.current);
      }
    };
  }, []);

  const handleDeleteItems = (itemsToDelete) => {
    setHistory(prev => prev.filter(item => !itemsToDelete.includes(item)));
  };

  const handleRoutesCalculated = (routesData) => {
    setSegmentedRoutes(routesData.routes);
    setSelectedRouteIndex(0);
  };

  const toggleLayersPanel = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setShowLayersPanel((prev) => !prev);
  }

  const openLoginOverlay = () => {
    setShowLoginModal(true);
  };

  const toggleSidebar = () => {
    // If Recent is open, close it before opening Sidebar
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setIsExpanded((prev) => !prev);
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
      } else {
        alert('Geocode failed: ' + status);
      }
    });
  };

  const fetchNearbyPlaces = (locationCoords) => {
    const placeType = selectedCategory === 'All' ? 'restaurant' : selectedCategory.toLowerCase();
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    console.log('Fetching nearby places for:', placeType, 'at:', locationCoords);
    const request = {
      location: locationCoords,
      radius: 2000,
      type: placeType,
    };

    service.nearbySearch(request, (results, status) => {
      console.log('Nearby search results:', results, 'Status:', status);
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setNearbyPlaces(results);
      } else {
        console.error('Nearby search error:', status);
        setNearbyPlaces([]);
      }
    });
  };

  const handleVehicleClick = async (vehicle) => {
    setSelectedVehicle(vehicle);
  
    if (vehicle === 'Flight') {
      alert('Flight mode is not supported for local (Malaysia) travel.');
      return;
    }
  
    setIsLoading(true);
  
    try {
      const directionsService = new window.google.maps.DirectionsService();
      const response = await directionsService.route({
        origin: startingPoint,
        destination: destination,
        travelMode: travelModes[vehicle],
        provideRouteAlternatives: true,
      });
  
      setRoutes(response.routes);
      setSelectedRouteIndex(0);

      geocodeAddress(destination, (coords) => {
        fetchNearbyPlaces(coords);
      });
    } catch (error) {
      console.error('Error fetching directions:', error);
      alert('Failed to get directions. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleRecentHistory = () => {
    // If Sidebar is open, close it before opening Recent
    if (isExpanded) setIsExpanded(false);
    if (showBusiness) setShowBusiness(false);
    if (showBookmarkpage) setShowBookmarkpage(false);
    setShowRecent((prev) => !prev);
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
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        clearInterval(interval);
  
        const inputStartingPoint = document.querySelector('input[placeholder="Choosing Starting point"]');
        const inputDestination = document.querySelector('input[placeholder="Choosing Destination"]');
      
        if (inputStartingPoint) {
          const autocompleteStart = new window.google.maps.places.Autocomplete(inputStartingPoint, {
            componentRestrictions: { country: 'MY' },
            fields: ['place_id', 'geometry', 'formatted_address'],
          });
      
          autocompleteStart.addListener('place_changed', () => {
            const place = autocompleteStart.getPlace();
            if (place.formatted_address) {
              setStartingPoint(place.formatted_address);
            }
          });
        }
      
        if (inputDestination) {
          const autocompleteDest = new window.google.maps.places.Autocomplete(inputDestination, {
            componentRestrictions: { country: 'MY' },
            fields: ['place_id', 'geometry', 'formatted_address'],
          });
      
          autocompleteDest.addListener('place_changed', () => {
            const place = autocompleteDest.getPlace();
            if (place.formatted_address) {
              setDestination(place.formatted_address);
            }
          });
        }
      }
    }, 500); // check every 500ms
  
    return () => clearInterval(interval);
  }, []);
  

  // const validateLocationIsInMalaysia = async (address) => {
  //   const geocoder = new window.google.maps.Geocoder();
  //   return new Promise((resolve) => {
  //     geocoder.geocode({ address }, (results, status) => {
  //       if (status === 'OK' && results[0]) {
  //         const countryComponent = results[0].address_components.find(component => 
  //           component.types.includes('country')
  //         );
  //         if (countryComponent && countryComponent.short_name === 'MY') {
  //           resolve(true);
  //         } else {
  //           resolve(false);
  //         }
  //       } else {
  //         resolve(false);
  //       }
  //     });
  //   });
  // };

  useEffect(() => {
  console.log('Updated starting point:', startingPoint);
  console.log('Updated destination:', destination);
}, [startingPoint, destination]);

useEffect(() => {
  console.log('Selected route index changed:', selectedRouteIndex);
}, [selectedRouteIndex]);


  return (
    <>
      {/* Collapsed Sidebar */}
      <div className="sidebar100">
        <div className="menu-icon100" onClick={toggleSidebar}>
          <FaBars />
        </div>
        <div className="menu-item100" onClick={toggleRecentHistory}>
          <FaClock className="icon100"  />
          <span className="label100" >Recent</span>
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
        {/* Expanded Panel */}
        <div className={`side-panel100 ${isExpanded ? 'expanded' : ''}`}>
          <div className="transport-section">
          <div className="transport-row">
              {['Car', 'Bus', 'Walking'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} onClick={() => handleVehicleClick(v)}>
                  {v === 'Car' ? '🚗' : v === 'Bus' ? '🚌' : '🚶'}<span>{v}</span>
                </div>
              ))}
            </div>
            <div className="transport-row">
              {['Bicycle', 'Motorbike', 'Flight'].map((v) => (
                <div key={v} className={`transport-option ${selectedVehicle === v ? 'active' : ''}`} onClick={() => handleVehicleClick(v)}>
                  {v === 'Bicycle' ? '🚴' : v === 'Motorbike' ? '🏍️' : '✈️'}<span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Starting Point Input */}
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

          {/* Destination Input */}
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

          {/* Additional Destinations */}
          {addDestinations.map((dest, index) => (
            <div className="input-container" key={index}>
              <div className="input-box">
                <FaMapMarkerAlt className="input-icon" />
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

          {/* Additional Destinations Button*/}
          <button className="add-destination" onClick={handleAddDestination}>
            ➕ Add Destination
          </button>

          {/* Routes */}
          {isLoading ? (
            <div className="loading-message">Calculating routes...</div>
          ) : (
            routes.length > 0 && (
              <div className="route-list">
                {routes.map((route, index) => (
                  <div 
                    key={index} 
                    className={`route-item ${index === selectedRouteIndex ? 'active-route' : ''}`}
                    onClick={() => {setSelectedRouteIndex(index)}}
                  >
                    <div><strong>{route.summary}</strong></div>
                    <div className="route-details">
                      <span className="time">
                        <FaClock /> {route.legs[0]?.duration?.text || 'N/A'}
                      </span>
                      <span className="distance">
                        <FaMapMarkerAlt /> {route.legs[0]?.distance?.text || 'N/A'}
                      </span>
                    </div>
                    <hr />
                  </div>
                ))}

                <div className="route-footer">
                  <div className="send-copy-row">
                    <div className="send-directions-text">📩 Send Directions</div>
                    <div className="copy-link">COPY LINK</div>
                  </div>
                  
                  <hr />

                  <div className="explore-nearby-text">🔍 Explore Nearby</div>

                  {/* Nearby Places List */}
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
              </div>
            )
          )}
        </div>
      </APIProvider>

      {/* Slide-in RecentSection */}
      <RecentSection isOpen={showRecent} onClose={() => setShowRecent(false)} history={history} onItemClick={onSearch} onDeleteItems={handleDeleteItems} />
      {/* <BusinessSection isOpen={showBusiness} onClose={() => setShowBusiness(false)} /> */}
      <BookmarkPage isOpen={showBookmarkpage} onClose={() => setShowBookmarkpage(false)} showLoginOverlay={openLoginOverlay}/>
      <BusinessSubmissionForm  isOpen={showBusiness} onClose={() => setShowBusiness(false)} />
      <MapLayer isOpen={showLayersPanel} onClose={() => setShowLayersPanel(false)} onMapTypeChange={(type) => setMapType(type)} onCategoryChange={(category) => setSelectedCategory(category)}/>
      <MapComponent startingPoint={startingPoint} destination={destination} mapType={mapType} nearbyPlaces={nearbyPlaces} selectedCategory={selectedCategory} selectedVehicle={travelModes[selectedVehicle]} addDestinations={addDestinations} onRoutesCalculated={handleRoutesCalculated}  routes={routes} selectedRouteIndex={selectedRouteIndex}/>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default LeftSidebar;
