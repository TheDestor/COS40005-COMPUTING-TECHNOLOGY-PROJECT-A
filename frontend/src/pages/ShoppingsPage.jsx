import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryPage.css';
import defaultImage from '../assets/Kuching.png';

const ShoppingLeisurePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('all');
  const [visibleItems, setVisibleItems] = useState(12);
  const [currentCategory] = useState('Shopping & Leisure');

  const placeCategories = {
    ShoppingLeisure: [
      'shopping_mall', 'clothing_store', 'department_store', 'jewelry_store',
      'movie_theater', 'spa', 'gym', 'bowling_alley', 'casino'
    ]
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
                  // Determine category type based on Google Places entry
                  let categoryType;
                  switch (entry) {
                    case 'shopping_mall':
                    case 'department_store':
                      categoryType = 'Shopping Malls';
                      break;
                    case 'clothing_store':
                    case 'jewelry_store':
                      categoryType = 'Fashion & Jewelry';
                      break;
                    case 'movie_theater':
                    case 'spa':
                    case 'gym':
                    case 'bowling_alley':
                    case 'casino':
                      categoryType = 'Wellness & Entertainment';
                      break;
                    default:
                      categoryType = 'Other';
                  }

                  return {
                    name: place.name,
                    desc: place.vicinity || 'Google Places result',
                    slug: place.name?.toLowerCase()?.replace(/\s+/g, '-') || 'unknown',
                    image: place.photos?.[0]?.getUrl({ maxWidth: 300 }) || defaultImage,
                    type: categoryType,
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

  const fetchShoppingLeisurePlaces = async () => {
    setLoading(true);
    try {
      const results = await fetchGooglePlaces('ShoppingLeisure', { lat: 1.5533, lng: 110.3592 });
      setData(results);
    } catch (error) {
      console.error('Error fetching Google Places:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingLeisurePlaces();
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
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="all">All Categories</option>
              <option value="Shopping Malls">Shopping Malls</option>
              <option value="Fashion & Jewelry">Fashion & Jewelry</option>
              <option value="Wellness & Entertainment">Wellness & Entertainment</option>
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

export default ShoppingLeisurePage;