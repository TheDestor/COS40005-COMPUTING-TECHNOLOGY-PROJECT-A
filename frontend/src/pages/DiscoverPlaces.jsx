import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';
import { useApiIsLoaded, APIProvider } from '@vis.gl/react-google-maps';
import { FaMapMarkerAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';

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
  const { name, desc, image, coordinates, type } = location.state || { coordinates: null };
  const [placesLoading, setPlacesLoading] = useState(false);

  // Debugging effect
  useEffect(() => {
    console.log('Current coordinates:', locationData?.coordinates);
  }, [locationData]);

  const processPlacesResults = useCallback((results) => {
    return results
      .filter(place => place.name && place.vicinity)
      .map(place => ({
        place_id: place.place_id,
        name: place.name,
        rating: place.rating || 'N/A',
        totalRatings: place.user_ratings_total || 'No reviews',
        address: place.vicinity,
        photos: place.photos?.map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI`
        ) || [defaultImage],
        types: place.types || [],
        location: place.geometry?.location.toJSON(),
      }));
  }, []);

  const processLocationData = (data) => {
    try {
      let rawCoords = data.coordinates || [];
      
      if (typeof rawCoords === 'string') {
        rawCoords = rawCoords.split(',').map(Number);
      }

      const [lat, lng] = rawCoords;
      
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error('Invalid coordinates range');
      }

      return { ...data, coordinates: [lat, lng] };
    } catch (e) {
      console.error('Coordinate error:', e);
      setCoordError(e.message);
      return { ...data, coordinates: [1.5533, 110.3592] };
    }
  };

  useEffect(() => {
    if (name && coordinates) {
      try {
        const data = processLocationData({ name, desc, image, coordinates });
        setLocationData(data);
      } catch (e) {
        setCoordError(e.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [name, coordinates, desc, image]);

  const fetchAllNearbyPlaces = useCallback(async () => {
    if (!isApiLoaded || !locationData?.coordinates) return;

    try {
      const [lat, lng] = locationData.coordinates;
      const div = document.createElement('div');
      document.body.appendChild(div);

      const service = new window.google.maps.places.PlacesService(div);
      
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: 15000,
        type: 'tourist_attraction',
        fields: ['name', 'vicinity', 'rating', 'user_ratings_total', 'photos', 'geometry', 'types']
      };

      setPlacesLoading(true);
      
      const results = await new Promise((resolve) => {
        service.nearbySearch(request, (results, status) => {
          document.body.removeChild(div);
          console.log('API Response:', {
            status,
            resultsCount: results?.length || 0,
            request: { lat, lng, radius: 15000 }
          });
          
          if (status === 'OK') {
            resolve(results || []);
          } else {
            console.error('API Error Details:', status);
            resolve([]);
          }
        });
      });

      setNearbyPlaces(processPlacesResults(results));
    } catch (error) {
      console.error('Fetch Error:', error);
      setNearbyPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [isApiLoaded, locationData, processPlacesResults]);

  useEffect(() => {
    if (isApiLoaded && locationData?.coordinates) {
      fetchAllNearbyPlaces();
    }
  }, [isApiLoaded, locationData, fetchAllNearbyPlaces]);

  const getPlaceType = (types) => {
    const exclude = ['point_of_interest', 'establishment'];
    return types?.find(t => !exclude.includes(t))?.replace(/_/g, ' ') || 'Location';
  };

  return (
    <APIProvider apiKey="AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI" libraries={['places']}>
      <div className="details-page">
        <MenuNavbar />

        <button 
          onClick={() => setLocationData({
            coordinates: [1.5580, 110.3478],
            name: 'Kuching Waterfront'
          })}
          style={{position: 'fixed', top: 10, right: 10, zIndex: 1000}}
        >
          Test Location (Kuching Waterfront)
        </button>

        {loading ? (
          <div className="loading-section">
            <h2>Loading location details...</h2>
          </div>
        ) : (
          <>
            <div className="hero-banner">
              <div className="hero-overlay">
                <h1>{locationData?.name?.toUpperCase()}</h1>
                <p>Exploring {locationData?.name} area</p>
              </div>
            </div>

            <div className="town-overview">
              <div className="overlay-container">
                <div className="text-content">
                  <h2>About {locationData?.name}</h2>
                  <p className="overview-text">{locationData?.desc}</p>
                  <div className="coordinates-display">
                    <span className="coord-badge">
                      Lat: {locationData?.coordinates[0]?.toFixed(4)}
                    </span>
                    <span className="coord-badge">
                      Lng: {locationData?.coordinates[1]?.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="image-content">
                  <img
                    src={locationData?.image || defaultImage}
                    alt={locationData?.name}
                    onError={(e) => {
                      e.target.src = defaultImage;
                      e.target.style.opacity = '0.8';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="nearby-places-section">
              <h2>Nearby Places ({nearbyPlaces.length})</h2>
              
              {placesLoading ? (
                <div className="loading-section">
                  <h3>Discovering nearby places...</h3>
                </div>
              ) : nearbyPlaces.length > 0 ? (
                <div className="places-grid">
                  {nearbyPlaces.map(place => (
                    <div
                      key={place.place_id}
                      className="place-card"
                      onClick={() => setSelectedPlace(place)}
                    >
                      <img 
                        src={place.photos[0]} 
                        alt={place.name} 
                        onError={(e) => {
                          e.target.src = defaultImage;
                          e.target.style.opacity = '0.8';
                        }}
                      />
                      <div className="place-info">
                        <div className="place-type">
                          {getPlaceType(place.types).toUpperCase()}
                        </div>
                        <h3>{place.name}</h3>
                        <div className="rating">
                          ⭐ {place.rating} ({place.totalRatings})
                        </div>
                        <p className="address">{place.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <FaExclamationTriangle />
                  <p>No places found within 15km radius</p>
                  <p>Check console for API response details</p>
                </div>
              )}
            </div>

            {selectedPlace && (
              <div className="place-modal">
                <div className="modal-content">
                  <button className="close-btn" onClick={() => setSelectedPlace(null)}>
                    &times;
                  </button>
                  <h2>{selectedPlace.name}</h2>
                  <div className="place-details">
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span>{selectedPlace.address}</span>
                    </div>
                    <div className="detail-item">
                      ⭐ {selectedPlace.rating} ({selectedPlace.totalRatings} reviews)
                    </div>
                    <div className="detail-item">
                      <FaClock />
                      {getPlaceType(selectedPlace.types)}
                    </div>
                  </div>
                  <div className="photo-gallery">
                    {selectedPlace.photos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo} 
                        alt={`${selectedPlace.name} ${index + 1}`}
                        onError={(e) => {
                          e.target.src = defaultImage;
                          e.target.style.opacity = '0.8';
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <Footer />
      </div>
    </APIProvider>
  );
};

export default DiscoverPlaces;