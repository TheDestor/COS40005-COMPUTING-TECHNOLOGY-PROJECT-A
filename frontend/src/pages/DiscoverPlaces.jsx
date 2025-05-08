import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';

const DiscoverPlaces = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const locationData = state?.location;

  // Redirect if no data and in development
  if (process.env.NODE_ENV === 'development' && !locationData) {
    console.error('Missing location state:', window.history.state);
    navigate('/towns');
  }

  const safeData = locationData ? {
    name: locationData.name,
    type: locationData.type,
    description: locationData.description,
    image: locationData.image,
    coordinates: locationData.coordinates,
    latitude: locationData.coordinates[1] || 'N/A', // Array is [long, lat]
    longitude: locationData.coordinates[0] || 'N/A',
    population: locationData.population,
    area: locationData.area,
    climate: locationData.climate
  } : null;

  if (!safeData) {
    return (
      <div className="error-container">
        <MenuNavbar />
        <div className="error-content">
          <h2>Content Unavailable</h2>
          <p>This location cannot be displayed right now.</p>
          <Link to="/towns" className="return-button">
            Browse Locations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="details-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{safeData.name.toUpperCase()}</h1>
          <p>Discover {safeData.name}</p>
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {safeData.name}</h2>
            <p className="overview-text">{safeData.description}</p>
            
            <div className="quick-facts">
              <h3>Key Information</h3>
              <ul>
                <li><strong>Type:</strong> {safeData.type}</li>
                <li><strong>Population:</strong> {safeData.population}</li>
                <li><strong>Area:</strong> {safeData.area}</li>
                <li><strong>Climate:</strong> {safeData.climate}</li>
                {safeData.coordinates.length >= 2 && (
                  <>
                    <li><strong>Latitude:</strong> {safeData.latitude}</li>
                    <li><strong>Longitude:</strong> {safeData.longitude}</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="image-content">
            <img 
              src={safeData.image} 
              alt={safeData.name}
              onError={(e) => {
                e.target.src = defaultImage;
                e.target.style.opacity = '0.8';
              }}
            />
            {safeData.coordinates.length >= 2 && (
              <div className="coordinates-badge">
                <span>📍 {safeData.latitude}, {safeData.longitude}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DiscoverPlaces;