import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
          const mockVideos = [
            {
              id: { videoId: 'dQw4w9WgXcQ' },
              snippet: {
                title: `${townData.name} Tourism Highlights`,
                description: `Explore the beauty of ${townData.name} through this amazing video`,
                thumbnails: {
                  medium: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' }
                }
              }
            },
            {
              id: { videoId: '9bZkp7q19f0' },
              snippet: {
                title: `Cultural Heritage of ${townData.name}`,
                description: `Discover the rich cultural traditions of ${townData.name}`,
                thumbnails: {
                  medium: { url: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg' }
                }
              }
            },
            {
              id: { videoId: 'J---aiyznGQ' },
              snippet: {
                title: `Local Cuisine in ${townData.name}`,
                description: `Taste the authentic flavors of ${townData.name}`,
                thumbnails: {
                  medium: { url: 'https://i.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg' }
                }
              }
            },
            {
              id: { videoId: 'L_jWHffIx5E' },
              snippet: {
                title: `Nature Adventures in ${townData.name}`,
                description: `Experience the natural wonders of ${townData.name}`,
                thumbnails: {
                  medium: { url: 'https://i.ytimg.com/vi/L_jWHffIx5E/mqdefault.jpg' }
                }
              }
            }
          ];
          setVideos(mockVideos);
          setSelectedVideo(mockVideos[0]);
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

  const handlePrev = () => {
    if (filteredItems.length < 5) {
      // For <5 cards, rotate the array left
      const arr = [...filteredItems];
      arr.unshift(arr.pop());
      // Rebuild visibleCards logic by updating filteredItems order
      setDivisionItems(prev => prev.map(item => arr.find(a => a._id === item._id) || item));
    } else {
      if (carouselStart > 0) {
        setCarouselStart(carouselStart - 1);
      } else {
        setCarouselStart(filteredItems.length - 5);
      }
    }
  };

  const handleNext = () => {
    if (filteredItems.length < 5) {
      // For <5 cards, rotate the array right
      const arr = [...filteredItems];
      arr.push(arr.shift());
      setDivisionItems(prev => prev.map(item => arr.find(a => a._id === item._id) || item));
    } else {
      if (carouselStart < filteredItems.length - 5) {
        setCarouselStart(carouselStart + 1);
      } else {
        setCarouselStart(0);
      }
    }
  };

  let visibleCards = [];
  if (filteredItems.length < 5) {
    if (filteredItems.length === 1) {
      visibleCards = [null, null, filteredItems[0], null, null];
    } else if (filteredItems.length === 2) {
      visibleCards = [null, filteredItems[0], null, filteredItems[1], null];
    } else if (filteredItems.length === 3) {
      visibleCards = [null, filteredItems[0], filteredItems[1], filteredItems[2], null];
    } else if (filteredItems.length === 4) {
      visibleCards = [filteredItems[0], filteredItems[1], filteredItems[2], filteredItems[3], null];
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const item = filteredItems[(carouselStart + i) % filteredItems.length];
      visibleCards.push(item);
    }
  }

  return (
    <div className="details-page">
      <MenuNavbar />

      <div 
        className="hero-banner"
        style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${townData.image || defaultImage})` }}
      >
        <div className="hero-overlay">
          <h1>{townData.name.toUpperCase()}</h1>
          <p>Exploring {townData.name}</p>
        </div>
      </div>

      <div className="video-section">
        <h2>Discover {townData.name} Through Videos</h2>
        
        {selectedVideo && (
          <div className="featured-video">
            <iframe
              title={selectedVideo.snippet.title}
              width="100%"
              height="500"
              src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="video-info">
              <h3>{selectedVideo.snippet.title}</h3>
              <p>{selectedVideo.snippet.description}</p>
            </div>
          </div>
        )}
        
        <div className="related-videos">
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
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {townData.name}</h2>
            <p className="overview-text">{townData.description}</p>
          </div>
        </div>
      </div>

      <div className="discover-section">
        <div className="section-header">
          <h2>Discover {townData.name}</h2>
          <p>Explore the best of what {townData.name} has to offer</p>
        </div>
        
        <div className="search-filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search locations by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="search-icon fas fa-search"></i>
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
            {visibleCards.map((item, idx) =>
              item ? (
                <div
                  key={item._id || item.name}
                  className={`carousel-card ${getCardPositionClass(idx)}${idx === 2 ? ' active' : ''}`}
                  onClick={() => {
                    if (idx !== 2 && item && filteredItems.length > 1) {
                      // Calculate the index of the clicked item in filteredItems
                      let itemIndex = (carouselStart + idx) % filteredItems.length;
                      // Calculate new carouselStart so that clicked card is at center (idx 2)
                      let newStart = (itemIndex - 2 + filteredItems.length) % filteredItems.length;
                      // For < 5 cards, always 0
                      if (filteredItems.length <= 5) newStart = 0;
                      setCarouselStart(newStart);
                    }
                  }}
                  style={{ cursor: idx !== 2 && item ? 'pointer' : 'default' }}
                >
                  <img src={item.image || defaultImage} alt={item.name} />
                  <span className="category-tag">{item.type}</span>
                  <div className="carousel-card-hover-info">
                    <div>{item.name}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 400, marginTop: 4 }}>{item.type}</div>
                  </div>
                </div>
              ) : (
                <div key={idx} className="carousel-card empty"></div>
              )
            )}
          </div>
          <button className="carousel-arrow" onClick={handleNext}>
            <FaChevronRight />
          </button>
        </div>

        {filteredItems[centerIndex] && (
          <div className="carousel-description">
            <p>{filteredItems[centerIndex].description}</p>
            <Link
              to={`/discover/${filteredItems[centerIndex].slug}`}
              state={{
                name: filteredItems[centerIndex].name,
                image: filteredItems[centerIndex].image,
                desc: filteredItems[centerIndex].description,
                coordinates: [filteredItems[centerIndex].latitude, filteredItems[centerIndex].longitude]
              }}
              className="explore-btn"
            >
              Explore more
            </Link>
          </div>
        )}
      </div>

      {showLogin && <LoginPage onClose={closeLogin} />}
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;