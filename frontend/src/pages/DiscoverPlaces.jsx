import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';
import { useApiIsLoaded } from '@vis.gl/react-google-maps';

const DiscoverPlaces = () => {
  const { state } = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordError, setCoordError] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(state?.selectedCategory || 'restaurant');
  const isApiLoaded = useApiIsLoaded();

  useEffect(() => {
    if (!isApiLoaded || !window.google || !locationData?.coordinates) return;

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    const location = new window.google.maps.LatLng(
      locationData.coordinates[1], // Latitude
      locationData.coordinates[0]  // Longitude
    );

    const request = {
      location,
      radius: 5000,
      type: selectedCategory
    };

    service.nearbySearch(request, (results, status) => {
      console.log('Nearby Search Results:', results); // Debugging log
      console.log('Nearby Search Status:', status); // Debugging log
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setNearbyPlaces(results);
      } else {
        console.warn('Places API error:', status);
        setNearbyPlaces([]);
      }
    });
  }, [selectedCategory, locationData, isApiLoaded]);

  const processLocationData = (data) => {
    const rawCoords = data.coordinates || [];
    const processedCoords = [
      parseFloat(rawCoords[0]),
      parseFloat(rawCoords[1])
    ];

    if (processedCoords.some(coord => isNaN(coord))) {
      return {
        ...data,
        coordinates: [0, 0],
        image: data.image || defaultImage
      };
    }

    return {
      ...data,
      coordinates: processedCoords,
      image: data.image || defaultImage
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setCoordError(null);
        setLoading(true);

        if (state?.location) {
          const processed = processLocationData(state.location);
          validateCoordinates(processed.coordinates);
          setLocationData(processed);
          setNearbyPlaces(state.nearbyPlaces || []);
          setLoading(false);
          return;
        }

        const decodedSlug = decodeURIComponent(slug);
        const response = await fetch('/api/locations');

        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();

        const matched = data.find(loc =>
          (loc.slug || loc.name)?.toLowerCase() === decodedSlug.toLowerCase()
        );

        if (!matched) throw new Error('Location not found');

        const processed = processLocationData(matched);
        validateCoordinates(processed.coordinates);
        setLocationData(processed);
      } catch (error) {
        console.error('Error:', error);
        setCoordError(error.message);
        navigate('/error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug, state, navigate]);

  const validateCoordinates = (coords) => {
    if (!Array.isArray(coords)) throw new Error('Coordinates must be an array');
    if (coords.length < 2) throw new Error('Coordinates array must contain at least 2 elements');
    if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      throw new Error('Coordinates must be numbers');
    }
    if (Math.abs(coords[1]) > 90 || Math.abs(coords[0]) > 180) {
      throw new Error(`Invalid coordinates: [${coords[0]}, ${coords[1]}]`);
    }
  };

  const renderNearbyPlaces = () => (
    <div className="nearby-places-section">
      <h2>Nearby {selectedCategory.replace(/_/g, ' ').toUpperCase()}</h2>
      {nearbyPlaces.length > 0 ? (
        <div className="nearby-places-grid">
          {nearbyPlaces.map((place) => (
            <div key={place.place_id} className="place-card">
              {place.photos?.[0] && (
                <img
                  className="place-photo"
                  src={place.photos[0].getUrl({ maxWidth: 400 })}
                  alt={place.name}
                />
              )}
              <h3>{place.name}</h3>
              {place.rating && (
                <div className="place-rating">
                  ⭐ {place.rating} ({place.user_ratings_total || 0} reviews)
                </div>
              )}
              <p className="place-address">
                {place.vicinity || place.formatted_address}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          No {selectedCategory.replace(/_/g, ' ')} found nearby.
        </div>
      )}
    </div>
  );

  if (coordError) {
    return (
      <div className="error-container">
        <MenuNavbar />
        <div className="error-content">
          <h2>Location Data Error</h2>
          <p className="coord-error">{coordError}</p>
          <Link to="/major-towns" className="return-button">
            Browse Locations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading Location Data...</p>
      </div>
    );
  }

  return (
    <div className="details-page">
      <MenuNavbar />

      <div className="hero-banner">
        <div className="hero-overlay">
          <h1>{locationData.name.toUpperCase()}</h1>
          <p>Explore {locationData.name}</p>
        </div>
      </div>

      <div className="town-overview">
        <div className="overlay-container">
          <div className="text-content">
            <h2>About {locationData.name}</h2>
            <p className="overview-text">{locationData.description}</p>
            <div className="coordinates-display">
              <span className="coord-badge">
                Latitude: {locationData.coordinates[1]?.toFixed(4)}
              </span>
              <span className="coord-badge">
                Longitude: {locationData.coordinates[0]?.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="image-content">
            <img
              src={locationData.image}
              alt={locationData.name}
              onError={(e) => {
                e.target.src = defaultImage;
                e.target.style.opacity = '0.8';
              }}
            />
          </div>
        </div>
      </div>

      <div className="category-selector">
        <label htmlFor="category">Nearby: </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="restaurant">Restaurants</option>
          <option value="park">Parks</option>
          <option value="hospital">Hospitals</option>
          <option value="school">Schools</option>
          <option value="lodging">Lodging</option>
          <option value="tourist_attraction">Tourist Attractions</option>
        </select>
      </div>

      <div className="place-info">
        {nearbyPlaces.length > 0 && nearbyPlaces.map((place) => (
          <div key={place.place_id}>
            <h3>{place.name}</h3>
            {place.isOpenNow ? (
              <span className="open-status">Open Now</span>
            ) : (
              <span className="closed-status">Closed Now</span>
            )}
          </div>
        ))}
      </div>

      {renderNearbyPlaces()}

      <Footer />
    </div>
  );
};

export default DiscoverPlaces;
