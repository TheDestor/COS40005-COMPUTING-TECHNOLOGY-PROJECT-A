// Top-level imports
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
import { FaSearch, FaArrowUp } from 'react-icons/fa';

const HERO_VIDEO_ID = 'wr0h2Y4pBdQ'; 

const TransportationPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Transportation');
  const [showLoading, setShowLoading] = useState(true); // 🚀 ADDED for instant loading
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    // Bus Stations
    {
      name: "Kuching Sentral Bus Terminal",
      desc: "Main bus terminal with connections to all major towns",
      slug: "kuching-sentral-bus-terminal",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4s56EQTizukzRQBE-EoSnosJslsI83o76dg&s",
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
      image: "https://miricouncil.gov.my/admin/file_manager/download/?id=1469",
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
      image: "https://cdn.busonlineticket.com/images/2023/07/Sibu-Bus-Terminal-16.jpg",
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
      image: "https://cdn.busonlineticket.com/images/2023/08/Bintulu-Bus-Terminal.jpg",
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
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnLE_12HXq1TmtdxcS9OuKAqNk5XPI2vsHXQ&s",
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
      image: "https://images.t2u.io/upload/event/listing/0-27132-AWSS3feb7aa84-0c26-4838-9556-548e6ede2fad-oP0x.jpg",
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
      image: "https://www.theborneopost.com/newsimages/2020/10/pb-boat-p1.gif",
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
      image: "https://static.r2r.io/transitimages/1524574740.jpg",
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
      image: "https://www.theborneopost.com/newsimages/2025/05/p1.jpg",
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
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTy7vnj8ffrY0w2zblofYXwe7Xqmw0RJ39cvg&s",
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
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRemuvL9OiQ0EaB62vM52k8ijWAQJ86juwJg&s",
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
      image: "https://www.caridestinasi.com/wp-content/uploads/2021/12/Slide6-8.jpg",
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
      image: "https://avisassets.abgemea.com/.imaging/featureImageSmall/dam/DMS/local/MY/Location/MY-Locations/IMG_20190201_102126.jpg",
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
      image: "data:image/jpeg;base64,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",
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
      image: "data:image/jpeg;base64,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",
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
      image: "https://www.miricitysharing.com/wp-content/uploads/2018/04/Now-Rent-a-Bicycle-at-Coco-Cabana-Miri-4.jpg",
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
      image: "https://cdn.busonlineticket.com/images/2023/05/Kuching-Sentral-Bus-Terminal-1.jpg",
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
      image: "https://cdn.busonlineticket.com/images/2023/08/Miri-Bus-Terminal-1.jpg",
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

export default TransportationPage;