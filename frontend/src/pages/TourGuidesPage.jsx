import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';

const TourGuidePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory, setCurrentCategory] = useState('Tour Guides');

  const fetchTourGuides = () => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error('Google Maps API not loaded');
        return resolve([]);
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        location: new window.google.maps.LatLng(1.5533, 110.3592), // Example: Kuching
        radius: 50000,
        keyword: 'tour guide',
      };

      const collectedResults = [];

      const handleResults = (results, status, pagination) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          collectedResults.push(...results);

          if (pagination && pagination.hasNextPage && collectedResults.length < 50) {
            setTimeout(() => pagination.nextPage(), 1000);
          } else {
            const formatted = collectedResults.slice(0, 50).map(place => ({
              name: place.name,
              desc: place.vicinity || 'Guided tours service',
              slug: place.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
              image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
            }));
            resolve(formatted);
          }
        } else {
          resolve([]);
        }
      };

      service.nearbySearch(request, handleResults);
    });
  };

  const loadTourGuides = async () => {
    setLoading(true);
    try {
      const results = await fetchTourGuides();
      setData(results);
    } catch (error) {
      console.error('Error fetching tour guides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTourGuides();
  }, []);

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const handleSortToggle = () => {
    setSortOrder(prev => (prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default'));
  };

  const highlightMatch = (name) => {
    const index = name.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (index === -1 || !searchQuery) return name;
    return (
      <>
        {name.substring(0, index)}
        <span style={{ backgroundColor: '#ffe066' }}>
          {name.substring(index, index + searchQuery.length)}
        </span>
        {name.substring(index + searchQuery.length)}
      </>
    );
  };

  const filteredData = [...data]
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'desc') return b.name.localeCompare(a.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{currentCategory.toUpperCase()}</h1>
          <p>Discover Local Tour Guides</p>
        </div>
      </div>

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
          <button
            className={`sort-btn ${sortOrder !== 'default' ? 'active' : ''}`}
            onClick={handleSortToggle}
          >
            <span aria-label="Sort by name">≡</span>
            {sortOrder === 'asc' && 'A-Z'}
            {sortOrder === 'desc' && 'Z-A'}
            {sortOrder === 'default' && 'Sort'}
          </button>
        </div>
      </div>

      <div className="cards-section">
        {filteredData.slice(0, visibleItems).map((item, index) => (
          <div
            className="card-wrapper"
            key={index}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}>
              <img src={item.image} alt={item.name} />
              <div className="card-content">
                <h3>{highlightMatch(item.name)}</h3>
                <div className="rating">⭐⭐⭐⭐⭐</div>
                <div className="desc-scroll">
                  <p>{item.desc}</p>
                </div>
                <div className="button-container">
                  <Link
                    to={`/discover/${item.slug}`}
                    state={{
                      name: item.name,
                      image: item.image,
                      desc: item.desc,
                      coordinates: [item.lat, item.lng] // Pass coordinates as [lng, lat]
                    }}
                      className="explore-btn"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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

export default TourGuidePage;
