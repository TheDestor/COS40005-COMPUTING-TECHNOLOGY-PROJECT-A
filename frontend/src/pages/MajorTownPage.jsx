import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

const HERO_VIDEO_ID = 'KIQueYmDWEQ'; 

const MajorTownPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory, setCurrentCategory] = useState('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.3 });

  // Fetch all locations and filter for Major Towns
  const fetchAllLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/locations');
      const allData = await response.json();

      // Log first 3 items to inspect structure
      allData.slice(0, 3).forEach((item, i) => {
        console.log(`Item ${i}: latitude = ${item.latitude}, longitude = ${item.longitude}`, item);
      });

      const majorTowns = allData.filter(item => item.type === 'Major Town');
      handleDataFetch('Major Towns', majorTowns);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLocations();
  }, []);

  const handleDataFetch = (category, fetchedData) => {
    setLoading(true);
    setCurrentCategory(category);
    setSearchQuery('');
    setSortOrder('default');

    const processed = processData(fetchedData);
    setData(processed);
    setLoading(false);
  };

  const processData = (items) => {
    return items.map(item => ({
      ...item,
      name: item.division,
      desc: item.description,
      slug: item.slug || item.division
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, ''),
      image: item.image || defaultImage,
      lat: item.latitude,
      lng: item.longitude
    }));
  };

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
        <h1>{currentCategory.toUpperCase() || 'MAJOR TOWNS'}</h1>
        <p className="hero-intro">
          Discover Sarawak's vibrant urban centers - from the bustling capital Kuching to the 
          historic town of Sibu and the riverine charm of Miri. Each major town offers unique 
          cultural experiences, modern amenities, and gateway access to Sarawak's rich heritage 
          and natural wonders.
        </p>
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
        {filteredData
          .slice(0, visibleItems)
          .map((item, index) => (
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
                      to={`/towns/${item.slug}`} 
                      state={{ 
                        town: item,
                        division: item.name,
                        type: item.type,
                        lat: item.latitude,
                        lng: item.longitude
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

export default MajorTownPage;