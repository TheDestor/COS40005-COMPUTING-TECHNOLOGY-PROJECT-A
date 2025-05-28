import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';

const TransportationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Transportation');

  const transportationCategories = {
    Transportation: ['airport', 'bus_station', 'transit_station', 'train_station', 'subway_station']
  };

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

  const fetchGooglePlaces = (categoryName, location, radius = 50000) => {
    return new Promise((resolve) => {
      if (!window.google) {
        console.error("Google Maps API not loaded");
        return resolve([]);
      }

      const entries = transportationCategories[categoryName];
      if (!entries) return resolve([]);

      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const collectedResults = [];
      let completedRequests = 0;

      entries.forEach(entry => {
        const request = {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius,
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
                  const types = place.types || [];
                  let placeType = 'Other';
                  if (types.includes('airport')) placeType = 'Airport';
                  else if (types.includes('bus_station')) placeType = 'Bus Station';
                  else if (types.includes('train_station')) placeType = 'Train Station';
                  else if (types.includes('subway_station')) placeType = 'Subway Station';
                  else if (types.includes('transit_station')) placeType = 'Transit Station';

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

  const processBackendData = (backendData) => {
    return backendData
      .filter(item => item.category?.toLowerCase() === 'transport') // Add this filter
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

  const fetchTransportationPlaces = async () => {
    setLoading(true);
    try {
      // Fetch backend data
      const backendResponse = await fetch('/api/locations?category=Transport');
      const backendData = await backendResponse.json();
      const processedBackend = processBackendData(backendData);

      // Fetch Google Places data
      const location = await getCurrentLocation();
      const googleResults = await fetchGooglePlaces('Transportation', location);

      // Combine data
      const allData = [...processedBackend, ...googleResults];
      setData(allData);
    } catch (error) {
      console.error('Error fetching transportation places:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportationPlaces();
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
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{currentCategory.toUpperCase()}</h1>
          <p>Exploring {currentCategory}</p>
        </div>
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
              <option value="all">All Categories</option>
              <option value="Airport">Airport</option>
              <option value="Bus Station">Bus Station</option>
              <option value="Train Station">Train Station</option>
              <option value="Subway Station">Subway Station</option>
              <option value="Transit Station">Transit Station</option>
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
      <Footer />
    </div>
  );
};

export default TransportationPage;