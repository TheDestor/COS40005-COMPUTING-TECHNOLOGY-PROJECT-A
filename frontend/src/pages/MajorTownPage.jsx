import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { useInstantData } from '../hooks/useInstantData.jsx'; // 🚀 Updated import
import { FaArrowUp } from 'react-icons/fa';

const HERO_VIDEO_ID = 'KIQueYmDWEQ';

const MajorTownPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Define data fetching function
  const fetchMajorTowns = useCallback(async () => {
    const response = await fetch('/api/locations');
    const allData = await response.json();
    return allData.filter(item => item.type === 'Major Town');
  }, []);

  // Define data processing function
  const processMajorTowns = useCallback((items) => {
    return items.map(item => ({
      ...item,
      name: item.division || item.name,
      desc: item.description || 'No description available',
      slug: item.slug || (item.division || item.name || 'unknown')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, ''),
      image: item.image || defaultImage,
      lat: item.latitude,
      lng: item.longitude,
      type: item.type || 'Major Town'
    }));
  }, []);

  // 🚀 KEY CHANGE: Use the enhanced instant data hook
  const { data, loading, isInitialLoad, preloadData } = useInstantData(
    'major_towns', 
    fetchMajorTowns, 
    processMajorTowns
  );

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => (prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default'));
  }, []);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let result = data.filter(item => 
      item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [data, searchQuery, sortOrder]);

  const highlightMatch = useCallback((name) => {
    if (!name) return 'Unknown';
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
  }, [searchQuery]);

  // 🚀 KEY CHANGE: COMPLETELY REMOVED the early return loading condition
  // The page will ALWAYS render instantly, showing cached data immediately

  return (
    <div className="category-page">
      <MenuNavbar 
        onLoginClick={handleLoginClick} 
        onMajorTownHover={preloadData}
      />

      {/* 🚀 KEY CHANGE: Only show loading for true first-time visits with no cache
      {loading && isInitialLoad && data.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Major Towns...</p>
        </div>
      )} */}

      {/* 🚀 ALWAYS SHOW CONTENT - cached data appears instantly */}
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
        <h1>MAJOR TOWNS</h1>
        <p className="hero-intro">
          Discover Sarawak's vibrant urban centers - from the bustling capital Kuching to the 
          historic town of Sibu and the riverine charm of Miri. Each major town offers unique 
          cultural experiences, modern amenities, and gateway access to Sarawak's rich heritage 
          and natural wonders.
        </p>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-bar-mj">
            <input
              type="text"
              placeholder="Search Major Towns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-mj"
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

      {/* 🚀 CONTENT ALWAYS SHOWS - cached data appears instantly */}
      <div className="cards-section">
        {filteredData.length > 0 ? (
          filteredData
            .slice(0, visibleItems)
            .map((item, index) => (
              <div
                className="card-wrapper"
                key={item.slug || index}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`card floating-card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = defaultImage;
                    }}
                  />
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
                          lat: item.lat,
                          lng: item.lng
                        }} 
                        className="explore-btn"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
        ) : (
          // 🚀 Only show empty state if not loading and truly no data
          !loading && data.length === 0 && (
            <div className="empty-state">
              <p>No major towns found.</p>
            </div>
          )
        )}
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

      <AIChatbot />
      {showScrollTop && (
        <button
          className="scroll-to-top-btn-mj"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaArrowUp aria-hidden="true" />
        </button>
      )}
      <Footer />
    </div>
  );
};

export default MajorTownPage;