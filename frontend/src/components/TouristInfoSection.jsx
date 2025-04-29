import React, { useState, useEffect } from 'react';
import '../styles/TouristInfoSection.css';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import kuchingImage from '../assets/Kuching.png';
import { Link } from 'react-router-dom';
import MapViewMenu from './MapViewMenu';

const TouristInfoSection = ({ showPlaces }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [containerStyle, setContainerStyle] = useState({ top: '60px' });
  const [locations, setLocations] = useState([]);

  // Handle data fetched from MapViewMenu
  const handleDataFetch = (category, fetchedData) => {
    const processed = (fetchedData || []).map(item => ({
      id: item?.id || item?.name || Math.random(), // fallback for unique key
      name: item?.name || item?.Name || 'Unknown',
      description: item?.description || item?.Desc || 'No description available.',
      image: item?.image || kuchingImage,
    }));

    setLocations(processed);
  };

  useEffect(() => {
    const updatePosition = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        setContainerStyle({ top: `${navbar.offsetHeight}px` });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className={`tourist-info-container ${isCollapsed ? 'collapsed' : ''}`}
      style={containerStyle}
    >
      {/* Render MapViewMenu and pass the handler */}
      <MapViewMenu onSelect={handleDataFetch} />
      
      <div className="collapse-toggle" onClick={toggleCollapse}>
        {isCollapsed ? <FiChevronLeft /> : <FiChevronRight />}
      </div>
      
      <div className="info-content">
        <div className="discover-more-container">
          <span className="discover-more">Discover more?</span>
          <Link to="/major-town" className="show-more">Show more</Link>
        </div>

        <div className="items-list">
          {locations.length > 0 ? locations.map(item => (
            <div key={item.id} className="info-item">
              <div className="item-image">
                <img 
                  src={item.image || kuchingImage} // fallback if no image
                  alt={item.name} 
                />
              </div>
              <div className="item-text">
                <h3>{item.name}</h3>
                <p>{item.description || 'Click view more to learn about this place.'}</p>
              </div>
              <div className="view-more-container">
                <button 
                  className="view-more-btn" 
                  // onClick={() => '/major-town'}
                >
                  View more
                </button>
              </div>
            </div>
          )) : (
            <p style={{ padding: '1rem' }}>No locations loaded. Select a category to explore.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristInfoSection;
