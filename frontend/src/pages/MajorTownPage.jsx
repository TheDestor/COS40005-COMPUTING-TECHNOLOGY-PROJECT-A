import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/MajorTownPage.css';
import defaultImage from '../assets/Kuching.png';

const MajorTownPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory, setCurrentCategory] = useState('');

  const handleDataFetch = (category, fetchedData) => {
    setLoading(true);
    setCurrentCategory(category);
    setSearchQuery('');
    setSortOrder('default');

    const processed = processData(fetchedData, category);
    setData(processed);
    setLoading(false);
  };

  const processData = (items, category) => {
    return (items || []).map(item => ({
      name: item?.Name || item?.name || 'Unknown',
      desc: item?.description || item?.Desc || 'No description',
      slug: (item?.Name || item?.name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
      // image: categoryImages[item?.name] || defaultImage,
      image: item?.image || defaultImage,
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
      <MenuNavbar onLoginClick={handleLoginClick} onMenuSelect={handleDataFetch} />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{currentCategory.toUpperCase() || 'Category'}</h1>
          <p>Exploring {currentCategory || 'Sarawak'}</p>
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
                    <Link to={`/details/${currentCategory}/${item.slug}`} className="explore-btn">
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

export default MajorTownPage;
