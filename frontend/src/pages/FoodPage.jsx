import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = '32OVK42tig4'; 

const FoodBeveragePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Food & Beverages');

  // Comprehensive food and beverage data for Sarawak
  const staticFoodData = [
    // Traditional Sarawak Cuisine
    {
      name: "Top Spot Food Court",
      desc: "Famous open-air food court with authentic Sarawak dishes and fresh seafood",
      slug: "top-spot-food-court",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5534,
      lng: 110.3594
    },
    {
      name: "Kolo Mee Stall - Lau Ya Keng",
      desc: "Legendary kolo mee stall serving the best traditional Sarawak noodles",
      slug: "lau-ya-keng-kolo-mee",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5545,
      lng: 110.3605
    },
    {
      name: "Sarawak Laksa House",
      desc: "Authentic Sarawak laksa with rich coconut curry broth and fresh prawns",
      slug: "sarawak-laksa-house",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5556,
      lng: 110.3616
    },
    {
      name: "Manok Pansoh Restaurant",
      desc: "Traditional Iban bamboo chicken and authentic Dayak cuisine",
      slug: "manok-pansoh-restaurant",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5567,
      lng: 110.3627
    },
    {
      name: "Umai Corner",
      desc: "Fresh Sarawak umai (raw fish salad) and traditional Melanau dishes",
      slug: "umai-corner",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5578,
      lng: 110.3638
    },
    {
      name: "Midin Stir-fry Stall",
      desc: "Famous for midin (jungle fern) stir-fry and local vegetables",
      slug: "midin-stir-fry-stall",
      image: defaultImage,
      type: "Traditional Sarawak",
      lat: 1.5589,
      lng: 110.3649
    },
    
    // Chinese Cuisine
    {
      name: "Chong Choon Cafe",
      desc: "Historic coffee shop serving traditional Chinese breakfast and kolo mee",
      slug: "chong-choon-cafe",
      image: defaultImage,
      type: "Chinese Cuisine",
      lat: 1.5600,
      lng: 110.3660
    },
    {
      name: "Jin Xiang Restaurant",
      desc: "Authentic Chinese seafood restaurant with live fish tanks",
      slug: "jin-xiang-restaurant",
      image: defaultImage,
      type: "Chinese Cuisine",
      lat: 1.5611,
      lng: 110.3671
    },
    {
      name: "Dim Sum Palace",
      desc: "Fresh dim sum and Cantonese specialties in elegant setting",
      slug: "dim-sum-palace",
      image: defaultImage,
      type: "Chinese Cuisine",
      lat: 1.5622,
      lng: 110.3682
    },
    
    // Malay Cuisine
    {
      name: "Nasi Lemak Sarawak",
      desc: "Authentic Sarawak-style nasi lemak with local sambal and side dishes",
      slug: "nasi-lemak-sarawak",
      image: defaultImage,
      type: "Malay Cuisine",
      lat: 1.5633,
      lng: 110.3693
    },
    {
      name: "Ayam Penyet Corner",
      desc: "Crispy fried chicken with spicy sambal and traditional accompaniments",
      slug: "ayam-penyet-corner",
      image: defaultImage,
      type: "Malay Cuisine",
      lat: 1.5644,
      lng: 110.3704
    },
    
    // International Cuisine
    {
      name: "The Junk Restaurant",
      desc: "Elegant fine dining with international fusion cuisine",
      slug: "the-junk-restaurant",
      image: defaultImage,
      type: "International Cuisine",
      lat: 1.5655,
      lng: 110.3715
    },
    {
      name: "Little Italy",
      desc: "Authentic Italian pasta and pizza with imported ingredients",
      slug: "little-italy",
      image: defaultImage,
      type: "International Cuisine",
      lat: 1.5666,
      lng: 110.3726
    },
    {
      name: "Sushi King",
      desc: "Fresh Japanese sushi and sashimi with traditional preparation",
      slug: "sushi-king",
      image: defaultImage,
      type: "International Cuisine",
      lat: 1.5677,
      lng: 110.3737
    },
    
    // Cafes & Coffee
    {
      name: "Black Bean Coffee",
      desc: "Specialty coffee roastery with single-origin beans and expert baristas",
      slug: "black-bean-coffee",
      image: defaultImage,
      type: "Cafes & Coffee",
      lat: 1.5688,
      lng: 110.3748
    },
    {
      name: "Starbucks Waterfront",
      desc: "Popular coffee chain with waterfront views and comfortable seating",
      slug: "starbucks-waterfront",
      image: defaultImage,
      type: "Cafes & Coffee",
      lat: 1.5699,
      lng: 110.3759
    },
    
    // Street Food & Hawker
    {
      name: "Satok Weekend Market",
      desc: "Famous weekend market with local street food and fresh produce",
      slug: "satok-weekend-market",
      image: defaultImage,
      type: "Street Food & Hawker",
      lat: 1.5710,
      lng: 110.3770
    },
    {
      name: "Carpenter Street Hawker",
      desc: "Historic street with traditional hawker stalls and local delicacies",
      slug: "carpenter-street-hawker",
      image: defaultImage,
      type: "Street Food & Hawker",
      lat: 1.5721,
      lng: 110.3781
    },
    
    // Seafood Specialties
    {
      name: "Bintulu Seafood Restaurant",
      desc: "Fresh seafood from Bintulu waters with traditional cooking methods",
      slug: "bintulu-seafood-restaurant",
      image: defaultImage,
      type: "Seafood Specialties",
      lat: 3.1739,
      lng: 113.0428
    },
    {
      name: "Kuching Prawn Mee",
      desc: "Famous prawn noodle soup with rich broth and fresh prawns",
      slug: "kuching-prawn-mee",
      image: defaultImage,
      type: "Seafood Specialties",
      lat: 1.5732,
      lng: 110.3792
    },
    
    // Desserts & Sweets
    {
      name: "Cendol Kuching",
      desc: "Traditional cendol with palm sugar and coconut milk",
      slug: "cendol-kuching",
      image: defaultImage,
      type: "Desserts & Sweets",
      lat: 1.5743,
      lng: 110.3803
    },
    {
      name: "Kuih Lapis Sarawak",
      desc: "Famous Sarawak layered cake and traditional kuih",
      slug: "kuih-lapis-sarawak",
      image: defaultImage,
      type: "Desserts & Sweets",
      lat: 1.5754,
      lng: 110.3814
    },
    
    // Bars & Nightlife
    {
      name: "The Junk Bar",
      desc: "Trendy bar with craft cocktails and live music",
      slug: "the-junk-bar",
      image: defaultImage,
      type: "Bars & Nightlife",
      lat: 1.5765,
      lng: 110.3825
    },
    {
      name: "Waterfront Bar",
      desc: "Riverside bar with sunset views and premium drinks",
      slug: "waterfront-bar",
      image: defaultImage,
      type: "Bars & Nightlife",
      lat: 1.5776,
      lng: 110.3836
    }
  ];

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => 
        item.category?.toLowerCase() === 'food' || 
        item.category?.toLowerCase() === 'restaurant' ||
        item.category?.toLowerCase() === 'cafe' ||
        item.type?.toLowerCase().includes('restaurant') ||
        item.type?.toLowerCase().includes('food') ||
        item.type?.toLowerCase().includes('cafe') ||
        item.type?.toLowerCase().includes('bar') ||
        item.type?.toLowerCase().includes('bakery')
      )
      .map(item => {
        // Determine category type based on name and description
        const name = item.name?.toLowerCase() || '';
        const desc = item.description?.toLowerCase() || '';
        let type = 'Other';
        
        if (name.includes('laksa') || name.includes('kolo mee') || name.includes('sarawak') || name.includes('traditional') || name.includes('dayak') || name.includes('iban')) {
          type = 'Traditional Sarawak';
        } else if (name.includes('chinese') || name.includes('dim sum') || name.includes('hakka') || name.includes('teochew')) {
          type = 'Chinese Cuisine';
        } else if (name.includes('malay') || name.includes('nasi lemak') || name.includes('rendang') || name.includes('satay')) {
          type = 'Malay Cuisine';
        } else if (name.includes('italian') || name.includes('japanese') || name.includes('korean') || name.includes('thai') || name.includes('western')) {
          type = 'International Cuisine';
        } else if (name.includes('coffee') || name.includes('cafe') || name.includes('tea')) {
          type = 'Cafes & Coffee';
        } else if (name.includes('hawker') || name.includes('street') || name.includes('market') || name.includes('stall')) {
          type = 'Street Food & Hawker';
        } else if (name.includes('seafood') || name.includes('prawn') || name.includes('fish') || name.includes('crab')) {
          type = 'Seafood Specialties';
        } else if (name.includes('dessert') || name.includes('cendol') || name.includes('kuih') || name.includes('ice cream')) {
          type = 'Desserts & Sweets';
        } else if (name.includes('bar') || name.includes('pub') || name.includes('karaoke') || name.includes('nightlife')) {
          type = 'Bars & Nightlife';
        }

        return {
          name: item.name || 'Unknown',
          desc: item.description || 'No description available',
          slug: item.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
          image: item.image || defaultImage,
          type: type,
          lat: item.latitude || 0,
          lng: item.longitude || 0
        };
      });
  };

  const fetchFoodBeveragePlaces = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Food');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Combine backend data with static data
      const allData = [...processedBackend, ...staticFoodData];
      
      // Remove duplicates based on name
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
      );
      
      setData(uniqueData);
    } catch (error) {
      console.error('Error fetching food places:', error);
      // Fallback to static data if backend fails
      setData(staticFoodData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodBeveragePlaces();
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
        <p>Loading...</p>
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
        <h1>{currentCategory.toUpperCase() || 'FOOD AND BEVERAGE'}</h1>
        <p className="hero-intro">
            Taste your way through Sarawak's rich cultural heritage. Explore unique local specialties, vibrant night markets, and dining experiences that tell the story of Borneo's diverse communities.
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
              <option value="Traditional Sarawak">Traditional Sarawak</option>
              <option value="Chinese Cuisine">Chinese Cuisine</option>
              <option value="Malay Cuisine">Malay Cuisine</option>
              <option value="International Cuisine">International Cuisine</option>
              <option value="Cafes & Coffee">Cafes & Coffee</option>
              <option value="Street Food & Hawker">Street Food & Hawker</option>
              <option value="Seafood Specialties">Seafood Specialties</option>
              <option value="Desserts & Sweets">Desserts & Sweets</option>
              <option value="Bars & Nightlife">Bars & Nightlife</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cards-section">
        {filteredData.slice(0, visibleItems).map((item, index) => (
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

export default FoodBeveragePage;