import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  
import LoginPage from './Loginpage.jsx';
import MapComponent from '../components/MapComponent.jsx';
import BookmarkPage from '../pages/Bookmarkpage.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import MapViewMenu from '../components/MapViewMenu.jsx';
import { APIProvider } from '@vis.gl/react-google-maps';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [addDestinations, setAddDestinations] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Major Town');
  const [selectedPlace, setSelectedPlace] = useState(null);
  

  // Show bookmark if state passed from navigation
  useEffect(() => {
    if (location.state?.openBookmark) {
      setShowBookmark(true);

      // Clean up the state so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  return (
    <APIProvider apiKey="AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI">
      <Navbar 
        onLoginClick={handleLoginClick}
        activeOption={selectedCategory}
        onMenuChange={setSelectedCategory}
        setSelectedPlace={setSelectedPlace}
      />

      <MapComponent 
        startingPoint={startingPoint} 
        destination={destination}
        addDestinations={addDestinations}
        nearbyPlaces={nearbyPlaces}
        selectedCategory={selectedCategory}
        selectedPlace={selectedPlace}
      />
      
      <TouristInfoSection />

      <LeftSidebar
        startingPoint={startingPoint}
        destination={destination}
        addDestinations={addDestinations}
        setStartingPoint={setStartingPoint}
        setDestination={setDestination}
        setAddDestinations={setAddDestinations}
        setNearbyPlaces={setNearbyPlaces}
      />

      {showLogin && <LoginPage onClose={closeLogin} />}
      {showBookmark && <BookmarkPage isOpen={showBookmark} onClose={() => setShowBookmark(false)} />}
      </APIProvider>
  );
};

export default HomePage;
