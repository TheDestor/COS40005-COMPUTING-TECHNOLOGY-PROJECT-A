import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone } from 'react-icons/fa';

const HERO_VIDEO_ID = 'dPGp9T7iyiE'; 

const AttractionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Attractions');

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

  // Fetch attractions from Overpass API (OpenStreetMap)
  const fetchOverpassAttractions = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for tourist attractions in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["tourism"~"attraction|museum|zoo|theme_park|aquarium"]["name"](${sarawakBbox});
          way["tourism"~"attraction|museum|zoo|theme_park|aquarium"]["name"](${sarawakBbox});
          relation["tourism"~"attraction|museum|zoo|theme_park|aquarium"]["name"](${sarawakBbox});
          
          // Also include national parks and natural attractions
          node["leisure"~"park|nature_reserve"]["name"](${sarawakBbox});
          way["leisure"~"park|nature_reserve"]["name"](${sarawakBbox});
          relation["leisure"~"park|nature_reserve"]["name"](${sarawakBbox});
          
          node["natural"~"beach|peak|waterfall"]["name"](${sarawakBbox});
          way["natural"~"beach|peak|waterfall"]["name"](${sarawakBbox});
          relation["natural"~"beach|peak|waterfall"]["name"](${sarawakBbox});
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
    } catch (error) {
      console.error('Error fetching Overpass attractions:', error);
      return [];
    }
  };

  const fetchAllAttractions = async () => {
    setLoading(true);
    try {
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

      // Process and enhance the data
      const processedData = uniqueData.map(item => {
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

      setData(processedData);
    } catch (error) {
      console.error('Error fetching all attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAttractions();
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
        <p>Loading Attractions...</p>
      </div>
    );
  }

  return (
    <div className="category-page">
      <MenuNavbar onLoginClick={handleLoginClick}/>

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
        <div className="search-container">
          <div className="search-bar-mj">
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

      <div className="cards-section">
        {filteredData.slice(0, visibleItems).map((item, index) => (
          <div
            className="card-wrapper"
            key={`${item.source}-${item.name}-${index}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`card ${index % 2 === 0 ? 'tall-card' : 'short-card'}`}>
              <img src={item.image} alt={item.name} />
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
        ))}
      </div>

      {filteredData.length === 0 && !loading && (
        <div className="no-results">
          <p>No attractions found. Try adjusting your search criteria.</p>
        </div>
      )}

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

export default AttractionsPage;