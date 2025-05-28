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
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Tour Guides');

  const determineTourType = (place) => {
    const lowerName = place.name.toLowerCase();
    const lowerAddress = (place.vicinity || '').toLowerCase();
    
    if (lowerName.includes('cultural') || lowerName.includes('heritage')) {
      return 'Cultural Tours';
    }
    if (lowerName.includes('adventure') || lowerName.includes('hiking')) {
      return 'Adventure Tours';
    }
    if (lowerName.includes('nature') || lowerName.includes('wildlife')) {
      return 'Nature Tours';
    }
    if (lowerName.includes('city') || lowerAddress.includes('city')) {
      return 'City Tours';
    }
    return 'General Tours';
  };

  const fetchTourGuides = () => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error('Google Maps API not loaded');
        return resolve([]);
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        location: new window.google.maps.LatLng(1.5533, 110.3592),
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
              type: determineTourType(place),
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng()
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

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSort = sortOrder === 'all' || item.type === sortOrder;
    return matchesSearch && matchesSort;
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
              className="search-input"
            />
          </div>

          <div className="sort-dropdown">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Categories</option>
              <option value="Cultural Tours">Cultural Tours</option>
              <option value="Adventure Tours">Adventure Tours</option>
              <option value="Nature Tours">Nature Tours</option>
              <option value="City Tours">City Tours</option>
              <option value="General Tours">General Tours</option>
            </select>
          </div>
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
                      coordinates: [item.lat, item.lng]
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