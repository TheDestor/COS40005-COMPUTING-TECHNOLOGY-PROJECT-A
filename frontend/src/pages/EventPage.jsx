import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';

const EventPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('All Events');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events?eventType=Festival'); // Use full backend URL
      console.log('API Response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch events');
      }

      const fetchedData = await response.json();
      console.log('Raw API Data:', fetchedData);
      setData(processData(fetchedData));
    } catch (error) {
      console.error('Full Error Details:', error);
      setData([]); // Reset data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const processData = (items) => {
    return (items || []).map(item => ({
      id: item._id?.toString() || item.id, // Convert MongoDB ObjectID
      name: item.name || 'Unknown Event',
      desc: item.description || 'No description available',
      slug: (item.name || 'unknown').toLowerCase().replace(/\s+/g, '-'),
      image: item.imageUrl || defaultImage,
      lat: item.latitude || item.lat || null,
      lng: item.longitude || item.lng || null,
      date: item.eventDate ? new Date(item.eventDate) : null,
      location: item.location || 'Location not specified',
      eventType: item.eventType || 'General'
    }));
  };

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default');
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
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{currentCategory.toUpperCase()}</h1>
          <p>Explore {currentCategory}</p>
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
        {filteredData.slice(0, visibleItems).map((item) => (
          <div className="card-wrapper" key={item.id}>
            <div className="card">
              <img 
                src={item.image} 
                alt={item.name}
                onError={(e) => {
                  e.target.src = defaultImage;
                  e.target.alt = 'Default event image';
                }}
              />
              <div className="card-content">
                <h3>{highlightMatch(item.name)}</h3>
                <div className="event-meta">
                  <span className="event-type">{item.eventType}</span>
                  {item.date && (
                    <span className="event-date">
                      {item.date.toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="location">{item.location}</div>
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
                      coordinates: item.lng && item.lat ? [item.lng, item.lat] : null,
                      date: item.date,
                      location: item.location
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
        <div className="pagination-controls">
          <button className="show-more-btn" onClick={() => setVisibleItems(prev => prev + 12)}>
            Show More (+12)
          </button>
          <button className="show-all-btn" onClick={() => setVisibleItems(filteredData.length)}>
            Show All
          </button>
        </div>
      )}

      {showLogin && <LoginPage onClose={closeLogin} />}
      <Footer />
    </div>
  );
};

export default EventPage;