import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
// Add at the top with other imports
import { Link } from 'react-router-dom';

const CategoryDetailsPage = () => {
  const [townData, setTownData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { slug } = useParams();
  const location = useLocation();
  const passedTown = location.state?.town;

  useEffect(() => {
  const loadData = async () => {
    if (passedTown) {
      // Use data from state
      setTownData({
        name: passedTown.name,
        division: passedTown.division,
        description: passedTown.desc,
        image: passedTown.image,
        population: passedTown.population || 'Data not available',
        area: passedTown.area || 'Data not available',
      });

      // Still fetch attractions if needed
      try {
        const res = await fetch(`/api/locations?division=${passedTown.division}`);
        const data = await res.json();
        const filteredAttractions = data.filter(
          (item) =>
            item.category === 'attractions' &&
            item.division.toLowerCase() === passedTown.division.toLowerCase()
        );
        setAttractions(filteredAttractions);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    } else {
      // Fallback: load everything from slug if no state passed
      try {
        const res = await fetch(`/api/locations?division=${slug}`);
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        const town = data.find(
          (item) =>
            item.category === 'town' &&
            item.division.toLowerCase() === slug.toLowerCase()
        );
        const filteredAttractions = data.filter(
          (item) =>
            item.category === 'attractions' &&
            item.division.toLowerCase() === slug.toLowerCase()
        );
        if (!town) throw new Error('Town not found');
        setTownData({
          name: passedTown.name,
          division: passedTown.division,
          description: passedTown.description,
          image: passedTown.image,
          population: passedTown.population || 'Data not available',
          area: passedTown.area || 'Data not available',
        });
        setAttractions(filteredAttractions);
      } catch (err) {
        console.error(err);
        setTownData(null);
      } finally {
        setLoading(false);
      }
    }
  };

  loadData();
}, [slug, passedTown]);

  if (!loading && !townData) {
    return (
      <div className="error-container">
        <MenuNavbar />
        <div className="error-content">
          <h2>404 - Town Not Found</h2>
          <p>The town "{slug}" doesn't exist in our records.</p>
          <Link to="/towns" className="return-button">
            Browse All Towns
          </Link>
        </div>
        <Footer />
      </div>
    );
  }
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

  return (
    <div className="details-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{townData?.name?.toUpperCase() || 'Town Details'}</h1>
          <p>Exploring {townData?.name || 'Sarawak'}</p>
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {townData?.name}</h2>
            <p className="overview-text">{townData?.description}</p>
            <div className="quick-facts">
              <h3>Quick Facts</h3>
              <ul>
                <li><strong>Division:</strong> {townData?.name}</li>
                <li><strong>Population:</strong> {townData?.population}</li>
                <li><strong>Area:</strong> {townData?.area}</li>
              </ul>
            </div>
          </div>
          <div className="image-content">
            <img src={townData?.image || defaultImage} alt={townData?.name} />
          </div>
        </div>
      </div>

      <div className="attractions-section">
        <h2>Top Attractions in {townData?.name}</h2>
        <div className="attractions-grid">
          {attractions.map((attraction, index) => (
            <div className="attraction-card" key={index}>
              <img src={attraction.image || defaultImage} alt={attraction.name} />
              <div className="attraction-info">
                <h3>{attraction.name}</h3>
                <p className="attraction-type">{attraction.type}</p>
                <p className="attraction-desc">{attraction.description}</p>
                <a
                  href={attraction.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="official-site-btn"
                >
                  Official Site
                </a>
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