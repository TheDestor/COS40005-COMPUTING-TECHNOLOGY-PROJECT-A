import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone, FaSearch, FaArrowUp } from 'react-icons/fa';
import { useInstantData } from '../hooks/useInstantData.jsx';

const HERO_VIDEO_ID = 'f8NnjAeb304'; 

const ShoppingLeisurePage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Shopping & Leisure');
  const [showLoading, setShowLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch business locations with category "Shopping & Leisure" - KEPT ORIGINAL
  const fetchBusinessShopping = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Shopping & Leisure');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business shopping');
      }
      
      const businessData = result.data || [];
      
      return businessData.map(business => ({
        name: business.name || 'Unknown Business',
        desc: business.description || 'No description available',
        slug: business.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown-business',
        image: business.businessImage || defaultImage,
        type: 'Business',
        division: business.division || 'N/A',
        latitude: business.latitude || 0,
        longitude: business.longitude || 0,
        url: business.website || '',
        category: business.category || 'Shopping & Leisure',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business shopping:', error);
      return [];
    }
  };

  // Fetch shopping locations from database - KEPT ORIGINAL
  const fetchShoppingLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Shopping');
      const fetchedData = await response.json();
      
      // Filter for shopping related categories
      const shoppingData = fetchedData.filter(item => 
        item.category?.toLowerCase().includes('shopping') || 
        item.type?.toLowerCase().includes('mall') ||
        item.type?.toLowerCase().includes('market')
      );
      
      return shoppingData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'Unknown',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Shopping',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching shopping locations:', error);
      return [];
    }
  };

  // Fetch shopping places from Overpass API (OpenStreetMap) - KEPT ORIGINAL
  const fetchOverpassShopping = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for shopping and leisure in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Shopping places
          node["shop"](${sarawakBbox});
          way["shop"](${sarawakBbox});
          relation["shop"](${sarawakBbox});
          
          // Leisure and entertainment
          node["leisure"](${sarawakBbox});
          way["leisure"](${sarawakBbox});
          relation["leisure"](${sarawakBbox});
          
          // Malls and shopping centers
          node["building"="retail"](${sarawakBbox});
          way["building"="retail"](${sarawakBbox});
          relation["building"="retail"](${sarawakBbox});
          
          // Markets
          node["amenity"="marketplace"](${sarawakBbox});
          way["amenity"="marketplace"](${sarawakBbox});
          relation["amenity"="marketplace"](${sarawakBbox});
        );
        out center 100;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const result = await response.json();
      
      return result.elements.map(element => {
        const tags = element.tags || {};
        const name = tags.name || 'Unnamed Shopping Place';
        
        // Determine coordinates
        let lat, lon;
        if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        } else {
          lat = element.lat;
          lon = element.lon;
        }

        // Determine type based on OSM tags
        let type = 'Other';
        if (tags.shop === 'mall' || tags.building === 'retail') type = 'Shopping Mall';
        else if (tags.shop === 'supermarket') type = 'Supermarket';
        else if (tags.shop === 'department_store') type = 'Department Store';
        else if (tags.amenity === 'marketplace') type = 'Market';
        else if (tags.leisure === 'fitness_centre') type = 'Fitness Center';
        else if (tags.leisure === 'sports_centre') type = 'Sports Center';
        else if (tags.leisure === 'park') type = 'Park';
        else if (tags.shop) type = tags.shop.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        else if (tags.leisure) type = tags.leisure.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Create description from available tags
        let description = tags.description || tags.wikipedia || '';
        if (!description) {
          description = `A ${type.toLowerCase()} in Sarawak`;
          if (tags.operator) description += ` operated by ${tags.operator}`;
        }

        return {
          name: name,
          desc: description,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          image: defaultImage,
          type: type,
          division: tags['addr:city'] || tags['addr:state'] || 'Sarawak',
          latitude: lat,
          longitude: lon,
          url: tags.website || '',
          category: 'Shopping & Leisure',
          source: 'overpass',
          osmTags: tags
        };
      });
    } catch (error) {
      console.error('Error fetching Overpass shopping:', error);
      return [];
    }
  };

  // Main fetch function for the hook - ADDED for instant loading
  const fetchAllShopping = useCallback(async () => {
    // Fetch from all sources
    const [shoppingLocations, businessShopping, overpassShopping] = await Promise.all([
      fetchShoppingLocations(),
      fetchBusinessShopping(),
      fetchOverpassShopping()
    ]);

    // Combine all data
    const allData = [...shoppingLocations, ...businessShopping, ...overpassShopping];
    
    // Remove duplicates based on name and coordinates
    const uniqueData = allData.filter((item, index, self) =>
      index === self.findIndex(t => 
        t.name === item.name && 
        Math.abs(t.latitude - item.latitude) < 0.001 && 
        Math.abs(t.longitude - item.longitude) < 0.001
      )
    );

    return uniqueData;
  }, []);

  // Data processing function - ADDED for instant loading
  const processShopping = useCallback((items) => {
    return items.map(item => {
      const name = item.name;
      const lowerName = name.toLowerCase();
      
      // Determine type if not already set
      let type = item.type;
      if (!type || type === 'Other') {
        if (lowerName.includes('mall') || lowerName.includes('shopping')) type = 'Shopping Mall';
        else if (lowerName.includes('market')) type = 'Market';
        else if (lowerName.includes('supermarket')) type = 'Supermarket';
        else if (lowerName.includes('fitness') || lowerName.includes('gym')) type = 'Fitness Center';
        else if (lowerName.includes('sports')) type = 'Sports Center';
        else if (lowerName.includes('park')) type = 'Park';
        else if (item.source === 'business') type = 'Business';
        else type = 'Other';
      }

      return {
        ...item,
        type,
        lat: item.latitude || item.lat || 0,
        lng: item.longitude || item.lng || 0
      };
    });
  }, []);

  // Use the instant data hook - ADDED for instant loading
  const { data, loading, preloadData } = useInstantData(
    'shopping_leisure', 
    fetchAllShopping, 
    processShopping
  );

  // 🚀 FIXED: Better loading state management
  useEffect(() => {
    // Hide loading when we have data OR when loading is complete without data
    if (!loading || data.length > 0) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, data.length]);

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const highlightMatch = useCallback((name) => {
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

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSort = sortOrder === 'all' || item.type === sortOrder;
    return matchesSearch && matchesSort;
  }), [data, searchQuery, sortOrder]);

  return (
    <div className="category-page">
      <MenuNavbar 
        onLoginClick={handleLoginClick} 
        onShoppingHover={preloadData} // ADDED for instant loading
      />

      {/* 🚀 FIXED: Loading overlay only when truly loading with no cached data
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Shopping & Leisure...</p>
        </div>
      )} */}

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
        <h1>{currentCategory.toUpperCase() || 'SHOPPING & LEISURE'}</h1>
        <p className="hero-intro">
          Take home a piece of Sarawak's rich heritage. Discover traditional handicrafts, local artisan products, and modern retail experiences that showcase the state's unique cultural diversity.
        </p>
      </div>

      <div className="search-section">
        <div className="search-container-mj">
          <div className="search-bar-mj">
            <FaSearch className="search-icon-mj" />
            <input
              type="text"
              placeholder={`Search ${currentCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-mj"
            />
          </div>

          <div className="sort-dropdown">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Categories</option>
              <option value="Shopping Mall">Shopping Mall</option>
              <option value="Supermarket">Supermarket</option>
              <option value="Department Store">Department Store</option>
              <option value="Market">Market</option>
              <option value="Fitness Center">Fitness Center</option>
              <option value="Sports Center">Sports Center</option>
              <option value="Park">Park</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>
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
                key={`${item.source}-${item.name}-${index}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}>
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
                    <div className="card-meta">
                      <span className="type-badge">{item.type}</span>
                      {item.division && <span className="division-badge">{item.division}</span>}
                      {item.source === 'business' && <span className="business-badge">Business</span>}
                      {item.source === 'overpass' && <span className="overpass-badge">OpenStreetMap</span>}
                    </div>
                    <div className="desc-scroll">
                      <p>{item.desc}</p>
                    </div>
                    <div className="button-container">
                      <Link
                        to={`/discover/${item.slug}`}
                        state={{
                          name: item.name,
                          image: item.image,
                          description: item.desc,
                          latitude: item.latitude || item.lat,
                          longitude: item.longitude || item.lng,
                          category: item.category,
                          type: item.type,
                          division: item.division,
                          url: item.url,
                          phone: item.phone,
                          address: item.address,
                          openingHours: item.openingHours,
                          source: item.source,
                          osmTags: item.osmTags
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
          // Only show empty state if not loading and truly no data
          !showLoading && (
            <div className="no-results">
              <p>No shopping and leisure destinations found. Try adjusting your search criteria.</p>
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

      {showScrollTop && (
        <button
          className="scroll-to-top-btn-mj"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaArrowUp aria-hidden="true" />
        </button>
      )}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default ShoppingLeisurePage;