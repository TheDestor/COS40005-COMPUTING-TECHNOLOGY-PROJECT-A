import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/MajorTownPage.css';
import defaultImage from '../assets/Kuching.png';
import kuchingImg from '../assets/Kuching.png';
import bintuluImg from '../assets/Bintulu.png';
import miriImg from '../assets/Miri.png';
import limbangImg from '../assets/Limbang.png';
import kapitImg from '../assets/Kapit.png';
import sibuImg from '../assets/Sibu.png';

// Import category images
const categoryImages = {
  'Kuching': kuchingImg,
  'Bintulu': bintuluImg,
  'Miri': miriImg,
  'Limbang': limbangImg,
  'Kapit': kapitImg,
  'Sibu': sibuImg,
};

const MajorTownPage = () => {
  const { category } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleItems, setVisibleItems] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = getEndpointByCategory(category);
        const response = await fetch(`${"/api/locations/"}/${endpoint}`);
        
        if (!response.ok) { // Check for HTTP errors
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        const processedData = processData(result, category);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setData([]); // Ensure data is reset on error
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [category]);

  useEffect(() => {
    setVisibleItems(12);
  }, [category, searchQuery, sortOrder]);

  const getEndpointByCategory = (currentCategory) => {
    const endpoints = {
      'major-towns': 'divisions',
      'homestays': 'homestays',
      'museums': 'attractions?type=museum',
      'national-parks': 'attractions?type=national-park',
      'airports': 'attractions?type=airport',
      'seaports': 'attractions?type=seaport',
      'accommodations': 'attractions?type=homestay',
      // Add more categories as needed
    };
    return endpoints[currentCategory] || '';
  };

  const processData = (rawData, currentCategory) => {
    switch(currentCategory) {
      case 'major-towns':
        return processDivisions(rawData);
      case 'homestays':
        return processHomestays(rawData);
      case 'museums':
      case 'national-parks':
      case 'airports':
      case 'seaports':
      case 'accommodations':
        return processAttractions(rawData, currentCategory);
      default:
        return rawData;
    }
  };

  const processDivisions = (divisions) => {
    if (!Array.isArray(divisions)) {
      console.error('Invalid divisions data:', divisions);
      return [];
    }
    
    return divisions.map(division => ({
      name: division?.name || 'Unknown Division',
      slug: division?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
      desc: division?.description || `Explore ${division?.name}'s unique culture`,
      image: categoryImages[division?.name] || defaultImage
    }));
  };

  const processHomestays = (homestays) => {
    return (homestays || []).map(homestay => ({
      name: homestay?.Name,
      slug: (homestay?.Name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown'),
      desc: `Experience life at ${homestay?.Name || 'this homestay'}`,
      image: defaultImage,
      location: {
        lat: homestay?.Latitude || 0,
        lng: homestay?.Longitude || 0
      }
    }));
  };

  const processAttractions = (attractions, type) => {
    const typeMap = {
      'museums': 'Museum',
      'national-parks': 'National Park',
      'airports': 'Airport',
      'seaports': 'Seaport',
      'accommodations': 'Homestay'
    };
    
    return (attractions || [])
      .filter(attr => attr?.Type === typeMap[type])
      .map(attr => ({
        name: attr?.Name || 'Unknown Attraction',
        slug: (attr?.Name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown'),
        desc: `${attr?.Type || 'Attraction'} in ${attr?.Division || 'Sarawak'}`,
        image: defaultImage,
        category: attr?.Category || 'General'
      }));
  };

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const handleSortToggle = () => {
    setSortOrder(prev => {
      if (prev === 'default') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'default';
    });
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
  .filter(item =>
    item?.name?.toLowerCase()?.includes(searchQuery.toLowerCase() ?? '')
  ) // Added missing closing parenthesis
  .sort((a, b) => {
    if (sortOrder === 'asc') return a.name?.localeCompare(b.name);
    if (sortOrder === 'desc') return b.name?.localeCompare(a.name);
    return 0;
  });

  const formattedCategory = category?.replace(/-/g, ' ') || '';

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading {formattedCategory || 'content'}...</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MenuNavbar onLoginClick={handleLoginClick} />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{formattedCategory.toUpperCase()}</h1>
          <p>Exploring {formattedCategory} in Sarawak</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder={`Search ${formattedCategory}...`}
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
                      to={`/details/${category}/${item.slug}`} 
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
          <button 
            className="show-more-btn100"
            onClick={() => setVisibleItems(prev => prev + 12)}
          >
            Show More (+12)
          </button>
          <button
            className="show-all-btn100"
            onClick={() => setVisibleItems(filteredData.length)}
          >
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