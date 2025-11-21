import React, { useState, useEffect, act } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AIChatbot from '../components/AiChatbot.jsx';
import { toast } from 'sonner';

const TOWN_VIDEOS = {
  Kuching: [
    {
      id: { videoId: 'Ru0fTWfuh8o' },
      snippet: {
        title: 'Kuching City Highlights',
        description: 'Experience Sarawak\'s charming capital - a city of contrasts where modern waterfronts meet historic landmarks, and vibrant markets coexist with lush rainforest sanctuaries.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/Ru0fTWfuh8o/mqdefault.jpg' }
        }
      }
    }
  ],
  Sibu: [
    {
      id: { videoId: 'gX4FjOAQa2A' },
      snippet: {
        title: 'Sibu: The Riverfront Gateway',
        description: 'Discover Sibu, the bustling commercial hub on the Rajang River, famous for its vibrant waterfront, rich Foochow heritage, and mouthwatering local delicacies.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/gX4FjOAQa2A/mqdefault.jpg' }
        }
      }
    }
  ],
  Miri: [
    {
      id: { videoId: 'Orie5jC6mlE' },
      snippet: {
        title: 'Miri: Resort City Adventure',
        description: 'Explore Miri, Sarawak\'s northern gateway, where oil heritage meets natural wonders - from stunning national parks and pristine beaches to vibrant city life.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/Orie5jC6mlE/mqdefault.jpg' }
        }
      }
    }
  ],
  Bintulu: [
    {
      id: { videoId: 'vBRh24zjaCc' },
      snippet: {
        title: 'Bintulu: Energy & Nature Hub',
        description: 'Experience Bintulu\'s unique blend of industrial prowess and natural beauty, featuring world-class LNG facilities alongside breathtaking coastal parks and cultural sites.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/vBRh24zjaCc/mqdefault.jpg' }
        }
      }
    }
  ],
  Samarahan: [
    {
      id: { videoId: 'a9jdNhyXdCU' },
      snippet: {
        title: 'Samarahan: Education City',
        description: 'Discover Samarahan, Sarawak\'s emerging educational hub known for its prestigious universities, tranquil environment, and close-knit academic community.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/a9jdNhyXdCU/mqdefault.jpg' }
        }
      }
    }
  ],
  Mukah: [
    {
      id: { videoId: 'utld6a8X8jo' },
      snippet: {
        title: 'Mukah: Melanau Heritage',
        description: 'Immerse in Mukah\'s rich Melanau culture, famous for its traditional sago production, unique tall houses, and the vibrant annual Kaul Festival celebrations.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/utld6a8X8jo/mqdefault.jpg' }
        }
      }
    }
  ],
  Kapit: [
    {
      id: { videoId: 'HtSy7Ah_nwo' },
      snippet: {
        title: 'Kapit: Heart of the Rajang',
        description: 'Journey to Kapit, the gateway to Sarawak\'s interior, offering authentic Iban longhouse experiences and access to the mighty Rajang River\'s upper reaches.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/HtSy7Ah_nwo/mqdefault.jpg' }
        }
      }
    }
  ],
  "Sri Aman": [
    {
      id: { videoId: 'ozJUKtFFfUE' },
      snippet: {
        title: 'Sri Aman: Tidal Bore Wonder',
        description: 'Witness Sri Aman\'s famous Benak tidal bore phenomenon while exploring this historic town\'s colonial forts and serene riverside charm.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/ozJUKtFFfUE/mqdefault.jpg' }
        }
      }
    }
  ],
  Limbang: [
    {
      id: { videoId: '2eJrUo0CWfo' },
      snippet: {
        title: 'Limbang: Border Town Charm',
        description: 'Explore Limbang\'s unique position bordering Brunei, featuring rich historical sites, traditional markets, and access to remote national parks.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/2eJrUo0CWfo/mqdefault.jpg' }
        }
      }
    }
  ],  
  Serian: [
    {
      id: { videoId: 'Ka90wjVr9so' },
      snippet: {
        title: 'Serian: Bidayuh Heartland',
        description: 'Discover Serian, the cultural heartland of the Bidayuh people, known for its fertile farmlands, traditional longhouses, and warm community spirit.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/Ka90wjVr9so/mqdefault.jpg' }
        }
      }
    }
  ],
  Sarikei: [
    {
      id: { videoId: '6oZFY9q9U9Y' },
      snippet: {
        title: 'Sarikei: Pineapple Paradise',
        description: 'Experience Sarikei, Sarawak\'s agricultural gem famous for its sweet pineapples, lush fruit orchards, and picturesque riverine landscapes.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/6oZFY9q9U9Y/mqdefault.jpg' }
        }
      }
    }
  ],
  Betong: [
    {
      id: { videoId: 'e2rDoT2-tBk' },
      snippet: {
        title: 'Betong: Saribas Gateway',
        description: 'Explore Betong in the scenic Saribas region, known for its iconic clock tower, traditional Iban culture, and beautiful rural countryside.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/e2rDoT2-tBk/mqdefault.jpg' }
        }
      }
    }
  ]
};

