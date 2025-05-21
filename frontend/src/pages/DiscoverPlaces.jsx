import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';
import { useApiIsLoaded } from '@vis.gl/react-google-maps';

const DiscoverPlaces = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordError, setCoordError] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const isApiLoaded = useApiIsLoaded();
  const location = useLocation();
  const { name, desc, image, coordinates, type } = location.state || {};
  const [selectedCategory, setSelectedCategory] = useState(type || 'tourist_attraction');

  const processPlacesResults = useCallback((results) => {
    return results
      .filter(place => place.name && place.vicinity)
      .map(place => ({
        place_id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        totalRatings: place.user_ratings_total || 0,
        address: place.vicinity,
        photos: place.photos?.map(photo => photo.getUrl({ maxWidth: 400 })) || [defaultImage],
        location: place.geometry?.location.toJSON(),
      }));
  }, []);

  useEffect(() => {
    if (location.state) {
      try {
        const { name, desc, image, coordinates } = location.state;
        // Validate coordinates array exists and has valid values
        if (!coordinates || coordinates.length < 2) {
          throw new Error('Invalid coordinates data');
        }
        const data = processLocationData({ name, desc, image, coordinates });
        setLocationData(data);
      } catch (e) {
        setCoordError(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      setCoordError('Missing location data');
      setLoading(false);
    }
  }, [location.state]);

  const fetchNearbyPlaces = useCallback(async () => {
    if (!isApiLoaded || !window.google || !locationData?.coordinates) return;

    try {
      const [lat, lng] = locationData.coordinates;
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      const location = new window.google.maps.LatLng(lat, lng);

      const results = await new Promise((resolve) => {
        service.nearbySearch({
          location,
          radius: 5000,
          type: selectedCategory
        }, (results, status) => {
          if (status === 'OK') resolve(results || []);
          else resolve([]);
        });
      });

      const detailedPlaces = await Promise.all(
        results.map(place => new Promise(resolve => {
          new window.google.maps.places.PlacesService(document.createElement('div'))
            .getDetails({ placeId: place.place_id }, (details, status) => {
              resolve(status === 'OK' ? { ...place, ...details } : null);
            });
        }))
      );

      setNearbyPlaces(processPlacesResults(detailedPlaces.filter(Boolean)));
    } catch (error) {
      console.error('Error fetching places:', error);
      setNearbyPlaces([]);
    }
  }, [isApiLoaded, locationData, selectedCategory, processPlacesResults]);

  useEffect(() => {
    fetchNearbyPlaces();
  }, [fetchNearbyPlaces]);

  const processLocationData = (data) => {
    const rawCoords = data.coordinates || [];
    let processedCoords = [0, 0]; // Default to [0, 0] if invalid

    try {
      // First parse attempt
      let lat = parseFloat(rawCoords[0]) || 0;
      let lng = parseFloat(rawCoords[1]) || 0;

      // Validate coordinate ranges
      const isValidLat = (val) => val >= -90 && val <= 90;
      const isValidLng = (val) => val >= -180 && val <= 180;

      // Check if initial parse is valid
      if (isValidLat(lat) && isValidLng(lng)) {
        processedCoords = [lat, lng];
      } else {
        // Attempt coordinate swap
        const swappedLat = parseFloat(rawCoords[1]) || 0;
        const swappedLng = parseFloat(rawCoords[0]) || 0;
        
        if (isValidLat(swappedLat) && isValidLng(swappedLng)) {
          processedCoords = [swappedLat, swappedLng];
        } else {
          throw new Error('Invalid coordinate values');
        }
      }
    } catch (e) {
      console.error('Coordinate processing error:', e);
      // Fallback to Kuching coordinates if parsing fails
      processedCoords = [1.5533, 110.3592];
    }

    return {
      name: data.name || 'Unknown Location',
      description: data.desc || 'No description available',
      image: data.image || defaultImage,
      coordinates: processedCoords
    };
  };

  // Validation function (optional but recommended)
  const validateCoordinates = (coords) => {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error('Invalid coordinates format');
    }

    const [lat, lng] = coords;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Coordinates must be numbers');
    }

    if (lat < -90 || lat > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90`);
    }

    if (lng < -180 || lng > 180) {
      throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180`);
    }
  };

  useEffect(() => {
    if (name && coordinates) {
      try {
        validateCoordinates(coordinates);
        const data = processLocationData({ name, desc, image, coordinates });
        setLocationData(data);
      } catch (e) {
        setCoordError(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      setCoordError('Missing location data');
      setLoading(false);
    }
  }, [name, desc, image, coordinates]);

  const renderNearbyPlaces = () => (
    <div className="nearby-places-section">
      <h2>Nearby {selectedCategory.replace(/_/g, ' ').toUpperCase()}</h2>

      <div className="places-grid">
        {nearbyPlaces.map(place => (
          <div
            key={place.place_id}
            className="place-card"
            onClick={() => setSelectedPlace(place)}
          >
            <img src={place.photos[0]} alt={place.name} />
            <div className="place-info">
              <h3>{place.name}</h3>
              <div className="rating">
                ⭐ {place.rating} ({place.totalRatings} reviews)
              </div>
              <p className="address">{place.address}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPlace && (
        <div className="place-modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedPlace(null)}>
              &times;
            </button>
            <h2>{selectedPlace.name}</h2>

            <div className="photo-gallery">
              {selectedPlace.photos.map((photo, index) => (
                <img key={index} src={photo} alt={`${selectedPlace.name} ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="details-page">
      <MenuNavbar />

      {loading || !locationData ? (
        <div className="loading-section">
          <h2>Loading location details...</h2>
        </div>
      ) : (
        <>
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
                    Longitude: {locationData.coordinates[0]?.toFixed(4)}
                  </span>
                  <span className="coord-badge">
                    Latitude: {locationData.coordinates[1]?.toFixed(4)}
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
              <option value="tourist_attraction">Tourist Attraction</option>
              <option value="museum">Museum</option>
              <option value="zoo">Zoo</option>
              <option value="amusement_park">Amusement Park</option>
            </select>
          </div>

          {renderNearbyPlaces()}
        </>
      )}

      <Footer />
    </div>
  );
};

export default DiscoverPlaces;
