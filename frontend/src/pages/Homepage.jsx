import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  
import LoginPage from './Loginpage.jsx';
import MapComponent from '../components/MapComponent.jsx';
import BookmarkPage from '../pages/Bookmarkpage.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showBookmark, setShowBookmark] = useState(false);
  const [startingPoint, setStartingPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [locationType, setLocationType] = useState('Major Town');

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
    <div>
      <Navbar 
        onLoginClick={handleLoginClick}
        activeOption={locationType}
        onMenuChange={setLocationType}
      />

      <MapComponent 
        startingPoint={startingPoint} 
        destination={destination}
        selectedCategory={locationType}
      />
      
      <TouristInfoSection />

      <LeftSidebar
        startingPoint={startingPoint}
        destination={destination}
        setStartingPoint={setStartingPoint}
        setDestination={setDestination}
      />

      {showLogin && <LoginPage onClose={closeLogin} />}
      {showBookmark && <BookmarkPage isOpen={showBookmark} onClose={() => setShowBookmark(false)} />}
    </div>
  );
};

export default HomePage;
