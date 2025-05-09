import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate, useParams } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';

const DiscoverPlaces = () => {
  const { state } = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [coordError, setCoordError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setCoordError(null);
        setLoading(true);

        if (state?.location) {
          const processed = processLocationData(state.location);
          validateCoordinates(processed.coordinates);
          setLocationData(processed);
          setLoading(false);
          return;
        }

        const decodedSlug = decodeURIComponent(slug);
        const response = await fetch(`/api/locations`);
        
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
    if (!Array.isArray(coords)) { // Added missing parenthesis
      throw new Error('Coordinates must be an array');
    }
    if (coords.length < 2) {
      throw new Error('Coordinates array must contain at least 2 elements');
    }
    if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
      throw new Error('Coordinates must be numbers');
    }
    if (Math.abs(coords[1]) > 90 || Math.abs(coords[0]) > 180) {
      throw new Error(`Invalid coordinates: [${coords[0]}, ${coords[1]}]`);
    } // Removed extra comma and parenthesis
  };

  useEffect(() => {
    if (!locationData?.coordinates || coordError) return;

    const initGooglePlaces = async () => {
      try {
        setIsLoadingNearby(true);
        setPlacesError('');
    
        const [lon, lat] = locationData.coordinates;
    
        const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
          throw new Error('Google Maps API key is missing.');
        }
    
        // Load Google Maps script
        if (!window.google?.maps?.places) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${REACT_APP_GOOGLE_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => window.google?.maps?.places ? resolve() : reject(new Error('Google Maps failed to load'));
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        const service = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );

        service.nearbySearch(
          {
            location: new window.google.maps.LatLng(lat, lon),
            radius: 10000,
            type: ['tourist_attraction', 'museum', 'park'],
            rankBy: window.google.maps.places.RankBy.PROMINENCE
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              const validPlaces = results.filter(place => 
                place.business_status !== 'CLOSED_PERMANENTLY' &&
                place.rating >= 3
              );
              setNearbyPlaces(validPlaces.slice(0, 6));
            } else {
              setPlacesError('Failed to load nearby attractions. Please try again later.');
            }
            setIsLoadingNearby(false);
          }
        );
      } catch (error) {
        console.error('Places Error:', error);
        setPlacesError(error.message || 'Failed to initialize Google Maps');
        setIsLoadingNearby(false);
      }
    };

    initGooglePlaces();
  }, [locationData, coordError]);

  const processLocationData = (data) => {
    try {
      const rawCoords = data.coordinates || [];
      const processedCoords = [
        parseFloat(rawCoords[0]),
        parseFloat(rawCoords[1])
      ];
  
      if (processedCoords.some(coord => isNaN(coord))) {
        console.warn('Invalid coordinates, using fallback');
        return {
          ...data,
          coordinates: [0, 0], // Fallback coordinates
          image: data.image || defaultImage
        };
      }
  
      return {
        ...data,
        coordinates: processedCoords,
        image: data.image || defaultImage
      };
    } catch (error) {
      console.error('Processing error:', error);
      return {
        name: data.name || 'Unknown Location',
        description: data.description || 'No description available',
        coordinates: [0, 0],
        image: defaultImage
      };
    }
  };

  const renderNearbyPlaces = () => (
    <div className="nearby-places-section">
      <h2>Nearby Attractions</h2>
      
      {placesError && (
        <div className="error-message">
          {placesError}
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      )}

      {isLoadingNearby ? (
        <div className="loading-text">
          <div className="small-spinner"></div>
          Searching nearby attractions...
        </div>
      ) : nearbyPlaces.length > 0 ? (
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
              <p className="place-address">{place.vicinity}</p>
            </div>
          ))}
        </div>
      ) : (
        !placesError && (
          <div className="no-results">
            No attractions found within 10km radius
          </div>
        )
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

      {renderNearbyPlaces()}

      <Footer />
    </div>
  );
};

export default DiscoverPlaces;