import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import TouristInfoSection from '../components/TouristInfoSection.jsx';  

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <div style={{ 
        padding: '1rem',
        marginRight: '350px', /* Make space for the tourist info section */
        transition: 'margin-right 0.3s ease-in-out'
      }}>
        {/* Your main content goes here */}
      </div>
      <TouristInfoSection />
    </div>
  );
};

export default HomePage;