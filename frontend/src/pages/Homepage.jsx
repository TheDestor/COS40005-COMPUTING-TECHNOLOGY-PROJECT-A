import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  
import LoginPage from './Loginpage.jsx';
import MapComponent from '../components/MapComponent.jsx';
import SearchBar from '../components/Searchbar.jsx';
import MapViewMenu from '../components/MapViewMenu.jsx';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import WeatherDateTime from '../components/WeatherDateTime.jsx';

const HomePage = () => {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeLogin = () => {
    setShowLogin(false);
  };

  return (
    <div>
      <Navbar onLoginClick={handleLoginClick} />

      <MapComponent />
      <TouristInfoSection />
      <LeftSidebar />

      {showLogin && <LoginPage onClose={closeLogin} />}
    </div>
  );
};

export default HomePage;
