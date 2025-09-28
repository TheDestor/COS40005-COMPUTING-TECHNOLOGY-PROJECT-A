import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = '102WPe0tHJI'; 

const TourGuidePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Tour Guides');

  // Comprehensive tour guide data for Sarawak
  const staticTourGuideData = [
    // Cultural Tours
    {
      name: "Sarawak Cultural Heritage Tours",
      desc: "Expert guides specializing in Iban, Bidayuh, and Melanau cultural experiences",
      slug: "sarawak-cultural-heritage-tours",
      image: defaultImage,
      type: "Cultural Tours",
      lat: 1.5534,
      lng: 110.3594
    },
    {
      name: "Kuching Heritage Walk",
      desc: "Historic city walking tours with certified local historians",
      slug: "kuching-heritage-walk",
      image: defaultImage,
      type: "Cultural Tours",
      lat: 1.5545,
      lng: 110.3605
    },
    {
      name: "Longhouse Cultural Experience",
      desc: "Authentic Iban longhouse visits with traditional ceremonies",
      slug: "longhouse-cultural-experience",
      image: defaultImage,
      type: "Cultural Tours",
      lat: 1.5556,
      lng: 110.3616
    },
    {
      name: "Miri Cultural Center Tours",
      desc: "Melanau and Chinese heritage tours in Miri",
      slug: "miri-cultural-center-tours",
      image: defaultImage,
      type: "Cultural Tours",
      lat: 4.4180,
      lng: 114.0155
    },
    
    // Adventure Tours
    {
      name: "Borneo Adventure Expeditions",
      desc: "Jungle trekking, cave exploration, and river adventures",
      slug: "borneo-adventure-expeditions",
      image: defaultImage,
      type: "Adventure Tours",
      lat: 1.5567,
      lng: 110.3627
    },
    {
      name: "Gunung Mulu National Park Guide",
      desc: "Expert guides for Mulu caves and pinnacles trekking",
      slug: "gunung-mulu-national-park-guide",
      image: defaultImage,
      type: "Adventure Tours",
      lat: 4.0500,
      lng: 114.8167
    },
    {
      name: "Bako National Park Hiking",
      desc: "Wildlife spotting and coastal hiking with experienced guides",
      slug: "bako-national-park-hiking",
      image: defaultImage,
      type: "Adventure Tours",
      lat: 1.7167,
      lng: 110.4667
    },
    {
      name: "Niah Caves Adventure Tours",
      desc: "Archaeological cave tours and jungle adventures",
      slug: "niah-caves-adventure-tours",
      image: defaultImage,
      type: "Adventure Tours",
      lat: 3.8167,
      lng: 113.7667
    },
    
    // Nature Tours
    {
      name: "Wildlife Photography Tours",
      desc: "Professional wildlife photography with expert naturalist guides",
      slug: "wildlife-photography-tours",
      image: defaultImage,
      type: "Nature Tours",
      lat: 1.5578,
      lng: 110.3638
    },
    {
      name: "Proboscis Monkey River Tours",
      desc: "Boat tours to spot proboscis monkeys and other wildlife",
      slug: "proboscis-monkey-river-tours",
      image: defaultImage,
      type: "Nature Tours",
      lat: 1.5589,
      lng: 110.3649
    },
    {
      name: "Bird Watching Expeditions",
      desc: "Specialized bird watching tours with ornithologist guides",
      slug: "bird-watching-expeditions",
      image: defaultImage,
      type: "Nature Tours",
      lat: 1.5600,
      lng: 110.3660
    },
    {
      name: "Mangrove Forest Tours",
      desc: "Eco-tours through pristine mangrove ecosystems",
      slug: "mangrove-forest-tours",
      image: defaultImage,
      type: "Nature Tours",
      lat: 1.5611,
      lng: 110.3671
    },
    
    // City Tours
    {
      name: "Kuching City Explorer",
      desc: "Comprehensive city tours covering all major attractions",
      slug: "kuching-city-explorer",
      image: defaultImage,
      type: "City Tours",
      lat: 1.5622,
      lng: 110.3682
    },
    {
      name: "Miri City Discovery",
      desc: "Oil town heritage and modern city highlights",
      slug: "miri-city-discovery",
      image: defaultImage,
      type: "City Tours",
      lat: 4.4191,
      lng: 114.0166
    },
    {
      name: "Sibu Heritage Tours",
      desc: "Historic Sibu with focus on Chinese and indigenous culture",
      slug: "sibu-heritage-tours",
      image: defaultImage,
      type: "City Tours",
      lat: 2.2870,
      lng: 111.8320
    },
    {
      name: "Bintulu Industrial Tours",
      desc: "Industrial heritage and modern development tours",
      slug: "bintulu-industrial-tours",
      image: defaultImage,
      type: "City Tours",
      lat: 3.1739,
      lng: 113.0428
    },
    
    // Food Tours
    {
      name: "Sarawak Food Adventures",
      desc: "Culinary tours featuring local delicacies and street food",
      slug: "sarawak-food-adventures",
      image: defaultImage,
      type: "Food Tours",
      lat: 1.5633,
      lng: 110.3693
    },
    {
      name: "Kuching Night Market Tours",
      desc: "Evening food tours through local markets and stalls",
      slug: "kuching-night-market-tours",
      image: defaultImage,
      type: "Food Tours",
      lat: 1.5644,
      lng: 110.3704
    },
    {
      name: "Traditional Cooking Classes",
      desc: "Hands-on cooking experiences with local chefs",
      slug: "traditional-cooking-classes",
      image: defaultImage,
      type: "Food Tours",
      lat: 1.5655,
      lng: 110.3715
    },
    
    // Photography Tours
    {
      name: "Sarawak Landscape Photography",
      desc: "Professional photography tours of scenic locations",
      slug: "sarawak-landscape-photography",
      image: defaultImage,
      type: "Photography Tours",
      lat: 1.5666,
      lng: 110.3726
    },
    {
      name: "Sunrise & Sunset Tours",
      desc: "Golden hour photography at iconic Sarawak locations",
      slug: "sunrise-sunset-tours",
      image: defaultImage,
      type: "Photography Tours",
      lat: 1.5677,
      lng: 110.3737
    },
    
    // Eco Tours
    {
      name: "Sustainable Tourism Guides",
      desc: "Eco-friendly tours promoting conservation and sustainability",
      slug: "sustainable-tourism-guides",
      image: defaultImage,
      type: "Eco Tours",
      lat: 1.5688,
      lng: 110.3748
    },
    {
      name: "Community-Based Tourism",
      desc: "Tours supporting local communities and traditional practices",
      slug: "community-based-tourism",
      image: defaultImage,
      type: "Eco Tours",
      lat: 1.5699,
      lng: 110.3759
    },
    
    // Specialized Tours
    {
      name: "Archaeological Site Tours",
      desc: "Expert guides for Niah Caves and other archaeological sites",
      slug: "archaeological-site-tours",
      image: defaultImage,
      type: "Specialized Tours",
      lat: 1.5710,
      lng: 110.3770
    },
    {
      name: "Religious Heritage Tours",
      desc: "Multi-faith religious sites and cultural understanding tours",
      slug: "religious-heritage-tours",
      image: defaultImage,
      type: "Specialized Tours",
      lat: 1.5721,
      lng: 110.3781
    },
    {
      name: "Art & Craft Workshops",
      desc: "Hands-on workshops with local artisans and craftspeople",
      slug: "art-craft-workshops",
      image: defaultImage,
      type: "Specialized Tours",
      lat: 1.5732,
      lng: 110.3792
    }
  ];

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => 
        item.category?.toLowerCase() === 'tour' || 
        item.category?.toLowerCase() === 'guide' ||
        item.type?.toLowerCase().includes('tour') ||
        item.type?.toLowerCase().includes('guide') ||
        item.name?.toLowerCase().includes('tour') ||
        item.name?.toLowerCase().includes('guide')
      )
      .map(item => {
        // Determine tour type based on name and description
        const name = item.name?.toLowerCase() || '';
        const desc = item.description?.toLowerCase() || '';
        let type = 'General Tours';
        
        if (name.includes('cultural') || name.includes('heritage') || name.includes('longhouse')) {
          type = 'Cultural Tours';
        } else if (name.includes('adventure') || name.includes('hiking') || name.includes('trekking') || name.includes('cave')) {
          type = 'Adventure Tours';
        } else if (name.includes('nature') || name.includes('wildlife') || name.includes('bird') || name.includes('mangrove')) {
          type = 'Nature Tours';
        } else if (name.includes('city') || name.includes('urban') || name.includes('downtown')) {
          type = 'City Tours';
        } else if (name.includes('food') || name.includes('culinary') || name.includes('cooking')) {
          type = 'Food Tours';
        } else if (name.includes('photography') || name.includes('photo')) {
          type = 'Photography Tours';
        } else if (name.includes('eco') || name.includes('sustainable') || name.includes('community')) {
          type = 'Eco Tours';
        } else if (name.includes('archaeological') || name.includes('religious') || name.includes('art')) {
          type = 'Specialized Tours';
        }

        return {
          name: item.name || 'Unknown',
          desc: item.description || 'Professional tour guide service',
          slug: item.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
          image: item.image || defaultImage,
          type: type,
          lat: item.latitude || 0,
          lng: item.longitude || 0
        };
    });
  };

  const loadTourGuides = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Tour');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Combine backend data with static data
      const allData = [...processedBackend, ...staticTourGuideData];
      
      // Remove duplicates based on name
      const uniqueData = allData.filter((item, index, self) => 
        index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
      );
      
      setData(uniqueData);
    } catch (error) {
      console.error('Error fetching tour guides:', error);
      // Fallback to static data if backend fails
      setData(staticTourGuideData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTourGuides();
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
        <h1>{currentCategory.toUpperCase() || 'TOUR GUIDE'}</h1>
        <p className="hero-intro">
            Connect with certified local guides who bring Sarawak to life. Get personalized tours, deep cultural insights, and access hidden gems in Kuching, Miri, Sibu, and throughout the state for an unforgettable experience.
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
              <option value="Cultural Tours">Cultural Tours</option>
              <option value="Adventure Tours">Adventure Tours</option>
              <option value="Nature Tours">Nature Tours</option>
              <option value="City Tours">City Tours</option>
              <option value="Food Tours">Food Tours</option>
              <option value="Photography Tours">Photography Tours</option>
              <option value="Eco Tours">Eco Tours</option>
              <option value="Specialized Tours">Specialized Tours</option>
              <option value="General Tours">General Tours</option>
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

export default TourGuidePage;