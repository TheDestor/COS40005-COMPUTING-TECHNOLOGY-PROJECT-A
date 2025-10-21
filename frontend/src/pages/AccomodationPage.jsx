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

const HERO_VIDEO_ID = 'Jsk5kvZ-DHo'; 

const AccommodationPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Accommodation');
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

  // Fetch business locations with category "Accommodation" - KEPT ORIGINAL
  const fetchBusinessAccommodation = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Accommodation');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business accommodation');
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
        category: business.category || 'Accommodation',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business accommodation:', error);
      return [];
    }
  };

  // Fetch accommodation locations from database - KEPT ORIGINAL
  const fetchAccommodationLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Accommodation');
      const fetchedData = await response.json();
      
      // Filter for accommodation related categories
      const accommodationData = fetchedData.filter(item => 
        item.category?.toLowerCase().includes('accommodation') || 
        item.type?.toLowerCase().includes('hotel') ||
        item.type?.toLowerCase().includes('resort') ||
        item.type?.toLowerCase().includes('homestay') ||
        item.type?.toLowerCase().includes('hostel') ||
        item.type?.toLowerCase().includes('guest')
      );
      
      return accommodationData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'Unknown',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Accommodation',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching accommodation locations:', error);
      return [];
    }
  };

  // Fetch accommodation places from Overpass API (OpenStreetMap) - KEPT ORIGINAL
  const fetchOverpassAccommodation = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for accommodation in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Hotels
          node["tourism"="hotel"](${sarawakBbox});
          way["tourism"="hotel"](${sarawakBbox});
          relation["tourism"="hotel"](${sarawakBbox});
          
          // Hostels
          node["tourism"="hostel"](${sarawakBbox});
          way["tourism"="hostel"](${sarawakBbox});
          relation["tourism"="hostel"](${sarawakBbox});
          
          // Guest houses
          node["tourism"="guest_house"](${sarawakBbox});
          way["tourism"="guest_house"](${sarawakBbox});
          relation["tourism"="guest_house"](${sarawakBbox});
          
          // Apartments
          node["tourism"="apartment"](${sarawakBbox});
          way["tourism"="apartment"](${sarawakBbox});
          relation["tourism"="apartment"](${sarawakBbox});
          
          // Camp sites
          node["tourism"="camp_site"](${sarawakBbox});
          way["tourism"="camp_site"](${sarawakBbox});
          relation["tourism"="camp_site"](${sarawakBbox});
          
          // Chalets
          node["tourism"="chalet"](${sarawakBbox});
          way["tourism"="chalet"](${sarawakBbox});
          relation["tourism"="chalet"](${sarawakBbox});
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
        const name = tags.name || 'Unnamed Accommodation';
        
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
        if (tags.tourism === 'hotel') type = 'Hotel';
        else if (tags.tourism === 'hostel') type = 'Hostel';
        else if (tags.tourism === 'guest_house') type = 'Guest House';
        else if (tags.tourism === 'apartment') type = 'Apartment';
        else if (tags.tourism === 'camp_site') type = 'Camp Site';
        else if (tags.tourism === 'chalet') type = 'Chalet';

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
          category: 'Accommodation',
          source: 'overpass',
          osmTags: tags
        };
      });
    } catch (error) {
      console.error('Error fetching Overpass accommodation:', error);
      return [];
    }
  };

  // Comprehensive accommodation data for Sarawak - KEPT ORIGINAL
  const staticAccommodationData = [
    // Hotels in Kuching
    {
      name: "Hilton Kuching",
      desc: "Luxury hotel with river views and premium amenities in city center",
      slug: "hilton-kuching",
      image: defaultImage,
      type: "Hotel",
      division: "Kuching",
      latitude: 1.5580,
      longitude: 110.3480,
      source: 'static'
    },
    {
      name: "Pullman Kuching",
      desc: "Modern hotel with business facilities and comfortable rooms",
      slug: "pullman-kuching",
      image: defaultImage,
      type: "Hotel",
      division: "Kuching",
      latitude: 1.5590,
      longitude: 110.3490,
      source: 'static'
    },
    {
      name: "Grand Margherita Hotel",
      desc: "Iconic hotel overlooking Sarawak River with extensive facilities",
      slug: "grand-margherita-hotel",
      image: defaultImage,
      type: "Hotel",
      division: "Kuching",
      latitude: 1.5600,
      longitude: 110.3500,
      source: 'static'
    },
    {
      name: "Batik Boutique Hotel",
      desc: "Boutique hotel with local cultural themes and personalized service",
      slug: "batik-boutique-hotel",
      image: defaultImage,
      type: "Hotel",
      division: "Kuching",
      latitude: 1.5610,
      longitude: 110.3510,
      source: 'static'
    },
    
    // Hotels in Miri
    {
      name: "Miri Marriott Resort & Spa",
      desc: "Beachfront resort with luxury accommodations and spa facilities",
      slug: "miri-marriott-resort-spa",
      image: defaultImage,
      type: "Resort",
      division: "Miri",
      latitude: 4.4180,
      longitude: 114.0155,
      source: 'static'
    },
    {
      name: "Imperial Hotel Miri",
      desc: "Business hotel in city center with conference facilities",
      slug: "imperial-hotel-miri",
      image: defaultImage,
      type: "Hotel",
      division: "Miri",
      latitude: 4.4190,
      longitude: 114.0160,
      source: 'static'
    },
    
    // Hotels in Sibu
    {
      name: "Premier Hotel Sibu",
      desc: "Modern hotel with river views and central location",
      slug: "premier-hotel-sibu",
      image: defaultImage,
      type: "Hotel",
      division: "Sibu",
      latitude: 2.2870,
      longitude: 111.8320,
      source: 'static'
    },
    {
      name: "Kingwood Hotel Sibu",
      desc: "Comfortable hotel with good amenities and friendly service",
      slug: "kingwood-hotel-sibu",
      image: defaultImage,
      type: "Hotel",
      division: "Sibu",
      latitude: 2.2880,
      longitude: 111.8330,
      source: 'static'
    },
    
    // Resorts
    {
      name: "Damai Beach Resort",
      desc: "Beachfront resort with private beach and water sports",
      slug: "damai-beach-resort",
      image: defaultImage,
      type: "Resort",
      division: "Kuching",
      latitude: 1.7500,
      longitude: 110.3300,
      source: 'static'
    },
    {
      name: "Borneo Highlands Resort",
      desc: "Mountain resort with cool climate and panoramic views",
      slug: "borneo-highlands-resort",
      image: defaultImage,
      type: "Resort",
      division: "Kuching",
      latitude: 1.4000,
      longitude: 110.2800,
      source: 'static'
    },
    
    // Homestays
    {
      name: "Kampung Buntal Homestay",
      desc: "Traditional fishing village experience with local family",
      slug: "kampung-buntal-homestay",
      image: defaultImage,
      type: "Homestay",
      division: "Kuching",
      latitude: 1.6800,
      longitude: 110.4500,
      source: 'static'
    },
    {
      name: "Annah Rais Homestay",
      desc: "Authentic Bidayuh longhouse experience in traditional village",
      slug: "annah-rais-homestay",
      image: defaultImage,
      type: "Homestay",
      division: "Kuching",
      latitude: 1.3000,
      longitude: 110.2000,
      source: 'static'
    },
    
    // Hostels
    {
      name: "Kuching Backpackers Hostel",
      desc: "Budget-friendly accommodation for travelers and backpackers",
      slug: "kuching-backpackers-hostel",
      image: defaultImage,
      type: "Hostel",
      division: "Kuching",
      latitude: 1.5620,
      longitude: 110.3520,
      source: 'static'
    },
    {
      name: "Miri Travellers Lodge",
      desc: "Affordable hostel with dormitory and private rooms",
      slug: "miri-travellers-lodge",
      image: defaultImage,
      type: "Hostel",
      division: "Miri",
      latitude: 4.4200,
      longitude: 114.0170,
      source: 'static'
    },
    
    // Guest Houses
    {
      name: "Riverside Guest House",
      desc: "Cozy guest house with personalized service and home-cooked meals",
      slug: "riverside-guest-house",
      image: defaultImage,
      type: "Guest House",
      division: "Kuching",
      latitude: 1.5630,
      longitude: 110.3530,
      source: 'static'
    },
    {
      name: "Sibu Heritage Guest House",
      desc: "Restored heritage building with traditional charm",
      slug: "sibu-heritage-guest-house",
      image: defaultImage,
      type: "Guest House",
      division: "Sibu",
      latitude: 2.2890,
      longitude: 111.8340,
      source: 'static'
    },
    
    // Luxury Resorts
    {
      name: "The Culvert Miri",
      desc: "Luxury eco-resort with private villas and nature experiences",
      slug: "the-culvert-miri",
      image: defaultImage,
      type: "Resort",
      division: "Miri",
      latitude: 4.4210,
      longitude: 114.0180,
      source: 'static'
    },
    {
      name: "Tusan Beach Resort",
      desc: "Seaside resort famous for its beautiful beach and blue tears phenomenon",
      slug: "tusan-beach-resort",
      image: defaultImage,
      type: "Resort",
      division: "Miri",
      latitude: 4.3500,
      longitude: 113.9500,
      source: 'static'
    }
  ];

  // Main fetch function for the hook - KEPT ORIGINAL
  const fetchAllAccommodation = useCallback(async () => {
    // Fetch from all sources
    const [accommodationLocations, businessAccommodation, overpassAccommodation, staticAccommodation] = await Promise.all([
      fetchAccommodationLocations(),
      fetchBusinessAccommodation(),
      fetchOverpassAccommodation(),
      Promise.resolve(staticAccommodationData)
    ]);

    // Combine all data
    const allData = [...accommodationLocations, ...businessAccommodation, ...overpassAccommodation, ...staticAccommodation];
    
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
  const processAccommodation = useCallback((items) => {
    return items.map(item => {
      const name = item.name;
      const lowerName = name.toLowerCase();
      
      // Determine type if not already set
      let type = item.type;
      if (!type || type === 'Other') {
        if (lowerName.includes('hotel') && !lowerName.includes('apartment')) type = 'Hotel';
        else if (lowerName.includes('resort')) type = 'Resort';
        else if (lowerName.includes('homestay')) type = 'Homestay';
        else if (lowerName.includes('hostel')) type = 'Hostel';
        else if (lowerName.includes('guest')) type = 'Guest House';
        else if (lowerName.includes('apartment')) type = 'Apartment';
        else if (lowerName.includes('chalet')) type = 'Chalet';
        else if (lowerName.includes('camp')) type = 'Camp Site';
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

  // Use the instant data hook - KEPT ORIGINAL
  const { data, loading, preloadData } = useInstantData(
    'accommodation', 
    fetchAllAccommodation, 
    processAccommodation
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
          <p>Loading Accommodation...</p>
        </div>
      </div>
    );
  } */

  return (
    <div className="category-page">
      <MenuNavbar 
        onLoginClick={handleLoginClick} 
        onAccommodationHover={preloadData}
      />

      {/* 🚀 ADDED: Loading overlay only during initial load
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Accommodation...</p>
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
        <h1>{currentCategory.toUpperCase() || 'ACCOMMODATION'}</h1>
        <p className="hero-intro">
          Explore a wide range of accommodations to suit every travel style and budget. Discover everything from modern international hotels to unique homestays, perfectly located in Sarawak's major urban centers.
        </p>
      </div>

      <div className="search-section">
        <div className="search-container">
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
              <option value="Hotel">Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Homestay">Homestay</option>
              <option value="Hostel">Hostel</option>
              <option value="Guest House">Guest House</option>
              <option value="Apartment">Apartment</option>
              <option value="Chalet">Chalet</option>
              <option value="Camp Site">Camp Site</option>
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
              <p>No accommodation places found. Try adjusting your search criteria.</p>
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

export default AccommodationPage;