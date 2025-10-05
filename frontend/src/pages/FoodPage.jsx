import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone } from 'react-icons/fa';

const HERO_VIDEO_ID = '32OVK42tig4'; 

const FoodBeveragePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Food & Beverages');

  // Fetch business locations with category "Food & Beverages"
  const fetchBusinessFood = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Food & Beverages');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business food');
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
        category: business.category || 'Food & Beverages',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business food:', error);
      return [];
    }
  };

  // Fetch food locations from database
  const fetchFoodLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Food');
      const fetchedData = await response.json();
      
      // Filter for food related categories
      const foodData = fetchedData.filter(item => 
        item.category?.toLowerCase().includes('food') || 
        item.category?.toLowerCase().includes('restaurant') ||
        item.category?.toLowerCase().includes('cafe') ||
        item.type?.toLowerCase().includes('food') ||
        item.type?.toLowerCase().includes('restaurant') ||
        item.type?.toLowerCase().includes('cafe')
      );
      
      return foodData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'Unknown',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Food',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching food locations:', error);
      return [];
    }
  };

  // Fetch food places from Overpass API (OpenStreetMap)
  const fetchOverpassFood = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for food and beverage in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Restaurants and food places
          node["amenity"="restaurant"](${sarawakBbox});
          way["amenity"="restaurant"](${sarawakBbox});
          relation["amenity"="restaurant"](${sarawakBbox});
          
          // Cafes and coffee shops
          node["amenity"="cafe"](${sarawakBbox});
          way["amenity"="cafe"](${sarawakBbox});
          relation["amenity"="cafe"](${sarawakBbox});
          
          // Bars and pubs
          node["amenity"="bar"](${sarawakBbox});
          way["amenity"="bar"](${sarawakBbox});
          relation["amenity"="bar"](${sarawakBbox});
          
          // Fast food
          node["amenity"="fast_food"](${sarawakBbox});
          way["amenity"="fast_food"](${sarawakBbox});
          relation["amenity"="fast_food"](${sarawakBbox});
          
          // Food courts
          node["amenity"="food_court"](${sarawakBbox});
          way["amenity"="food_court"](${sarawakBbox});
          relation["amenity"="food_court"](${sarawakBbox});
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
        const name = tags.name || 'Unnamed Food Place';
        
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
        if (tags.amenity === 'restaurant') type = 'Restaurant';
        else if (tags.amenity === 'cafe') type = 'Cafe';
        else if (tags.amenity === 'bar') type = 'Bar';
        else if (tags.amenity === 'fast_food') type = 'Fast Food';
        else if (tags.amenity === 'food_court') type = 'Food Court';
        else if (tags.cuisine) type = tags.cuisine.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Create description from available tags
        let description = tags.description || tags.wikipedia || '';
        if (!description) {
          description = `A ${type.toLowerCase()} in Sarawak`;
          if (tags.cuisine) description += ` serving ${tags.cuisine.replace('_', ' ')} cuisine`;
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
          category: 'Food & Beverages',
          source: 'overpass',
          osmTags: tags
        };
      });
    } catch (error) {
      console.error('Error fetching Overpass food:', error);
      return [];
    }
  };

  // Comprehensive food and beverage data for Sarawak
  const staticFoodData = [
    // Traditional Sarawak Cuisine
    {
      name: "Top Spot Food Court",
      desc: "Famous open-air food court with authentic Sarawak dishes and fresh seafood",
      slug: "top-spot-food-court",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5534,
      longitude: 110.3594,
      source: 'static'
    },
    {
      name: "Kolo Mee Stall - Lau Ya Keng",
      desc: "Legendary kolo mee stall serving the best traditional Sarawak noodles",
      slug: "lau-ya-keng-kolo-mee",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5545,
      longitude: 110.3605,
      source: 'static'
    },
    {
      name: "Sarawak Laksa House",
      desc: "Authentic Sarawak laksa with rich coconut curry broth and fresh prawns",
      slug: "sarawak-laksa-house",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5556,
      longitude: 110.3616,
      source: 'static'
    },
    {
      name: "Manok Pansoh Restaurant",
      desc: "Traditional Iban bamboo chicken and authentic Dayak cuisine",
      slug: "manok-pansoh-restaurant",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5567,
      longitude: 110.3627,
      source: 'static'
    },
    {
      name: "Umai Corner",
      desc: "Fresh Sarawak umai (raw fish salad) and traditional Melanau dishes",
      slug: "umai-corner",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5578,
      longitude: 110.3638,
      source: 'static'
    },
    {
      name: "Midin Stir-fry Stall",
      desc: "Famous for midin (jungle fern) stir-fry and local vegetables",
      slug: "midin-stir-fry-stall",
      image: defaultImage,
      type: "Traditional Sarawak",
      division: "Kuching",
      latitude: 1.5589,
      longitude: 110.3649,
      source: 'static'
    },
    
    // Chinese Cuisine
    {
      name: "Chong Choon Cafe",
      desc: "Historic coffee shop serving traditional Chinese breakfast and kolo mee",
      slug: "chong-choon-cafe",
      image: defaultImage,
      type: "Chinese Cuisine",
      division: "Kuching",
      latitude: 1.5600,
      longitude: 110.3660,
      source: 'static'
    },
    {
      name: "Jin Xiang Restaurant",
      desc: "Authentic Chinese seafood restaurant with live fish tanks",
      slug: "jin-xiang-restaurant",
      image: defaultImage,
      type: "Chinese Cuisine",
      division: "Kuching",
      latitude: 1.5611,
      longitude: 110.3671,
      source: 'static'
    },
    {
      name: "Dim Sum Palace",
      desc: "Fresh dim sum and Cantonese specialties in elegant setting",
      slug: "dim-sum-palace",
      image: defaultImage,
      type: "Chinese Cuisine",
      division: "Kuching",
      latitude: 1.5622,
      longitude: 110.3682,
      source: 'static'
    },
    
    // Malay Cuisine
    {
      name: "Nasi Lemak Sarawak",
      desc: "Authentic Sarawak-style nasi lemak with local sambal and side dishes",
      slug: "nasi-lemak-sarawak",
      image: defaultImage,
      type: "Malay Cuisine",
      division: "Kuching",
      latitude: 1.5633,
      longitude: 110.3693,
      source: 'static'
    },
    {
      name: "Ayam Penyet Corner",
      desc: "Crispy fried chicken with spicy sambal and traditional accompaniments",
      slug: "ayam-penyet-corner",
      image: defaultImage,
      type: "Malay Cuisine",
      division: "Kuching",
      latitude: 1.5644,
      longitude: 110.3704,
      source: 'static'
    },
    
    // International Cuisine
    {
      name: "The Junk Restaurant",
      desc: "Elegant fine dining with international fusion cuisine",
      slug: "the-junk-restaurant",
      image: defaultImage,
      type: "International Cuisine",
      division: "Kuching",
      latitude: 1.5655,
      longitude: 110.3715,
      source: 'static'
    },
    {
      name: "Little Italy",
      desc: "Authentic Italian pasta and pizza with imported ingredients",
      slug: "little-italy",
      image: defaultImage,
      type: "International Cuisine",
      division: "Kuching",
      latitude: 1.5666,
      longitude: 110.3726,
      source: 'static'
    },
    {
      name: "Sushi King",
      desc: "Fresh Japanese sushi and sashimi with traditional preparation",
      slug: "sushi-king",
      image: defaultImage,
      type: "International Cuisine",
      division: "Kuching",
      latitude: 1.5677,
      longitude: 110.3737,
      source: 'static'
    },
    
    // Cafes & Coffee
    {
      name: "Black Bean Coffee",
      desc: "Specialty coffee roastery with single-origin beans and expert baristas",
      slug: "black-bean-coffee",
      image: defaultImage,
      type: "Cafe",
      division: "Kuching",
      latitude: 1.5688,
      longitude: 110.3748,
      source: 'static'
    },
    {
      name: "Starbucks Waterfront",
      desc: "Popular coffee chain with waterfront views and comfortable seating",
      slug: "starbucks-waterfront",
      image: defaultImage,
      type: "Cafe",
      division: "Kuching",
      latitude: 1.5699,
      longitude: 110.3759,
      source: 'static'
    },
    
    // Street Food & Hawker
    {
      name: "Satok Weekend Market",
      desc: "Famous weekend market with local street food and fresh produce",
      slug: "satok-weekend-market",
      image: defaultImage,
      type: "Food Court",
      division: "Kuching",
      latitude: 1.5710,
      longitude: 110.3770,
      source: 'static'
    },
    {
      name: "Carpenter Street Hawker",
      desc: "Historic street with traditional hawker stalls and local delicacies",
      slug: "carpenter-street-hawker",
      image: defaultImage,
      type: "Street Food",
      division: "Kuching",
      latitude: 1.5721,
      longitude: 110.3781,
      source: 'static'
    },
    
    // Seafood Specialties
    {
      name: "Bintulu Seafood Restaurant",
      desc: "Fresh seafood from Bintulu waters with traditional cooking methods",
      slug: "bintulu-seafood-restaurant",
      image: defaultImage,
      type: "Seafood",
      division: "Bintulu",
      latitude: 3.1739,
      longitude: 113.0428,
      source: 'static'
    },
    {
      name: "Kuching Prawn Mee",
      desc: "Famous prawn noodle soup with rich broth and fresh prawns",
      slug: "kuching-prawn-mee",
      image: defaultImage,
      type: "Seafood",
      division: "Kuching",
      latitude: 1.5732,
      longitude: 110.3792,
      source: 'static'
    },
    
    // Desserts & Sweets
    {
      name: "Cendol Kuching",
      desc: "Traditional cendol with palm sugar and coconut milk",
      slug: "cendol-kuching",
      image: defaultImage,
      type: "Dessert",
      division: "Kuching",
      latitude: 1.5743,
      longitude: 110.3803,
      source: 'static'
    },
    {
      name: "Kuih Lapis Sarawak",
      desc: "Famous Sarawak layered cake and traditional kuih",
      slug: "kuih-lapis-sarawak",
      image: defaultImage,
      type: "Dessert",
      division: "Kuching",
      latitude: 1.5754,
      longitude: 110.3814,
      source: 'static'
    },
    
    // Bars & Nightlife
    {
      name: "The Junk Bar",
      desc: "Trendy bar with craft cocktails and live music",
      slug: "the-junk-bar",
      image: defaultImage,
      type: "Bar",
      division: "Kuching",
      latitude: 1.5765,
      longitude: 110.3825,
      source: 'static'
    },
    {
      name: "Waterfront Bar",
      desc: "Riverside bar with sunset views and premium drinks",
      slug: "waterfront-bar",
      image: defaultImage,
      type: "Bar",
      division: "Kuching",
      latitude: 1.5776,
      longitude: 110.3836,
      source: 'static'
    }
  ];

  const fetchAllFood = async () => {
    setLoading(true);
    try {
      // Fetch from all sources
      const [foodLocations, businessFood, overpassFood, staticFood] = await Promise.all([
        fetchFoodLocations(),
        fetchBusinessFood(),
        fetchOverpassFood(),
        Promise.resolve(staticFoodData)
      ]);

      // Combine all data
      const allData = [...foodLocations, ...businessFood, ...overpassFood, ...staticFood];
      
      // Remove duplicates based on name and coordinates
      const uniqueData = allData.filter((item, index, self) =>
        index === self.findIndex(t => 
          t.name === item.name && 
          Math.abs((t.latitude || t.lat) - (item.latitude || item.lat)) < 0.001 && 
          Math.abs((t.longitude || t.lng) - (item.longitude || item.lng)) < 0.001
        )
      );

      // Process and enhance the data
      const processedData = uniqueData.map(item => {
        const name = item.name;
        const lowerName = name.toLowerCase();
        
        // Determine type if not already set
        let type = item.type;
        if (!type || type === 'Other') {
          if (lowerName.includes('laksa') || lowerName.includes('kolo mee') || lowerName.includes('sarawak') || lowerName.includes('traditional') || lowerName.includes('dayak') || lowerName.includes('iban')) {
            type = 'Traditional Sarawak';
          } else if (lowerName.includes('chinese') || lowerName.includes('dim sum') || lowerName.includes('hakka') || lowerName.includes('teochew')) {
            type = 'Chinese Cuisine';
          } else if (lowerName.includes('malay') || lowerName.includes('nasi lemak') || lowerName.includes('rendang') || lowerName.includes('satay')) {
            type = 'Malay Cuisine';
          } else if (lowerName.includes('italian') || lowerName.includes('japanese') || lowerName.includes('korean') || lowerName.includes('thai') || lowerName.includes('western')) {
            type = 'International Cuisine';
          } else if (lowerName.includes('coffee') || lowerName.includes('cafe') || lowerName.includes('tea')) {
            type = 'Cafe';
          } else if (lowerName.includes('hawker') || lowerName.includes('street') || lowerName.includes('market') || lowerName.includes('stall')) {
            type = 'Street Food';
          } else if (lowerName.includes('seafood') || lowerName.includes('prawn') || lowerName.includes('fish') || lowerName.includes('crab')) {
            type = 'Seafood';
          } else if (lowerName.includes('dessert') || lowerName.includes('cendol') || lowerName.includes('kuih') || lowerName.includes('ice cream')) {
            type = 'Dessert';
          } else if (lowerName.includes('bar') || lowerName.includes('pub') || lowerName.includes('karaoke') || lowerName.includes('nightlife')) {
            type = 'Bar';
          } else if (item.source === 'business') type = 'Business';
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
      console.error('Error fetching all food places:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFood();
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
        <p>Loading Food & Beverages...</p>
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
        <h1>{currentCategory.toUpperCase() || 'FOOD & BEVERAGES'}</h1>
        <p className="hero-intro">
          Taste your way through Sarawak's rich cultural heritage. Explore unique local specialties, vibrant night markets, and dining experiences that tell the story of Borneo's diverse communities.
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
              <option value="Traditional Sarawak">Traditional Sarawak</option>
              <option value="Chinese Cuisine">Chinese Cuisine</option>
              <option value="Malay Cuisine">Malay Cuisine</option>
              <option value="International Cuisine">International Cuisine</option>
              <option value="Cafe">Cafe</option>
              <option value="Street Food">Street Food</option>
              <option value="Seafood">Seafood</option>
              <option value="Dessert">Dessert</option>
              <option value="Bar">Bar</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Food Court">Food Court</option>
              <option value="Business">Business</option>
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
                  {item.source === 'static' && <span className="static-badge">Local</span>}
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
          <p>No food and beverage places found. Try adjusting your search criteria.</p>
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

export default FoodBeveragePage;