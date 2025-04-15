import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';
import LeftSidebar from '../components/LeftSideBar.jsx';  

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <div style={{ 
        padding: '1rem',
        marginRight: '350px',
        transition: 'margin-right 0.3s ease-in-out'
      }}>
        {/* Your main content goes here */}
      </div>
      <TouristInfoSection />
      <LeftSidebar />
    </div>
  );
};

export default HomePage;