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

  // Comprehensive shopping and leisure data for Sarawak
  const staticShoppingData = [
    // Shopping Malls - Kuching
    {
      name: "The Spring Shopping Mall",
      desc: "Kuching's premier shopping destination with international and local brands",
      slug: "the-spring-shopping-mall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 1.5534,
      lng: 110.3594
    },
    {
      name: "Vivacity Megamall",
      desc: "Modern shopping complex featuring entertainment and dining options",
      slug: "vivacity-megamall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 1.5545,
      lng: 110.3605
    },
    {
      name: "CityONE Megamall",
      desc: "Family-friendly shopping center with diverse retail options",
      slug: "cityone-megamall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 1.5556,
      lng: 110.3616
    },
    {
      name: "Plaza Merdeka",
      desc: "Historic shopping center in the heart of Kuching",
      slug: "plaza-merdeka",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 1.5567,
      lng: 110.3627
    },
    {
      name: "Hock Lee Center",
      desc: "Popular shopping complex with local and international stores",
      slug: "hock-lee-center",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 1.5578,
      lng: 110.3638
    },
    
    // Shopping Malls - Other Cities
    {
      name: "Boulevard Shopping Mall",
      desc: "Popular shopping destination in Miri with various stores",
      slug: "boulevard-shopping-mall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 4.4180,
      lng: 114.0155
    },
    {
      name: "Bintang Megamall",
      desc: "Sibu's largest shopping complex with entertainment facilities",
      slug: "bintang-megamall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 2.2870,
      lng: 111.8320
    },
    {
      name: "Imperial Mall Miri",
      desc: "Modern shopping center in Miri with international brands",
      slug: "imperial-mall-miri",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 4.4191,
      lng: 114.0166
    },
    {
      name: "Permaisuri Imperial City Mall",
      desc: "Luxury shopping destination in Miri",
      slug: "permaisuri-imperial-city-mall",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 4.4202,
      lng: 114.0177
    },
    {
      name: "Wisma Sanyan",
      desc: "Sibu's iconic shopping landmark",
      slug: "wisma-sanyan",
      image: defaultImage,
      type: "Shopping Malls",
      lat: 2.2881,
      lng: 111.8331
    },
    
    // Fashion & Jewelry
    {
      name: "Sarawak Handicraft Center",
      desc: "Traditional Sarawak crafts, textiles, and jewelry",
      slug: "sarawak-handicraft-center",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5589,
      lng: 110.3649
    },
    {
      name: "Main Bazaar",
      desc: "Historic shopping street with local crafts and souvenirs",
      slug: "main-bazaar",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5600,
      lng: 110.3660
    },
    {
      name: "Tun Jugah Shopping Center",
      desc: "Fashion and lifestyle shopping in Kuching",
      slug: "tun-jugah-shopping-center",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5611,
      lng: 110.3671
    },
    {
      name: "Beads & Crafts Gallery",
      desc: "Traditional beadwork and handmade jewelry",
      slug: "beads-crafts-gallery",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5622,
      lng: 110.3682
    },
    {
      name: "Pua Kumbu Gallery",
      desc: "Traditional Iban textile and weaving center",
      slug: "pua-kumbu-gallery",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5633,
      lng: 110.3693
    },
    {
      name: "Borneo Art Gallery",
      desc: "Contemporary and traditional art pieces",
      slug: "borneo-art-gallery",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5644,
      lng: 110.3704
    },
    {
      name: "Silver & Gold Crafts",
      desc: "Traditional silver and gold jewelry crafting",
      slug: "silver-gold-crafts",
      image: defaultImage,
      type: "Fashion & Jewelry",
      lat: 1.5655,
      lng: 110.3715
    },
    
    // Wellness & Entertainment
    {
      name: "Cineplex Megamall",
      desc: "Modern cinema with latest movies and comfortable seating",
      slug: "cineplex-megamall",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5666,
      lng: 110.3726
    },
    {
      name: "Sarawak Spa & Wellness",
      desc: "Traditional and modern spa treatments",
      slug: "sarawak-spa-wellness",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5677,
      lng: 110.3737
    },
    {
      name: "Fitness First Kuching",
      desc: "Modern gym with state-of-the-art equipment",
      slug: "fitness-first-kuching",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5688,
      lng: 110.3748
    },
    {
      name: "Borneo Bowling Center",
      desc: "Family entertainment with bowling and arcade games",
      slug: "borneo-bowling-center",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5699,
      lng: 110.3759
    },
    {
      name: "KTV Lounge Sarawak",
      desc: "Karaoke entertainment with private rooms",
      slug: "ktv-lounge-sarawak",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5710,
      lng: 110.3770
    },
    {
      name: "Aqua Zorbing Center",
      desc: "Water sports and recreational activities",
      slug: "aqua-zorbing-center",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5721,
      lng: 110.3781
    },
    {
      name: "Escape Room Challenge",
      desc: "Interactive puzzle and escape room games",
      slug: "escape-room-challenge",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5732,
      lng: 110.3792
    },
    {
      name: "Virtual Reality Arcade",
      desc: "Latest VR gaming and entertainment experiences",
      slug: "virtual-reality-arcade",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5743,
      lng: 110.3803
    },
    {
      name: "Yoga & Meditation Center",
      desc: "Wellness classes and meditation sessions",
      slug: "yoga-meditation-center",
      image: defaultImage,
      type: "Wellness & Entertainment",
      lat: 1.5754,
      lng: 110.3814
    },
    
    // Markets & Bazaars
    {
      name: "Sunday Market Kuching",
      desc: "Traditional weekend market with local products",
      slug: "sunday-market-kuching",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 1.5765,
      lng: 110.3825
    },
    {
      name: "Tamu Sibu",
      desc: "Local market with fresh produce and crafts",
      slug: "tamu-sibu",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 2.2892,
      lng: 111.8342
    },
    {
      name: "Central Market Miri",
      desc: "Traditional market with local goods and food",
      slug: "central-market-miri",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 4.4203,
      lng: 114.0177
    },
    {
      name: "Satok Weekend Market",
      desc: "Kuching's largest weekend market with local delicacies",
      slug: "satok-weekend-market",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 1.5776,
      lng: 110.3836
    },
    {
      name: "Bintulu Central Market",
      desc: "Fresh seafood and local produce market",
      slug: "bintulu-central-market",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 3.1740,
      lng: 113.0429
    },
    {
      name: "Kapit Tamu",
      desc: "Traditional longhouse market with authentic crafts",
      slug: "kapit-tamu",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 2.0168,
      lng: 112.9334
    },
    {
      name: "Limbang Night Market",
      desc: "Evening market with local street food and crafts",
      slug: "limbang-night-market",
      image: defaultImage,
      type: "Markets & Bazaars",
      lat: 4.7549,
      lng: 115.0090
    },
    
    // Electronics & Technology
    {
      name: "Digital World Kuching",
      desc: "Electronics and technology retail store",
      slug: "digital-world-kuching",
      image: defaultImage,
      type: "Electronics & Technology",
      lat: 1.5787,
      lng: 110.3847
    },
    {
      name: "Tech Hub Miri",
      desc: "Latest gadgets and computer accessories",
      slug: "tech-hub-miri",
      image: defaultImage,
      type: "Electronics & Technology",
      lat: 4.4214,
      lng: 114.0188
    },
    {
      name: "Mobile Zone Sibu",
      desc: "Smartphones and mobile accessories",
      slug: "mobile-zone-sibu",
      image: defaultImage,
      type: "Electronics & Technology",
      lat: 2.2903,
      lng: 111.8353
    },
    
    // Books & Stationery
    {
      name: "Popular Bookstore Kuching",
      desc: "Books, magazines, and educational materials",
      slug: "popular-bookstore-kuching",
      image: defaultImage,
      type: "Books & Stationery",
      lat: 1.5798,
      lng: 110.3858
    },
    {
      name: "MPH Bookstore Miri",
      desc: "International and local book collection",
      slug: "mph-bookstore-miri",
      image: defaultImage,
      type: "Books & Stationery",
      lat: 4.4225,
      lng: 114.0199
    },
    {
      name: "Stationery World",
      desc: "Office supplies and school materials",
      slug: "stationery-world",
      image: defaultImage,
      type: "Books & Stationery",
      lat: 1.5809,
      lng: 110.3869
    },
    
    // Sports & Outdoor
    {
      name: "Sports Direct Kuching",
      desc: "Sports equipment and athletic wear",
      slug: "sports-direct-kuching",
      image: defaultImage,
      type: "Sports & Outdoor",
      lat: 1.5820,
      lng: 110.3880
    },
    {
      name: "Outdoor Adventure Store",
      desc: "Camping and hiking equipment",
      slug: "outdoor-adventure-store",
      image: defaultImage,
      type: "Sports & Outdoor",
      lat: 1.5831,
      lng: 110.3891
    },
    {
      name: "Bicycle World",
      desc: "Bicycles and cycling accessories",
      slug: "bicycle-world",
      image: defaultImage,
      type: "Sports & Outdoor",
      lat: 1.5842,
      lng: 110.3902
    },
    
    // Home & Garden
    {
      name: "IKEA Kuching",
      desc: "Furniture and home decoration",
      slug: "ikea-kuching",
      image: defaultImage,
      type: "Home & Garden",
      lat: 1.5853,
      lng: 110.3913
    },
    {
      name: "Garden Center Miri",
      desc: "Plants, gardening tools, and outdoor furniture",
      slug: "garden-center-miri",
      image: defaultImage,
      type: "Home & Garden",
      lat: 4.4236,
      lng: 114.0210
    },
    {
      name: "Home Decor Plus",
      desc: "Interior design and home accessories",
      slug: "home-decor-plus",
      image: defaultImage,
      type: "Home & Garden",
      lat: 1.5864,
      lng: 110.3924
    }
  ];

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => 
        item.category?.toLowerCase() === 'shopping' || 
        item.category?.toLowerCase() === 'leisure' ||
        item.type?.toLowerCase().includes('shopping') ||
        item.type?.toLowerCase().includes('mall') ||
        item.type?.toLowerCase().includes('market') ||
        item.type?.toLowerCase().includes('bazaar') ||
        item.type?.toLowerCase().includes('entertainment') ||
        item.type?.toLowerCase().includes('fashion') ||
        item.type?.toLowerCase().includes('electronics') ||
        item.type?.toLowerCase().includes('sports') ||
        item.type?.toLowerCase().includes('book') 
      )
      .map(item => {
        // Determine category type based on name and description
        const name = item.name?.toLowerCase() || '';
        const desc = item.description?.toLowerCase() || '';
        let type = 'Other';
        
        if (name.includes('mall') || name.includes('megamall') || name.includes('shopping center') || name.includes('plaza')) {
          type = 'Shopping Malls';
        } else if (name.includes('handicraft') || name.includes('craft') || name.includes('jewelry') || name.includes('fashion') || name.includes('art') || name.includes('gallery')) {
          type = 'Fashion & Jewelry';
        } else if (name.includes('spa') || name.includes('gym') || name.includes('cinema') || name.includes('bowling') || name.includes('ktv') || name.includes('entertainment') || name.includes('arcade') || name.includes('yoga')) {
          type = 'Wellness & Entertainment';
        } else if (name.includes('market') || name.includes('bazaar') || name.includes('tamu') || name.includes('night market')) {
          type = 'Markets & Bazaars';
        } else if (name.includes('digital') || name.includes('tech') || name.includes('mobile') || name.includes('computer') || name.includes('electronics')) {
          type = 'Electronics & Technology';
        } else if (name.includes('book') || name.includes('stationery') || name.includes('magazine') || name.includes('educational')) {
          type = 'Books & Stationery';
        } else if (name.includes('sport') || name.includes('outdoor') || name.includes('bicycle') || name.includes('adventure') || name.includes('fitness')) {
          type = 'Sports & Outdoor';
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

  const fetchShoppingLeisurePlaces = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Shopping');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Combine backend data with static data
      const allData = [...processedBackend, ...staticShoppingData];
      
      // Remove duplicates based on name
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
      );
      
      setData(uniqueData);
    } catch (error) {
      console.error('Error fetching shopping places:', error);
      // Fallback to static data if backend fails
      setData(staticShoppingData);
    } finally {
      setLoading(false);
    }
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
              <option value="Fashion & Jewelry">Fashion & Jewelry</option>
              <option value="Wellness & Entertainment">Wellness & Entertainment</option>
              <option value="Markets & Bazaars">Markets & Bazaars</option>
              <option value="Electronics & Technology">Electronics & Technology</option>
              <option value="Books & Stationery">Books & Stationery</option>
              <option value="Sports & Outdoor">Sports & Outdoor</option>
              <option value="Home & Garden">Home & Garden</option>
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

export default ShoppingLeisurePage;