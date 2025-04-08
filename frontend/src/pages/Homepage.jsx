import React from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '1rem' }}>
        
        <MapView />
      </div>
    </div>
  );
};

export default HomePage;
