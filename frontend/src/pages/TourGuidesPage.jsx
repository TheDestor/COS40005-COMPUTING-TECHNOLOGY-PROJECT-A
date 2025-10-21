// Top-level imports
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';
import { FaPhone, FaSearch, FaArrowUp } from 'react-icons/fa';
import { useInstantData } from '../hooks/useInstantData.jsx';

const HERO_VIDEO_ID = '102WPe0tHJI'; 

// Component: TourGuidePage
const TourGuidePage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Tour Guides');
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

  // Fetch business locations with category "Tour Guides" - KEPT ORIGINAL
  const fetchBusinessTourGuides = async () => {
    try {
      const response = await fetch('/api/businesses/approved/category/Tour Guides');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch business tour guides');
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
        category: business.category || 'Tour Guides',
        owner: business.owner,
        ownerEmail: business.ownerEmail,
        phone: business.phone,
        address: business.address,
        openingHours: business.openingHours,
        ownerAvatar: business.ownerAvatar,
        source: 'business'
      }));
    } catch (error) {
      console.error('Error fetching business tour guides:', error);
      return [];
    }
  };

  // Fetch tour guide locations from database - KEPT ORIGINAL
  const fetchTourGuideLocations = async () => {
    try {
      const response = await fetch('/api/locations?category=Tour');
      const fetchedData = await response.json();
      
      // Filter for tour guide related categories
      const tourGuideData = fetchedData.filter(item => 
        item.category?.toLowerCase().includes('tour') || 
        item.category?.toLowerCase().includes('guide') ||
        item.type?.toLowerCase().includes('tour') ||
        item.type?.toLowerCase().includes('guide')
      );
      
      return tourGuideData.map(item => ({
        name: item.name || item.Name || 'Unknown',
        desc: item.description || item.desc || 'No description available',
        slug: (item.name || item.Name)?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        division: item.division || 'Unknown',
        latitude: item.latitude || item.lat || 0,
        longitude: item.longitude || item.lng || 0,
        url: item.url || '',
        category: item.category || 'Tour',
        source: 'database'
      }));
    } catch (error) {
      console.error('Error fetching tour guide locations:', error);
      return [];
    }
  };

  // Fetch tour guide services from Overpass API (OpenStreetMap) - KEPT ORIGINAL
  const fetchOverpassTourGuides = async () => {
    try {
      // Sarawak bounding box (approximate)
      const sarawakBbox = '1.0,109.5,3.5,115.5';
      
      // Overpass query for tourism services in Sarawak
      const overpassQuery = `
        [out:json][timeout:25];
        (
          // Tourism information
          node["tourism"="information"](${sarawakBbox});
          way["tourism"="information"](${sarawakBbox});
          relation["tourism"="information"](${sarawakBbox});
          
          // Tour operators
          node["tourism"="yes"]["name"](${sarawakBbox});
          way["tourism"="yes"]["name"](${sarawakBbox});
          relation["tourism"="yes"]["name"](${sarawakBbox});
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
        const name = tags.name || 'Tour Service';
        
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
        let type = 'General Tours';
        if (tags.tourism === 'information') type = 'Tour Information';
        else if (tags.tourism === 'yes') type = 'Tour Service';

        // Create description from available tags
        let description = tags.description || tags.wikipedia || '';
        if (!description) {
          description = `Tour guide service in Sarawak`;
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
          category: 'Tour Guides',
          source: 'overpass',
          osmTags: tags
        };
      });
    } catch (error) {
      console.error('Error fetching Overpass tour guides:', error);
      return [];
    }
  };

  // Comprehensive tour guide data for Sarawak - KEPT ORIGINAL
  const staticTourGuideData = [
    // Cultural Tours
    {
      name: "Sarawak Cultural Heritage Tours",
      desc: "Expert guides specializing in Iban, Bidayuh, and Melanau cultural experiences",
      slug: "sarawak-cultural-heritage-tours",
      image: defaultImage,
      type: "Cultural Tours",
      division: "Kuching",
      latitude: 1.5534,
      longitude: 110.3594,
      source: 'static'
    },
    {
      name: "Kuching Heritage Walk",
      desc: "Historic city walking tours with certified local historians",
      slug: "kuching-heritage-walk",
      image: defaultImage,
      type: "Cultural Tours",
      division: "Kuching",
      latitude: 1.5545,
      longitude: 110.3605,
      source: 'static'
    },
    {
      name: "Longhouse Cultural Experience",
      desc: "Authentic Iban longhouse visits with traditional ceremonies",
      slug: "longhouse-cultural-experience",
      image: defaultImage,
      type: "Cultural Tours",
      division: "Kuching",
      latitude: 1.5556,
      longitude: 110.3616,
      source: 'static'
    },
    {
      name: "Miri Cultural Center Tours",
      desc: "Melanau and Chinese heritage tours in Miri",
      slug: "miri-cultural-center-tours",
      image: defaultImage,
      type: "Cultural Tours",
      division: "Miri",
      latitude: 4.4180,
      longitude: 114.0155,
      source: 'static'
    },
    
    // Adventure Tours
    {
      name: "Borneo Adventure Expeditions",
      desc: "Jungle trekking, cave exploration, and river adventures",
      slug: "borneo-adventure-expeditions",
      image: defaultImage,
      type: "Adventure Tours",
      division: "Kuching",
      latitude: 1.5567,
      longitude: 110.3627,
      source: 'static'
    },
    {
      name: "Gunung Mulu National Park Guide",
      desc: "Expert guides for Mulu caves and pinnacles trekking",
      slug: "gunung-mulu-national-park-guide",
      image: defaultImage,
      type: "Adventure Tours",
      division: "Miri",
      latitude: 4.0500,
      longitude: 114.8167,
      source: 'static'
    },
    {
      name: "Bako National Park Hiking",
      desc: "Wildlife spotting and coastal hiking with experienced guides",
      slug: "bako-national-park-hiking",
      image: defaultImage,
      type: "Adventure Tours",
      division: "Kuching",
      latitude: 1.7167,
      longitude: 110.4667,
      source: 'static'
    },
    {
      name: "Niah Caves Adventure Tours",
      desc: "Archaeological cave tours and jungle adventures",
      slug: "niah-caves-adventure-tours",
      image: defaultImage,
      type: "Adventure Tours",
      division: "Miri",
      latitude: 3.8167,
      longitude: 113.7667,
      source: 'static'
    },
    
    // Nature Tours
    {
      name: "Wildlife Photography Tours",
      desc: "Professional wildlife photography with expert naturalist guides",
      slug: "wildlife-photography-tours",
      image: defaultImage,
      type: "Nature Tours",
      division: "Kuching",
      latitude: 1.5578,
      longitude: 110.3638,
      source: 'static'
    },
    {
      name: "Proboscis Monkey River Tours",
      desc: "Boat tours to spot proboscis monkeys and other wildlife",
      slug: "proboscis-monkey-river-tours",
      image: defaultImage,
      type: "Nature Tours",
      division: "Kuching",
      latitude: 1.5589,
      longitude: 110.3649,
      source: 'static'
    },
    {
      name: "Bird Watching Expeditions",
      desc: "Specialized bird watching tours with ornithologist guides",
      slug: "bird-watching-expeditions",
      image: defaultImage,
      type: "Nature Tours",
      division: "Kuching",
      latitude: 1.5600,
      longitude: 110.3660,
      source: 'static'
    },
    {
      name: "Mangrove Forest Tours",
      desc: "Eco-tours through pristine mangrove ecosystems",
      slug: "mangrove-forest-tours",
      image: defaultImage,
      type: "Nature Tours",
      division: "Kuching",
      latitude: 1.5611,
      longitude: 110.3671,
      source: 'static'
    },
    
    // City Tours
    {
      name: "Kuching City Explorer",
      desc: "Comprehensive city tours covering all major attractions",
      slug: "kuching-city-explorer",
      image: defaultImage,
      type: "City Tours",
      division: "Kuching",
      latitude: 1.5622,
      longitude: 110.3682,
      source: 'static'
    },
    {
      name: "Miri City Discovery",
      desc: "Oil town heritage and modern city highlights",
      slug: "miri-city-discovery",
      image: defaultImage,
      type: "City Tours",
      division: "Miri",
      latitude: 4.4191,
      longitude: 114.0166,
      source: 'static'
    },
    {
      name: "Sibu Heritage Tours",
      desc: "Historic Sibu with focus on Chinese and indigenous culture",
      slug: "sibu-heritage-tours",
      image: defaultImage,
      type: "City Tours",
      division: "Sibu",
      latitude: 2.2870,
      longitude: 111.8320,
      source: 'static'
    },
    {
      name: "Bintulu Industrial Tours",
      desc: "Industrial heritage and modern development tours",
      slug: "bintulu-industrial-tours",
      image: defaultImage,
      type: "City Tours",
      division: "Bintulu",
      latitude: 3.1739,
      longitude: 113.0428,
      source: 'static'
    },
    
    // Food Tours
    {
      name: "Sarawak Food Adventures",
      desc: "Culinary tours featuring local delicacies and street food",
      slug: "sarawak-food-adventures",
      image: defaultImage,
      type: "Food Tours",
      division: "Kuching",
      latitude: 1.5633,
      longitude: 110.3693,
      source: 'static'
    },
    {
      name: "Kuching Night Market Tours",
      desc: "Evening food tours through local markets and stalls",
      slug: "kuching-night-market-tours",
      image: defaultImage,
      type: "Food Tours",
      division: "Kuching",
      latitude: 1.5644,
      longitude: 110.3704,
      source: 'static'
    },
    {
      name: "Traditional Cooking Classes",
      desc: "Hands-on cooking experiences with local chefs",
      slug: "traditional-cooking-classes",
      image: defaultImage,
      type: "Food Tours",
      division: "Kuching",
      latitude: 1.5655,
      longitude: 110.3715,
      source: 'static'
    },
    
    // Photography Tours
    {
      name: "Sarawak Landscape Photography",
      desc: "Professional photography tours of scenic locations",
      slug: "sarawak-landscape-photography",
      image: defaultImage,
      type: "Photography Tours",
      division: "Kuching",
      latitude: 1.5666,
      longitude: 110.3726,
      source: 'static'
    },
    {
      name: "Sunrise & Sunset Tours",
      desc: "Golden hour photography at iconic Sarawak locations",
      slug: "sunrise-sunset-tours",
      image: defaultImage,
      type: "Photography Tours",
      division: "Kuching",
      latitude: 1.5677,
      longitude: 110.3737,
      source: 'static'
    },
    
    // Eco Tours
    {
      name: "Sustainable Tourism Guides",
      desc: "Eco-friendly tours promoting conservation and sustainability",
      slug: "sustainable-tourism-guides",
      image: defaultImage,
      type: "Eco Tours",
      division: "Kuching",
      latitude: 1.5688,
      longitude: 110.3748,
      source: 'static'
    },
    {
      name: "Community-Based Tourism",
      desc: "Tours supporting local communities and traditional practices",
      slug: "community-based-tourism",
      image: defaultImage,
      type: "Eco Tours",
      division: "Kuching",
      latitude: 1.5699,
      longitude: 110.3759,
      source: 'static'
    },
    
    // Specialized Tours
    {
      name: "Archaeological Site Tours",
      desc: "Expert guides for Niah Caves and other archaeological sites",
      slug: "archaeological-site-tours",
      image: defaultImage,
      type: "Specialized Tours",
      division: "Miri",
      latitude: 1.5710,
      longitude: 110.3770,
      source: 'static'
    },
    {
      name: "Religious Heritage Tours",
      desc: "Multi-faith religious sites and cultural understanding tours",
      slug: "religious-heritage-tours",
      image: defaultImage,
      type: "Specialized Tours",
      division: "Kuching",
      latitude: 1.5721,
      longitude: 110.3781,
      source: 'static'
    },
    {
      name: "Art & Craft Workshops",
      desc: "Hands-on workshops with local artisans and craftspeople",
      slug: "art-craft-workshops",
      image: defaultImage,
      type: "Specialized Tours",
      division: "Kuching",
      latitude: 1.5732,
      longitude: 110.3792,
      source: 'static'
    }
  ];

  // Main fetch function for the hook - KEPT ORIGINAL
  const fetchAllTourGuides = useCallback(async () => {
    // Fetch from all sources
    const [tourGuideLocations, businessTourGuides, overpassTourGuides, staticTourGuides] = await Promise.all([
      fetchTourGuideLocations(),
      fetchBusinessTourGuides(),
      fetchOverpassTourGuides(),
      Promise.resolve(staticTourGuideData)
    ]);

    // Combine all data
    const allData = [...tourGuideLocations, ...businessTourGuides, ...overpassTourGuides, ...staticTourGuides];
    
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
  const processTourGuides = useCallback((items) => {
    return items.map(item => {
      const name = item.name;
      const lowerName = name.toLowerCase();
      
      // Determine type if not already set
      let type = item.type;
      if (!type || type === 'Other') {
        if (lowerName.includes('cultural') || lowerName.includes('heritage') || lowerName.includes('longhouse')) {
          type = 'Cultural Tours';
        } else if (lowerName.includes('adventure') || lowerName.includes('hiking') || lowerName.includes('trekking') || lowerName.includes('cave')) {
          type = 'Adventure Tours';
        } else if (lowerName.includes('nature') || lowerName.includes('wildlife') || lowerName.includes('bird') || lowerName.includes('mangrove')) {
          type = 'Nature Tours';
        } else if (lowerName.includes('city') || lowerName.includes('urban') || lowerName.includes('downtown')) {
          type = 'City Tours';
        } else if (lowerName.includes('food') || lowerName.includes('culinary') || lowerName.includes('cooking')) {
          type = 'Food Tours';
        } else if (lowerName.includes('photography') || lowerName.includes('photo')) {
          type = 'Photography Tours';
        } else if (lowerName.includes('eco') || lowerName.includes('sustainable') || lowerName.includes('community')) {
          type = 'Eco Tours';
        } else if (lowerName.includes('archaeological') || lowerName.includes('religious') || lowerName.includes('art')) {
          type = 'Specialized Tours';
        } else if (item.source === 'business') type = 'Business';
        else type = 'General Tours';
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
    'tour_guides', 
    fetchAllTourGuides, 
    processTourGuides
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
          <p>Loading Tour Guides...</p>
        </div>
      </div>
    );
  } */

  return (
    <div className="category-page">
      <MenuNavbar 
        onLoginClick={handleLoginClick} 
        onTourGuidesHover={preloadData}
      />

      {/* 🚀 ADDED: Loading overlay only during initial load
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading Tour Guides...</p>
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
        <h1>{currentCategory.toUpperCase() || 'TOUR GUIDES'}</h1>
        <p className="hero-intro">
          Connect with certified local guides who bring Sarawak to life. Get personalized tours, deep cultural insights, and access hidden gems in Kuching, Miri, Sibu, and throughout the state for an unforgettable experience.
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
              <option value="Cultural Tours">Cultural Tours</option>
              <option value="Adventure Tours">Adventure Tours</option>
              <option value="Nature Tours">Nature Tours</option>
              <option value="City Tours">City Tours</option>
              <option value="Food Tours">Food Tours</option>
              <option value="Photography Tours">Photography Tours</option>
              <option value="Eco Tours">Eco Tours</option>
              <option value="Specialized Tours">Specialized Tours</option>
              <option value="Tour Information">Tour Information</option>
              <option value="Tour Service">Tour Service</option>
              <option value="Business">Business</option>
              <option value="General Tours">General Tours</option>
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
              <p>No tour guides found. Try adjusting your search criteria.</p>
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

export default TourGuidePage;