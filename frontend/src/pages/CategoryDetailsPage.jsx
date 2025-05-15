import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import LoginPage from './Loginpage';
import '../styles/CategoryDetailsPage.css';
import defaultImage from '../assets/Kuching.png';
import { Link } from 'react-router-dom';

const CategoryDetailsPage = () => {
  const [townData, setTownData] = useState(null);
  const [divisionItems, setDivisionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const { slug } = useParams();
  const location = useLocation();
  const passedTown = location.state?.town;
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCategory, setSortCategory] = useState('all');

  useEffect(() => {
    if (passedTown) {
      setTownData(passedTown);
      setDivisionItems(passedTown?.division || []);
      setLoading(false);
    }
  }, [passedTown]);

  // useEffect(() => {
  //   // Only fetch places if townData exists and nearbyPlaces is empty
  //   if (townData && nearbyPlaces.length === 0) {
  //     const interval = setInterval(() => {
  //       if (window.google?.maps?.Geocoder) {
  //         clearInterval(interval);
  //         // Proceed with geocoding
  //         const geocoder = new window.google.maps.Geocoder();
  //         geocoder.geocode({ address: townData.name }, (results, status) => {
  //           if (status === 'OK' && results[0]) {
  //             const locationCoords = results[0].geometry.location;
  //             fetchNearbyPlaces(locationCoords);
  //           } else {
  //             console.error('Geocode failed:', status);
  //           }
  //         });
  //       }
  //     }, 500);
      
  //     return () => clearInterval(interval);
  //   }
  // }, [townData, selectedCategory, nearbyPlaces]);

  // const fetchNearbyPlaces = (locationCoords) => {
  //   const service = new window.google.maps.places.PlacesService(document.createElement('div'));

  //   const request = {
  //     location: locationCoords,
  //     radius: 5000,  // Example radius
  //     type: selectedCategory.toLowerCase(),
  //   };

  //   // Perform nearbySearch using the Place service
  //   service.nearbySearch(request, (results, status) => {
  //     if (status === window.google.maps.places.PlacesServiceStatus.OK) {
  //       const placeDetailPromises = results.map((place) => {
  //         return new Promise((resolve) => {
  //           // Request for details of each place
  //           const detailsRequest = {
  //             placeId: place.place_id,
  //             fields: ['name', 'geometry', 'photos', 'formatted_address'],
  //           };

  //           service.getDetails(detailsRequest, (details, detailStatus) => {
  //             if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK) {
  //               resolve(details);  // Successfully resolved place details
  //             } else {
  //               console.error('Failed to get place details:', detailStatus);
  //               resolve(null);
  //             }
  //           });
  //         });
  //       });

  //       // Wait for all place details to be fetched
  //       Promise.all(placeDetailPromises).then((allDetails) => {
  //         const validPlaces = allDetails.filter((place) => place !== null);
  //         setNearbyPlaces(validPlaces);
  //       });
  //     } else {
  //       console.error('Nearby search failed:', status);
  //       setNearbyPlaces([]);
  //     }
  //   });
  // };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const divisionName = passedTown?.division || slug;
        
        // Fetch all locations for the division
        const response = await fetch(`/api/locations`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Find the main town information
        const townInfo = data.find(item => 
          item.type === 'Major Town' && 
          item.division.toLowerCase() === divisionName.toLowerCase()
        ) || data[0];

        // Filter out the main town from other locations
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

        // Geocode town and fetch nearby places
        // if (townInfo?.division && window.google?.maps?.Geocoder) {
        //   const geocoder = new window.google.maps.Geocoder();
        //   geocoder.geocode({ address: townInfo.division }, (results, status) => {
        //     if (status === 'OK' && results[0]) {
        //       fetchNearbyPlaces(results[0].geometry.location);
        //     } else {
        //       console.error('Geocode failed:', status);
        //     }
        //   });
        // }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, passedTown]);

  const handleLoginClick = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

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
    const matchesSort = sortCategory === 'all' || item.type === sortCategory;
    return matchesSearch && matchesSort;
  });

  return (
    <div className="details-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{townData.name.toUpperCase()}</h1>
          <p>Exploring {townData.name}</p>
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {townData.name}</h2>
            <p className="overview-text">{townData.description}</p>
            <div className="quick-facts">
              <h3>Quick Facts</h3>
              <ul>
                <li><strong>Population:</strong> {townData.population}</li>
                <li><strong>Area:</strong> {townData.area}</li>
                <li><strong>Climate:</strong> {townData.climate}</li>
              </ul>
            </div>
          </div>
          <div className="image-content">
            <img src={townData.image} alt={townData.name} />
          </div>
        </div>
      </div>

      <div className="search-sort-bar">
        <input
          type="text"
          placeholder="Search locations by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={sortCategory}
          onChange={(e) => setSortCategory(e.target.value)}
          className="sort-select"
        >
          <option value="all">All Categories</option>
          <option value="National Park">National Park</option>
          <option value="Homestay">Homestay</option>
          <option value="Museum">Museum</option>
          <option value="Beach">Beach</option>
          <option value="Airport">Airport</option>
        </select>
      </div>

      <div className="division-locations-section">
        <h2>Discover {townData.name}</h2>
        <div className="locations-grid">
          {filteredItems.map((item, index) => (
            <div className="location-card" key={index}>
            <img src={item.image || defaultImage} alt={item.name} />
            <div className="location-info">
              <div className="location-header">
                <h3>{item.name}</h3>
                <span className="location-type">{item.type}</span>
              </div>
              <p className="location-desc">{item.description}</p>
          
              {item.coordinates && (
                <div className="coordinates">
                  <p><strong>Lat:</strong> {item.lat}</p>
                  <p><strong>Lng:</strong> {item.lng}</p>
                </div>
              )}
          
              <div className="location-actions">
              <Link
                to={{
                  pathname: `/discover/${encodeURIComponent(item.slug || item.name)}`,
                  state: {
                    location: {
                      name: item.name,
                      description: item.description,
                      coordinates: [item.coordinates?.lng, item.coordinates?.lat],
                      image: item.image
                    },
                    // nearbyPlaces
                    selectedCategory // pass selected category to DiscoverPlaces
                  }
                }}
                className="explore-btn"
              >
                Explore
              </Link>
              </div>
            </div>
          </div>
          ))}
        </div>
      </div>

      {showLogin && <LoginPage onClose={closeLogin} />}
      <Footer />
    </div>
  );
};

export default CategoryDetailsPage;