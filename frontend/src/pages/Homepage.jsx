import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  
import LoginPage from './Loginpage.jsx';

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

      <div style={{ 
        padding: '1rem',
        marginRight: '350px',
        transition: 'margin-right 0.3s ease-in-out'
      }}>
        {/* Your main content */}
      </div>

      <TouristInfoSection />
      <LeftSidebar />

      {showLogin && <LoginPage onClose={closeLogin} />}
    </div>
  );
};

export default HomePage;
