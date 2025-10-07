import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone } from 'react-icons/fa';
import { useInstantData } from '../hooks/useInstantData.jsx';

const HERO_VIDEO_ID = 'wr0h2Y4pBdQ'; 

const TransportationPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Transportation');
  const [showLoading, setShowLoading] = useState(true); // 🚀 ADDED for instant loading

  // Fetch business locations with category "Transportation" - KEPT ORIGINAL
  const fetchBusinessTransportation = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Transportation');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business transportation');
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
        category: business.category || 'Transportation',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business transportation:', error);
      return [];
    }
  };

  // Fetch transportation locations from database - KEPT ORIGINAL
  const fetchTransportationLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Transport');
      const fetchedData = await response.json();
      
      // Filter for transportation related categories
      const transportationData = fetchedData.filter(item => 
        item.category?.toLowerCase().includes('transport') || 
        item.type?.toLowerCase().includes('airport') ||
        item.type?.toLowerCase().includes('bus') ||
        item.type?.toLowerCase().includes('ferry') ||
        item.type?.toLowerCase().includes('taxi') ||
        item.type?.toLowerCase().includes('rental')
      );
      
      return transportationData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'Unknown',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Transport',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching transportation locations:', error);
      return [];
    }
  };

  // Fetch transportation places from Overpass API (OpenStreetMap) - KEPT ORIGINAL
  const fetchOverpassTransportation = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for transportation in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Airports
          node["aeroway"="aerodrome"](${sarawakBbox});
          way["aeroway"="aerodrome"](${sarawakBbox});
          relation["aeroway"="aerodrome"](${sarawakBbox});
          
          // Bus stations
          node["amenity"="bus_station"](${sarawakBbox});
          way["amenity"="bus_station"](${sarawakBbox});
          relation["amenity"="bus_station"](${sarawakBbox});
          
          // Ferry terminals
          node["amenity"="ferry_terminal"](${sarawakBbox});
          way["amenity"="ferry_terminal"](${sarawakBbox});
          relation["amenity"="ferry_terminal"](${sarawakBbox});
          
          // Taxi stands
          node["amenity"="taxi"](${sarawakBbox});
          way["amenity"="taxi"](${sarawakBbox});
          relation["amenity"="taxi"](${sarawakBbox});
          
          // Car rental
          node["amenity"="car_rental"](${sarawakBbox});
          way["amenity"="car_rental"](${sarawakBbox});
          relation["amenity"="car_rental"](${sarawakBbox});
          
          // Bus stops
          node["highway"="bus_stop"](${sarawakBbox});
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
        const name = tags.name || 'Unnamed Transportation';
        
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
        if (tags.aeroway === 'aerodrome') type = 'Airport';
        else if (tags.amenity === 'bus_station') type = 'Bus Station';
        else if (tags.amenity === 'ferry_terminal') type = 'Ferry Terminal';
        else if (tags.amenity === 'taxi') type = 'Taxi & Ride Services';
        else if (tags.amenity === 'car_rental') type = 'Car Rental';
        else if (tags.highway === 'bus_stop') type = 'Bus Station';

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
          category: 'Transportation',
          source: 'overpass',
          osmTags: tags
        };
      });
    } catch (error) {
      console.error('Error fetching Overpass transportation:', error);
      return [];
    }
  };

  // Comprehensive transportation data for Sarawak - KEPT ORIGINAL
  const staticTransportationData = [
    // Airports
    {
      name: "Kuching International Airport",
      desc: "Main international gateway to Sarawak with flights to major cities",
      slug: "kuching-international-airport",
      image: defaultImage,
      type: "Airport",
      division: "Kuching",
      latitude: 1.4847,
      longitude: 110.3469,
      source: 'static'
    },
    {
      name: "Miri Airport",
      desc: "Regional airport serving northern Sarawak and Brunei",
      slug: "miri-airport",
      image: defaultImage,
      type: "Airport",
      division: "Miri",
      latitude: 4.3250,
      longitude: 113.9870,
      source: 'static'
    },
    {
      name: "Sibu Airport",
      desc: "Domestic airport connecting central Sarawak",
      slug: "sibu-airport",
      image: defaultImage,
      type: "Airport",
      division: "Sibu",
      latitude: 2.2619,
      longitude: 111.9853,
      source: 'static'
    },
    {
      name: "Bintulu Airport",
      desc: "Industrial airport serving Bintulu and surrounding areas",
      slug: "bintulu-airport",
      image: defaultImage,
      type: "Airport",
      division: "Bintulu",
      latitude: 3.1234,
      longitude: 113.0200,
      source: 'static'
    },
    {
      name: "Limbang Airport",
      desc: "Small regional airport in northern Sarawak",
      slug: "limbang-airport",
      image: defaultImage,
      type: "Airport",
      division: "Limbang",
      latitude: 4.8081,
      longitude: 115.0104,
      source: 'static'
    },
    
    // Bus Stations
    {
      name: "Kuching Sentral Bus Terminal",
      desc: "Main bus terminal with connections to all major towns",
      slug: "kuching-sentral-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      division: "Kuching",
      latitude: 1.5534,
      longitude: 110.3594,
      source: 'static'
    },
    {
      name: "Miri Bus Terminal",
      desc: "Central bus station serving northern Sarawak routes",
      slug: "miri-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      division: "Miri",
      latitude: 4.4180,
      longitude: 114.0155,
      source: 'static'
    },
    {
      name: "Sibu Bus Station",
      desc: "Main bus hub for central Sarawak transportation",
      slug: "sibu-bus-station",
      image: defaultImage,
      type: "Bus Station",
      division: "Sibu",
      latitude: 2.2870,
      longitude: 111.8320,
      source: 'static'
    },
    {
      name: "Bintulu Bus Terminal",
      desc: "Bus station serving industrial and residential areas",
      slug: "bintulu-bus-terminal",
      image: defaultImage,
      type: "Bus Station",
      division: "Bintulu",
      latitude: 3.1739,
      longitude: 113.0428,
      source: 'static'
    },
    {
      name: "Sri Aman Bus Station",
      desc: "Regional bus station for southern Sarawak",
      slug: "sri-aman-bus-station",
      image: defaultImage,
      type: "Bus Station",
      division: "Sri Aman",
      latitude: 1.2370,
      longitude: 111.4621,
      source: 'static'
    },
    
    // Ferry Terminals
    {
      name: "Kuching Waterfront Ferry Terminal",
      desc: "River ferry terminal for local water transport",
      slug: "kuching-waterfront-ferry-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      division: "Kuching",
      latitude: 1.5600,
      longitude: 110.3500,
      source: 'static'
    },
    {
      name: "Sibu Express Boat Terminal",
      desc: "Express boat terminal for river transport to interior",
      slug: "sibu-express-boat-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      division: "Sibu",
      latitude: 2.2900,
      longitude: 111.8400,
      source: 'static'
    },
    {
      name: "Miri Ferry Terminal",
      desc: "Coastal ferry terminal for island connections",
      slug: "miri-ferry-terminal",
      image: defaultImage,
      type: "Ferry Terminal",
      division: "Miri",
      latitude: 4.4200,
      longitude: 114.0200,
      source: 'static'
    },
    
    // Taxi & Ride Services
    {
      name: "Kuching Taxi Stand - Waterfront",
      desc: "Main taxi stand at Kuching Waterfront",
      slug: "kuching-taxi-stand-waterfront",
      image: defaultImage,
      type: "Taxi & Ride Services",
      division: "Kuching",
      latitude: 1.5610,
      longitude: 110.3510,
      source: 'static'
    },
    {
      name: "Grab Pickup Point - Miri",
      desc: "Designated Grab pickup area in Miri city center",
      slug: "grab-pickup-point-miri",
      image: defaultImage,
      type: "Taxi & Ride Services",
      division: "Miri",
      latitude: 4.4190,
      longitude: 114.0160,
      source: 'static'
    },
    {
      name: "Sibu City Taxi Hub",
      desc: "Central taxi hub for Sibu city transportation",
      slug: "sibu-city-taxi-hub",
      image: defaultImage,
      type: "Taxi & Ride Services",
      division: "Sibu",
      latitude: 2.2880,
      longitude: 111.8330,
      source: 'static'
    },
    
    // Car Rental
    {
      name: "Hertz Car Rental - Kuching Airport",
      desc: "International car rental service at Kuching Airport",
      slug: "hertz-car-rental-kuching-airport",
      image: defaultImage,
      type: "Car Rental",
      division: "Kuching",
      latitude: 1.4850,
      longitude: 110.3470,
      source: 'static'
    },
    {
      name: "Avis Car Rental - Miri",
      desc: "Car rental service in Miri city center",
      slug: "avis-car-rental-miri",
      image: defaultImage,
      type: "Car Rental",
      division: "Miri",
      latitude: 4.4185,
      longitude: 114.0158,
      source: 'static'
    },
    {
      name: "Local Car Rental - Sibu",
      desc: "Local car rental service for Sibu and surrounding areas",
      slug: "local-car-rental-sibu",
      image: defaultImage,
      type: "Car Rental",
      division: "Sibu",
      latitude: 2.2875,
      longitude: 111.8325,
      source: 'static'
    },
    
    // Motorcycle Rental
    {
      name: "Scooter Rental Kuching",
      desc: "Motorcycle and scooter rental for city exploration",
      slug: "scooter-rental-kuching",
      image: defaultImage,
      type: "Motorcycle Rental",
      division: "Kuching",
      latitude: 1.5620,
      longitude: 110.3520,
      source: 'static'
    },
    {
      name: "Bike Rental Miri",
      desc: "Bicycle and motorcycle rental service in Miri",
      slug: "bike-rental-miri",
      image: defaultImage,
      type: "Motorcycle Rental",
      division: "Miri",
      latitude: 4.4200,
      longitude: 114.0170,
      source: 'static'
    },
    
    // Long Distance Transport
    {
      name: "Express Bus Terminal - Kuching",
      desc: "Long distance express bus terminal for interstate travel",
      slug: "express-bus-terminal-kuching",
      image: defaultImage,
      type: "Long Distance Transport",
      division: "Kuching",
      latitude: 1.5540,
      longitude: 110.3600,
      source: 'static'
    },
    {
      name: "Interstate Bus Terminal - Miri",
      desc: "Bus terminal for travel to Sabah and Brunei",
      slug: "interstate-bus-terminal-miri",
      image: defaultImage,
      type: "Long Distance Transport",
      division: "Miri",
      latitude: 4.4190,
      longitude: 114.0165,
      source: 'static'
    }
  ];

  // Main fetch function for the hook - KEPT ORIGINAL
  const fetchAllTransportation = useCallback(async () => {
    // Fetch from all sources
    const [transportationLocations, businessTransportation, overpassTransportation, staticTransportation] = await Promise.all([
      fetchTransportationLocations(),
      fetchBusinessTransportation(),
      fetchOverpassTransportation(),
      Promise.resolve(staticTransportationData)
    ]);

    // Combine all data
    const allData = [...transportationLocations, ...businessTransportation, ...overpassTransportation, ...staticTransportation];
    
    // Remove duplicates based on name and coordinates
    const uniqueData = allData.filter((item, index, self) =>
      index === self.findIndex(t => 
        t.name === item.name && 
        Math.abs((t.latitude || t.lat) - (item.latitude || item.lat)) < 0.001 && 
        Math.abs((t.longitude || t.lng) - (item.longitude || item.lng)) < 0.001
      )
    );

    return uniqueData;
  }, []);

  // Data processing function - KEPT ORIGINAL
  const processTransportation = useCallback((items) => {
    return items.map(item => {
      const name = item.name;
      const lowerName = name.toLowerCase();
      
      // Determine type if not already set
      let type = item.type;
      if (!type || type === 'Other') {
        if (lowerName.includes('airport') || lowerName.includes('terminal')) {
          type = 'Airport';
        } else if (lowerName.includes('bus') || lowerName.includes('station')) {
          type = 'Bus Station';
        } else if (lowerName.includes('ferry') || lowerName.includes('boat') || lowerName.includes('water')) {
          type = 'Ferry Terminal';
        } else if (lowerName.includes('taxi') || lowerName.includes('grab') || lowerName.includes('ride')) {
          type = 'Taxi & Ride Services';
        } else if (lowerName.includes('car rental') || lowerName.includes('rental')) {
          type = 'Car Rental';
        } else if (lowerName.includes('motorcycle') || lowerName.includes('scooter') || lowerName.includes('bike')) {
          type = 'Motorcycle Rental';
        } else if (lowerName.includes('express') || lowerName.includes('interstate') || lowerName.includes('long distance')) {
          type = 'Long Distance Transport';
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
  }, []);

  // Use the instant data hook - KEPT ORIGINAL
  const { data, loading, preloadData } = useInstantData(
    'transportation', 
    fetchAllTransportation, 
    processTransportation
  );

  // 🚀 ADDED: Better loading state management
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

  // 🚀 COMMENTED OUT: Blocking loading condition (keep the code but don't use it)
  /* if (loading && data.length === 0) {
    return (
      <div className="category-page">
        <MenuNavbar onLoginClick={handleLoginClick} />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Transportation...</p>
        </div>
      </div>
    );
  } */

  return (
    <div className="category-page">
      <MenuNavbar 
        onLoginClick={handleLoginClick} 
        onTransportationHover={preloadData}
      />

      {/* 🚀 ADDED: Loading overlay only during initial load
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Transportation...</p>
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
        <h1>{currentCategory.toUpperCase() || 'TRANSPORTATION'}</h1>
        <p className="hero-intro">
          Your journey through Sarawak starts here. Discover efficient transportation networks that connect the state's major towns, making its rich heritage and natural wonders easily accessible.
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
              <option value="Airport">Airport</option>
              <option value="Bus Station">Bus Station</option>
              <option value="Ferry Terminal">Ferry Terminal</option>
              <option value="Taxi & Ride Services">Taxi & Ride Services</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Motorcycle Rental">Motorcycle Rental</option>
              <option value="Long Distance Transport">Long Distance Transport</option>
              <option value="Business">Business</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🚀 UPDATED: Cards section with better loading logic */}
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
            ))
        ) : (
          // 🚀 UPDATED: Only show empty state if not loading and truly no data
          !showLoading && (
            <div className="no-results">
              <p>No transportation places found. Try adjusting your search criteria.</p>
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

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default TransportationPage;