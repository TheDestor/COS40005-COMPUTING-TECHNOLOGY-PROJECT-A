import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
import { Link } from 'react-router-dom';

const CategoryDetailsPage = () => {
  const [townData, setTownData] = useState(null);
  const [divisionItems, setDivisionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { slug } = useParams();
  const location = useLocation();
  const passedTown = location.state?.town;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const divisionName = passedTown?.division || slug;
        
        // Fetch all locations for the division
        const response = await fetch(`/api/locations`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Find the main town information
        const townInfo = data.find(item => 
          item.type === 'Major Town' && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        ) || data[0];

        // Filter out the main town from other locations
        const otherItems = data.filter(item => 
          item._id !== townInfo?._id && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        );

        setTownData({
          name: townInfo?.division,
          description: townInfo?.description || townInfo?.desc,
          image: townInfo?.image || defaultImage,
          population: townInfo?.population || 'Data not available',
          area: townInfo?.area || 'Data not available',
          climate: townInfo?.climate || 'Tropical',
        });

        setDivisionItems(otherItems);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, passedTown]);

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!townData) {
    return (
      <div className="error-container">
        <MenuNavbar />
        <div className="error-content">
          <h2>404 - Division Not Found</h2>
          <p>The division "{slug}" doesn't exist in our records.</p>
          <Link to="/towns" className="return-button">
            Browse All Towns
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
          <h1>{townData.name.toUpperCase()}</h1>
          <p>Exploring {townData.name}</p>
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {townData.name}</h2>
            <p className="overview-text">{townData.description}</p>
            <div className="quick-facts">
              <h3>Quick Facts</h3>
              <ul>
                <li><strong>Population:</strong> {townData.population}</li>
                <li><strong>Area:</strong> {townData.area}</li>
                <li><strong>Climate:</strong> {townData.climate}</li>
              </ul>
            </div>
          </div>
          <div className="image-content">
            <img src={townData.image} alt={townData.name} />
          </div>
        </div>
      </div>

      <div className="division-locations-section">
        <h2>Discover {townData.name}</h2>
        <div className="locations-grid">
          {divisionItems.map((item, index) => (
            <div className="location-card" key={index}>
              <img src={item.image || defaultImage} alt={item.name} />
              <div className="location-info">
                <div className="location-header">
                  <h3>{item.name}</h3>
                  <span className="location-type">{item.type}</span>
                </div>
                <p className="location-desc">{item.description}</p>
                <div className="location-actions">
                <Link
                to={{
                  // Fix encoding and add URL-safe formatting
                  pathname: `/discover/${encodeURIComponent(item.name.replace(/\s+/g, '-').toLowerCase())}`,
                  state: { 
                    location: {
                      ...item,
                      name: item.name || 'Unnamed Location',
                      type: item.type || 'General Location',
                      description: item.description || item.desc || 'No description available',
                      image: item.image || defaultImage,
                      coordinates: item.coordinates || [0, 0], // Ensure array format
                      population: item.population || 'N/A',
                      area: item.area || 'N/A',
                      climate: item.climate || 'Tropical'
                    }
                  }
                }}
                className="explore-btn"
              >
                Explore
              </Link>
                  {item.coordinates && (
                    <button className="map-btn">
                      View on Map
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLogin && <LoginPage onClose={closeLogin} />}
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;