const DEFAULT_VIDEO = [
  {
    id: { videoId: 'KIQueYmDWEQ' },
    snippet: {
      title: 'Sarawak Tourism Highlights',
      description: 'Explore the beauty of Sarawak through this amazing video',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/KIQueYmDWEQ/mqdefault.jpg' }
      }
    }
  }
];

// Filtering requirements for Major Attractions carousel:
// - Exclude any locations with names containing "Pharmacy" or "Toilet"
// - Case-insensitive matching, handle simple variations (e.g., "pharmacies", "toilets", "pharma", "toilette")
// - Apply on client-side before displaying cards; also request API to exclude if supported
// - Must not affect performance or existing valid cards
export const shouldExcludeByName = (name) => {
  try {
    const text = String(name || "").toLowerCase();
    // Match variations: pharm*, toilet*
    // Examples matched: "pharmacy", "pharmacies", "pharma center", "toilet", "toilets", "toilette"
    return /\b(?:pharm\w*|toilet\w*)\b/i.test(text);
  } catch (err) {
    // If filtering fails for any reason, do not exclude and log an error
    console.error('Name filtering failed:', err);
    return false;
  }
};

const CategoryDetailsPage = () => {
  const [townData, setTownData] = useState(null);
  const [divisionItems, setDivisionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { slug } = useParams();
  const location = useLocation();
  const passedTown = location.state?.town;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 5;
  const [carouselStart, setCarouselStart] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'Homestay', name: 'Homestay' },
    { id: 'Museum', name: 'Museum' },
    { id: 'National Park', name: 'National Park' },
    { id: 'Beach', name: 'Beach' },
    { id: 'Airport', name: 'Airport' }
  ];

  useEffect(() => {
    if (passedTown) {
      setTownData(passedTown);
      setDivisionItems(passedTown?.division || []);
      setLoading(false);
    }
  }, [passedTown]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const divisionName = passedTown?.division || slug;
        
        // Request server-side filtering if available
        const response = await fetch(`/api/locations?excludeTerms=pharmacy,toilet`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        const townInfo = data.find(item => 
          item.type === 'Major Town' && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        ) || data[0];

        // Apply client-side filtering as a safety net
        let otherItems = data.filter(item => 
          item._id !== townInfo?._id && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        );

        try {
          otherItems = otherItems.filter(item => !shouldExcludeByName(item?.name));
        } catch (filterErr) {
          console.error('Client-side filtering error:', filterErr);
          // Non-fatal: keep otherItems unfiltered to avoid breaking UI
        }

        setTownData({
          name: townInfo?.division,
          description: townInfo?.description || townInfo?.desc,
          image: townInfo?.image || defaultImage,
          population: townInfo?.population || 'Data not available',
          area: townInfo?.area || 'Data not available',
          climate: townInfo?.climate || 'Tropical',
        });

        setDivisionItems(otherItems);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, passedTown]);

  useEffect(() => {
    if (townData?.name) {
      const fetchVideos = async () => {
        try {
          // Use the mapping for the town, fallback to default
          const videos = TOWN_VIDEOS[townData.name] || DEFAULT_VIDEO;
          setVideos(videos);
          setSelectedVideo(videos[0]);
        } catch (error) {
          console.error('Error fetching videos:', error);
        }
      };
      fetchVideos();
    }
  }, [townData]);

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const turb = document.getElementById("turb");
    let frame = 0;
    let anim;
    function animate() {
      if (turb) {
        turb.setAttribute("baseFrequency", `0.02 ${0.15 + Math.sin(frame/20)*0.03}`);
      }
      frame++;
      anim = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(anim);
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!townData) {
    return (
      <div className="error-container">
        <MenuNavbar />
        <div className="error-content">
          <h2>404 - Division Not Found</h2>
          <p>The division "{slug}" doesn't exist in our records.</p>
          <Link to="/towns" className="return-button">
            Browse All Towns
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredItems = divisionItems.filter(item => {
    // Safety check: apply exclude filter again at display-time (defensive)
    if (shouldExcludeByName(item?.name)) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination logic
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredItems.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredItems.length / cardsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Always assign inclination classes based on visible index (0-4)
  function getCardPositionClass(idx) {
    if (idx === 2) return 'center';
    if (idx === 1) return 'left1';
    if (idx === 0) return 'left2';
    if (idx === 3) return 'right1';
    if (idx === 4) return 'right2';
    return '';
  }

  const getCarouselCards = () => {
    if (filteredItems.length <= 5) return filteredItems;
    return filteredItems.slice(carouselStart, carouselStart + 5);
  };

  const centerIndex = carouselStart + 2;

  const handleNext = () => {
    if (filteredItems.length > 1) {
      setCarouselStart((prev) => (prev + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (filteredItems.length > 1) {
      // Push cards to the right (advance start forward)
      setCarouselStart((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  let visibleCards = [];
  const n = filteredItems.length;

  if (n > 0) {
    if (n >= 5) {
      // For 5 or more items, normal sliding window
      for (let i = 0; i < 5; i++) {
        const item = filteredItems[(carouselStart + i) % n];
        visibleCards.push(item);
      }
    } else {
      // For less than 5 items, we create a rotated list and place it in the center.
      const rotatedItems = [];
      for (let i = 0; i < n; i++) {
        rotatedItems.push(filteredItems[(carouselStart + i) % n]);
      }

      // Initialize with nulls for centering
      visibleCards = [null, null, null, null, null];
      
      // Place items into the `visibleCards` array based on count
      if (n === 1) { // Center
        visibleCards[2] = rotatedItems[0];
      } else if (n === 2) { // Center, right1
        visibleCards[2] = rotatedItems[0];
        visibleCards[3] = rotatedItems[1];
      } else if (n === 3) { // left1, Center, right1
        visibleCards[1] = rotatedItems[0];
        visibleCards[2] = rotatedItems[1];
        visibleCards[3] = rotatedItems[2];
      } else if (n === 4) { // left2, left1, Center, right1
        visibleCards[0] = rotatedItems[0];
        visibleCards[1] = rotatedItems[1];
        visibleCards[2] = rotatedItems[2];
        visibleCards[3] = rotatedItems[3];
      }
    }
  }

  const activeCategory = selectedCategory;
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCarouselStart(0); // Reset carousel to start
  }

  return (
    <div className="details-page">
      <MenuNavbar onLoginClick={handleLoginClick}/>

      {/* Hero Banner with Centered About Section */}
      <div 
        className="hero-banner with-centered-about"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${townData.image || defaultImage})` }}
      >
        {/* Centered About Section */}
        <div className="centered-about-section">
          <div className="text-content">
            <h2>About {townData.name}</h2>
            <p className="overview-text">{townData.description}</p>
          </div>
        </div>
      </div>

      <div className="video-section-container">
      <div className="video-section">
        <h2>Discover {townData.name} Through Video</h2>
        
        {selectedVideo && (
          <div className="featured-video">
            <iframe
              title={selectedVideo.snippet.title}
              width="100%"
              height="500"
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
              // frameBorder="0"
              controls="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="video-info">
              <h3>{selectedVideo.snippet.title}</h3>
              <p>{selectedVideo.snippet.description}</p>
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="discover-section">
        <div className="section-header-container">
          <h2>Major Attractions in {townData.name}</h2>
          <p>Explore the best of what {townData.name} has to offer</p>
        </div>
        
        <div className="search-filter-container">
          <div className="search-bar-category">
            <input
              type="text"
              placeholder="Search locations by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="search-icon-category fas fa-search"></i>
          </div>
          
          <div className="category-filter-bar">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <span className="btn-icon">{category.icon}</span>
                <span className="btn-text">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="carousel-container">
          <button className="carousel-arrow" onClick={handlePrev}>
            <FaChevronLeft />
          </button>
          <div className="carousel">
            {visibleCards.length > 0 ? (
              visibleCards.map((item, idx) =>
                item ? (
                  <div
                    key={item._id}
                    className={`carousel-card ${getCardPositionClass(idx)}${idx === 2 ? ' active' : ''}`}
                    onClick={() => {
                      if (item && filteredItems.length > 1) {
                        const positionsToMove = idx - 2;
                        let newStart;
                        if (positionsToMove > 0) {
                          // Move left (current behavior for right side)
                          newStart = (carouselStart + positionsToMove + filteredItems.length) % filteredItems.length;
                        } else if (positionsToMove < 0) {
                          // Move right (new behavior for left side)
                          newStart = (carouselStart + positionsToMove + filteredItems.length * 2) % filteredItems.length;
                        } else {
                          // Already center, do nothing
                          return;
                        }
                        setCarouselStart(newStart);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={item.image || defaultImage} alt={item.name} />
                    <div className="card-reflection">
                      <img src={item.image || defaultImage} alt="" aria-hidden="true" />
                    </div>
                    <div className="carousel-card-hover-info">
                      <div>{item.name}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 4 }}>{item.type}</div>
                    </div>
                  </div>
                ) : null
              )
            ) : (
              <div className="no-location-card">
                <div className="no-location-content">
                  <span className="no-location-emoji" role="img" aria-label="No data">📭</span>
                  <h3>No location data found for this category.</h3>
                  <p>We couldn't find any locations for <b>{townData.name}</b> at the moment.<br/>Try another category or check back later!</p>
                </div>
              </div>
            )}
          </div>
          <button className="carousel-arrow" onClick={handleNext}>
            <FaChevronRight />
          </button>
        </div>

        {visibleCards.length > 0 && visibleCards[2] && (
          <div className="carousel-description-section">
            <p className="carousel-description-text">
              {visibleCards[2].description || "No description available."}
            </p>
            <div className="carousel-description-actions">
              <Link
                to={`/discover/${encodeURIComponent(visibleCards[2].name)}`}
                state={{
                  category: visibleCards[2].category,
                  type: visibleCards[2].type,
                  division: visibleCards[2].division,
                  name: visibleCards[2].name,
                  latitude: visibleCards[2].latitude,
                  longitude: visibleCards[2].longitude,
                  url: visibleCards[2].url,
                  description: visibleCards[2].description,
                  image: visibleCards[2].image
                }}
                className="category-explore-btn"
              >
                Explore more
              </Link>
              <a
                href={visibleCards[2].url || "#"}
                className={`official-site-btn${visibleCards[2].url ? "" : " disabled"}`}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={visibleCards[2].url ? 0 : -1}
              >
                Related Site
              </a>
            </div>
          </div>
        )}
      </div>

      {showLogin && <LoginPage onClose={closeLogin} />}

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;