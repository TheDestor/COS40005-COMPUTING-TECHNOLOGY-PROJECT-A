import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AIChatbot from '../components/AiChatbot.jsx';

const TOWN_VIDEOS = {
  Kuching: [
    {
      id: { videoId: 'Ru0fTWfuh8o' },
      snippet: {
        title: 'Kuching City Highlights',
        description: 'Explore the vibrant city of Kuching, Sarawak’s capital, with its unique blend of culture, food, and history.',
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
        title: 'Sibu: The Swan City',
        description: 'Discover Sibu’s riverfront, local delicacies, and vibrant festivals in this feature video.',
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
        title: 'Miri Adventure',
        description: 'Experience the adventure capital of Sarawak, from beaches to caves and national parks.',
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
        title: 'Bintulu: Nature & Industry',
        description: 'See how Bintulu balances industry and nature, with beautiful parks and vibrant commerce.',
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
        title: 'Kota Samarahan: The City of Bridges',
        description: 'Discover the beauty of Kota Samarahan, with its unique blend of culture, food, and history.',
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
        title: 'Mukah: The City of Bridges',
        description: 'Discover the beauty of Mukah, with its unique blend of culture, food, and history.',
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
        title: 'Kapit: The City of Bridges',
        description: 'Discover the beauty of Kapit, with its unique blend of culture, food, and history.',
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
        title: 'Sri Aman: The City of Bridges',
        description: 'Discover the beauty of Sri Aman, with its unique blend of culture, food, and history.',
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
        title: 'Limbang: The City of Bridges',
        description: 'Discover the beauty of Limbang, with its unique blend of culture, food, and history.',
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
        title: 'Serian: The City of Bridges',
        description: 'Discover the beauty of Serian, with its unique blend of culture, food, and history.',
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
        title: 'Sarikei: The City of Bridges',
        description: 'Discover the beauty of Sarikei, with its unique blend of culture, food, and history.',
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
        title: 'Betong: The City of Bridges',
        description: 'Discover the beauty of Betong, with its unique blend of culture, food, and history.',
        thumbnails: {
          medium: { url: 'https://i.ytimg.com/vi/e2rDoT2-tBk/mqdefault.jpg' }
        }
      }
    }
  ],
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
        
        const response = await fetch(`/api/locations`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        const townInfo = data.find(item => 
          item.type === 'Major Town' && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        ) || data[0];

        const otherItems = data.filter(item => 
          item._id !== townInfo?._id && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        );

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

  return (
    <div className="details-page">
      <MenuNavbar />

      {/* Hero Banner with Centered About Section */}
      <div 
        className="hero-banner with-centered-about"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${townData.image || defaultImage})` }}
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
        
        {/* <div className="related-videos">
          <h3>More Videos</h3>
          <div className="videos-container">
            <div className="videos-scroll">
              {videos.map((video, index) => (
                <div 
                  key={index} 
                  className={`video-thumbnail ${selectedVideo?.id.videoId === video.id.videoId ? 'active' : ''}`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <img 
                    src={video.snippet.thumbnails.medium.url} 
                    alt={video.snippet.title} 
                  />
                  <p>{video.snippet.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div> */}
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
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
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
                to={`/discover/${visibleCards[2].slug}`}
                state={{
                  name: visibleCards[2].name,
                  image: visibleCards[2].image,
                  desc: visibleCards[2].description,
                  coordinates: [visibleCards[2].latitude, visibleCards[2].longitude]
                }}
                className="category-explore-btn"
              >
                Explore more
              </Link>
              <a
                href={visibleCards[2].officialSite || "#"}
                className={`official-site-btn${visibleCards[2].officialSite ? "" : " disabled"}`}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={visibleCards[2].officialSite ? 0 : -1}
              >
                Official Site
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Ai Chatbot */}
      <AIChatbot />
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;