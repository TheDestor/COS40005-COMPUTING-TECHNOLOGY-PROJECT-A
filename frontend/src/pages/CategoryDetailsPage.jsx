import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css'; // New CSS file
import defaultImage from '../assets/Kuching.png';

const CategoryDetailsPage = () => {
  // Reuse all the same state and logic from AirportPage
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory, setCurrentCategory] = useState('');

  // Reuse existing fetch logic
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/locations?type=ImageGrid');
      const fetchedData = await response.json();
      handleDataFetch('Image Grid', fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Reuse existing data processing
  const handleDataFetch = (category, fetchedData) => {
    /* Same implementation as AirportPage */
  };

  const processData = (items, category) => {
    /* Same implementation as AirportPage */
  };

  // Reuse existing helper functions
  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);
  const handleSortToggle = () => {
    setSortOrder(prev => (prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default'));
  };

  const highlightMatch = (name) => {
    /* Same implementation as AirportPage */
  };

  const filteredData = [...data]
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      /* Same sorting logic as AirportPage */
    });

  if (loading) {
    /* Same loading spinner as AirportPage */
  }

  return (
    <div className="image-grid-page">
      <MenuNavbar />

      {/* Same hero banner section */}
      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{currentCategory.toUpperCase() || 'Category'}</h1>
          <p>Exploring {currentCategory || 'Sarawak'}</p>
        </div>
      </div>

      {/* Same search and sort section */}
      <div className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder={`Search ${currentCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={`sort-btn ${sortOrder !== 'default' ? 'active' : ''}`} onClick={handleSortToggle}>
            {/* Same sort button content */}
          </button>
        </div>
      </div>

      {/* Modified grid section */}
      <div className="image-grid-container">
        {filteredData.slice(0, visibleItems).map((item, index) => (
          <div className="image-grid-item" key={index}>
            <Link to={`/details/${currentCategory}/${item.slug}`}>
              <div className="image-wrapper">
                <img src={item.image} alt={item.name} />
                <div className="image-overlay">
                  <h3 className="image-title">{highlightMatch(item.name)}</h3>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Same pagination controls */}
      {filteredData.length > visibleItems && (
        <div className="pagination-controls100">
          <button className="show-more-btn100" onClick={() => setVisibleItems(prev => prev + 12)}>
            Show More (+12)
          </button>
          <button className="show-all-btn100" onClick={() => setVisibleItems(filteredData.length)}>
            Show All
          </button>
        </div>
      )}

      {showLogin && <LoginPage onClose={closeLogin} />}
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;