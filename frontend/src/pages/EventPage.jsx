import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = 'VduPZPPIvHA'; 

const EventPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('All Events');
  const [error, setError] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('All');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/event/getAllEvents');
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response');
      }

      const { events: fetchedData } = await response.json();
      if (!fetchedData || !Array.isArray(fetchedData)) {
        throw new Error('Invalid data format from API');
      }

      const processedData = processData(fetchedData);
      setData(processedData);
    } catch (error) {
      console.error('Fetch Error:', error);
      setError(`Failed to load events: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const processData = (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    return items.map(item => ({
      id: item._id?.toString() || Math.random().toString(36).substr(2, 9),
      name: item.name || 'Unnamed Event',
      desc: item.description || 'Description not available',
      slug: (item.name || 'event').toLowerCase().replace(/\s+/g, '-'),
      image: item.imageUrl || defaultImage,
      lat: item.latitude || item.lat || null,
      lng: item.longitude || item.lng || null,
      date: item.eventDate ? new Date(item.eventDate) : null,
      // location: item.location || 'Location not specified',
      eventType: item.eventType || 'Event'
    }));
  };

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
    const matchesType = selectedEventType === 'All' || item.eventType === selectedEventType;
    return matchesSearch && matchesType;
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
        <div className="hero-video-bg">
          <iframe
            src={`https://www.youtube.com/embed/${HERO_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${HERO_VIDEO_ID}&modestbranding=1&showinfo=0&rel=0`}
            title="Sarawak Hero Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          ></iframe>
        </div>
      </div>

      <div className="hero-overlay-mt">
        <h1>{currentCategory.toUpperCase() || 'EVENT'}</h1>
        <p className="hero-intro">
            Explore the vibrant pulse of Sarawak through its events. From cultural festivals and bustling markets to modern concerts and exhibitions, discover what's happening across Kuching, Miri, Sibu, and beyond.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          Error loading events: {error}. Please try refreshing the page.
        </div>
      )}

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
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="sort-select"
            >
              <option value="All">All Events</option>
              <option value="Festival">Festival</option>
              <option value="Workshop">Workshop</option>
              <option value="Business Meetup">Business Meetup</option>
            </select>
          </div>
        </div>
      </div>

      {!loading && !error && filteredData.length === 0 && (
        <div className="no-results">
          <p>No events found matching your criteria.</p>
          <button onClick={() => {
            setSearchQuery('');
            setSelectedEventType('All');
          }}>
            Reset Filters
          </button>
        </div>
      )}

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

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default EventPage;