import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone, FaSearch, FaArrowUp } from 'react-icons/fa';
import { useInstantData } from '../hooks/useInstantData';

const HERO_VIDEO_ID = 'dPGp9T7iyiE'; 

const AttractionsPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Attractions');
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

  // ✅ Get coordinates dynamically (e.g., from geolocation)
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            resolve({ lat: 1.5533, lng: 110.3592 }); // Fallback to Kuching
          }
        );
      } else {
        resolve({ lat: 1.5533, lng: 110.3592 }); // Fallback if geolocation is unsupported
      }
    });
  };

  // Fetch Attraction locations from database
  const fetchAttractionLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Attraction');
      const fetchedData = await response.json();
      
      // Filter for only category "Attraction"
      const attractionData = fetchedData.filter(item => 
        item.category?.toLowerCase() === 'attraction'
      );
      
      return attractionData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'N/A',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Attraction',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching attraction locations:', error);
      return [];
    }
  };

  // Fetch business locations with category "Attractions"
  const fetchBusinessAttractions = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Attractions');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business attractions');
      }
      
      const businessData = result.data || [];
      
      return businessData.map(business => ({
        name: business.name || 'Unknown Business',
        desc: business.description || 'No description available',
        slug: business.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown-business',
        image: business.businessImage || defaultImage,
        type: 'Business',
        division: business.division || 'Unknown',
        latitude: business.latitude || 0,
        longitude: business.longitude || 0,
        url: business.website || '',
        category: business.category || 'Attractions',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business attractions:', error);
      return [];
    }
  };

  const OVERPASS_CACHE_KEY = 'overpass_attractions_cache';
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  const getCachedOverpassData = () => {
    try {
      const cached = localStorage.getItem(OVERPASS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('📦 Using cached Overpass data');
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to read Overpass cache:', error);
    }
    return null;
  };

  const setCachedOverpassData = (data) => {
    try {
      localStorage.setItem(OVERPASS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('💾 Cached Overpass data');
    } catch (error) {
      console.warn('Failed to cache Overpass data:', error);
    }
  };

  // Fetch attractions from Overpass API (OpenStreetMap)
  const fetchOverpassAttractions = async () => {
    // Check cache first
    const cachedData = getCachedOverpassData();
    if (cachedData) {
      return cachedData;
    }

    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for tourist attractions in Sarawak
      const overpassQuery = `
        [out:json][timeout:15];
        (
          node["tourism"="attraction"]["name"](${sarawakBbox});
          node["tourism"="museum"]["name"](${sarawakBbox});
          node["leisure"="park"]["name"](${sarawakBbox});
        );
        out center 50;
      `;

      // Try multiple Overpass servers with fallback
      const overpassUrls = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter'
      ];

      for (const url of overpassUrls) {
        try {
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept-Language': 'en'
            },
            body: `data=${encodeURIComponent(overpassQuery)}`
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Successfully fetched from ${url}`);
            
            if (result && result.elements) {
              const processedData = result.elements.map(element => {
                const tags = element.tags || {};
                const name = tags.name || 'Unnamed Attraction';
                
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
                if (tags.tourism === 'museum') type = 'Museum';
                else if (tags.tourism === 'zoo') type = 'Zoo';
                else if (tags.tourism === 'aquarium') type = 'Aquarium';
                else if (tags.tourism === 'theme_park') type = 'Theme Park';
                else if (tags.leisure === 'park' || tags.leisure === 'nature_reserve') type = 'National Park';
                else if (tags.natural === 'beach') type = 'Beach';
                else if (tags.natural === 'waterfall') type = 'Waterfall';
                else if (tags.tourism === 'attraction') type = 'Attraction';

                // Create description from available tags
                let description = tags.description || tags.wikipedia || '';
                if (!description) {
                  if (tags.tourism) description = `${tags.tourism.replace('_', ' ')}`;
                  if (tags.operator) description += ` operated by ${tags.operator}`;
                }

                return {
                  name: name,
                  desc: description || `A ${type.toLowerCase()} in Sarawak`,
                  slug: name.toLowerCase().replace(/\s+/g, '-'),
                  image: defaultImage, // Overpass doesn't provide images
                  type: type,
                  division: tags['addr:city'] || tags['addr:state'] || 'Sarawak',
                  latitude: lat,
                  longitude: lon,
                  url: tags.website || '',
                  category: 'Attraction',
                  source: 'overpass',
                  osmTags: tags // Include all OSM tags for potential future use
                };
              });
              
              setCachedOverpassData(processedData);
              return processedData;
            }
            
            return [];
          } else if (response.status === 429) {
            console.warn(`⚠️ Rate limited by ${url}, trying next server...`);
            continue; // Try next URL
          } else {
            console.warn(`⚠️ ${url} returned ${response.status}, trying next server...`);
            continue; // Try next URL
          }
        } catch (error) {
          console.warn(`⚠️ Error with ${url}:`, error.message);
          continue; // Try next URL
        }
      }

      // If all servers fail, return empty array
      console.warn('❌ All Overpass servers failed, returning empty array');
      return [];
      
    } catch (error) {
      console.error('Error fetching Overpass attractions:', error);
      return [];
    }
  };

  // Main fetch function for the hook
  const fetchAllAttractions = useCallback(async () => {
    // Fetch from all sources (excluding Google Places)
    const [attractionLocations, businessAttractions, overpassAttractions] = await Promise.all([
      fetchAttractionLocations(),
      fetchBusinessAttractions(),
      fetchOverpassAttractions()
    ]);

    // Combine all data
    const allData = [...attractionLocations, ...businessAttractions, ...overpassAttractions];
    
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

  // Data processing function
  const processAttractions = useCallback((items) => {
    return items.map(item => {
      const name = item.name;
      const lowerName = name.toLowerCase();
      
      // Determine type if not already set
      let type = item.type;
      if (!type || type === 'Other') {
        if (lowerName.includes('museum')) type = 'Museum';
        else if (lowerName.includes('park') || lowerName.includes('national')) type = 'National Park';
        else if (lowerName.includes('beach')) type = 'Beach';
        else if (lowerName.includes('zoo')) type = 'Zoo';
        else if (lowerName.includes('aquarium')) type = 'Aquarium';
        else if (lowerName.includes('waterfall')) type = 'Waterfall';
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

  // 🚀 Use the enhanced instant data hook
  const { data, loading, isInitialLoad, preloadData } = useInstantData(
    'attractions', 
    fetchAllAttractions, 
    processAttractions
  );

  // 🚀 FIXED: Better loading state management
  useEffect(() => {
    console.log('Loading states:', { loading, dataLength: data.length, isInitialLoad });
    
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
        onAttractionsHover={preloadData}
      />

      {/* 🚀 FIXED: Simple and reliable loading condition */}
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Attractions...</p>
        </div>
      )}

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
        <h1>{currentCategory.toUpperCase() || 'ATTRACTIONS'}</h1>
        <p className="hero-intro">
          Explore Sarawak's incredible diversity of attractions. From Kuching's cultural landmarks and Sibu's heritage sites to Miri's national parks and ancient cave systems, discover the must-see wonders that make Sarawak unique.
        </p>
      </div>

      <div className="search-section">
        <div className="search-container-mj">
          <div className="search-bar-mj">
            <FaSearch className="search-icon-mj" aria-hidden="true" />
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
              <option value="National Park">National Park</option>
              <option value="Museum">Museum</option>
              <option value="Beach">Beach</option>
              <option value="Zoo">Zoo</option>
              <option value="Aquarium">Aquarium</option>
              <option value="Waterfall">Waterfall</option>
              <option value="Theme Park">Theme Park</option>
              <option value="Business">Business Attractions</option>
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
              <p>No attractions found. Try adjusting your search criteria.</p>
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

export default AttractionsPage;