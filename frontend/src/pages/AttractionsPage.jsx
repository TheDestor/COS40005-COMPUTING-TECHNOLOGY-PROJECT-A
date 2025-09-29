import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = 'dPGp9T7iyiE'; 

const AttractionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Attractions');

  const placeCategories = {
    Attractions: ['tourist_attraction', 'museum', 'zoo', 'amusement_park', 'aquarium']
  };

  // ✅ Get coordinates dynamically (e.g., from geolocation)
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            resolve({ lat: 1.5533, lng: 110.3592 }); // Fallback to Kuching
          }
        );
      } else {
        resolve({ lat: 1.5533, lng: 110.3592 }); // Fallback if geolocation is unsupported
      }
    });
  };

  const fetchGooglePlaces = (categoryName, location, radius = 50000) => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error("Google Maps API not loaded");
        return resolve([]);
      }

      const entries = placeCategories[categoryName];
      if (!entries) return resolve([]);

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const collectedResults = [];
      let completedRequests = 0;

      entries.forEach(entry => {
        const request = {
          location: new window.google.maps.LatLng(1.5533, 110.3592),
          radius: 50000,
          type: entry
        };

        const processResults = (results, status, pagination) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            collectedResults.push(...results);

            if (pagination && pagination.hasNextPage && collectedResults.length < 50) {
              setTimeout(() => pagination.nextPage(), 1000);
            } else {
              completedRequests++;
              if (completedRequests === entries.length) {
                const formatted = collectedResults.slice(0, 50).map(place => {
                  const name = place.name;
                  const lowerName = name.toLowerCase();
                  let type = '';
                  if (lowerName.includes('museum')) type = 'Museum';
                  else if (lowerName.includes('park') || lowerName.includes('national')) type = 'National Park';
                  else if (lowerName.includes('beach')) type = 'Beach';
                  else type = 'Other';

                  return {
                    name,
                    desc: place.vicinity || 'Google Places result',
                    image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
                    slug: name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
                    type,
                    lat: place.geometry?.location?.lat(),
                    lng: place.geometry?.location?.lng()
                  };
                });
                resolve(formatted);
              }
            }
          } else {
            completedRequests++;
            if (completedRequests === entries.length) {
              resolve([]);
            }
          }
        };

        service.nearbySearch(request, processResults);
      });
    });
  };

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/locations?category=Attraction');
      const fetchedData = await response.json();

      const googleResults = await fetchGooglePlaces('Attractions', { lat: 1.5533, lng: 110.3592 });

      const filteredBackend = fetchedData.filter(item =>
        item.category?.toLowerCase() === 'attraction'
      );
      const allData = [...filteredBackend, ...googleResults];

      const processedData = processData(allData);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching Attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (items) => {
    return (items || []).map(item => {
      const name = item?.Name || item?.name || 'Unknown';
      const lowerName = name.toLowerCase();
      let type = '';
      if (lowerName.includes('museum')) type = 'Museum';
      else if (lowerName.includes('park') || lowerName.includes('national')) type = 'National Park';
      else if (lowerName.includes('airport')) type = 'Airport';
      else if (lowerName.includes('beach')) type = 'Beach';
      else type = 'Other';

      return {
        name,
        desc: item?.description || item?.Desc || 'No description',
        slug: name.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        image: item?.image || defaultImage,
        type,
        lat: item.geometry?.location?.lat() || 0, // From Google Places
        lng: item.geometry?.location?.lng() || 0  // From Google Places
      };
    });
  };

  useEffect(() => {
    fetchAttractions();
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
        <h1>{currentCategory.toUpperCase() || 'ATTRACTIONS'}</h1>
        <p className="hero-intro">
            Explore Sarawak's incredible diversity of attractions. From Kuching's cultural landmarks and Sibu's heritage sites to Miri's national parks and ancient cave systems, discover the must-see wonders that make Sarawak unique.
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
              <option value="Museum">Museum</option>
              <option value="National Park">National Park</option>
              <option value="Beach">Beach</option>
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
                      coordinates: [item.lat, item.lng] // Pass coordinates as [lng, lat]
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

export default AttractionsPage;
