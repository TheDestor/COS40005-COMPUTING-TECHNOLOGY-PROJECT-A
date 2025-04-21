import React, { useState, useEffect } from 'react';
import { FaBars, FaClock, FaBuilding, FaMapMarkerAlt, FaSearch, FaSort, FaBookmark, FaLayerGroup } from 'react-icons/fa';
import '../styles/LeftSideBar.css';
import RecentSection from './RecentSection';
import BusinessSection from './BusinessSection';
import BookmarkPage from '../pages/Bookmarkpage';
import MapLayer from './MapLayers';
import MapComponent from './MapComponent';
import { AdvancedMarker, APIProvider } from '@vis.gl/react-google-maps';
import LoginModal from '../pages/Loginpage';
import { IoCloseOutline } from "react-icons/io5";

const travelModes = {
  Car: 'DRIVING',
  Bus: 'TRANSIT',
  Walking: 'WALKING',
  Bicycle: 'BICYCLING',
  Motorbike: 'DRIVING', // treated like Car
  Flight: 'TRANSIT',    // flights not directly supported, fallback to TRANSIT
};

const LeftSidebar = () => {
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
    setAddDestinations((prev) => [...prev, '']);
  };

  const handleVehicleClick = async (vehicle) => {
    if (!startingPoint.trim() || !destination.trim()) {
      alert('You need to fill in your starting point and destination first');
      return;
    }
    setSelectedVehicle(vehicle);

    if (vehicle === 'Flight' && isLocalDestination) {
      alert('Flight mode is not available for local destinations');
      return;
    }

    try {
      setIsLoading(true);
      setSelectedVehicle(vehicle);
      
      const directionsService = new window.google.maps.DirectionsService();
      const response = await directionsService.route({
        origin: startingPoint,
        destination: destination,
        travelMode: travelModes[vehicle],
        provideRouteAlternatives: true,
      });
      
      setRoutes(response.routes);
      setSelectedRouteIndex(0);
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
    setShowBusiness((prev) => !prev);
  };

  const toggleBookmark = () => {
    if (isExpanded) setIsExpanded(false);
    if (showRecent) setShowRecent(false);
    if (showBusiness) setShowBusiness(false);
    setShowBookmarkpage((prev) => !prev);
  }

  // const handleSubmit = () => {
  //   if (!startingPoint.trim() || !destination.trim()) {
  //     alert('Please fill in both starting point and destination!');
  //     return;
  //   }
  
  //   console.log('Starting Point:', startingPoint);
  //   console.log('Destination:', destination);
  //   // Add any action here — API call, direction logic, etc.
  // };

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
              <div className={`transport-option ${selectedVehicle === 'Car' ? 'active' : ''}`} onClick={() => handleVehicleClick('Car')}>
                🚗<span>Car</span>
              </div>
              <div className={`transport-option ${selectedVehicle === 'Bus' ? 'active' : ''}`} onClick={() => handleVehicleClick('Bus')}>
                🚌<span>Bus</span>
              </div>
              <div className={`transport-option ${selectedVehicle === 'Walking' ? 'active' : ''}`} onClick={() => handleVehicleClick('Walking')}>
                🚶<span>Walking</span>
              </div>
            </div>
            <div className="transport-row">
              <div className={`transport-option ${selectedVehicle === 'Bicycle' ? 'active' : ''}`} onClick={() => handleVehicleClick('Bicycle')}>
                🚴<span>Bicycle</span>
              </div>
              <div className={`transport-option ${selectedVehicle === 'Motorbike' ? 'active' : ''}`} onClick={() => handleVehicleClick('Motorbike')}>
                🏍️<span>Motorbike</span>
              </div>
              <div className={`transport-option ${selectedVehicle === 'Flight' ? 'active' : ''}`} onClick={() => handleVehicleClick('Flight')}>
                ✈️<span>Flight</span>
              </div>
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
          {addDestinations.map((point, index) => (
            <div className="input-container" key={index}>
              <div className="input-box">
                <FaMapMarkerAlt className="input-icon red" />
                <input
                  type="text"
                  placeholder={`Add Destination ${index + 1}`}
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...addDestinations];
                    newPoints[index] = e.target.value;
                    setAddDestinations(newPoints);
                  }}
                />
                <button
                  onClick={() => {
                    const updated = [...addDestinations];
                    updated.splice(index, 1);
                    setAddDestinations(updated);
                  }}
                >
                  <IoCloseOutline />
                </button>
                <FaSearch className="input-icon" />
              </div>
            </div>
          ))}

          {/* Add Destination Button */}
          <div className="add-destination" onClick={handleAddDestination}>➕ Add destination</div>

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
                    onClick={() => setSelectedRouteIndex(index)}
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
                  {/* Keep your existing nearby items */}
                </div>
              </div>
            )
          )}
        </div>
      </APIProvider>

      {/* Slide-in RecentSection */}
      <RecentSection isOpen={showRecent} onClose={() => setShowRecent(false)} />
      <BusinessSection isOpen={showBusiness} onClose={() => setShowBusiness(false)} />
      <BookmarkPage isOpen={showBookmarkpage} onClose={() => setShowBookmarkpage(false)} showLoginOverlay={openLoginOverlay}/>
      <MapLayer isOpen={showLayersPanel} onClose={() => setShowLayersPanel(false)} onMapTypeChange={(type) => setMapType(type)}/>
      <MapComponent startingPoint={startingPoint} destination={destination} mapType={mapType} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
};

export default LeftSidebar;
