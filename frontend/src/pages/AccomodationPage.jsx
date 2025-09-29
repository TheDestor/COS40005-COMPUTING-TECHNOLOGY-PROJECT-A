import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavBar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';
import AIChatbot from '../components/AiChatbot.jsx';

const HERO_VIDEO_ID = 'Jsk5kvZ-DHo'; 

const AccommodationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Accommodation');

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
            resolve({ lat: 1.5533, lng: 110.3592 });
          }
        );
      } else {
        resolve({ lat: 1.5533, lng: 110.3592 });
      }
    });
  };

  const fetchGooglePlaces = async (location) => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error("Google Maps API not loaded");
        return resolve([]);
      }

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius: 50000,
        type: 'lodging'
      };

      const processResults = (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formatted = results.map(place => {
            const types = place.types || [];
            let placeType = 'Other';
            if (types.includes('hotel')) placeType = 'Hotel';
            else if (types.includes('homestay')) placeType = 'Homestay';
            else if (types.includes('hostel')) placeType = 'Hostel';
            else if (types.includes('resort')) placeType = 'Resort';
            else if (types.includes('guest_house')) placeType = 'Guest House';

            return {
              name: place.name,
              desc: place.vicinity || 'Google Places result',
              slug: place.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
              image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
              type: placeType,
              lat: place.geometry?.location?.lat(),
              lng: place.geometry?.location?.lng()
            };
          });
          resolve(formatted);
        } else {
          resolve([]);
        }
      };

      service.nearbySearch(request, processResults);
    });
  };

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => item.category?.toLowerCase() === 'accommodation')
      .map(item => ({
        name: item.Name || item.name,
        desc: item.description || item.Desc,
        slug: item.slug || item.Name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
        image: item.image || defaultImage,
        type: item.type || 'Other',
        lat: item.latitude || item.lat,
        lng: item.longitude || item.lng
      }));
  };

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Accommodation');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Fetch Google Places data
      const location = await getCurrentLocation();
      const googleResults = await fetchGooglePlaces(location);

      // Combine data
      const allData = [...processedBackend, ...googleResults];
      setData(allData);
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
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
      <MenuNavBar onLoginClick={handleLoginClick}/>

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
        <h1>{currentCategory.toUpperCase() || 'ACCOMODATION'}</h1>
        <p className="hero-intro">
            Explore a wide range of accommodations to suit every travel style and budget. Discover everything from modern international hotels to unique homestays, perfectly located in Sarawak's major urban centers.
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
              <option value="all">All Types</option>
              <option value="Hotel">Hotel</option>
              <option value="Homestay">Homestay</option>
              <option value="Hostel">Hostel</option>
              <option value="Resort">Resort</option>
              <option value="Guest House">Guest House</option>
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

export default AccommodationPage;