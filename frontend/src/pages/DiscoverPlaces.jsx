import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import MenuNavbar from '../components/MenuNavbar';
import Footer from '../components/Footer';
import defaultImage from '../assets/Kuching.png';
import '../styles/DiscoverPlaces.css';
import { useApiIsLoaded, APIProvider } from '@vis.gl/react-google-maps';
import { FaMapMarkerAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const DiscoverPlaces = () => {
  const { slug } = useParams();
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordError, setCoordError] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const isApiLoaded = useApiIsLoaded();
  const location = useLocation();
  const [placesLoading, setPlacesLoading] = useState(false);

  const processLocationData = useCallback((data) => {
    try {
      let rawCoords = data.coordinates || [];
      
      if (typeof rawCoords === 'string') {
        rawCoords = rawCoords.split(',').map(Number);
      } else if (rawCoords.latitude && rawCoords.longitude) {
        rawCoords = [rawCoords.latitude, rawCoords.longitude];
      }

      const [lat, lng] = rawCoords;
      
      if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error(`Invalid coordinates: ${lat}, ${lng}`);
      }

      return { ...data, coordinates: [lat, lng] };
    } catch (e) {
      console.error('Coordinate error:', e);
      setCoordError(e.message);
      return { ...data, coordinates: [1.5533, 110.3592] };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        if (location.state) {
          const processed = processLocationData(location.state);
          if (isMounted) setLocationData(processed);
          return;
        }

        if (slug) {
          apiKey="AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI"
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });
        
        if (isMounted) {
          setLocationData({
            coordinates: [position.coords.latitude, position.coords.longitude],
            name: 'Your Current Location',
            desc: 'Exploring nearby places around your current location',
            image: defaultImage
          });
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (isMounted) {
          setCoordError(error.message);
          setLocationData({
            coordinates: [1.5533, 110.3592],
            name: 'Kuching',
            desc: 'Default location: Kuching, Sarawak',
            image: defaultImage
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, [location.state, slug, processLocationData]);

  const processPlacesResults = useCallback((results) => {
    return results.filter(place => place.name && place.vicinity).map(place => ({
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

  const fetchAllNearbyPlaces = useCallback(async (coords) => {
    if (!isApiLoaded) return;

    try {
      const [lat, lng] = coords;
      const div = document.createElement('div');
      document.body.appendChild(div);

      const service = new window.google.maps.places.PlacesService(div);
      
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: 50000,
        fields: ['name', 'vicinity', 'rating', 'user_ratings_total', 'photos', 'geometry', 'types']
      };

      setPlacesLoading(true);
      
      const results = await new Promise((resolve) => {
        service.nearbySearch(request, (results, status) => {
          document.body.removeChild(div);
          console.log('Places API Response:', {
            status,
            statusMessage: window.google.maps.places.PlacesServiceStatus[status],
            resultsCount: results?.length || 0,
            request: { lat, lng, radius: request.radius },
            timestamp: new Date().toISOString()
          });

          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(results);
          } else {
            console.error('API Error Details:', {
              status,
              message: window.google.maps.places.PlacesServiceStatus[status]
            });
            resolve([]);
          }
        });
      });

      console.log('Raw API Results:', results);
      setNearbyPlaces(processPlacesResults(results));
    } catch (error) {
      console.error('Full Error Stack:', error);
      setNearbyPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [isApiLoaded, processPlacesResults]);

  useEffect(() => {
    if (locationData?.coordinates) {
      fetchAllNearbyPlaces(locationData.coordinates);
    }
  }, [locationData?.coordinates, fetchAllNearbyPlaces]);

  const getPlaceType = (types) => {
    const exclude = ['point_of_interest', 'establishment'];
    return types?.find(t => !exclude.includes(t))?.replace(/_/g, ' ') || 'Location';
  };

  return (
    <APIProvider 
      apiKey="AIzaSyCez55Id2LmgCyvoyThwhb_ZTJOZfTkJmI"
      libraries={['places']}
      onLoad={() => console.log('Google Maps API initialized successfully')}
      onError={(error) => console.error('Google Maps API failed to load:', error)}
    >
      <div className="details-page">
        <MenuNavbar />

        {/* <button 
          style={{
            position: 'fixed',
            top: '70px',
            right: '10px',
            zIndex: 1000,
            padding: '10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => {
            console.log('Current Location State:', locationData);
            console.log('Google Maps API Status:', window.google?.maps?.version);
            fetchAllNearbyPlaces([1.5580, 110.3478]);
          }}
        >
          Debug: Force Kuching Location
        </button> */}

        {coordError && (
          <div className="error-banner">
            <FaExclamationTriangle /> {coordError}
          </div>
        )}

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
                  {locationData?.desc ? (
                    <p className="overview-text">{locationData.desc}</p>
                  ) : (
                    <p className="overview-text no-description">No description available</p>
                  )}
                  {/* <p className="overview-text">{locationData?.desc}</p> */}
                  {/* <div className="coordinates-display">
                    <span className="coord-badge">
                      Lat: {locationData?.coordinates[0]?.toFixed(4)}
                    </span>
                    <span className="coord-badge">
                      Lng: {locationData?.coordinates[1]?.toFixed(4)}
                    </span>
                  </div> */}
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
                  <p>No places found within 50km radius</p>
                  <p>Check browser console for API response details</p>
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