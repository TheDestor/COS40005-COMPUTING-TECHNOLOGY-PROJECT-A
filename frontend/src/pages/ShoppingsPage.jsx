import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = 'f8NnjAeb304'; 

const ShoppingLeisurePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Shopping & Leisure');

  const processOSMData = (osmData) => {
    if (!osmData.elements) return [];
    
    return osmData.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => {
        const tags = element.tags;
        let type = 'Other';
        
        // Determine category based on OSM tags
        if (tags.shop) {
          switch(tags.shop) {
            case 'mall':
            case 'department_store':
            case 'supermarket':
              type = 'Shopping Malls';
              break;
            case 'clothes':
            case 'fashion':
            case 'jewelry':
            case 'accessories':
            case 'shoes':
            case 'bag':
            case 'tailor':
              type = 'Fashion and Jewelry';
              break;
            case 'electronics':
            case 'computer':
            case 'mobile_phone':
            case 'hifi':
              type = 'Electronics and Technology';
              break;
            case 'books':
            case 'stationery':
              type = 'Books and Stationery';
              break;
            case 'sports':
            case 'outdoor':
            case 'bicycle':
              type = 'Sports and Outdoor';
              break;
            case 'hardware':
            case 'garden_centre':
            case 'furniture':
              type = 'Home and Garden';
              break;
            default:
              type = 'Other';
          }
        } else if (tags.leisure) {
          switch(tags.leisure) {
            case 'fitness_centre':
            case 'gym':
            case 'sports_centre':
            case 'yoga':
              type = 'Sports and Outdoor';
              break;
            case 'spa':
            case 'sauna':
              type = 'Wellness and Entertainment';
              break;
            case 'cinema':
            case 'bowling_alley':
            case 'amusement_arcade':
            case 'adult_gaming_centre':
              type = 'Wellness and Entertainment';
              break;
            default:
              type = 'Wellness and Entertainment';
          }
        } else if (tags.amenity === 'marketplace' || tags.amenity === 'market') {
          type = 'Markets and Bazaars';
        } else if (tags.amenity === 'cinema' || tags.amenity === 'theatre') {
          type = 'Wellness and Entertainment';
        } else if (tags.amenity === 'spa') {
          type = 'Wellness and Entertainment';
        }

        // Generate description if not available
        let description = tags.description || '';
        if (!description) {
          if (tags.shop) {
            description = `A ${tags.shop.replace('_', ' ')} located in Sarawak`;
          } else if (tags.leisure) {
            description = `A ${tags.leisure.replace('_', ' ')} facility in Sarawak`;
          } else {
            description = 'Shopping and leisure destination in Sarawak';
          }
        }

        // Get coordinates
        let lat, lng;
        if (element.lat && element.lon) {
          lat = element.lat;
          lng = element.lon;
        } else if (element.center) {
          lat = element.center.lat;
          lng = element.center.lon;
        } else {
          // Fallback coordinates for Kuching
          lat = 1.5500;
          lng = 110.3333;
        }

        return {
          name: tags.name,
          desc: description,
          slug: tags.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
          image: defaultImage,
          type: type,
          lat: lat,
          lng: lng
        };
      });
  };

  const fetchShoppingLeisurePlaces = async () => {
    setLoading(true);
    try {
      // Using OpenStreetMap Overpass API - completely free, no API key needed
      // Simplified query that works with the Overpass API
      const query = `
        [out:json][timeout:25];
        (
          // Shopping places in Sarawak area
          node["shop"](1.0,109.0,2.5,111.5);
          node["leisure"](1.0,109.0,2.5,111.5);
          node["amenity"~"cinema|theatre|spa"](1.0,109.0,2.5,111.5);
          
          // Ways for larger shopping areas
          way["shop"](1.0,109.0,2.5,111.5);
          way["leisure"](1.0,109.0,2.5,111.5);
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const osmData = await response.json();
      
      // Process OSM data to match your format
      const processedData = processOSMData(osmData);
      
      // Remove duplicates based on name and limit to 50
      const uniqueData = processedData
        .filter((item, index, self) => 
          index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
        )
        .slice(0, 50); // Ensure we only return max 50 items
      
      setData(uniqueData);
      
    } catch (error) {
      console.error('Error fetching shopping places from OpenStreetMap:', error);
      // Fallback to static data if API fails
      setData(getFallbackData());
    } finally {
      setLoading(false);
    }
  };

  // Fallback data in case API fails
  const getFallbackData = () => {
    return [
      {
        name: "Vivacity Megamall",
        desc: "One of Kuching's largest shopping malls with various retail outlets and entertainment options",
        slug: "vivacity-megamall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5200,
        lng: 110.3500
      },
      {
        name: "Spring Shopping Mall",
        desc: "Popular shopping destination in Kuching with international brands and dining options",
        slug: "spring-shopping-mall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5300,
        lng: 110.3400
      },
      {
        name: "Sarawak Handicraft Center",
        desc: "Traditional Sarawakian crafts and souvenirs including textiles and wood carvings",
        slug: "sarawak-handicraft-center",
        image: defaultImage,
        type: "Fashion and Jewelry",
        lat: 1.5600,
        lng: 110.3400
      },
      {
        name: "Plaza Merdeka",
        desc: "Shopping mall in the heart of Kuching with diverse retail options",
        slug: "plaza-merdeka",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5581,
        lng: 110.3469
      },
      {
        name: "The Hills Shopping Mall",
        desc: "Modern shopping complex with entertainment and dining facilities",
        slug: "the-hills-shopping-mall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5314,
        lng: 110.3572
      },
      {
        name: "CityONE Megamall",
        desc: "Shopping and entertainment complex in Kuching",
        slug: "cityone-megamall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5256,
        lng: 110.3297
      },
      {
        name: "Boulevard Shopping Mall",
        desc: "Well-established shopping center in Kuching",
        slug: "boulevard-shopping-mall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5564,
        lng: 110.3458
      },
      {
        name: "Green Heights Shopping Mall",
        desc: "Neighborhood shopping mall with various amenities",
        slug: "green-heights-shopping-mall",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5483,
        lng: 110.3292
      },
      {
        name: "Riverside Shopping Complex",
        desc: "Riverside shopping experience in Kuching",
        slug: "riverside-shopping-complex",
        image: defaultImage,
        type: "Shopping Malls",
        lat: 1.5597,
        lng: 110.3450
      },
      {
        name: "Satok Weekend Market",
        desc: "Famous local market offering fresh produce and handicrafts",
        slug: "satok-weekend-market",
        image: defaultImage,
        type: "Markets and Bazaars",
        lat: 1.5589,
        lng: 110.3383
      }
    ].slice(0, 50);
  };

  useEffect(() => {
    fetchShoppingLeisurePlaces();
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
        <p>Loading shopping and leisure destinations...</p>
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
        <h1>{currentCategory.toUpperCase() || 'SHOPPING AND LEISURE'}</h1>
        <p className="hero-intro">
            Take home a piece of Sarawak's rich heritage. Discover traditional handicrafts, local artisan products, and modern retail experiences that showcase the state's unique cultural diversity.
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
              <option value="Shopping Malls">Shopping Malls</option>
              <option value="Fashion and Jewelry">Fashion and Jewelry</option>
              <option value="Wellness and Entertainment">Wellness and Entertainment</option>
              <option value="Markets and Bazaars">Markets and Bazaars</option>
              <option value="Electronics and Technology">Electronics and Technology</option>
              <option value="Books and Stationery">Books and Stationery</option>
              <option value="Sports and Outdoor">Sports and Outdoor</option>
              <option value="Home and Garden">Home and Garden</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* <div className="results-info">
        <p>Showing {filteredData.length} of {data.length} locations</p>
      </div> */}

      <div className="cards-section">
        {filteredData.length > 0 ? (
          filteredData.slice(0, visibleItems).map((item, index) => (
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
                  <div className={`type-badge ${item.type.replace(/\s+/g, '-').toLowerCase()}`}>
                    {item.type}
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
          ))
        ) : (
          <div className="no-results">
            <p>No shopping and leisure destinations found. Try adjusting your search or check back later.</p>
          </div>
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

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default ShoppingLeisurePage;