import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = 'wr0h2Y4pBdQ'; 

const TransportationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Transportation');

  // Comprehensive transportation data for Sarawak
  const staticTransportationData = [
    // Airports
    {
      name: "Kuching International Airport",
      desc: "Main international gateway to Sarawak with flights to major cities",
      slug: "kuching-international-airport",
      image: defaultImage,
      type: "Airport",
      lat: 1.4847,
      lng: 110.3469
    },
    {
      name: "Miri Airport",
      desc: "Regional airport serving northern Sarawak and Brunei",
      slug: "miri-airport",
      image: defaultImage,
      type: "Airport",
      lat: 4.3250,
      lng: 113.9870
    },
    {
      name: "Sibu Airport",
      desc: "Domestic airport connecting central Sarawak",
      slug: "sibu-airport",
      image: defaultImage,
      type: "Airport",
      lat: 2.2619,
      lng: 111.9853
    },
    {
      name: "Bintulu Airport",
      desc: "Industrial airport serving Bintulu and surrounding areas",
      slug: "bintulu-airport",
      image: defaultImage,
      type: "Airport",
      lat: 3.1234,
      lng: 113.0200
    },
    {
      name: "Limbang Airport",
      desc: "Small regional airport in northern Sarawak",
      slug: "limbang-airport",
      image: defaultImage,
      type: "Airport",
      lat: 4.8081,
      lng: 115.0104
    },
    
    // Bus Stations
    {
      name: "Kuching Sentral Bus Terminal",
      desc: "Main bus terminal with connections to all major towns",
      slug: "kuching-sentral-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      lat: 1.5534,
      lng: 110.3594
    },
    {
      name: "Miri Bus Terminal",
      desc: "Central bus station serving northern Sarawak routes",
      slug: "miri-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      lat: 4.4180,
      lng: 114.0155
    },
    {
      name: "Sibu Bus Station",
      desc: "Main bus hub for central Sarawak transportation",
      slug: "sibu-bus-station",
      image: defaultImage,
      type: "Bus Station",
      lat: 2.2870,
      lng: 111.8320
    },
    {
      name: "Bintulu Bus Terminal",
      desc: "Bus station serving industrial and residential areas",
      slug: "bintulu-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      lat: 3.1739,
      lng: 113.0428
    },
    {
      name: "Sri Aman Bus Station",
      desc: "Regional bus station for southern Sarawak",
      slug: "sri-aman-bus-station",
      image: defaultImage,
      type: "Bus Station",
      lat: 1.2370,
      lng: 111.4621
    },
    
    // Ferry Terminals
    {
      name: "Kuching Waterfront Ferry Terminal",
      desc: "River ferry terminal for local water transport",
      slug: "kuching-waterfront-ferry-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      lat: 1.5600,
      lng: 110.3500
    },
    {
      name: "Sibu Express Boat Terminal",
      desc: "Express boat terminal for river transport to interior",
      slug: "sibu-express-boat-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      lat: 2.2900,
      lng: 111.8400
    },
    {
      name: "Miri Ferry Terminal",
      desc: "Coastal ferry terminal for island connections",
      slug: "miri-ferry-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      lat: 4.4200,
      lng: 114.0200
    },
    
    // Taxi & Ride Services
    {
      name: "Kuching Taxi Stand - Waterfront",
      desc: "Main taxi stand at Kuching Waterfront",
      slug: "kuching-taxi-stand-waterfront",
      image: defaultImage,
      type: "Taxi & Ride Services",
      lat: 1.5610,
      lng: 110.3510
    },
    {
      name: "Grab Pickup Point - Miri",
      desc: "Designated Grab pickup area in Miri city center",
      slug: "grab-pickup-point-miri",
      image: defaultImage,
      type: "Taxi & Ride Services",
      lat: 4.4190,
      lng: 114.0160
    },
    {
      name: "Sibu City Taxi Hub",
      desc: "Central taxi hub for Sibu city transportation",
      slug: "sibu-city-taxi-hub",
      image: defaultImage,
      type: "Taxi & Ride Services",
      lat: 2.2880,
      lng: 111.8330
    },
    
    // Car Rental
    {
      name: "Hertz Car Rental - Kuching Airport",
      desc: "International car rental service at Kuching Airport",
      slug: "hertz-car-rental-kuching-airport",
      image: defaultImage,
      type: "Car Rental",
      lat: 1.4850,
      lng: 110.3470
    },
    {
      name: "Avis Car Rental - Miri",
      desc: "Car rental service in Miri city center",
      slug: "avis-car-rental-miri",
      image: defaultImage,
      type: "Car Rental",
      lat: 4.4185,
      lng: 114.0158
    },
    {
      name: "Local Car Rental - Sibu",
      desc: "Local car rental service for Sibu and surrounding areas",
      slug: "local-car-rental-sibu",
      image: defaultImage,
      type: "Car Rental",
      lat: 2.2875,
      lng: 111.8325
    },
    
    // Motorcycle Rental
    {
      name: "Scooter Rental Kuching",
      desc: "Motorcycle and scooter rental for city exploration",
      slug: "scooter-rental-kuching",
      image: defaultImage,
      type: "Motorcycle Rental",
      lat: 1.5620,
      lng: 110.3520
    },
    {
      name: "Bike Rental Miri",
      desc: "Bicycle and motorcycle rental service in Miri",
      slug: "bike-rental-miri",
      image: defaultImage,
      type: "Motorcycle Rental",
      lat: 4.4200,
      lng: 114.0170
    },
    
    // Long Distance Transport
    {
      name: "Express Bus Terminal - Kuching",
      desc: "Long distance express bus terminal for interstate travel",
      slug: "express-bus-terminal-kuching",
      image: defaultImage,
      type: "Long Distance Transport",
      lat: 1.5540,
      lng: 110.3600
    },
    {
      name: "Interstate Bus Terminal - Miri",
      desc: "Bus terminal for travel to Sabah and Brunei",
      slug: "interstate-bus-terminal-miri",
      image: defaultImage,
      type: "Long Distance Transport",
      lat: 4.4190,
      lng: 114.0165
    }
  ];

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => 
        item.category?.toLowerCase() === 'transport' || 
        item.category?.toLowerCase() === 'transportation' ||
        item.type?.toLowerCase().includes('airport') ||
        item.type?.toLowerCase().includes('bus') ||
        item.type?.toLowerCase().includes('ferry') ||
        item.type?.toLowerCase().includes('taxi') ||
        item.type?.toLowerCase().includes('rental')
      )
      .map(item => {
        // Determine category type based on name and description
        const name = item.name?.toLowerCase() || '';
        const desc = item.description?.toLowerCase() || '';
        let type = 'Other';
        
        if (name.includes('airport') || name.includes('terminal')) {
          type = 'Airport';
        } else if (name.includes('bus') || name.includes('station')) {
          type = 'Bus Station';
        } else if (name.includes('ferry') || name.includes('boat') || name.includes('water')) {
          type = 'Ferry Terminal';
        } else if (name.includes('taxi') || name.includes('grab') || name.includes('ride')) {
          type = 'Taxi & Ride Services';
        } else if (name.includes('car rental') || name.includes('rental')) {
          type = 'Car Rental';
        } else if (name.includes('motorcycle') || name.includes('scooter') || name.includes('bike')) {
          type = 'Motorcycle Rental';
        } else if (name.includes('express') || name.includes('interstate') || name.includes('long distance')) {
          type = 'Long Distance Transport';
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

  const fetchTransportationPlaces = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Transport');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Combine backend data with static data
      const allData = [...processedBackend, ...staticTransportationData];
      
      // Remove duplicates based on name
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
      );
      
      setData(uniqueData);
    } catch (error) {
      console.error('Error fetching transportation places:', error);
      // Fallback to static data if backend fails
      setData(staticTransportationData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportationPlaces();
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
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
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
        <h1>{currentCategory.toUpperCase() || 'TRANSPORTATION'}</h1>
        <p className="hero-intro">
            Your journey through Sarawak starts here. Discover efficient transportation networks that connect the state's major towns, making its rich heritage and natural wonders easily accessible.
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Categories</option>
              <option value="Airport">Airport</option>
              <option value="Bus Station">Bus Station</option>
              <option value="Ferry Terminal">Ferry Terminal</option>
              <option value="Taxi & Ride Services">Taxi & Ride Services</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Motorcycle Rental">Motorcycle Rental</option>
              <option value="Long Distance Transport">Long Distance Transport</option>
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

export default TransportationPage;